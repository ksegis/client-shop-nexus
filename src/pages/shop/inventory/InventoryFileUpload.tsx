import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Clock, Eye, RefreshCw, X, Trash2 } from 'lucide-react';
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

interface UploadResult {
  sessionId: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  correctedRecords: number;
  processedRecords: number;
  session?: UploadSession;
}

export function InventoryFileUpload() {
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ProcessingProgress>({
    stage: 'parsing',
    progress: 0,
    message: 'Preparing upload...'
  });
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<CSVRecord[]>([]);
  
  // Session management state
  const [recentSessions, setRecentSessions] = useState<UploadSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [canClose, setCanClose] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Reconciliation state
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [reconciliationSessionId, setReconciliationSessionId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadRecentSessions(currentUser.id);
    }
  }, [currentUser]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadRecentSessions = async (userId: string) => {
    try {
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Enhanced normalization function for part numbers
  const normalizePartNumber = (partNumber: string): string => {
    if (!partNumber) return '';
    
    let cleaned = partNumber.trim();
    
    // Remove Excel formula formatting: ="10406" -> 10406, =10406 -> 10406
    if (cleaned.startsWith('=')) {
      cleaned = cleaned.substring(1); // Remove the = prefix
      
      // If it's wrapped in quotes after removing =, remove those too
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
          (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
      }
    }
    
    return cleaned;
  };

  const validateCSVRecord = (record: CSVRecord, rowIndex: number): ValidationResult => {
    const notes: string[] = [];
    let isValid = true;
    let corrected = false;
    const cleanedData = { ...record };

    // Rule 1: Normalize SKU (remove Excel formatting)
    if (cleanedData.sku) {
      const originalSku = cleanedData.sku;
      const normalizedSku = normalizePartNumber(originalSku);
      
      if (originalSku !== normalizedSku) {
        cleanedData.sku = normalizedSku;
        notes.push(`SKU normalized: "${originalSku}" → "${normalizedSku}"`);
        corrected = true;
      }
    }

    // Rule 2: Validate required fields
    if (!cleanedData.vendor_code || cleanedData.vendor_code.trim() === '') {
      notes.push('Missing vendor_code');
      isValid = false;
    }

    if (!cleanedData.sku || cleanedData.sku.trim() === '') {
      notes.push('Missing SKU');
      isValid = false;
    }

    // Rule 3: Auto-generate VCPN
    if (cleanedData.vendor_code && cleanedData.sku) {
      const expectedVCPN = cleanedData.vendor_code + cleanedData.sku;
      if (!cleanedData.vcpn || cleanedData.vcpn !== expectedVCPN) {
        const originalVCPN = cleanedData.vcpn || '';
        cleanedData.vcpn = expectedVCPN;
        notes.push(`VCPN corrected: "${originalVCPN}" → "${expectedVCPN}"`);
        corrected = true;
      }
    }

    // Rule 4: Validate total quantity calculation
    const warehouseQtys = [
      'east_qty', 'midwest_qty', 'california_qty', 'southeast_qty',
      'pacific_nw_qty', 'texas_qty', 'great_lakes_qty', 'florida_qty'
    ];

    const calculatedTotal = warehouseQtys.reduce((sum, field) => {
      const qty = parseInt(cleanedData[field]) || 0;
      return sum + qty;
    }, 0);

    const currentTotal = parseInt(cleanedData.total_qty) || 0;
    if (currentTotal !== calculatedTotal) {
      cleanedData.total_qty = calculatedTotal.toString();
      notes.push(`TotalQty corrected: ${currentTotal} → ${calculatedTotal}`);
      corrected = true;
    }

    return {
      isValid,
      corrected,
      notes,
      originalData: record,
      cleanedData
    };
  };

  const parseCSVFile = (file: File): Promise<CSVRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV file must have at least a header and one data row'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const records: CSVRecord[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length === headers.length) {
              const record: CSVRecord = {};
              headers.forEach((header, index) => {
                record[header] = values[index] || '';
              });
              records.push(record);
            }
          }

          resolve(records);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const createUploadSession = async (filename: string, fileSize: number, totalRecords: number): Promise<string> => {
    const { data, error } = await supabase
      .from('csv_upload_sessions')
      .insert([{
        filename: filename,
        original_filename: filename,
        file_size: fileSize,
        status: 'processing',
        total_records: totalRecords,
        processed_records: 0,
        valid_records: 0,
        invalid_records: 0,
        corrected_records: 0,
        user_id: currentUser?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  const insertStagingRecords = async (sessionId: string, records: CSVRecord[], validationResults: ValidationResult[]) => {
    const stagingRecords = records.map((record, index) => {
      const validation = validationResults[index];
      return {
        upload_session_id: sessionId,
        row_number: index + 1,
        validation_status: validation.isValid ? 'valid' : 'invalid',
        action_type: 'unknown',
        needs_review: !validation.isValid || validation.corrected,
        validation_notes: validation.notes.join('; '),
        original_data: validation.originalData,
        
        // Extract key fields for easy querying
        vendor_name: validation.cleanedData.vendor_name || '',
        vcpn: validation.cleanedData.vcpn || '',
        vendor_code: validation.cleanedData.vendor_code || '',
        part_number: validation.cleanedData.sku || '',
        long_description: validation.cleanedData.long_description || '',
        total_qty: parseInt(validation.cleanedData.total_qty) || 0,
        calculated_total_qty: parseInt(validation.cleanedData.total_qty) || 0,
        
        // Warehouse quantities
        east_qty: parseInt(validation.cleanedData.east_qty) || 0,
        midwest_qty: parseInt(validation.cleanedData.midwest_qty) || 0,
        california_qty: parseInt(validation.cleanedData.california_qty) || 0,
        southeast_qty: parseInt(validation.cleanedData.southeast_qty) || 0,
        pacific_nw_qty: parseInt(validation.cleanedData.pacific_nw_qty) || 0,
        texas_qty: parseInt(validation.cleanedData.texas_qty) || 0,
        great_lakes_qty: parseInt(validation.cleanedData.great_lakes_qty) || 0,
        florida_qty: parseInt(validation.cleanedData.florida_qty) || 0
      };
    });

    // Insert in batches to avoid payload size limits
    const batchSize = 100;
    for (let i = 0; i < stagingRecords.length; i += batchSize) {
      const batch = stagingRecords.slice(i, i + batchSize);
      const { error } = await supabase
        .from('csv_staging_records')
        .insert(batch);
      
      if (error) throw error;
    }
  };

  const updateSessionStats = async (sessionId: string, validationResults: ValidationResult[]) => {
    const validCount = validationResults.filter(r => r.isValid).length;
    const invalidCount = validationResults.filter(r => !r.isValid).length;
    const correctedCount = validationResults.filter(r => r.corrected).length;

    const { error } = await supabase
      .from('csv_upload_sessions')
      .update({
        valid_records: validCount,
        invalid_records: invalidCount,
        corrected_records: correctedCount,
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  };

  const processInventorySync = async (sessionId: string) => {
    try {
      // Get valid and corrected records from staging
      const { data: stagingRecords, error: stagingError } = await supabase
        .from('csv_staging_records')
        .select('*')
        .eq('upload_session_id', sessionId)
        .in('validation_status', ['valid', 'corrected']);

      if (stagingError) throw stagingError;

      let processedCount = 0;
      
      for (const record of stagingRecords || []) {
        try {
          // Check if record exists in inventory by VCPN
          const { data: existing, error: checkError } = await supabase
            .from('inventory')
            .select('id')
            .eq('vcpn', record.vcpn)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }

          const inventoryData = {
            name: record.long_description || record.part_number || 'Unknown Item',
            description: record.long_description,
            sku: record.part_number,
            vcpn: record.vcpn,
            vendor_code: record.vendor_code,
            vendor_name: record.vendor_name,
            quantity: record.total_qty,
            east_qty: record.east_qty,
            midwest_qty: record.midwest_qty,
            california_qty: record.california_qty,
            southeast_qty: record.southeast_qty,
            pacific_nw_qty: record.pacific_nw_qty,
            texas_qty: record.texas_qty,
            great_lakes_qty: record.great_lakes_qty,
            florida_qty: record.florida_qty,
            total_qty: record.total_qty,
            ftp_upload_id: sessionId
          };

          if (existing) {
            // Update existing record
            const { error: updateError } = await supabase
              .from('inventory')
              .update(inventoryData)
              .eq('id', existing.id);

            if (updateError) throw updateError;

            // Update staging record
            await supabase
              .from('csv_staging_records')
              .update({ 
                existing_inventory_id: existing.id,
                action_type: 'update',
                validation_status: 'processed',
                processed_at: new Date().toISOString()
              })
              .eq('id', record.id);
          } else {
            // Insert new record
            const { data: newRecord, error: insertError } = await supabase
              .from('inventory')
              .insert([inventoryData])
              .select()
              .single();

            if (insertError) throw insertError;

            // Update staging record
            await supabase
              .from('csv_staging_records')
              .update({ 
                existing_inventory_id: newRecord.id,
                action_type: 'insert',
                validation_status: 'processed',
                processed_at: new Date().toISOString()
              })
              .eq('id', record.id);
          }

          processedCount++;
        } catch (error) {
          console.error('Error processing record:', record.id, error);
          // Mark record as failed
          await supabase
            .from('csv_staging_records')
            .update({ 
              validation_status: 'invalid',
              validation_notes: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            })
            .eq('id', record.id);
        }
      }

      // Update session with processed count
      await supabase
        .from('csv_upload_sessions')
        .update({
          processed_records: processedCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      return processedCount;
    } catch (error) {
      console.error('Error in inventory sync:', error);
      throw error;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 50MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadResult(null);
      previewCSVFile(file);
    }
  };

  const previewCSVFile = async (file: File) => {
    try {
      const records = await parseCSVFile(file);
      setPreviewData(records.slice(0, 5)); // Show first 5 rows for preview
    } catch (error) {
      console.error('Error previewing CSV:', error);
      toast({
        title: "Preview Error",
        description: "Could not preview CSV file",
        variant: "destructive",
      });
    }
  };

  const handleUploadClick = () => {
    setShowUploadDialog(true);
    setUploadResult(null);
    setSelectedFile(null);
    setPreviewData([]);
  };

  const processCSVUpload = async () => {
    if (!selectedFile || !currentUser) return;

    try {
      setIsUploading(true);
      setCanClose(false);
      setUploadProgress({ stage: 'parsing', progress: 10, message: 'Parsing CSV file...' });

      // Parse CSV file
      const records = await parseCSVFile(selectedFile);
      setUploadProgress({ stage: 'parsing', progress: 30, message: `Parsed ${records.length} records` });

      // Create upload session
      const sessionId = await createUploadSession(selectedFile.name, selectedFile.size, records.length);
      setCurrentSessionId(sessionId);
      setUploadProgress({ stage: 'validating', progress: 50, message: 'Validating records...' });

      // Validate records
      const validationResults = records.map((record, index) => validateCSVRecord(record, index));
      setUploadProgress({ stage: 'validating', progress: 70, message: 'Storing validation results...' });

      // Insert staging records
      await insertStagingRecords(sessionId, records, validationResults);
      
      // Update session statistics
      await updateSessionStats(sessionId, validationResults);
      setUploadProgress({ stage: 'syncing', progress: 85, message: 'Syncing to inventory...' });

      // Process inventory sync in background
      const processedCount = await processInventorySync(sessionId);
      setUploadProgress({ stage: 'completed', progress: 100, message: 'Upload completed successfully!' });

      // Get final session data
      const { data: finalSession } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      const result: UploadResult = {
        sessionId,
        totalRecords: records.length,
        validRecords: validationResults.filter(r => r.isValid).length,
        invalidRecords: validationResults.filter(r => !r.isValid).length,
        correctedRecords: validationResults.filter(r => r.corrected).length,
        processedRecords: processedCount,
        session: finalSession
      };

      setUploadResult(result);
      setCanClose(true);

      toast({
        title: "Upload Successful",
        description: `Processed ${processedCount} records successfully`,
      });

      // Refresh recent sessions
      if (currentUser) {
        loadRecentSessions(currentUser.id);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({ 
        stage: 'failed', 
        progress: 0, 
        message: error instanceof Error ? error.message : 'Upload failed' 
      });
      setCanClose(true);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setUploadResult(null);
    setUploadProgress({ stage: 'parsing', progress: 0, message: 'Preparing upload...' });
    setCurrentSessionId(null);
    setCanClose(true);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast({
      title: "Upload Reset",
      description: "Upload form has been reset",
    });

    // Refresh recent sessions
    if (currentUser) {
      loadRecentSessions(currentUser.id);
    }
  };

  const closeUploadDialog = () => {
    if (!canClose && isUploading) {
      toast({
        title: "Processing in Progress",
        description: "Upload is still processing. Please wait for completion or check recent sessions.",
      });
      return;
    }
    
    setShowUploadDialog(false);
    resetUpload();
  };

  const deleteUploadSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this upload session? This will also remove all associated staging records.')) {
      return;
    }

    try {
      setIsDeleting(sessionId);

      // Delete staging records first
      const { error: stagingError } = await supabase
        .from('csv_staging_records')
        .delete()
        .eq('upload_session_id', sessionId);

      if (stagingError) throw stagingError;

      // Delete session
      const { error: sessionError } = await supabase
        .from('csv_upload_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      toast({
        title: "Session Deleted",
        description: "Upload session and associated records have been removed",
      });

      // Refresh sessions
      if (currentUser) {
        loadRecentSessions(currentUser.id);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the upload session",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const openReconciliation = (sessionId: string) => {
    setReconciliationSessionId(sessionId);
    setShowReconciliation(true);
    setShowUploadDialog(false);
  };

  const closeReconciliation = () => {
    setShowReconciliation(false);
    setReconciliationSessionId(null);
    
    if (currentUser) {
      loadRecentSessions(currentUser.id);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getSessionProgress = (session: UploadSession): number => {
    if (session.status === 'completed') return 100;
    if (session.total_records === 0) return 0;
    return Math.round(((session.processed_records || 0) / session.total_records) * 100);
  };

  const getStatusBadge = (session: UploadSession) => {
    switch (session.status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{session.status}</Badge>;
    }
  };

  return (
    <>
      {/* Upload Button */}
      <Button onClick={handleUploadClick} className="flex items-center space-x-2">
        <Upload className="h-4 w-4" />
        <span>Enhanced CSV Upload</span>
      </Button>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Enhanced CSV Upload</h2>
                  <p className="text-sm text-gray-600">Enhanced processing with validation and reconciliation</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={closeUploadDialog}
                  disabled={!canClose && isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              {!uploadResult ? (
                <div className="space-y-6">
                  {/* Recent Upload Sessions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center space-x-2">
                        <Clock className="h-5 w-5" />
                        <span>Recent Upload Sessions</span>
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => currentUser && loadRecentSessions(currentUser.id)}
                        disabled={loadingSessions}
                      >
                        {loadingSessions ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh
                      </Button>
                    </div>

                    {recentSessions.length > 0 ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {recentSessions.map((session) => (
                          <Card key={session.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="font-medium">{session.original_filename}</span>
                                  {getStatusBadge(session)}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {session.total_records} records • {formatDate(session.created_at)}
                                </div>
                                
                                {session.status === 'processing' && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                      <span>Progress: {session.processed_records || 0} / {session.total_records}</span>
                                      <span>{getSessionProgress(session)}%</span>
                                    </div>
                                    <Progress value={getSessionProgress(session)} className="h-2" />
                                  </div>
                                )}
                              </div>
                              
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
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent upload sessions found</p>
                        <p className="text-sm text-gray-500">Enhanced processing with validation, reconciliation, and audit tracking</p>
                      </div>
                    )}
                  </div>

                  {/* File Upload Section */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <div className="text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                      <p className="text-sm text-gray-500">Enhanced processing with validation, reconciliation, and audit tracking</p>
                      <p className="text-xs text-gray-400 mt-1">Maximum file size: 50MB</p>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4"
                        disabled={isUploading}
                      >
                        Select File
                      </Button>
                    </div>
                  </div>

                  {/* File Preview */}
                  {selectedFile && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <FileText className="h-5 w-5" />
                          <span>File Preview</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{selectedFile.name}</span>
                            <span className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</span>
                          </div>
                          
                          {previewData.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-xs">
                                <thead>
                                  <tr className="border-b">
                                    {Object.keys(previewData[0]).map((header) => (
                                      <th key={header} className="text-left p-2 font-medium">
                                        {header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {previewData.map((row, index) => (
                                    <tr key={index} className="border-b">
                                      {Object.values(row).map((value, cellIndex) => (
                                        <td key={cellIndex} className="p-2 truncate max-w-32">
                                          {value}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          
                          <div className="flex space-x-2">
                            <Button 
                              onClick={processCSVUpload} 
                              disabled={isUploading}
                              className="flex-1"
                            >
                              {isUploading ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Process CSV
                                </>
                              )}
                            </Button>
                            <Button variant="outline" onClick={resetUpload} disabled={isUploading}>
                              Reset
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Processing Progress */}
                  {isUploading && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Activity className="h-5 w-5" />
                          <span>Processing Progress</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{uploadProgress.message}</span>
                            <span className="text-sm text-gray-500">{uploadProgress.progress}%</span>
                          </div>
                          <Progress value={uploadProgress.progress} className="h-3" />
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className={`flex items-center space-x-1 ${uploadProgress.stage === 'parsing' ? 'text-blue-600' : uploadProgress.progress > 30 ? 'text-green-600' : ''}`}>
                              <div className={`w-2 h-2 rounded-full ${uploadProgress.stage === 'parsing' ? 'bg-blue-600' : uploadProgress.progress > 30 ? 'bg-green-600' : 'bg-gray-300'}`} />
                              <span>Parsing</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${uploadProgress.stage === 'validating' ? 'text-blue-600' : uploadProgress.progress > 70 ? 'text-green-600' : ''}`}>
                              <div className={`w-2 h-2 rounded-full ${uploadProgress.stage === 'validating' ? 'bg-blue-600' : uploadProgress.progress > 70 ? 'bg-green-600' : 'bg-gray-300'}`} />
                              <span>Validating</span>
                            </div>
                            <div className={`flex items-center space-x-1 ${uploadProgress.stage === 'syncing' ? 'text-blue-600' : uploadProgress.progress === 100 ? 'text-green-600' : ''}`}>
                              <div className={`w-2 h-2 rounded-full ${uploadProgress.stage === 'syncing' ? 'bg-blue-600' : uploadProgress.progress === 100 ? 'bg-green-600' : 'bg-gray-300'}`} />
                              <span>Syncing</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                /* Upload Results */
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Upload Completed Successfully!</h3>
                    <p className="text-gray-600">Your CSV file has been processed and validated</p>
                  </div>

                  {/* Results Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="text-center p-4">
                      <div className="text-2xl font-bold text-blue-600">{uploadResult.totalRecords}</div>
                      <div className="text-sm text-gray-500">Total Records</div>
                    </Card>
                    <Card className="text-center p-4">
                      <div className="text-2xl font-bold text-green-600">{uploadResult.validRecords}</div>
                      <div className="text-sm text-gray-500">Valid Records</div>
                    </Card>
                    <Card className="text-center p-4">
                      <div className="text-2xl font-bold text-orange-600">{uploadResult.correctedRecords}</div>
                      <div className="text-sm text-gray-500">Corrected</div>
                    </Card>
                    <Card className="text-center p-4">
                      <div className="text-2xl font-bold text-purple-600">{uploadResult.processedRecords}</div>
                      <div className="text-sm text-gray-500">Processed</div>
                    </Card>
                  </div>

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

                  <div className="flex space-x-2">
                    <Button onClick={resetUpload} variant="outline" className="flex-1">
                      Upload Another File
                    </Button>
                    <Button onClick={closeUploadDialog} className="flex-1">
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSV Reconciliation */}
      {showReconciliation && reconciliationSessionId && (
        <CSVReconciliation
          sessionId={reconciliationSessionId}
          onClose={closeReconciliation}
        />
      )}
    </>
  );
}

export default InventoryFileUpload;

