import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { csvData, filename, userId } = req.body;

    if (!csvData || !filename) {
      return res.status(400).json({ error: 'CSV data and filename are required' });
    }

    // Parse CSV data
    let records;
    try {
      records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (parseError) {
      return res.status(400).json({ 
        error: 'Invalid CSV format', 
        details: parseError.message 
      });
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'No valid records found in CSV' });
    }

    // Create upload log entry
    const { data: uploadLog, error: logError } = await supabase
      .from('ftp_upload_log')
      .insert({
        filename,
        records_processed: records.length,
        status: 'processing',
        uploaded_by: userId
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating upload log:', logError);
      return res.status(500).json({ error: 'Failed to create upload log' });
    }

    const uploadId = uploadLog.id;
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Map CSV columns to database columns (using existing column names where they exist)
        const inventoryItem = {
          // Core identification - map to existing columns
          name: record.PartNumber || '',
          description: record.LongDescription || '',
          sku: record.PartNumber || '',
          category: 'FTP Import',
          supplier: record.VendorName || '',
          
          // Pricing - use existing columns
          cost: parseFloat(record.Cost) || 0,
          price: parseFloat(record.JobberPrice) || 0,
          
          // Quantities - use existing columns
          quantity: parseInt(record.TotalQty) || 0,
          min_stock: 0,
          max_stock: parseInt(record.TotalQty) || 0,
          
          // Existing FTP columns
          vendor_code: record.VendorCode || '',
          manufacturer_part_no: record.ManufacturerPartNo || '',
          case_qty: parseInt(record.CaseQty) || 1,
          east_qty: parseInt(record.EastQty) || 0,
          midwest_qty: parseInt(record.MidwestQty) || 0,
          california_qty: parseInt(record.CaliforniaQty) || 0,
          southeast_qty: parseInt(record.SoutheastQty) || 0,
          pacific_nw_qty: parseInt(record.PacificNWQty) || 0,
          texas_qty: parseInt(record.TexasQty) || 0,
          great_lakes_qty: parseInt(record.GreatLakesQty) || 0,
          florida_qty: parseInt(record.FloridaQty) || 0,
          
          // New FTP columns (will be added by migration)
          vendor_name: record.VendorName || '',
          vcpn: record.VCPN || '',
          long_description: record.LongDescription || '',
          jobber_price: parseFloat(record.JobberPrice) || 0,
          upsable: record.UPSable === 'TRUE',
          core_charge: parseFloat(record.CoreCharge) || 0,
          is_non_returnable: record.IsNonReturnable === 'TRUE',
          prop65_toxicity: record.Prop65Toxicity || '',
          upc_code: record.UPCCode || '',
          is_oversized: record.IsOversized === 'TRUE',
          weight: parseFloat(record.Weight) || 0,
          height: parseFloat(record.Height) || 0,
          length: parseFloat(record.Length) || 0,
          width: parseFloat(record.Width) || 0,
          aaia_code: record.AAIACode || '',
          is_hazmat: record.IsHazmat === 'TRUE',
          is_chemical: record.IsChemical === 'TRUE',
          ups_ground_assessorial: parseInt(record.UPS_Ground_Assessorial) || 0,
          us_ltl: parseInt(record.US_LTL) || 0,
          total_qty: parseInt(record.TotalQty) || 0,
          kit_components: record.KitComponents || '',
          is_kit: record.IsKit === 'TRUE',
          
          // Upload tracking
          ftp_upload_id: uploadId,
          ftp_uploaded_at: new Date().toISOString(),
          ftp_filename: filename
        };

        // Check if item already exists (by part number)
        const { data: existingItem } = await supabase
          .from('inventory')
          .select('id')
          .eq('name', record.PartNumber)
          .single();

        if (existingItem) {
          // Update existing item
          const { error: updateError } = await supabase
            .from('inventory')
            .update(inventoryItem)
            .eq('id', existingItem.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          // Insert new item
          const { error: insertError } = await supabase
            .from('inventory')
            .insert(inventoryItem);

          if (insertError) {
            throw insertError;
          }
        }

        successCount++;
      } catch (itemError) {
        failCount++;
        errors.push({
          row: i + 1,
          partNumber: record.PartNumber,
          error: itemError.message
        });
        console.error(`Error processing row ${i + 1}:`, itemError);
      }
    }

    // Update upload log with results
    const finalStatus = failCount === 0 ? 'completed' : (successCount === 0 ? 'failed' : 'completed');
    const { error: updateLogError } = await supabase
      .from('ftp_upload_log')
      .update({
        records_successful: successCount,
        records_failed: failCount,
        status: finalStatus,
        error_message: errors.length > 0 ? JSON.stringify(errors.slice(0, 10)) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', uploadId);

    if (updateLogError) {
      console.error('Error updating upload log:', updateLogError);
    }

    return res.status(200).json({
      success: true,
      uploadId,
      totalRecords: records.length,
      successCount,
      failCount,
      errors: errors.slice(0, 10), // Return first 10 errors
      message: `Successfully processed ${successCount} out of ${records.length} records`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

