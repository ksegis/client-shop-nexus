import { supabase } from '@/integrations/supabase/client';
import { processCSVFile, generateValidationSummary, ProcessedCSVRecord } from './csvValidation';
import { createStagingRecords, updateStagingActionTypes, syncAllRecords, SyncSummary } from './inventorySync';

export interface CSVProcessingSession {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRecords: number;
  processedRecords: number;
  validRecords: number;
  invalidRecords: number;
  correctedRecords: number;
  errorMessage?: string;
  uploadedBy: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ProcessingProgress {
  stage: 'parsing' | 'validating' | 'staging' | 'syncing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  details?: any;
}

/**
 * Create a new CSV upload session
 */
export async function createUploadSession(
  filename: string,
  originalFilename: string,
  fileSize: number,
  uploadedBy: string
): Promise<string> {
  const { data, error } = await supabase
    .from('csv_upload_sessions')
    .insert([{
      filename,
      original_filename: originalFilename,
      file_size: fileSize,
      status: 'processing',
      uploaded_by: uploadedBy,
      started_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create upload session: ${error.message}`);
  }

  return data.id;
}

/**
 * Update upload session status
 */
export async function updateSessionStatus(
  sessionId: string,
  updates: Partial<CSVProcessingSession>
): Promise<void> {
  const { error } = await supabase
    .from('csv_upload_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to update session status: ${error.message}`);
  }
}

/**
 * Get upload session details
 */
export async function getUploadSession(sessionId: string): Promise<CSVProcessingSession | null> {
  const { data, error } = await supabase
    .from('csv_upload_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get upload session: ${error.message}`);
  }

  return {
    id: data.id,
    filename: data.filename,
    originalFilename: data.original_filename,
    fileSize: data.file_size,
    status: data.status,
    totalRecords: data.total_records || 0,
    processedRecords: data.processed_records || 0,
    validRecords: data.valid_records || 0,
    invalidRecords: data.invalid_records || 0,
    correctedRecords: data.corrected_records || 0,
    errorMessage: data.error_message,
    uploadedBy: data.uploaded_by,
    createdAt: data.created_at,
    startedAt: data.started_at,
    completedAt: data.completed_at
  };
}

/**
 * Process CSV file in background
 */
export async function processCSVInBackground(
  csvContent: string,
  sessionId: string,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<void> {
  try {
    // Stage 1: Parse and validate CSV
    onProgress?.({
      stage: 'parsing',
      progress: 10,
      message: 'Parsing CSV file...'
    });

    const processedRecords = processCSVFile(csvContent);
    const validationSummary = generateValidationSummary(processedRecords);

    onProgress?.({
      stage: 'validating',
      progress: 30,
      message: 'Validating records...',
      details: validationSummary
    });

    // Update session with validation results
    await updateSessionStatus(sessionId, {
      totalRecords: validationSummary.total,
      validRecords: validationSummary.valid,
      invalidRecords: validationSummary.invalid,
      correctedRecords: validationSummary.corrected
    });

    // Stage 2: Create staging records
    onProgress?.({
      stage: 'staging',
      progress: 50,
      message: 'Creating staging records...'
    });

    await createStagingRecords(processedRecords, sessionId);
    await updateStagingActionTypes(sessionId);

    onProgress?.({
      stage: 'staging',
      progress: 70,
      message: 'Staging records created successfully'
    });

    // Stage 3: Sync to inventory (optional - can be done later via reconciliation)
    onProgress?.({
      stage: 'syncing',
      progress: 80,
      message: 'Processing valid records...'
    });

    // Only auto-sync records that are valid and don't need review
    const autoSyncRecords = processedRecords.filter(r => 
      r.validation.isValid && !r.validation.corrected
    );

    let syncSummary: SyncSummary | null = null;
    if (autoSyncRecords.length > 0) {
      syncSummary = await syncAllRecords(autoSyncRecords, sessionId);
    }

    // Stage 4: Complete
    onProgress?.({
      stage: 'completed',
      progress: 100,
      message: 'Processing completed successfully',
      details: { validationSummary, syncSummary }
    });

    await updateSessionStatus(sessionId, {
      status: 'completed',
      processedRecords: autoSyncRecords.length,
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    onProgress?.({
      stage: 'failed',
      progress: 0,
      message: `Processing failed: ${errorMessage}`
    });

    await updateSessionStatus(sessionId, {
      status: 'failed',
      errorMessage,
      completedAt: new Date().toISOString()
    });

    throw error;
  }
}

/**
 * Get staging records for a session
 */
export async function getStagingRecords(sessionId: string, filters?: {
  validationStatus?: string;
  needsReview?: boolean;
  actionType?: string;
}) {
  let query = supabase
    .from('csv_staging_records')
    .select('*')
    .eq('upload_session_id', sessionId)
    .order('row_number');

  if (filters?.validationStatus) {
    query = query.eq('validation_status', filters.validationStatus);
  }

  if (filters?.needsReview !== undefined) {
    query = query.eq('needs_review', filters.needsReview);
  }

  if (filters?.actionType) {
    query = query.eq('action_type', filters.actionType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get staging records: ${error.message}`);
  }

  return data || [];
}

/**
 * Update a staging record
 */
export async function updateStagingRecord(recordId: string, updates: any): Promise<void> {
  const { error } = await supabase
    .from('csv_staging_records')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', recordId);

  if (error) {
    throw new Error(`Failed to update staging record: ${error.message}`);
  }
}

/**
 * Process a single staging record to inventory
 */
export async function processStagingRecord(recordId: string): Promise<void> {
  // Get the staging record
  const { data: stagingRecord, error: fetchError } = await supabase
    .from('csv_staging_records')
    .select('*')
    .eq('id', recordId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to get staging record: ${fetchError.message}`);
  }

  if (!stagingRecord || stagingRecord.validation_status !== 'valid') {
    throw new Error('Record is not valid for processing');
  }

  // Create the inventory record
  const inventoryData = {
    vendor_name: stagingRecord.vendor_name,
    vcpn: stagingRecord.vcpn,
    vendor_code: stagingRecord.vendor_code,
    sku: stagingRecord.part_number,
    manufacturer_part_no: stagingRecord.manufacturer_part_no,
    long_description: stagingRecord.long_description,
    name: stagingRecord.long_description || stagingRecord.part_number || 'Unknown Item',
    description: stagingRecord.long_description,
    jobber_price: stagingRecord.jobber_price,
    cost: stagingRecord.cost,
    price: stagingRecord.jobber_price || 0,
    quantity: stagingRecord.total_qty || 0,
    core_charge: stagingRecord.core_charge,
    upsable: stagingRecord.upsable,
    case_qty: stagingRecord.case_qty,
    is_non_returnable: stagingRecord.is_non_returnable,
    prop65_toxicity: stagingRecord.prop65_toxicity,
    upc_code: stagingRecord.upc_code,
    is_oversized: stagingRecord.is_oversized,
    weight: stagingRecord.weight,
    height: stagingRecord.height,
    length: stagingRecord.length,
    width: stagingRecord.width,
    aaia_code: stagingRecord.aaia_code,
    is_hazmat: stagingRecord.is_hazmat,
    is_chemical: stagingRecord.is_chemical,
    ups_ground_assessorial: stagingRecord.ups_ground_assessorial,
    us_ltl: stagingRecord.us_ltl,
    east_qty: stagingRecord.east_qty,
    midwest_qty: stagingRecord.midwest_qty,
    california_qty: stagingRecord.california_qty,
    southeast_qty: stagingRecord.southeast_qty,
    pacific_nw_qty: stagingRecord.pacific_nw_qty,
    texas_qty: stagingRecord.texas_qty,
    great_lakes_qty: stagingRecord.great_lakes_qty,
    florida_qty: stagingRecord.florida_qty,
    total_qty: stagingRecord.total_qty,
    kit_components: stagingRecord.kit_components,
    is_kit: stagingRecord.is_kit,
    supplier: stagingRecord.vendor_name,
    category: null,
    reorder_level: null,
    ftp_upload_id: stagingRecord.upload_session_id,
    ftp_uploaded_at: new Date().toISOString()
  };

  if (stagingRecord.action_type === 'update' && stagingRecord.existing_inventory_id) {
    // Update existing record
    const { error: updateError } = await supabase
      .from('inventory')
      .update({
        ...inventoryData,
        updated_at: new Date().toISOString()
      })
      .eq('id', stagingRecord.existing_inventory_id);

    if (updateError) {
      throw new Error(`Failed to update inventory record: ${updateError.message}`);
    }
  } else {
    // Insert new record
    const { error: insertError } = await supabase
      .from('inventory')
      .insert([{
        ...inventoryData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (insertError) {
      throw new Error(`Failed to insert inventory record: ${insertError.message}`);
    }
  }

  // Mark staging record as processed
  await updateStagingRecord(recordId, {
    validation_status: 'processed',
    processed_at: new Date().toISOString()
  });
}

/**
 * Get recent upload sessions for a user
 */
export async function getRecentUploadSessions(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('csv_upload_sessions')
    .select('*')
    .eq('uploaded_by', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get upload sessions: ${error.message}`);
  }

  return data || [];
}

