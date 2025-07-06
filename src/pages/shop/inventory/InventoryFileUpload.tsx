import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Clock, Eye, RefreshCw, X, Trash2, BarChart3, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CSVReconciliation } from './CSVReconciliation';


// Types for CSV processing
interface CSVRecord {
  [key: string]: string;
}

interface ValidationResult {
  isValid: boolean;
  corrected: boolean;
  notes: string[];
  originalData: CSVRecord;
  cleanedData: CSVRecord;
}

interface ProcessingProgress {
  stage: 'parsing' | 'validating' | 'syncing' | 'completed' | 'failed';
  progress: number;
  message: string;
  details?: any;
}

interface UploadSession {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  status: string;
  total_records: number;
  processed_records: number;
  valid_records: number;
  invalid_records: number;
  corrected_records: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  updated_at: string;
}

interface SyncSummary {
  inserted: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: string[];
}

export function InventoryFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewData, setPreviewData] = useState<CSVRecord[]>([]);
  const [recentSessions, setRecentSessions] = useState<UploadSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [canClose, setCanClose] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Reconciliation state
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [reconciliationSessionId, setReconciliationSessionId] = useState<string | null>(null);
  
  // Monitor state
  const [showMonitor, setShowMonitor] = useState(false);
  const [monitorSessionId, setMonitorSessionId] = useState<string | null>(null);
  const [monitorData, setMonitorData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get current user
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        loadRecentSessions(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Load recent upload sessions with enhanced statistics
  const loadRecentSessions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })
        .limit(10); // Show more recent sessions

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  };

  // Load monitor data for a session
  const loadMonitorData = async (sessionId: string) => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: stagingRecords, error: stagingError } = await supabase
        .from('csv_staging_records')
        .select('validation_status, needs_review, action_type')
        .eq('upload_session_id', sessionId);

      if (stagingError) throw stagingError;

      const stats = {
        total: stagingRecords?.length || 0,
        valid: stagingRecords?.filter(r => r.validation_status === 'valid').length || 0,
        invalid: stagingRecords?.filter(r => r.validation_status === 'invalid').length || 0,
        corrected: stagingRecords?.filter(r => r.validation_status === 'corrected').length || 0,
        needsReview: stagingRecords?.filter(r => r.needs_review).length || 0,
        inserted: stagingRecords?.filter(r => r.action_type === 'insert').length || 0,
        updated: stagingRecords?.filter(r => r.action_type === 'update').length || 0
      };

      setMonitorData({
        session,
        stats
      });
    } catch (error) {
      console.error('Error loading monitor data:', error);
      toast({
        title: "Monitor Error",
        description: "Failed to load monitoring data",
        variant: "destructive",
      });
    }
  };

  // Format date with proper error handling
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return 'Invalid Date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Delete upload session functionality
  const deleteUploadSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this upload session? This will also delete all associated staging records.')) {
      return;
    }

    setIsDeleting(sessionId);
    try {
      // First delete staging records
      const { error: stagingError } = await supabase
        .from('csv_staging_records')
        .delete()
        .eq('upload_session_id', sessionId);

      if (stagingError) {
        console.error('Error deleting staging records:', stagingError);
      }

      // Then delete the session
      const { error: sessionError } = await supabase
        .from('csv_upload_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) {
        throw sessionError;
      }

      toast({
        title: "Session Deleted",
        description: "Upload session and associated records have been deleted.",
      });

      // Reload recent sessions
      if (currentUser) {
        await loadRecentSessions(currentUser.id);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete session',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Create upload session
  const createUploadSession = async (filename: string, originalFilename: string, fileSize: number): Promise<string> => {
    if (fileSize > 50 * 1024 * 1024) {
      throw new Error('File size exceeds 50MB limit. Please use a smaller file for optimal performance.');
    }

    const { data, error } = await supabase
      .from('csv_upload_sessions')
      .insert([{
        filename,
        original_filename: originalFilename,
        file_size: fileSize,
        status: 'processing',
        uploaded_by: currentUser?.id,
        user_id: currentUser?.id,
        total_records: 0,
        processed_records: 0,
        valid_records: 0,
        invalid_records: 0,
        corrected_records: 0
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  // Update session progress
  const updateSessionProgress = async (sessionId: string, updates: Partial<UploadSession>) => {
    const { error } = await supabase
      .from('csv_upload_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) throw error;
  };

  // Parse CSV content with enhanced column mapping
  const parseCSV = (csvText: string): CSVRecord[] => {
    const lines = csvText.split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
    
    // COLUMN MAPPING - Map CSV headers to expected field names
    const columnMapping: { [key: string]: string } = {
      'VendorName': 'VendorName',
      'VendorCode': 'VendorCode', 
      'PartNumber': 'PartNumber',
      'LongDescription': 'LongDescription',
      'VCPN': 'VCPN',
      'ManufacturerPartNo': 'ManufacturerPartNo',
      'EastQty': 'EastQty',
      'MidwestQty': 'MidwestQty',
      'CaliforniaQty': 'CaliforniaQty',
      'SoutheastQty': 'SoutheastQty',
      'PacificNWQty': 'PacificNWQty',
      'TexasQty': 'TexasQty',
      'GreatLakesQty': 'GreatLakesQty',
      'FloridaQty': 'FloridaQty',
      'TotalQty': 'TotalQty',
      'Description': 'LongDescription',
      'Qty': 'TotalQty',
      'SKU': 'PartNumber',
      'Part': 'PartNumber',
      'PartNo': 'PartNumber',
      'Vendor': 'VendorCode'
    };
    
    const records: CSVRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const record: CSVRecord = {};
      
      headers.forEach((header, index) => {
        // Use mapped column name if available, otherwise use original
        const mappedHeader = columnMapping[header] || header;
        let value = values[index] || '';
        
        // Clean data during parsing - remove Excel formula formatting
        if (value.startsWith('=')) {
          value = value.substring(1); // Remove leading = sign
          // If it's wrapped in quotes after removing =, remove those too
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
        }
        value = value.trim(); // Remove whitespace
        
        record[mappedHeader] = value;
      });
      
      if (record['LongDescription'] || record['PartNumber'] || record['VCPN'] || record['VendorCode']) {
        records.push(record);
      }
    }
    
    return records;
  };

  // Enhanced normalization function for part numbers
  const normalizeSKU = (sku: string): string => {
    if (!sku) return '';
    
    let cleaned = sku.trim();
    
    if (cleaned.startsWith('=')) {
      cleaned = cleaned.substring(1);
      
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
          (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
      }
    }
    
    return cleaned;
  };

  // Calculate total quantity from warehouse quantities
  const calculateTotalQuantity = (record: CSVRecord): number => {
    const warehouseFields = [
      'EastQty', 'MidwestQty', 'CaliforniaQty', 'SoutheastQty',
      'PacificNWQty', 'TexasQty', 'GreatLakesQty', 'FloridaQty'
    ];
    
    let total = 0;
    warehouseFields.forEach(field => {
      const qty = parseInt(record[field] || '0') || 0;
      total += qty;
    });
    
    return total;
  };

  // Validate and clean CSV record
  const validateRecord = (record: CSVRecord): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      corrected: false,
      notes: [],
      originalData: { ...record },
      cleanedData: { ...record }
    };

    const vendorCode = record['VendorCode'] || record['Vendor'] || '';
    const originalSKU = record['PartNumber'] || record['SKU'] || '';
    
    if (!vendorCode.trim()) {
      result.isValid = false;
      result.notes.push('Missing vendor_code - record flagged as invalid');
    }
    
    if (!originalSKU.trim()) {
      result.isValid = false;
      result.notes.push('Missing SKU/PartNumber - record flagged as invalid');
    }

    if (!result.isValid) {
      return result;
    }

    // Normalize SKU
    const cleanedSKU = normalizeSKU(originalSKU);
    if (cleanedSKU !== originalSKU) {
      result.corrected = true;
      result.cleanedData['PartNumber'] = cleanedSKU;
      if (originalSKU.startsWith('=')) {
        result.notes.push(`Excel formula prefix removed: "${originalSKU}" → "${cleanedSKU}"`);
      } else {
        result.notes.push(`SKU normalized: "${originalSKU}" → "${cleanedSKU}"`);
      }
    }

    // Auto-correct VCPN
    const originalVCPN = record['VCPN'] || '';
    const expectedVCPN = vendorCode + cleanedSKU;
    
    if (!originalVCPN || originalVCPN !== expectedVCPN) {
      result.corrected = true;
      result.cleanedData['VCPN'] = expectedVCPN;
      if (!originalVCPN) {
        result.notes.push(`VCPN auto-generated: "${expectedVCPN}"`);
      } else {
        result.notes.push(`VCPN corrected: "${originalVCPN}" → "${expectedVCPN}"`);
      }
    }

    // Validate and correct total quantity
    const originalTotalQty = parseInt(record['TotalQty'] || '0') || 0;
    const calculatedTotalQty = calculateTotalQuantity(record);
    
    if (originalTotalQty !== calculatedTotalQty) {
      result.corrected = true;
      result.cleanedData['TotalQty'] = calculatedTotalQty.toString();
      result.notes.push(`TotalQty corrected: ${originalTotalQty} → ${calculatedTotalQty} (sum of warehouse quantities)`);
    }

    return result;
  };

  // Save staging record
  const saveStagingRecord = async (sessionId: string, record: CSVRecord, validation: ValidationResult, rowNumber: number) => {
    const stagingData = {
      upload_session_id: sessionId,
      row_number: rowNumber,
      validation_status: validation.isValid ? 'valid' : (validation.corrected ? 'corrected' : 'invalid'),
      needs_review: !validation.isValid || validation.corrected,
      validation_notes: validation.notes.join('; '),
      original_data: validation.originalData,
      
      vendor_name: record['VendorName'] || record['Vendor'] || null,
      vcpn: validation.cleanedData['VCPN'] || null,
      vendor_code: record['VendorCode'] || record['Vendor'] || null,
      part_number: validation.cleanedData['PartNumber'] || null,
      manufacturer_part_no: record['ManufacturerPartNo'] || null,
      long_description: record['LongDescription'] || record['Description'] || null,
      jobber_price: parseFloat(record['JobberPrice'] || '0') || null,
      cost: parseFloat(record['Cost'] || '0') || null,
      case_qty: parseInt(record['CaseQty'] || '0') || null,
      weight: parseFloat(record['Weight'] || '0') || null,
      height: parseFloat(record['Height'] || '0') || null,
      length: parseFloat(record['Length'] || '0') || null,
      width: parseFloat(record['Width'] || '0') || null,
      upsable: record['Upsable']?.toLowerCase() === 'true' || false,
      is_oversized: record['IsOversized']?.toLowerCase() === 'true' || false,
      is_hazmat: record['IsHazmat']?.toLowerCase() === 'true' || false,
      is_chemical: record['IsChemical']?.toLowerCase() === 'true' || false,
      is_non_returnable: record['IsNonReturnable']?.toLowerCase() === 'true' || false,
      prop65_toxicity: record['Prop65Toxicity']?.toLowerCase() === 'true' || false,
      upc_code: record['UPCCode'] || null,
      aaia_code: record['AAIACode'] || null,
      
      east_qty: parseInt(record['EastQty'] || '0') || 0,
      midwest_qty: parseInt(record['MidwestQty'] || '0') || 0,
      california_qty: parseInt(record['CaliforniaQty'] || '0') || 0,
      southeast_qty: parseInt(record['SoutheastQty'] || '0') || 0,
      pacific_nw_qty: parseInt(record['PacificNWQty'] || '0') || 0,
      texas_qty: parseInt(record['TexasQty'] || '0') || 0,
      great_lakes_qty: parseInt(record['GreatLakesQty'] || '0') || 0,
      florida_qty: parseInt(record['FloridaQty'] || '0') || 0,
      total_qty: parseInt(validation.cleanedData['TotalQty'] || '0') || 0,
      calculated_total_qty: calculateTotalQuantity(record),
      
      is_kit: record['IsKit']?.toLowerCase() === 'true' || false,
      kit_components: record['KitComponents'] || null
    };

    const { error } = await supabase
      .from('csv_staging_records')
      .insert([stagingData]);

    if (error) throw error;
  };

  // Sync staging records to inventory
  const syncStagingToInventory = async (sessionId: string): Promise<SyncSummary> => {
    const summary: SyncSummary = {
      inserted: 0,
      updated: 0,
      deleted: 0,
      skipped: 0,
      errors: []
    };

    try {
      const { data: stagingRecords, error: fetchError } = await supabase
        .from('csv_staging_records')
        .select('*')
        .eq('upload_session_id', sessionId)
        .in('validation_status', ['valid', 'corrected']);

      if (fetchError) throw fetchError;

      for (const staging of stagingRecords || []) {
        try {
          const { data: existing, error: checkError } = await supabase
            .from('inventory')
            .select('id')
            .eq('vcpn', staging.vcpn)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }

          const inventoryData = {
            name: staging.long_description || staging.part_number || 'Unknown Item',
            description: staging.long_description,
            sku: staging.part_number, // Map part_number to sku in inventory
            vcpn: staging.vcpn,
            vendor_code: staging.vendor_code,
            vendor_name: staging.vendor_name,
            manufacturer_part_no: staging.manufacturer_part_no,
            quantity: staging.total_qty,
            price: staging.jobber_price,
            cost: staging.cost,
            case_qty: staging.case_qty,
            weight: staging.weight,
            height: staging.height,
            length: staging.length,
            width: staging.width,
            upsable: staging.upsable,
            is_oversized: staging.is_oversized,
            is_hazmat: staging.is_hazmat,
            is_chemical: staging.is_chemical,
            is_non_returnable: staging.is_non_returnable,
            prop65_toxicity: staging.prop65_toxicity,
            upc_code: staging.upc_code,
            aaia_code: staging.aaia_code,
            east_qty: staging.east_qty,
            midwest_qty: staging.midwest_qty,
            california_qty: staging.california_qty,
            southeast_qty: staging.southeast_qty,
            pacific_nw_qty: staging.pacific_nw_qty,
            texas_qty: staging.texas_qty,
            great_lakes_qty: staging.great_lakes_qty,
            florida_qty: staging.florida_qty,
            total_qty: staging.total_qty,
            is_kit: staging.is_kit,
            kit_components: staging.kit_components,
            ftp_upload_id: sessionId,
            import_source: 'csv_upload',
            updated_at: new Date().toISOString()
          };

          if (existing) {
            const { error: updateError } = await supabase
              .from('inventory')
              .update(inventoryData)
              .eq('id', existing.id);

            if (updateError) throw updateError;
            summary.updated++;

            await supabase
              .from('csv_staging_records')
              .update({ 
                existing_inventory_id: existing.id,
                action_type: 'update',
                processed_at: new Date().toISOString()
              })
              .eq('id', staging.id);
          } else {
            const { data: newRecord, error: insertError } = await supabase
              .from('inventory')
              .insert([{
                ...inventoryData,
                created_at: new Date().toISOString()
              }])
              .select()
              .single();

            if (insertError) throw insertError;
            summary.inserted++;

            await supabase
              .from('csv_staging_records')
              .update({ 
                existing_inventory_id: newRecord.id,
                action_type: 'insert',
                processed_at: new Date().toISOString()
              })
              .eq('id', staging.id);
          }
        } catch (error) {
          console.error('Error syncing record:', error);
          summary.errors.push(`Row ${staging.row_number}: ${error.message}`);
          summary.skipped++;
        }
      }
    } catch (error) {
      console.error('Error in sync process:', error);
      summary.errors.push(`Sync process error: ${error.message}`);
    }

    return summary;
  };

  // Process CSV file in background
  const processCSVInBackground = async (file: File) => {
    let sessionId: string | null = null;
    
    try {
      setIsUploading(true);
      setCanClose(false);
      setUploadProgress(0);
      setProcessingStage('Initializing upload session...');

      sessionId = await createUploadSession(
        `${Date.now()}_${file.name}`,
        file.name,
        file.size
      );
      setCurrentSessionId(sessionId);

      setUploadProgress(10);
      setProcessingStage('Reading CSV file...');

      const csvText = await file.text();
      const records = parseCSV(csvText);

      setUploadProgress(20);
      setProcessingStage(`Validating ${records.length} records...`);

      await updateSessionProgress(sessionId, {
        total_records: records.length,
        status: 'processing'
      });

      const batchSize = 50;
      let validCount = 0;
      let invalidCount = 0;
      let correctedCount = 0;

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        for (let j = 0; j < batch.length; j++) {
          const record = batch[j];
          const validation = validateRecord(record);
          
          if (validation.isValid) {
            validCount++;
          } else {
            invalidCount++;
          }
          
          if (validation.corrected) {
            correctedCount++;
          }

          await saveStagingRecord(sessionId, record, validation, i + j + 1);
        }

        const progress = 20 + ((i + batch.length) / records.length) * 60;
        setUploadProgress(Math.min(progress, 80));
        setProcessingStage(`Processed ${Math.min(i + batchSize, records.length)} of ${records.length} records...`);

        await updateSessionProgress(sessionId, {
          processed_records: Math.min(i + batchSize, records.length),
          valid_records: validCount,
          invalid_records: invalidCount,
          corrected_records: correctedCount
        });
      }

      setUploadProgress(85);
      setProcessingStage('Syncing to inventory...');
      setCanClose(true);

      const syncSummary = await syncStagingToInventory(sessionId);

      setUploadProgress(95);
      setProcessingStage('Finalizing...');

      await updateSessionProgress(sessionId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      setUploadProgress(100);
      setProcessingStage('Processing completed successfully!');

      const { data: finalSession } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      setUploadResult({
        sessionId,
        session: finalSession,
        syncSummary
      });

      toast({
        title: "CSV Processing Complete",
        description: `Processed ${records.length} records. ${validCount} valid, ${invalidCount} invalid, ${correctedCount} corrected.`,
      });

      if (currentUser) {
        loadRecentSessions(currentUser.id);
      }

    } catch (error) {
      console.error('Processing error:', error);
      
      setProcessingStage('Processing failed');
      
      if (sessionId) {
        await updateSessionProgress(sessionId, {
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        });
      }

      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setCanClose(true);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 50MB for optimal performance.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        const records = parseCSV(csvText);
        setPreviewData(records.slice(0, 3));
      };
      reader.readAsText(file);
    }
  };

  // Process CSV file
  const processCSVFile = async () => {
    if (!selectedFile) return;
    await processCSVInBackground(selectedFile);
  };

  // Reset upload state
  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setUploadResult(null);
    setUploadProgress(0);
    setProcessingStage('');
    setCurrentSessionId(null);
    setCanClose(true);
    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (currentUser) {
      loadRecentSessions(currentUser.id);
    }
    
    toast({
      title: "Reset Complete",
      description: "Upload form has been reset.",
    });
  };

  // Close dialog
  const closeDialog = () => {
    if (isUploading && !canClose) {
      toast({
        title: "Cannot close yet",
        description: "Please wait for the critical processing phase to complete.",
        variant: "destructive",
      });
      return;
    }
    
    setShowUploadDialog(false);
    
    if (isUploading) {
      toast({
        title: "Processing continues in background",
        description: "Your CSV upload will continue processing. Check recent sessions for updates.",
      });
    }
  };

  // Open reconciliation interface
  const openReconciliation = (sessionId: string) => {
    setReconciliationSessionId(sessionId);
    setShowReconciliation(true);
    setShowUploadDialog(false);
  };

  // Close reconciliation interface
  const closeReconciliation = () => {
    setShowReconciliation(false);
    setReconciliationSessionId(null);
    
    if (currentUser) {
      loadRecentSessions(currentUser.id);
    }
  };

  // Open monitor
  const openMonitor = async () => {
    const sessionId = currentSessionId || (recentSessions.length > 0 ? recentSessions[0].id : null);
    
    if (!sessionId) {
      toast({
        title: "No Sessions to Monitor",
        description: "Upload a CSV file first to monitor processing.",
        variant: "destructive",
      });
      return;
    }

    setMonitorSessionId(sessionId);
    await loadMonitorData(sessionId);
    setShowMonitor(true);
    setShowUploadDialog(false);
  };

  // Close monitor
  const closeMonitor = () => {
    setShowMonitor(false);
    setMonitorSessionId(null);
    setMonitorData(null);
    
    if (currentUser) {
      loadRecentSessions(currentUser.id);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // NEW: Get processing progress percentage for sessions
  const getSessionProgress = (session: UploadSession): number => {
    if (session.status === 'completed') return 100;
    if (session.status === 'failed') return 0;
    if (session.total_records === 0) return 0;
    return Math.round((session.processed_records / session.total_records) * 100);
  };

  return (
    <>
      <Button onClick={() => setShowUploadDialog(true)} className="flex items-center space-x-2">
        <Upload className="w-4 h-4" />
        <span>Enhanced CSV Upload</span>
      </Button>

      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header with Monitor and close buttons */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Enhanced CSV Upload</h2>
                  <p className="text-sm text-gray-600">Enhanced processing with validation, reconciliation, and audit tracking</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={openMonitor}
                    className="flex items-center space-x-1"
                  >
                    <Activity className="h-4 w-4" />
                    <span>Monitor</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeDialog}
                    className="h-8 w-8 p-0"
                    disabled={isUploading && !canClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* ENHANCED: Recent Upload Sessions with audit access */}
              {recentSessions.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Recent Upload Sessions
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => currentUser && loadRecentSessions(currentUser.id)}
                        className="h-6 w-6 p-0"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentSessions.map((session) => (
                        <div key={session.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium truncate">{session.original_filename}</span>
                              <Badge 
                                variant={session.status === 'completed' ? 'default' : 
                                        session.status === 'failed' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {session.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-400">{formatDate(session.created_at)}</span>
                          </div>
                          
                          {/* ENHANCED: Detailed progress and statistics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                            <div>
                              <span className="text-gray-500">Total:</span>
                              <span className="font-mono ml-1">{session.total_records?.toLocaleString() || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Processed:</span>
                              <span className="font-mono ml-1">{session.processed_records?.toLocaleString() || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Valid:</span>
                              <span className="font-mono ml-1 text-green-600">{session.valid_records?.toLocaleString() || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Invalid:</span>
                              <span className="font-mono ml-1 text-red-600">{session.invalid_records?.toLocaleString() || 0}</span>
                            </div>
                          </div>
                          
                          {/* Progress bar for processing sessions */}
                          {session.status === 'processing' && (
                            <div className="mb-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Processing Progress</span>
                                <span>{getSessionProgress(session)}%</span>
                              </div>
                              <Progress value={getSessionProgress(session)} className="h-2" />
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              Size: {formatFileSize(session.file_size || 0)}
                            </div>
                            <div className="flex items-center space-x-1">
                              {/* Review button for problematic records */}
                              {(session.invalid_records > 0 || session.corrected_records > 0) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openReconciliation(session.id)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Review
                                </Button>
                              )}
                              
                              {/* Delete button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteUploadSession(session.id)}
                                disabled={isDeleting === session.id}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                {isDeleting === session.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* File Upload */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FileText className="w-12 h-12 text-blue-500 mx-auto" />
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">Enhanced processing with validation, reconciliation, and audit tracking</p>
                        <p className="text-xs text-gray-400">Size: {formatFileSize(selectedFile.size)}</p>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          Select Different File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="text-lg font-medium">Upload CSV File</p>
                        <p className="text-sm text-gray-500">Enhanced processing with validation, reconciliation, and audit tracking</p>
                        <p className="text-xs text-gray-400">Maximum file size: 50MB</p>
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Select File
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* CSV Preview */}
              {previewData.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-sm">CSV Preview & Field Detection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs space-y-2">
                      <p><strong>Detected Fields:</strong> {Object.keys(previewData[0] || {}).join(', ')}</p>
                      <p><strong>Sample Records:</strong> {previewData.length} shown</p>
                      <div className="bg-gray-50 p-2 rounded text-xs max-h-32 overflow-y-auto">
                        {previewData.map((record, index) => (
                          <div key={index} className="mb-1">
                            <strong>Row {index + 1}:</strong> {record['LongDescription'] || record['PartNumber'] || record['VCPN'] || 'Unknown'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Processing Progress */}
              {isUploading && (
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>{processingStage}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-gray-500">
                    ⚡ Processing in background - you can {canClose ? 'close this dialog and ' : ''}continue working while this completes
                  </p>
                </div>
              )}

              {/* Upload Results */}
              {uploadResult && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Processing Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Badge variant="outline" className="mr-2">Total</Badge>
                          {uploadResult.session?.total_records || 0}
                        </div>
                        <div>
                          <Badge variant="default" className="mr-2">Valid</Badge>
                          {uploadResult.session?.valid_records || 0}
                        </div>
                        <div>
                          <Badge variant="destructive" className="mr-2">Invalid</Badge>
                          {uploadResult.session?.invalid_records || 0}
                        </div>
                        <div>
                          <Badge variant="secondary" className="mr-2">Corrected</Badge>
                          {uploadResult.session?.corrected_records || 0}
                        </div>
                      </div>

                      {uploadResult.syncSummary && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium mb-2">Inventory Sync Results:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>✅ Inserted: {uploadResult.syncSummary.inserted}</div>
                            <div>🔄 Updated: {uploadResult.syncSummary.updated}</div>
                            <div>🗑️ Deleted: {uploadResult.syncSummary.deleted}</div>
                            <div>⏭️ Skipped: {uploadResult.syncSummary.skipped}</div>
                          </div>
                          {uploadResult.syncSummary.errors.length > 0 && (
                            <div className="mt-2 text-xs text-red-600">
                              {uploadResult.syncSummary.errors.length} sync errors occurred
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex space-x-2">
                        {/* Review button for problematic records */}
                        {((uploadResult.session?.invalid_records || 0) > 0 || (uploadResult.session?.corrected_records || 0) > 0) && (
                          <Button 
                            size="sm" 
                            onClick={() => openReconciliation(uploadResult.sessionId)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review & Correct
                          </Button>
                        )}
                      </div>

                      {/* Alert for records needing review */}
                      {((uploadResult.session?.invalid_records || 0) > 0 || (uploadResult.session?.corrected_records || 0) > 0) && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Some records need review. Use the reconciliation interface to correct errors and process remaining records.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  disabled={isUploading && !canClose}
                >
                  Reset
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={closeDialog}
                    disabled={isUploading && !canClose}
                  >
                    {isUploading && canClose ? 'Close (Processing continues)' : 'Close'}
                  </Button>
                  <Button
                    onClick={processCSVFile}
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading ? 'Processing...' : 'Process CSV'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Reconciliation Interface */}
      {showReconciliation && reconciliationSessionId && (
        <CSVReconciliation
          sessionId={reconciliationSessionId}
          onClose={closeReconciliation}
        />
      )}

      {/* Simple Monitor Interface */}
      {showMonitor && monitorData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Processing Monitor</h2>
                  <p className="text-sm text-gray-600">{monitorData.session.original_filename}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMonitor}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{monitorData.stats.total}</div>
                    <div className="text-sm text-gray-500">Total Records</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{monitorData.stats.valid}</div>
                    <div className="text-sm text-gray-500">Valid</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">{monitorData.stats.invalid}</div>
                    <div className="text-sm text-gray-500">Invalid</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{monitorData.stats.corrected}</div>
                    <div className="text-sm text-gray-500">Corrected</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{monitorData.stats.inserted}</div>
                    <div className="text-sm text-gray-500">Inserted to Inventory</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{monitorData.stats.updated}</div>
                    <div className="text-sm text-gray-500">Updated in Inventory</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <div className="text-sm text-gray-500">
                  Status: <Badge variant={monitorData.session.status === 'completed' ? 'default' : 'secondary'}>
                    {monitorData.session.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(monitorData.session.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InventoryFileUpload;

