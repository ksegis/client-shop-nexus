import { supabase } from '@/integrations/supabase/client';
import { ProcessedCSVRecord } from './csvValidation';

export interface SyncResult {
  action: 'insert' | 'update' | 'delete' | 'skip';
  success: boolean;
  error?: string;
  recordId?: string;
}

export interface SyncSummary {
  total: number;
  inserted: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: string[];
}

/**
 * Check if a record exists in inventory by VCPN
 */
export async function findExistingRecord(vcpn: string) {
  if (!vcpn) return null;
  
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('vcpn', vcpn)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw new Error(`Error checking existing record: ${error.message}`);
  }
  
  return data;
}

/**
 * Insert new inventory record
 */
export async function insertInventoryRecord(processedData: any, uploadSessionId: string): Promise<SyncResult> {
  try {
    const inventoryData = {
      ...processedData,
      ftp_upload_id: uploadSessionId,
      ftp_uploaded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('inventory')
      .insert([inventoryData])
      .select()
      .single();

    if (error) {
      return {
        action: 'insert',
        success: false,
        error: error.message
      };
    }

    return {
      action: 'insert',
      success: true,
      recordId: data.id
    };
  } catch (error) {
    return {
      action: 'insert',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update existing inventory record
 */
export async function updateInventoryRecord(existingId: string, processedData: any, uploadSessionId: string): Promise<SyncResult> {
  try {
    const updateData = {
      ...processedData,
      ftp_upload_id: uploadSessionId,
      ftp_uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_at;

    const { data, error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', existingId)
      .select()
      .single();

    if (error) {
      return {
        action: 'update',
        success: false,
        error: error.message
      };
    }

    return {
      action: 'update',
      success: true,
      recordId: data.id
    };
  } catch (error) {
    return {
      action: 'update',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Mark records for deletion that are not in the CSV
 */
export async function markRecordsForDeletion(uploadSessionId: string, csvVCPNs: string[]): Promise<SyncResult[]> {
  try {
    // Find records that were previously uploaded but are not in current CSV
    const { data: existingRecords, error: fetchError } = await supabase
      .from('inventory')
      .select('id, vcpn, name')
      .not('ftp_upload_id', 'is', null) // Only consider previously uploaded records
      .not('vcpn', 'in', `(${csvVCPNs.map(v => `"${v}"`).join(',')})`);

    if (fetchError) {
      return [{
        action: 'delete',
        success: false,
        error: `Error fetching records for deletion: ${fetchError.message}`
      }];
    }

    if (!existingRecords || existingRecords.length === 0) {
      return [];
    }

    // For now, we'll just mark them with a special flag rather than actually deleting
    // This is safer and allows for recovery
    const results: SyncResult[] = [];
    
    for (const record of existingRecords) {
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          ftp_upload_id: `DELETED_${uploadSessionId}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);

      if (updateError) {
        results.push({
          action: 'delete',
          success: false,
          error: `Error marking record ${record.vcpn} for deletion: ${updateError.message}`,
          recordId: record.id
        });
      } else {
        results.push({
          action: 'delete',
          success: true,
          recordId: record.id
        });
      }
    }

    return results;
  } catch (error) {
    return [{
      action: 'delete',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during deletion marking'
    }];
  }
}

/**
 * Sync a single processed record to inventory
 */
export async function syncRecord(processedRecord: ProcessedCSVRecord, uploadSessionId: string): Promise<SyncResult> {
  // Skip invalid records
  if (!processedRecord.validation.isValid) {
    return {
      action: 'skip',
      success: false,
      error: 'Record validation failed'
    };
  }

  const { processed } = processedRecord;
  
  try {
    // Check if record exists
    const existingRecord = await findExistingRecord(processed.vcpn);
    
    if (existingRecord) {
      // Update existing record
      return await updateInventoryRecord(existingRecord.id, processed, uploadSessionId);
    } else {
      // Insert new record
      return await insertInventoryRecord(processed, uploadSessionId);
    }
  } catch (error) {
    return {
      action: 'skip',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown sync error'
    };
  }
}

/**
 * Sync all processed records to inventory
 */
export async function syncAllRecords(processedRecords: ProcessedCSVRecord[], uploadSessionId: string): Promise<SyncSummary> {
  const summary: SyncSummary = {
    total: processedRecords.length,
    inserted: 0,
    updated: 0,
    deleted: 0,
    skipped: 0,
    errors: []
  };

  // Process valid records
  const validRecords = processedRecords.filter(r => r.validation.isValid);
  const csvVCPNs = validRecords.map(r => r.processed.vcpn).filter(Boolean);

  // Sync individual records
  for (const record of processedRecords) {
    const result = await syncRecord(record, uploadSessionId);
    
    switch (result.action) {
      case 'insert':
        if (result.success) {
          summary.inserted++;
        } else {
          summary.skipped++;
          summary.errors.push(`Insert failed for row ${record.rowNumber}: ${result.error}`);
        }
        break;
      case 'update':
        if (result.success) {
          summary.updated++;
        } else {
          summary.skipped++;
          summary.errors.push(`Update failed for row ${record.rowNumber}: ${result.error}`);
        }
        break;
      case 'skip':
        summary.skipped++;
        if (result.error) {
          summary.errors.push(`Skipped row ${record.rowNumber}: ${result.error}`);
        }
        break;
    }
  }

  // Handle deletions
  try {
    const deletionResults = await markRecordsForDeletion(uploadSessionId, csvVCPNs);
    
    for (const result of deletionResults) {
      if (result.success) {
        summary.deleted++;
      } else {
        summary.errors.push(`Deletion marking failed: ${result.error}`);
      }
    }
  } catch (error) {
    summary.errors.push(`Error during deletion process: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return summary;
}

/**
 * Create staging records for background processing
 */
export async function createStagingRecords(processedRecords: ProcessedCSVRecord[], uploadSessionId: string): Promise<void> {
  const stagingRecords = processedRecords.map(record => ({
    upload_session_id: uploadSessionId,
    row_number: record.rowNumber,
    validation_status: record.validation.isValid ? 'valid' : 'invalid',
    needs_review: !record.validation.isValid || record.validation.corrected,
    validation_notes: [...record.validation.notes, ...record.validation.errors].join('; '),
    original_data: record.original,
    
    // Processed data
    ...record.processed,
    
    // Determine action type
    action_type: 'unknown' // Will be determined during sync
  }));

  // Insert in batches to avoid timeout
  const batchSize = 100;
  for (let i = 0; i < stagingRecords.length; i += batchSize) {
    const batch = stagingRecords.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('csv_staging_records')
      .insert(batch);
      
    if (error) {
      throw new Error(`Error creating staging records: ${error.message}`);
    }
  }
}

/**
 * Update staging record action types based on existing inventory
 */
export async function updateStagingActionTypes(uploadSessionId: string): Promise<void> {
  // Get all valid staging records
  const { data: stagingRecords, error: fetchError } = await supabase
    .from('csv_staging_records')
    .select('id, vcpn')
    .eq('upload_session_id', uploadSessionId)
    .eq('validation_status', 'valid');

  if (fetchError) {
    throw new Error(`Error fetching staging records: ${fetchError.message}`);
  }

  if (!stagingRecords) return;

  // Check which VCPNs exist in inventory
  const vcpns = stagingRecords.map(r => r.vcpn).filter(Boolean);
  
  if (vcpns.length > 0) {
    const { data: existingRecords, error: existingError } = await supabase
      .from('inventory')
      .select('vcpn')
      .in('vcpn', vcpns);

    if (existingError) {
      throw new Error(`Error checking existing records: ${existingError.message}`);
    }

    const existingVCPNs = new Set(existingRecords?.map(r => r.vcpn) || []);

    // Update action types
    for (const record of stagingRecords) {
      const actionType = existingVCPNs.has(record.vcpn) ? 'update' : 'insert';
      
      const { error: updateError } = await supabase
        .from('csv_staging_records')
        .update({ action_type: actionType })
        .eq('id', record.id);

      if (updateError) {
        console.error(`Error updating action type for staging record ${record.id}:`, updateError);
      }
    }
  }
}

