import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Clock, Eye, RefreshCw, X, Trash2, BarChart3, Activity, Play, Pause, Square, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CSVReconciliation } from './CSVReconciliation';
import CSVAuditDashboard from './CSVAuditDashboard';

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
  chunk_number?: number;
  parent_session_id?: string;
  last_processed_at?: string;
}

interface SyncSummary {
  inserted: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: string[];
}

interface ChunkInfo {
  chunkNumber: number;
  startIndex: number;
  endIndex: number;
  records: CSVRecord[];
  sessionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
}

interface ProcessingStats {
  totalRecords: number;
  processedRecords: number;
  validRecords: number;
  invalidRecords: number;
  insertedRecords: number;
  updatedRecords: number;
  failedRecords: number;
  processingRate: number;
  successRate: number;
  estimatedTimeRemaining: number;
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
  
  // Hybrid approach state
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingStats, setProcessingStats] = useState<ProcessingStats>({
    totalRecords: 0,
    processedRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    insertedRecords: 0,
    updatedRecords: 0,
    failedRecords: 0,
    processingRate: 0,
    successRate: 0,
    estimatedTimeRemaining: 0
  });
  const [processingStartTime, setProcessingStartTime] = useState<Date | null>(null);
  
  // Reconciliation state
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [showAuditDashboard, setShowAuditDashboard] = useState(false);
  const [auditSessionId, setAuditSessionId] = useState<string | null>(null);
  const [reconciliationSessionId, setReconciliationSessionId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration
  const CHUNK_SIZE = 5000; // Records per chunk
  const BATCH_SIZE = 50; // Records per batch within chunk
  const PROGRESS_UPDATE_INTERVAL = 100; // Update progress every N records

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

  // Cleanup processing interval on unmount
  useEffect(() => {
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []);

  // Load recent upload sessions with enhanced statistics
  const loadRecentSessions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })
        .limit(20); // Show more recent sessions

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Stall detection function
  const detectStall = (session: UploadSession): { isStalled: boolean; stallDuration?: number } => {
    if (session.status !== 'processing') {
      return { isStalled: false };
    }

    const now = new Date();
    const lastProcessedAt = session.last_processed_at || session.updated_at;
    
    if (!lastProcessedAt) {
      return { isStalled: false };
    }

    try {
      const lastProcessedDate = new Date(lastProcessedAt);
      const timeSinceLastProgress = now.getTime() - lastProcessedDate.getTime();
      const stallThresholdMs = 2 * 60 * 1000; // 2 minutes

      if (timeSinceLastProgress > stallThresholdMs) {
        const stallDurationMinutes = Math.floor(timeSinceLastProgress / 1000 / 60);
        return { isStalled: true, stallDuration: stallDurationMinutes };
      }
    } catch (error) {
      console.error('Error detecting stall:', error);
    }

    return { isStalled: false };
  };

  // Get session status with stall detection
  const getSessionStatus = (session: UploadSession) => {
    const stallInfo = detectStall(session);
    
    if (stallInfo.isStalled) {
      return {
        status: `stalled (${stallInfo.stallDuration}m)`,
        variant: 'destructive' as const,
        icon: AlertTriangle
      };
    }

    switch (session.status) {
      case 'processing':
        return { status: 'processing', variant: 'default' as const, icon: Clock };
      case 'completed':
        return { status: 'completed', variant: 'default' as const, icon: CheckCircle };
      case 'failed':
        return { status: 'failed', variant: 'destructive' as const, icon: XCircle };
      default:
        return { status: session.status, variant: 'secondary' as const, icon: Clock };
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
  const createUploadSession = async (filename: string, originalFilename: string, fileSize: number, chunkNumber?: number, parentSessionId?: string): Promise<string> => {
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
        corrected_records: 0,
        chunk_number: chunkNumber,
        parent_session_id: parentSessionId,
        last_processed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  // Update session progress
  const updateSessionProgress = async (sessionId: string, updates: Partial<UploadSession>) => {
    const updateData = {
      ...updates,
      last_processed_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('csv_upload_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) throw error;
  };

  // Enhanced CSV parsing with column mapping
  const parseCSVFile = (csvText: string): CSVRecord[] => {
    const lines = csvText.split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
    
    // Column mapping for different CSV formats
    const columnMapping: { [key: string]: string } = {
      'VendorCode': 'VendorCode',
      'Vendor': 'VendorCode',
      'PartNumber': 'PartNumber',
      'Part': 'PartNumber',
      'PartNo': 'PartNumber',
      'SKU': 'PartNumber',
      'VendorName': 'VendorName',
      'LongDescription': 'LongDescription',
      'Description': 'LongDescription',
      'VCPN': 'VCPN',
      'JobberPrice': 'JobberPrice',
      'Cost': 'Cost',
      'TotalQty': 'TotalQty',
      'EastQty': 'EastQty',
      'MidwestQty': 'MidwestQty',
      'CaliforniaQty': 'CaliforniaQty',
      'SoutheastQty': 'SoutheastQty',
      'PacificNWQty': 'PacificNWQty',
      'TexasQty': 'TexasQty',
      'GreatLakesQty': 'GreatLakesQty',
      'FloridaQty': 'FloridaQty'
    };
    
    const records: CSVRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => {
        let cleaned = v.trim().replace(/"/g, '');
        // Remove Excel formula formatting
        if (cleaned.startsWith('=')) {
          cleaned = cleaned.substring(1);
          if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
              (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            cleaned = cleaned.slice(1, -1);
          }
        }
        return cleaned;
      });
      
      const record: CSVRecord = {};
      
      headers.forEach((header, index) => {
        const mappedHeader = columnMapping[header] || header;
        record[mappedHeader] = values[index] || '';
      });
      
      // Only include records with essential data
      if (record['LongDescription'] || record['PartNumber'] || record['VCPN'] || record['VendorCode']) {
        records.push(record);
      }
    }
    
    return records;
  };

  // Split records into chunks
  const createChunks = (records: CSVRecord[]): ChunkInfo[] => {
    const chunks: ChunkInfo[] = [];
    
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunkRecords = records.slice(i, Math.min(i + CHUNK_SIZE, records.length));
      chunks.push({
        chunkNumber: Math.floor(i / CHUNK_SIZE) + 1,
        startIndex: i,
        endIndex: Math.min(i + CHUNK_SIZE, records.length) - 1,
        records: chunkRecords,
        status: 'pending'
      });
    }
    
    return chunks;
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

  // Real-time inventory sync for individual record
  const syncRecordToInventory = async (sessionId: string, record: CSVRecord, validation: ValidationResult): Promise<{ action: 'insert' | 'update' | 'skip'; error?: string }> => {
    if (!validation.isValid) {
      return { action: 'skip', error: 'Invalid record' };
    }

    try {
      const vcpn = validation.cleanedData['VCPN'];
      
      // Check if record exists
      const { data: existing, error: checkError } = await supabase
        .from('inventory')
        .select('id')
        .eq('vcpn', vcpn)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      const inventoryData = {
        name: record['LongDescription'] || validation.cleanedData['PartNumber'] || 'Unknown Item',
        description: record['LongDescription'],
        sku: validation.cleanedData['PartNumber'], // Map part_number to sku
        vcpn: validation.cleanedData['VCPN'],
        vendor_code: record['VendorCode'] || record['Vendor'],
        vendor_name: record['VendorName'] || record['Vendor'],
        manufacturer_part_no: record['ManufacturerPartNo'],
        quantity: parseInt(validation.cleanedData['TotalQty'] || '0') || 0,
        price: parseFloat(record['JobberPrice'] || '0') || null,
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
        is_kit: record['IsKit']?.toLowerCase() === 'true' || false,
        kit_components: record['KitComponents'] || null,
        ftp_upload_id: sessionId,
        import_source: 'csv_upload',
        imported_at: new Date().toISOString()
      };

      if (existing) {
        const { error: updateError } = await supabase
          .from('inventory')
          .update(inventoryData)
          .eq('id', existing.id);

        if (updateError) throw updateError;
        return { action: 'update' };
      } else {
        const { error: insertError } = await supabase
          .from('inventory')
          .insert([inventoryData]);

        if (insertError) throw insertError;
        return { action: 'insert' };
      }
    } catch (error) {
      console.error('Error syncing record to inventory:', error);
      return { action: 'skip', error: error.message };
    }
  };

  // Process a single chunk with real-time inventory sync
  const processChunk = async (chunk: ChunkInfo): Promise<void> => {
    if (!chunk.sessionId) {
      throw new Error('Chunk session ID not set');
    }

    const sessionId = chunk.sessionId;
    let validCount = 0;
    let invalidCount = 0;
    let correctedCount = 0;
    let insertedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    // Update chunk status
    setChunks(prev => prev.map(c => 
      c.chunkNumber === chunk.chunkNumber 
        ? { ...c, status: 'processing' }
        : c
    ));

    try {
      // Process records in batches
      for (let i = 0; i < chunk.records.length; i += BATCH_SIZE) {
        if (isPaused) {
          // Update chunk status to paused
          setChunks(prev => prev.map(c => 
            c.chunkNumber === chunk.chunkNumber 
              ? { ...c, status: 'paused' }
              : c
          ));
          return;
        }

        const batch = chunk.records.slice(i, Math.min(i + BATCH_SIZE, chunk.records.length));
        
        for (let j = 0; j < batch.length; j++) {
          const record = batch[j];
          const rowNumber = chunk.startIndex + i + j + 1;
          
          // Validate record
          const validation = validateRecord(record);
          
          if (validation.isValid) {
            validCount++;
          } else {
            invalidCount++;
          }
          
          if (validation.corrected) {
            correctedCount++;
          }

          // Save to staging
          await saveStagingRecord(sessionId, record, validation, rowNumber);

          // Real-time inventory sync for valid records
          if (validation.isValid) {
            const syncResult = await syncRecordToInventory(sessionId, record, validation);
            
            switch (syncResult.action) {
              case 'insert':
                insertedCount++;
                break;
              case 'update':
                updatedCount++;
                break;
              case 'skip':
                failedCount++;
                break;
            }

            // Mark staging record as processed
            await supabase
              .from('csv_staging_records')
              .update({ 
                processed_at: new Date().toISOString(),
                action_type: syncResult.action
              })
              .eq('upload_session_id', sessionId)
              .eq('row_number', rowNumber);
          }

          // Update progress every PROGRESS_UPDATE_INTERVAL records
          if ((i + j + 1) % PROGRESS_UPDATE_INTERVAL === 0) {
            const processedInChunk = i + j + 1;
            const chunkProgress = (processedInChunk / chunk.records.length) * 100;
            
            // Update session progress
            await updateSessionProgress(sessionId, {
              processed_records: processedInChunk,
              valid_records: validCount,
              invalid_records: invalidCount,
              corrected_records: correctedCount
            });

            // Update overall stats
            updateProcessingStats(processedInChunk, validCount, invalidCount, insertedCount, updatedCount, failedCount);
          }
        }
      }

      // Mark chunk as completed
      setChunks(prev => prev.map(c => 
        c.chunkNumber === chunk.chunkNumber 
          ? { ...c, status: 'completed' }
          : c
      ));

      // Final session update for this chunk
      await updateSessionProgress(sessionId, {
        status: 'completed',
        processed_records: chunk.records.length,
        valid_records: validCount,
        invalid_records: invalidCount,
        corrected_records: correctedCount,
        completed_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error processing chunk:', error);
      
      // Mark chunk as failed
      setChunks(prev => prev.map(c => 
        c.chunkNumber === chunk.chunkNumber 
          ? { ...c, status: 'failed' }
          : c
      ));

      // Update session with error
      await updateSessionProgress(sessionId, {
        status: 'failed',
        error_message: error.message
      });

      throw error;
    }
  };

  // Update processing statistics
  const updateProcessingStats = (processed: number, valid: number, invalid: number, inserted: number, updated: number, failed: number) => {
    const now = new Date();
    const startTime = processingStartTime || now;
    const elapsedSeconds = (now.getTime() - startTime.getTime()) / 1000;
    const processingRate = elapsedSeconds > 0 ? processed / elapsedSeconds : 0;
    const successRate = processed > 0 ? ((inserted + updated) / processed) * 100 : 0;
    
    const totalRecords = chunks.reduce((sum, chunk) => sum + chunk.records.length, 0);
    const totalProcessed = chunks.reduce((sum, chunk) => {
      if (chunk.status === 'completed') return sum + chunk.records.length;
      if (chunk.chunkNumber === currentChunkIndex + 1) return sum + processed;
      return sum;
    }, 0);
    
    const remainingRecords = totalRecords - totalProcessed;
    const estimatedTimeRemaining = processingRate > 0 ? remainingRecords / processingRate : 0;

    setProcessingStats({
      totalRecords,
      processedRecords: totalProcessed,
      validRecords: valid,
      invalidRecords: invalid,
      insertedRecords: inserted,
      updatedRecords: updated,
      failedRecords: failed,
      processingRate,
      successRate,
      estimatedTimeRemaining
    });
  };

  // Start processing all chunks
  const startProcessing = async () => {
    if (chunks.length === 0) return;

    setIsProcessing(true);
    setIsPaused(false);
    setProcessingStartTime(new Date());
    setCurrentChunkIndex(0);

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (isPaused) break;

        setCurrentChunkIndex(i);
        const chunk = chunks[i];

        // Create session for this chunk if not exists
        if (!chunk.sessionId) {
          const chunkSessionId = await createUploadSession(
            `${selectedFile?.name}_chunk_${chunk.chunkNumber}`,
            selectedFile?.name || 'unknown',
            selectedFile?.size || 0,
            chunk.chunkNumber
          );
          
          // Update chunk with session ID
          setChunks(prev => prev.map(c => 
            c.chunkNumber === chunk.chunkNumber 
              ? { ...c, sessionId: chunkSessionId }
              : c
          ));
          
          chunk.sessionId = chunkSessionId;
        }

        await processChunk(chunk);
      }

      if (!isPaused) {
        setProcessingStage('All chunks processed successfully!');
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${chunks.length} chunks with ${processingStats.totalRecords} total records.`,
        });
      }

    } catch (error) {
      console.error('Error in chunk processing:', error);
      setProcessingStage(`Processing failed: ${error.message}`);
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      
      if (currentUser) {
        loadRecentSessions(currentUser.id);
      }
    }
  };

  // Pause processing
  const pauseProcessing = () => {
    setIsPaused(true);
    setProcessingStage('Processing paused...');
    toast({
      title: "Processing Paused",
      description: "You can resume processing at any time.",
    });
  };

  // Resume processing
  const resumeProcessing = () => {
    setIsPaused(false);
    setProcessingStage('Resuming processing...');
    toast({
      title: "Processing Resumed",
      description: "Continuing from where we left off.",
    });
  };

  // Stop processing
  const stopProcessing = () => {
    setIsPaused(true);
    setIsProcessing(false);
    setProcessingStage('Processing stopped by user.');
    
    // Mark current chunk as paused
    if (currentChunkIndex < chunks.length) {
      setChunks(prev => prev.map(c => 
        c.chunkNumber === currentChunkIndex + 1 
          ? { ...c, status: 'paused' }
          : c
      ));
    }
    
    toast({
      title: "Processing Stopped",
      description: "Processing has been stopped. You can resume later.",
    });
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit for chunked processing
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 100MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        const records = parseCSVFile(csvText);
        setPreviewData(records.slice(0, 5)); // Show more preview records
        
        // Create chunks
        const fileChunks = createChunks(records);
        setChunks(fileChunks);
        
        // Initialize processing stats
        setProcessingStats({
          totalRecords: records.length,
          processedRecords: 0,
          validRecords: 0,
          invalidRecords: 0,
          insertedRecords: 0,
          updatedRecords: 0,
          failedRecords: 0,
          processingRate: 0,
          successRate: 0,
          estimatedTimeRemaining: 0
        });
        
        setProcessingStage(`File loaded: ${records.length} records split into ${fileChunks.length} chunks of ${CHUNK_SIZE} records each.`);
      };
      reader.readAsText(file);
    }
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
    setChunks([]);
    setCurrentChunkIndex(0);
    setIsProcessing(false);
    setIsPaused(false);
    setProcessingStartTime(null);
    setProcessingStats({
      totalRecords: 0,
      processedRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      insertedRecords: 0,
      updatedRecords: 0,
      failedRecords: 0,
      processingRate: 0,
      successRate: 0,
      estimatedTimeRemaining: 0
    });
    
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
    if (isProcessing && !isPaused) {
      toast({
        title: "Cannot close during processing",
        description: "Please pause or stop processing before closing.",
        variant: "destructive",
      });
      return;
    }
    
    setShowUploadDialog(false);
    
    if (isProcessing && isPaused) {
      toast({
        title: "Processing paused",
        description: "You can resume processing from the sessions tab.",
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

  // Open audit dashboard
  const openAuditDashboard = (sessionId: string) => {
    setAuditSessionId(sessionId);
    setShowAuditDashboard(true);
    setShowUploadDialog(false);
  };

  // Close audit dashboard
  const closeAuditDashboard = () => {
    setShowAuditDashboard(false);
    setAuditSessionId(null);
    
    if (currentUser) {
      loadRecentSessions(currentUser.id);
    }
  };

  return (
    <>
      {/* Main Upload Interface */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Enhanced CSV Inventory Upload</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to select a CSV file or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Maximum file size: 100MB (will be processed in chunks)
                  </p>
                </label>
              </div>

              {selectedFile && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <Badge variant="secondary">{formatFileSize(selectedFile.size)}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUploadDialog(true)}
                    >
                      Configure & Process
                    </Button>
                  </div>

                  {chunks.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        File will be processed in {chunks.length} chunks of {CHUNK_SIZE} records each for optimal performance and recovery.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Upload Sessions</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => currentUser && loadRecentSessions(currentUser.id)}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent upload sessions found.</p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => {
                  const statusInfo = getSessionStatus(session);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <StatusIcon className="h-4 w-4" />
                          <span className="font-medium text-sm">{session.original_filename}</span>
                          <Badge variant={statusInfo.variant}>{statusInfo.status}</Badge>
                          {session.chunk_number && (
                            <Badge variant="outline">Chunk {session.chunk_number}</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>
                            {session.processed_records}/{session.total_records} records processed
                            {session.total_records > 0 && (
                              <span className="ml-2">
                                ({Math.round((session.processed_records / session.total_records) * 100)}%)
                              </span>
                            )}
                          </div>
                          <div>
                            Valid: {session.valid_records} | Invalid: {session.invalid_records} | Corrected: {session.corrected_records}
                          </div>
                          <div>
                            Created: {formatDate(session.created_at)} | Size: {formatFileSize(session.file_size)}
                          </div>
                        </div>
                        {session.total_records > 0 && (
                          <Progress 
                            value={(session.processed_records / session.total_records) * 100} 
                            className="mt-2 h-2"
                          />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {/* Audit button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAuditDashboard(session.id)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        
                        {/* Review button for problematic records */}
                        {((session.invalid_records || 0) > 0 || (session.corrected_records || 0) > 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReconciliation(session.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Delete button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUploadSession(session.id)}
                          disabled={isDeleting === session.id}
                        >
                          {isDeleting === session.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Upload Dialog with Tabs */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Enhanced CSV Upload & Processing</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={closeDialog}
                disabled={isProcessing && !isPaused}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload">Upload & Preview</TabsTrigger>
                  <TabsTrigger value="chunks">Chunks & Processing</TabsTrigger>
                  <TabsTrigger value="progress">Progress Monitor</TabsTrigger>
                </TabsList>

                {/* Upload & Preview Tab */}
                <TabsContent value="upload" className="space-y-4">
                  {selectedFile && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">File Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Filename:</span> {selectedFile.name}
                          </div>
                          <div>
                            <span className="font-medium">Size:</span> {formatFileSize(selectedFile.size)}
                          </div>
                          <div>
                            <span className="font-medium">Total Records:</span> {processingStats.totalRecords}
                          </div>
                          <div>
                            <span className="font-medium">Chunks:</span> {chunks.length} × {CHUNK_SIZE} records
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {previewData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Data Preview (First 5 Records)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-50">
                                {Object.keys(previewData[0] || {}).slice(0, 8).map((header) => (
                                  <th key={header} className="border border-gray-300 px-2 py-1 text-left">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.map((record, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {Object.values(record).slice(0, 8).map((value, cellIndex) => (
                                    <td key={cellIndex} className="border border-gray-300 px-2 py-1">
                                      {String(value).substring(0, 50)}
                                      {String(value).length > 50 && '...'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Chunks & Processing Tab */}
                <TabsContent value="chunks" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Processing Control</span>
                        <div className="flex space-x-2">
                          {!isProcessing && (
                            <Button
                              onClick={startProcessing}
                              disabled={chunks.length === 0}
                              size="sm"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start Processing
                            </Button>
                          )}
                          {isProcessing && !isPaused && (
                            <Button
                              onClick={pauseProcessing}
                              variant="outline"
                              size="sm"
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          {isProcessing && isPaused && (
                            <Button
                              onClick={resumeProcessing}
                              size="sm"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                          )}
                          {isProcessing && (
                            <Button
                              onClick={stopProcessing}
                              variant="destructive"
                              size="sm"
                            >
                              <Square className="h-4 w-4 mr-1" />
                              Stop
                            </Button>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {processingStage && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">{processingStage}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {chunks.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Chunk Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {chunks.map((chunk) => {
                            const getStatusColor = (status: string) => {
                              switch (status) {
                                case 'completed': return 'bg-green-100 text-green-800';
                                case 'processing': return 'bg-blue-100 text-blue-800';
                                case 'failed': return 'bg-red-100 text-red-800';
                                case 'paused': return 'bg-yellow-100 text-yellow-800';
                                default: return 'bg-gray-100 text-gray-800';
                              }
                            };

                            return (
                              <div key={chunk.chunkNumber} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center space-x-3">
                                  <Badge variant="outline">Chunk {chunk.chunkNumber}</Badge>
                                  <span className="text-sm">
                                    Records {chunk.startIndex + 1}-{chunk.endIndex + 1} ({chunk.records.length} total)
                                  </span>
                                </div>
                                <Badge className={getStatusColor(chunk.status)}>
                                  {chunk.status}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Progress Monitor Tab */}
                <TabsContent value="progress" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Processing Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{processingStats.totalRecords}</div>
                          <div className="text-blue-800">Total Records</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{processingStats.processedRecords}</div>
                          <div className="text-green-800">Processed</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{processingStats.insertedRecords}</div>
                          <div className="text-purple-800">Inserted</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{processingStats.updatedRecords}</div>
                          <div className="text-orange-800">Updated</div>
                        </div>
                      </div>

                      {processingStats.totalRecords > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Overall Progress</span>
                            <span>{Math.round((processingStats.processedRecords / processingStats.totalRecords) * 100)}%</span>
                          </div>
                          <Progress 
                            value={(processingStats.processedRecords / processingStats.totalRecords) * 100} 
                            className="h-3"
                          />
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Processing Rate:</span> {processingStats.processingRate.toFixed(1)} records/sec
                        </div>
                        <div>
                          <span className="font-medium">Success Rate:</span> {processingStats.successRate.toFixed(1)}%
                        </div>
                        <div>
                          <span className="font-medium">Valid Records:</span> {processingStats.validRecords}
                        </div>
                        <div>
                          <span className="font-medium">Invalid Records:</span> {processingStats.invalidRecords}
                        </div>
                        {processingStats.estimatedTimeRemaining > 0 && (
                          <div className="col-span-2">
                            <span className="font-medium">Estimated Time Remaining:</span> {Math.round(processingStats.estimatedTimeRemaining / 60)} minutes
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {isProcessing && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Current Chunk Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Chunk {currentChunkIndex + 1} of {chunks.length}</span>
                            <span>{isPaused ? 'Paused' : 'Processing...'}</span>
                          </div>
                          {chunks[currentChunkIndex] && (
                            <div className="text-xs text-gray-600">
                              Records {chunks[currentChunkIndex].startIndex + 1}-{chunks[currentChunkIndex].endIndex + 1}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  disabled={isProcessing && !isPaused}
                >
                  Reset
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={closeDialog}
                    disabled={isProcessing && !isPaused}
                  >
                    {isProcessing && isPaused ? 'Close (Processing paused)' : 'Close'}
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

      {/* CSV Audit Dashboard */}
      {showAuditDashboard && auditSessionId && (
        <CSVAuditDashboard
          sessionId={auditSessionId}
          onClose={closeAuditDashboard}
        />
      )}
    </>
  );
}

export default InventoryFileUpload;

