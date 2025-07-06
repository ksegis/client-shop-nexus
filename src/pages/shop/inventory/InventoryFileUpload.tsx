import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Clock, Eye, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  originalFilename: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  validRecords: number;
  invalidRecords: number;
  correctedRecords: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
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
  const [canClose, setCanClose] = useState(true); // NEW: Track if dialog can be closed
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

  // Load recent upload sessions
  const loadRecentSessions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  };

  // Create upload session
  const createUploadSession = async (filename: string, originalFilename: string, fileSize: number): Promise<string> => {
    const { data, error } = await supabase
      .from('csv_upload_sessions')
      .insert([{
        filename,
        original_filename: originalFilename,
        file_size: fileSize,
        status: 'processing',
        uploaded_by: currentUser?.id,
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

  // Parse CSV content
  const parseCSV = (csvText: string): CSVRecord[] => {
    const lines = csvText.split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
    
    const records: CSVRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const record: CSVRecord = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      
      // Only include records with meaningful data
      if (record['LongDescription'] || record['PartNumber'] || record['VCPN'] || record['VendorCode']) {
        records.push(record);
      }
    }
    
    return records;
  };

  // Normalize SKU (Rule 1: Clean Excel formatting)
  const normalizeSKU = (sku: string): string => {
    if (!sku) return '';
    
    // Remove Excel formula formatting: ="10406" -> 10406
    let cleaned = sku.trim();
    if (cleaned.startsWith('="') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(2, -1);
    } else if (cleaned.startsWith('=') && cleaned.includes('"')) {
      cleaned = cleaned.replace(/^=["']?|["']?$/g, '');
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

  // Validate and clean CSV record (All 3 validation rules)
  const validateRecord = (record: CSVRecord): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      corrected: false,
      notes: [],
      originalData: { ...record },
      cleanedData: { ...record }
    };

    // Rule 1: Validate required fields (vendor_code, sku)
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

    // If basic validation fails, return early
    if (!result.isValid) {
      return result;
    }

    // Rule 1: Normalize SKU
    const cleanedSKU = normalizeSKU(originalSKU);
    if (cleanedSKU !== originalSKU) {
      result.corrected = true;
      result.cleanedData['PartNumber'] = cleanedSKU;
      result.notes.push(`SKU normalized: "${originalSKU}" → "${cleanedSKU}"`);
    }

    // Rule 2: Auto-correct VCPN if missing or incorrect
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

    // Rule 3: Validate and correct total quantity
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
      validation_status: validation.isValid ? 'valid' : 'invalid',
      needs_review: !validation.isValid || validation.corrected,
      validation_notes: validation.notes.join('; '),
      original_data: validation.originalData,
      
      // Map CSV fields to staging table columns
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
      
      // Warehouse quantities
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
      
      // Kit fields
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
      // Get valid staging records
      const { data: stagingRecords, error: fetchError } = await supabase
        .from('csv_staging_records')
        .select('*')
        .eq('upload_session_id', sessionId)
        .eq('validation_status', 'valid');

      if (fetchError) throw fetchError;

      for (const staging of stagingRecords || []) {
        try {
          // Check if record exists by VCPN
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
            sku: staging.part_number,
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
            ftp_upload_id: sessionId
          };

          if (existing) {
            // Update existing record
            const { error: updateError } = await supabase
              .from('inventory')
              .update(inventoryData)
              .eq('id', existing.id);

            if (updateError) throw updateError;
            summary.updated++;

            // Update staging record
            await supabase
              .from('csv_staging_records')
              .update({ 
                existing_inventory_id: existing.id,
                action_type: 'update',
                processed_at: new Date().toISOString()
              })
              .eq('id', staging.id);
          } else {
            // Insert new record
            const { data: newRecord, error: insertError } = await supabase
              .from('inventory')
              .insert([inventoryData])
              .select()
              .single();

            if (insertError) throw insertError;
            summary.inserted++;

            // Update staging record
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
      setCanClose(false); // Prevent closing during critical operations
      setUploadProgress(0);
      setProcessingStage('Initializing upload session...');

      // Create upload session
      sessionId = await createUploadSession(
        `${Date.now()}_${file.name}`,
        file.name,
        file.size
      );
      setCurrentSessionId(sessionId);

      setUploadProgress(10);
      setProcessingStage('Reading CSV file...');

      // Read and parse CSV
      const csvText = await file.text();
      const records = parseCSV(csvText);

      setUploadProgress(20);
      setProcessingStage(`Validating ${records.length} records...`);

      // Update session with total records
      await updateSessionProgress(sessionId, {
        totalRecords: records.length,
        status: 'processing'
      });

      // Process records in batches
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

          // Save to staging table
          await saveStagingRecord(sessionId, record, validation, i + j + 1);
        }

        // Update progress
        const progress = 20 + ((i + batch.length) / records.length) * 60;
        setUploadProgress(Math.min(progress, 80));
        setProcessingStage(`Processed ${Math.min(i + batchSize, records.length)} of ${records.length} records...`);

        // Update session progress
        await updateSessionProgress(sessionId, {
          processedRecords: Math.min(i + batchSize, records.length),
          validRecords: validCount,
          invalidRecords: invalidCount,
          correctedRecords: correctedCount
        });
      }

      setUploadProgress(85);
      setProcessingStage('Syncing to inventory...');
      setCanClose(true); // Allow closing during sync phase

      // Sync valid records to inventory
      const syncSummary = await syncStagingToInventory(sessionId);

      setUploadProgress(95);
      setProcessingStage('Finalizing...');

      // Update session as completed
      await updateSessionProgress(sessionId, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      setUploadProgress(100);
      setProcessingStage('Processing completed successfully!');

      // Get final session data
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

      // Refresh recent sessions
      if (currentUser) {
        loadRecentSessions(currentUser.id);
      }

    } catch (error) {
      console.error('Processing error:', error);
      console.error('Upload process error:', error);
      
      setProcessingStage('Processing failed');
      
      if (sessionId) {
        await updateSessionProgress(sessionId, {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date().toISOString()
        });
      }

      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setCanClose(true); // Always allow closing after completion
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Preview first few rows
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Close dialog - FIXED: Now works during background processing
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
    
    // If processing is ongoing, show notification
    if (isUploading) {
      toast({
        title: "Processing continues in background",
        description: "Your CSV upload will continue processing. Check recent sessions for updates.",
      });
    }
  };

  // View session details (for reconciliation)
  const viewSessionDetails = (sessionId: string) => {
    // This would open the reconciliation interface
    // For now, just show a toast
    toast({
      title: "Reconciliation Interface",
      description: "Opening reconciliation interface for session: " + sessionId,
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <Button onClick={() => setShowUploadDialog(true)} className="flex items-center space-x-2">
        <Upload className="w-4 h-4" />
        <span>Enhanced CSV Upload</span>
      </Button>

      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header with close button - FIXED */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Enhanced CSV Upload</h2>
                  <p className="text-sm text-gray-600">Enhanced processing with validation and reconciliation</p>
                </div>
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

              {/* Recent Upload Sessions */}
              {recentSessions.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Recent Upload Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-2 border rounded text-xs">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-3 h-3" />
                            <span className="font-medium">{session.originalFilename}</span>
                            <span className="text-gray-500">
                              {session.totalRecords} records
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={session.status === 'completed' ? 'default' : 
                                      session.status === 'failed' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {session.status}
                            </Badge>
                            <span className="text-gray-400">{formatDate(session.createdAt)}</span>
                            {(session.invalidRecords > 0 || session.correctedRecords > 0) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewSessionDetails(session.id)}
                                className="h-6 px-2 text-xs"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Review
                              </Button>
                            )}
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
                        <p className="text-sm text-gray-500">Enhanced processing with validation and reconciliation</p>
                        <p className="text-xs text-gray-400">Size: {formatFileSize(selectedFile.size)}</p>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          Select Different File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="text-lg font-medium">Upload CSV File</p>
                        <p className="text-sm text-gray-500">Enhanced processing with validation and reconciliation</p>
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

                      {((uploadResult.session?.invalid_records || 0) > 0 || (uploadResult.session?.corrected_records || 0) > 0) && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="text-sm">
                              Some records need review. Use the reconciliation interface to correct errors and process remaining records.
                            </div>
                            <Button 
                              size="sm" 
                              className="mt-2"
                              onClick={() => viewSessionDetails(uploadResult.sessionId)}
                            >
                              Open Reconciliation
                            </Button>
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
    </>
  );
}

export default InventoryFileUpload;

