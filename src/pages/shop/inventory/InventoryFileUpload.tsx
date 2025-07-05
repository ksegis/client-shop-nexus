import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Clock, Eye, RefreshCw } from 'lucide-react';
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
              .select('id')
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
          summary.errors.push(`VCPN ${staging.vcpn}: ${error}`);
          summary.skipped++;
        }
      }

    } catch (error) {
      console.error('Error in sync process:', error);
      summary.errors.push(`Sync process error: ${error}`);
    }

    return summary;
  };

  // Main processing function
  const processCSVInBackground = async (csvContent: string, sessionId: string) => {
    try {
      // Stage 1: Parse CSV
      setProcessingStage('Parsing CSV file...');
      setUploadProgress(10);
      
      const records = parseCSV(csvContent);
      await updateSessionProgress(sessionId, { 
        total_records: records.length,
        status: 'processing'
      });

      // Stage 2: Validate and save to staging
      setProcessingStage('Validating records...');
      setUploadProgress(30);
      
      let validCount = 0;
      let invalidCount = 0;
      let correctedCount = 0;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const validation = validateRecord(record);
        
        await saveStagingRecord(sessionId, record, validation, i + 1);
        
        if (validation.isValid) {
          validCount++;
          if (validation.corrected) correctedCount++;
        } else {
          invalidCount++;
        }

        // Update progress
        const progress = 30 + (i / records.length) * 40;
        setUploadProgress(Math.round(progress));
        
        if (i % 100 === 0) {
          setProcessingStage(`Validating records... ${i + 1}/${records.length}`);
        }
      }

      await updateSessionProgress(sessionId, {
        processed_records: records.length,
        valid_records: validCount,
        invalid_records: invalidCount,
        corrected_records: correctedCount
      });

      // Stage 3: Sync to inventory
      setProcessingStage('Syncing to inventory...');
      setUploadProgress(80);
      
      const syncSummary = await syncStagingToInventory(sessionId);

      // Stage 4: Complete
      setProcessingStage('Processing complete!');
      setUploadProgress(100);
      
      await updateSessionProgress(sessionId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      return {
        validationSummary: { validCount, invalidCount, correctedCount },
        syncSummary
      };

    } catch (error) {
      console.error('Processing error:', error);
      await updateSessionProgress(sessionId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };

  // Handle button click
  const handleUploadClick = () => {
    setShowUploadDialog(true);
    setUploadResult(null);
    setSelectedFile(null);
    setPreviewData([]);
    setUploadProgress(0);
    setProcessingStage('');
    setCurrentSessionId(null);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
      previewCSVFile(file);
    }
  };

  // Preview CSV file
  const previewCSVFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
      
      // Parse first few rows for preview
      const preview = lines.slice(1, 4).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: CSVRecord = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        return record;
      }).filter(record => Object.values(record).some(value => value.length > 0));

      setPreviewData(preview);
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview Error",
        description: "Could not preview the CSV file",
        variant: "destructive",
      });
    }
  };

  // Process CSV file
  const processCSVFile = async () => {
    if (!selectedFile || !currentUser) {
      toast({
        title: "Error",
        description: "No file selected or user not authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setProcessingStage('Initializing...');
    setUploadResult(null);

    try {
      // Create upload session
      const sessionId = await createUploadSession(
        selectedFile.name,
        selectedFile.name,
        selectedFile.size
      );
      setCurrentSessionId(sessionId);

      // Read CSV content
      const csvContent = await selectedFile.text();

      // Process in background
      const result = await processCSVInBackground(csvContent, sessionId);

      // Get final session data
      const { data: session } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      setUploadResult({
        sessionId,
        session,
        ...result
      });

      // Refresh recent sessions
      if (currentUser) {
        loadRecentSessions(currentUser.id);
      }

      toast({
        title: "Processing Complete",
        description: `Successfully processed ${session?.valid_records || 0} of ${session?.total_records || 0} records`,
      });

    } catch (error) {
      console.error('Upload process error:', error);
      setProcessingStage('Processing failed');
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // View session details (opens reconciliation interface)
  const viewSessionDetails = (sessionId: string) => {
    // This would navigate to the reconciliation interface
    toast({
      title: "Reconciliation Interface",
      description: `Opening reconciliation for session ${sessionId}`,
    });
  };

  // Reset upload state
  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setProcessingStage('');
    setPreviewData([]);
    setCurrentSessionId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Close dialog
  const closeDialog = () => {
    setShowUploadDialog(false);
    resetUpload();
  };

  // Format session status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      {/* Upload Button */}
      <Button 
        variant="outline" 
        onClick={handleUploadClick}
        type="button"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload CSV
      </Button>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Enhanced CSV Upload & Validation</h2>
              <Button variant="outline" onClick={closeDialog} disabled={isUploading}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Feature Overview */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm space-y-2">
                    <p className="font-medium">✅ Enhanced Processing Features:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                      <div>• SKU normalization (Excel formatting)</div>
                      <div>• VCPN auto-correction</div>
                      <div>• Quantity validation & correction</div>
                      <div>• Background processing</div>
                      <div>• Duplicate detection & updates</div>
                      <div>• Complete audit trail</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sessions */}
              {recentSessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Recent Upload Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{session.originalFilename}</div>
                            <div className="text-xs text-gray-500">
                              {session.totalRecords} records • {session.validRecords} valid • {session.correctedRecords} corrected
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(session.createdAt).toLocaleDateString()} {new Date(session.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(session.status)}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => viewSessionDetails(session.id)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* File Selection */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                
                <div className="space-y-2">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">
                      {selectedFile ? selectedFile.name : 'Select CSV File'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Enhanced processing with validation and reconciliation
                    </p>
                    {selectedFile && (
                      <p className="text-xs text-gray-400 mt-1">
                        Size: {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                  <Button onClick={openFilePicker} disabled={isUploading}>
                    Select File
                  </Button>
                </div>
              </div>

              {/* CSV Preview */}
              {previewData.length > 0 && (
                <Card>
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
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{processingStage}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-gray-500">
                    ⚡ Processing in background - you can continue working while this completes
                  </p>
                </div>
              )}

              {/* Upload Results */}
              {uploadResult && (
                <Card>
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
                  disabled={isUploading}
                >
                  Reset
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={closeDialog}
                    disabled={isUploading}
                  >
                    Close
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

