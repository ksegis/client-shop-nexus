import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  RefreshCw,
  Activity,
  Play,
  Pause,
  Square,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CSVReconciliation } from './CSVReconciliation';

// Configuration constants
const CHUNK_SIZE = 5000; // Records per chunk
const BATCH_SIZE = 50;   // Records per batch for real-time processing
const PROGRESS_UPDATE_INTERVAL = 100; // Update UI every N records

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedData: Record<string, any>;
  status: 'valid' | 'invalid' | 'corrected';
}

interface ProcessingChunk {
  id: string;
  chunkNumber: number;
  totalChunks: number;
  records: any[];
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  processed: number;
  inserted: number;
  failed: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface FileProcessingState {
  originalFilename: string;
  totalRecords: number;
  chunks: ProcessingChunk[];
  currentChunkIndex: number;
  overallProgress: {
    totalProcessed: number;
    totalInserted: number;
    totalFailed: number;
    startTime: Date;
    estimatedTimeRemaining?: number;
  };
  status: 'parsing' | 'processing' | 'completed' | 'failed' | 'paused';
  isPaused: boolean;
}

interface UploadSession {
  id: string;
  original_filename: string;
  status: string;
  total_records: number;
  processed_records: number;
  valid_records: number;
  invalid_records: number;
  corrected_records: number;
  created_at: string;
  updated_at: string;
  chunk_number?: number;
  total_chunks?: number;
  file_size?: number;
}

export default function InventoryFileUpload() {
  // State management
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSessions, setUploadSessions] = useState<UploadSession[]>([]);
  const [processingState, setProcessingState] = useState<FileProcessingState | null>(null);
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [reconciliationSessionId, setReconciliationSessionId] = useState<string>('');
  
  // Refs for processing control
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingControlRef = useRef<{
    shouldStop: boolean;
    shouldPause: boolean;
  }>({ shouldStop: false, shouldPause: false });

  // Load upload sessions on component mount
  useEffect(() => {
    loadUploadSessions();
  }, []);

  const loadUploadSessions = async () => {
    try {
      const { data: sessions, error } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setUploadSessions(sessions || []);
    } catch (error) {
      console.error('Error loading upload sessions:', error);
    }
  };

  // File selection handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  // Enhanced CSV parsing with chunking
  const parseCSVFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const records = [];

          // Enhanced column mapping
          const columnMapping: Record<string, string> = {
            'VendorCode': 'vendor_code',
            'Vendor Code': 'vendor_code',
            'PartNumber': 'part_number',
            'Part Number': 'part_number',
            'SKU': 'part_number',
            'Part': 'part_number',
            'PartNo': 'part_number',
            'VendorName': 'vendor_name',
            'Vendor Name': 'vendor_name',
            'ManufacturerPartNo': 'manufacturer_part_no',
            'Manufacturer Part No': 'manufacturer_part_no',
            'LongDescription': 'long_description',
            'Long Description': 'long_description',
            'Description': 'long_description',
            'JobberPrice': 'jobber_price',
            'Jobber Price': 'jobber_price',
            'Price': 'jobber_price',
            'Cost': 'cost',
            'TotalQty': 'total_qty',
            'Total Qty': 'total_qty',
            'Quantity': 'total_qty',
            'EastQty': 'east_qty',
            'East Qty': 'east_qty',
            'MidwestQty': 'midwest_qty',
            'Midwest Qty': 'midwest_qty',
            'CaliforniaQty': 'california_qty',
            'California Qty': 'california_qty',
            'SoutheastQty': 'southeast_qty',
            'Southeast Qty': 'southeast_qty',
            'PacificNWQty': 'pacific_nw_qty',
            'Pacific NW Qty': 'pacific_nw_qty',
            'TexasQty': 'texas_qty',
            'Texas Qty': 'texas_qty',
            'GreatLakesQty': 'great_lakes_qty',
            'Great Lakes Qty': 'great_lakes_qty',
            'FloridaQty': 'florida_qty',
            'Florida Qty': 'florida_qty'
          };

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => {
              let cleaned = v.trim().replace(/"/g, '');
              // Remove Excel formula formatting
              if (cleaned.startsWith('=') && cleaned.includes('"')) {
                cleaned = cleaned.replace(/^="?/, '').replace(/"?$/, '');
              }
              return cleaned;
            });

            if (values.length !== headers.length) continue;

            const record: any = { row_number: i };
            
            // Map headers to standardized field names
            headers.forEach((header, index) => {
              const mappedField = columnMapping[header] || header.toLowerCase().replace(/\s+/g, '_');
              record[mappedField] = values[index] || '';
            });

            // Generate VCPN if missing
            if (!record.vcpn && record.vendor_code && record.part_number) {
              record.vcpn = `${record.vendor_code}-${record.part_number}`;
            }

            records.push(record);
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

  // Enhanced validation with better error handling
  const validateRecord = (record: any, rowNumber: number): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cleanedData = { ...record };

    // Required field validation
    if (!cleanedData.vendor_code?.trim()) {
      errors.push('Missing vendor code');
    }
    if (!cleanedData.part_number?.trim()) {
      errors.push('Missing part number');
    }

    // Data type validation and cleaning
    const numericFields = ['total_qty', 'jobber_price', 'cost', 'case_qty', 'weight', 'height', 'length', 'width'];
    numericFields.forEach(field => {
      if (cleanedData[field]) {
        const numValue = parseFloat(cleanedData[field]);
        if (isNaN(numValue)) {
          warnings.push(`Invalid ${field}: ${cleanedData[field]}`);
          cleanedData[field] = 0;
        } else {
          cleanedData[field] = numValue;
        }
      }
    });

    // Boolean field validation
    const booleanFields = ['upsable', 'is_oversized', 'is_hazmat', 'is_chemical', 'is_non_returnable', 'is_kit'];
    booleanFields.forEach(field => {
      if (cleanedData[field]) {
        cleanedData[field] = ['true', '1', 'yes', 'y'].includes(cleanedData[field].toString().toLowerCase());
      }
    });

    // Determine validation status
    let status: 'valid' | 'invalid' | 'corrected' = 'valid';
    if (errors.length > 0) {
      status = 'invalid';
    } else if (warnings.length > 0) {
      status = 'corrected';
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedData,
      status
    };
  };

  // Create upload session for a chunk
  const createUploadSession = async (
    filename: string, 
    chunkNumber: number, 
    totalChunks: number, 
    recordCount: number,
    fileSize: number
  ): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const chunkFilename = totalChunks > 1 
        ? `${filename.replace('.csv', '')}_chunk_${chunkNumber}.csv`
        : filename;

      const { data, error } = await supabase
        .from('csv_upload_sessions')
        .insert({
          original_filename: chunkFilename,
          status: 'processing',
          total_records: recordCount,
          processed_records: 0,
          valid_records: 0,
          invalid_records: 0,
          corrected_records: 0,
          uploaded_by: user.id,
          user_id: user.id,
          chunk_number: chunkNumber,
          total_chunks: totalChunks,
          file_size: fileSize
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating upload session:', error);
      throw error;
    }
  };

  // Insert record to staging table
  const insertStagingRecord = async (
    sessionId: string, 
    record: any, 
    validation: ValidationResult
  ): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('csv_staging_records')
        .insert({
          upload_session_id: sessionId,
          row_number: record.row_number,
          vcpn: validation.cleanedData.vcpn || '',
          vendor_code: validation.cleanedData.vendor_code || '',
          vendor_name: validation.cleanedData.vendor_name || '',
          part_number: validation.cleanedData.part_number || '',
          manufacturer_part_no: validation.cleanedData.manufacturer_part_no || '',
          long_description: validation.cleanedData.long_description || '',
          jobber_price: validation.cleanedData.jobber_price || 0,
          cost: validation.cleanedData.cost || 0,
          total_qty: validation.cleanedData.total_qty || 0,
          case_qty: validation.cleanedData.case_qty || 0,
          weight: validation.cleanedData.weight || 0,
          height: validation.cleanedData.height || 0,
          length: validation.cleanedData.length || 0,
          width: validation.cleanedData.width || 0,
          upsable: validation.cleanedData.upsable || false,
          is_oversized: validation.cleanedData.is_oversized || false,
          is_hazmat: validation.cleanedData.is_hazmat || false,
          is_chemical: validation.cleanedData.is_chemical || false,
          is_non_returnable: validation.cleanedData.is_non_returnable || false,
          prop65_toxicity: validation.cleanedData.prop65_toxicity || '',
          upc_code: validation.cleanedData.upc_code || '',
          aaia_code: validation.cleanedData.aaia_code || '',
          east_qty: validation.cleanedData.east_qty || 0,
          midwest_qty: validation.cleanedData.midwest_qty || 0,
          california_qty: validation.cleanedData.california_qty || 0,
          southeast_qty: validation.cleanedData.southeast_qty || 0,
          pacific_nw_qty: validation.cleanedData.pacific_nw_qty || 0,
          texas_qty: validation.cleanedData.texas_qty || 0,
          great_lakes_qty: validation.cleanedData.great_lakes_qty || 0,
          florida_qty: validation.cleanedData.florida_qty || 0,
          is_kit: validation.cleanedData.is_kit || false,
          kit_components: validation.cleanedData.kit_components || '',
          validation_status: validation.status,
          validation_errors: validation.errors.join('; ') || null,
          validation_warnings: validation.warnings.join('; ') || null,
          user_id: user.id,
          uploaded_by: user.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error inserting staging record:', error);
      throw error;
    }
  };

  // Real-time inventory insertion
  const insertToInventory = async (record: any, sessionId: string): Promise<boolean> => {
    try {
      // Check if record already exists
      const { data: existing } = await supabase
        .from('inventory')
        .select('id')
        .eq('vcpn', record.vcpn)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('inventory')
          .update({
            name: record.long_description || record.part_number || 'Unknown Item',
            description: record.long_description,
            sku: record.part_number, // Map part_number to sku
            vendor_code: record.vendor_code,
            vendor_name: record.vendor_name,
            manufacturer_part_no: record.manufacturer_part_no,
            quantity: record.total_qty,
            price: record.jobber_price,
            cost: record.cost,
            case_qty: record.case_qty,
            weight: record.weight,
            height: record.height,
            length: record.length,
            width: record.width,
            upsable: record.upsable,
            is_oversized: record.is_oversized,
            is_hazmat: record.is_hazmat,
            is_chemical: record.is_chemical,
            is_non_returnable: record.is_non_returnable,
            prop65_toxicity: record.prop65_toxicity,
            upc_code: record.upc_code,
            aaia_code: record.aaia_code,
            east_qty: record.east_qty,
            midwest_qty: record.midwest_qty,
            california_qty: record.california_qty,
            southeast_qty: record.southeast_qty,
            pacific_nw_qty: record.pacific_nw_qty,
            texas_qty: record.texas_qty,
            great_lakes_qty: record.great_lakes_qty,
            florida_qty: record.florida_qty,
            total_qty: record.total_qty,
            is_kit: record.is_kit,
            kit_components: record.kit_components,
            ftp_upload_id: sessionId,
            import_source: 'csv_upload',
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
        return true;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('inventory')
          .insert({
            name: record.long_description || record.part_number || 'Unknown Item',
            description: record.long_description,
            sku: record.part_number, // Map part_number to sku
            vcpn: record.vcpn,
            vendor_code: record.vendor_code,
            vendor_name: record.vendor_name,
            manufacturer_part_no: record.manufacturer_part_no,
            quantity: record.total_qty,
            price: record.jobber_price,
            cost: record.cost,
            case_qty: record.case_qty,
            weight: record.weight,
            height: record.height,
            length: record.length,
            width: record.width,
            upsable: record.upsable,
            is_oversized: record.is_oversized,
            is_hazmat: record.is_hazmat,
            is_chemical: record.is_chemical,
            is_non_returnable: record.is_non_returnable,
            prop65_toxicity: record.prop65_toxicity,
            upc_code: record.upc_code,
            aaia_code: record.aaia_code,
            east_qty: record.east_qty,
            midwest_qty: record.midwest_qty,
            california_qty: record.california_qty,
            southeast_qty: record.southeast_qty,
            pacific_nw_qty: record.pacific_nw_qty,
            texas_qty: record.texas_qty,
            great_lakes_qty: record.great_lakes_qty,
            florida_qty: record.florida_qty,
            total_qty: record.total_qty,
            is_kit: record.is_kit,
            kit_components: record.kit_components,
            ftp_upload_id: sessionId,
            import_source: 'csv_upload'
          });

        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Error inserting to inventory:', error);
      return false;
    }
  };

  // Mark staging record as processed
  const markStagingRecordProcessed = async (sessionId: string, vcpn: string, actionType: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('csv_staging_records')
        .update({
          processed_at: new Date().toISOString(),
          action_type: actionType
        })
        .eq('upload_session_id', sessionId)
        .eq('vcpn', vcpn);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking staging record as processed:', error);
    }
  };

  // Process a single chunk with real-time inventory insertion
  const processChunk = async (chunk: ProcessingChunk): Promise<void> => {
    try {
      // Update chunk status
      setProcessingState(prev => {
        if (!prev) return prev;
        const updatedChunks = [...prev.chunks];
        updatedChunks[chunk.chunkNumber - 1] = {
          ...chunk,
          status: 'processing',
          startTime: new Date()
        };
        return { ...prev, chunks: updatedChunks };
      });

      let processed = 0;
      let inserted = 0;
      let failed = 0;

      // Process records in batches for better performance
      for (let i = 0; i < chunk.records.length; i += BATCH_SIZE) {
        // Check for pause/stop signals
        if (processingControlRef.current.shouldStop) {
          throw new Error('Processing stopped by user');
        }
        if (processingControlRef.current.shouldPause) {
          // Update chunk status to paused
          setProcessingState(prev => {
            if (!prev) return prev;
            const updatedChunks = [...prev.chunks];
            updatedChunks[chunk.chunkNumber - 1] = {
              ...chunk,
              status: 'paused',
              processed,
              inserted,
              failed
            };
            return { ...prev, chunks: updatedChunks, isPaused: true };
          });
          return;
        }

        const batch = chunk.records.slice(i, i + BATCH_SIZE);
        
        for (const record of batch) {
          try {
            // Validate record
            const validation = validateRecord(record, record.row_number);
            
            // Insert to staging table
            await insertStagingRecord(chunk.sessionId, record, validation);
            
            // If valid or corrected, immediately insert to inventory
            if (validation.status === 'valid' || validation.status === 'corrected') {
              const success = await insertToInventory(validation.cleanedData, chunk.sessionId);
              if (success) {
                await markStagingRecordProcessed(chunk.sessionId, validation.cleanedData.vcpn, 'insert');
                inserted++;
              } else {
                failed++;
              }
            }
            
            processed++;
            
            // Update progress every PROGRESS_UPDATE_INTERVAL records
            if (processed % PROGRESS_UPDATE_INTERVAL === 0) {
              setProcessingState(prev => {
                if (!prev) return prev;
                const updatedChunks = [...prev.chunks];
                updatedChunks[chunk.chunkNumber - 1] = {
                  ...chunk,
                  processed,
                  inserted,
                  failed
                };
                
                const totalProcessed = prev.overallProgress.totalProcessed + processed;
                const totalInserted = prev.overallProgress.totalInserted + inserted;
                const totalFailed = prev.overallProgress.totalFailed + failed;
                
                return {
                  ...prev,
                  chunks: updatedChunks,
                  overallProgress: {
                    ...prev.overallProgress,
                    totalProcessed,
                    totalInserted,
                    totalFailed
                  }
                };
              });
            }
            
          } catch (error) {
            console.error('Error processing record:', error);
            failed++;
          }
        }
      }

      // Update session status
      await supabase
        .from('csv_upload_sessions')
        .update({
          status: 'completed',
          processed_records: processed,
          valid_records: inserted,
          invalid_records: failed,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', chunk.sessionId);

      // Mark chunk as completed
      setProcessingState(prev => {
        if (!prev) return prev;
        const updatedChunks = [...prev.chunks];
        updatedChunks[chunk.chunkNumber - 1] = {
          ...chunk,
          status: 'completed',
          processed,
          inserted,
          failed,
          endTime: new Date()
        };
        return { ...prev, chunks: updatedChunks };
      });

    } catch (error) {
      console.error('Error processing chunk:', error);
      
      // Mark chunk as failed
      setProcessingState(prev => {
        if (!prev) return prev;
        const updatedChunks = [...prev.chunks];
        updatedChunks[chunk.chunkNumber - 1] = {
          ...chunk,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        return { ...prev, chunks: updatedChunks };
      });
    }
  };

  // Main file upload and processing function
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    processingControlRef.current = { shouldStop: false, shouldPause: false };

    try {
      // Parse CSV file
      const records = await parseCSVFile(file);
      const totalRecords = records.length;
      const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);

      // Initialize processing state
      const initialState: FileProcessingState = {
        originalFilename: file.name,
        totalRecords,
        chunks: [],
        currentChunkIndex: 0,
        overallProgress: {
          totalProcessed: 0,
          totalInserted: 0,
          totalFailed: 0,
          startTime: new Date()
        },
        status: 'processing',
        isPaused: false
      };

      // Create chunks
      for (let i = 0; i < totalChunks; i++) {
        const chunkRecords = records.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const sessionId = await createUploadSession(
          file.name,
          i + 1,
          totalChunks,
          chunkRecords.length,
          file.size
        );

        const chunk: ProcessingChunk = {
          id: `chunk_${i + 1}`,
          chunkNumber: i + 1,
          totalChunks,
          records: chunkRecords,
          sessionId,
          status: 'pending',
          processed: 0,
          inserted: 0,
          failed: 0
        };

        initialState.chunks.push(chunk);
      }

      setProcessingState(initialState);

      // Process chunks sequentially
      for (let i = 0; i < initialState.chunks.length; i++) {
        if (processingControlRef.current.shouldStop) break;
        
        setProcessingState(prev => prev ? { ...prev, currentChunkIndex: i } : prev);
        await processChunk(initialState.chunks[i]);
      }

      // Mark overall processing as completed
      setProcessingState(prev => {
        if (!prev) return prev;
        return { ...prev, status: 'completed' };
      });

      // Refresh sessions list
      await loadUploadSessions();

    } catch (error) {
      console.error('Error during upload:', error);
      setProcessingState(prev => {
        if (!prev) return prev;
        return { ...prev, status: 'failed' };
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Processing control functions
  const pauseProcessing = () => {
    processingControlRef.current.shouldPause = true;
  };

  const resumeProcessing = async () => {
    if (!processingState) return;
    
    processingControlRef.current.shouldPause = false;
    setProcessingState(prev => prev ? { ...prev, isPaused: false } : prev);

    // Find the first paused or failed chunk and resume from there
    for (let i = 0; i < processingState.chunks.length; i++) {
      const chunk = processingState.chunks[i];
      if (chunk.status === 'paused' || chunk.status === 'failed') {
        setProcessingState(prev => prev ? { ...prev, currentChunkIndex: i } : prev);
        await processChunk(chunk);
      }
    }
  };

  const stopProcessing = () => {
    processingControlRef.current.shouldStop = true;
    setProcessingState(prev => {
      if (!prev) return prev;
      return { ...prev, status: 'failed', isPaused: false };
    });
  };

  // Delete upload session
  const deleteUploadSession = async (sessionId: string) => {
    try {
      // Delete staging records first
      await supabase
        .from('csv_staging_records')
        .delete()
        .eq('upload_session_id', sessionId);

      // Delete session
      await supabase
        .from('csv_upload_sessions')
        .delete()
        .eq('id', sessionId);

      // Refresh sessions list
      await loadUploadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
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

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Get session status badge
  const getSessionStatusBadge = (session: UploadSession) => {
    const statusColors = {
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'paused': 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={statusColors[session.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {session.status}
      </Badge>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Enhanced CSV Upload</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Enhanced CSV Upload</span>
            <div className="flex items-center space-x-2">
              {processingState && (
                <div className="flex items-center space-x-2">
                  {processingState.isPaused ? (
                    <Button size="sm" onClick={resumeProcessing} className="flex items-center space-x-1">
                      <Play className="h-4 w-4" />
                      <span>Resume</span>
                    </Button>
                  ) : processingState.status === 'processing' ? (
                    <Button size="sm" onClick={pauseProcessing} className="flex items-center space-x-1">
                      <Pause className="h-4 w-4" />
                      <span>Pause</span>
                    </Button>
                  ) : null}
                  <Button size="sm" variant="destructive" onClick={stopProcessing} className="flex items-center space-x-1">
                    <Square className="h-4 w-4" />
                    <span>Stop</span>
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Enhanced processing with chunking, real-time updates, and recovery options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
              <TabsTrigger value="progress">Processing Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {!processingState ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Upload CSV File</span>
                    </CardTitle>
                    <CardDescription>
                      Enhanced processing with validation, chunking, and real-time inventory updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="csv-file">Select CSV File</Label>
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        disabled={isUploading}
                      />
                    </div>

                    {file && (
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Selected:</strong> {file.name} ({formatFileSize(file.size)})
                          <br />
                          <strong>Processing:</strong> Will be split into chunks of {CHUNK_SIZE.toLocaleString()} records each
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      onClick={handleUpload} 
                      disabled={!file || isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Process CSV
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Processing: {processingState.originalFilename}</CardTitle>
                    <CardDescription>
                      Real-time processing with chunking and immediate inventory updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Overall Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Overall Progress</span>
                          <span>
                            {processingState.overallProgress.totalProcessed.toLocaleString()} / {processingState.totalRecords.toLocaleString()} records
                          </span>
                        </div>
                        <Progress 
                          value={(processingState.overallProgress.totalProcessed / processingState.totalRecords) * 100} 
                          className="w-full"
                        />
                      </div>

                      {/* Statistics */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-blue-600">
                            {processingState.overallProgress.totalProcessed.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Processed</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-green-600">
                            {processingState.overallProgress.totalInserted.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Inserted to Inventory</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-red-600">
                            {processingState.overallProgress.totalFailed.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </div>
                      </div>

                      {/* Chunk Progress */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Chunk Progress</h4>
                        <ScrollArea className="h-32">
                          <div className="space-y-2">
                            {processingState.chunks.map((chunk, index) => (
                              <div key={chunk.id} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">
                                    Chunk {chunk.chunkNumber}/{chunk.totalChunks}
                                  </span>
                                  {chunk.status === 'processing' && <RefreshCw className="h-3 w-3 animate-spin" />}
                                  {chunk.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-600" />}
                                  {chunk.status === 'failed' && <XCircle className="h-3 w-3 text-red-600" />}
                                  {chunk.status === 'paused' && <Pause className="h-3 w-3 text-yellow-600" />}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {chunk.processed}/{chunk.records.length} records
                                  {chunk.inserted > 0 && ` (${chunk.inserted} inserted)`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Recent Upload Sessions</h3>
                <Button size="sm" onClick={loadUploadSessions} className="flex items-center space-x-1">
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {uploadSessions.map((session) => (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">{session.original_filename}</span>
                              {getSessionStatusBadge(session)}
                              {session.chunk_number && (
                                <Badge variant="outline">
                                  Chunk {session.chunk_number}/{session.total_chunks}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {session.total_records.toLocaleString()} records • 
                              Processed: {session.processed_records.toLocaleString()} • 
                              Valid: {session.valid_records.toLocaleString()}
                              {session.file_size && ` • Size: ${formatFileSize(session.file_size)}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(session.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {session.status === 'completed' && session.invalid_records > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReconciliationSessionId(session.id);
                                  setShowReconciliation(true);
                                }}
                              >
                                Review
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteUploadSession(session.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {session.processed_records > 0 && (
                          <div className="mt-2">
                            <Progress 
                              value={(session.processed_records / session.total_records) * 100} 
                              className="w-full h-2"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              {processingState ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Real-Time Processing Monitor</CardTitle>
                    <CardDescription>
                      Live updates for {processingState.originalFilename}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Processing Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-5 w-5" />
                          <span className="font-medium">Status:</span>
                          <Badge className={
                            processingState.status === 'completed' ? 'bg-green-100 text-green-800' :
                            processingState.status === 'failed' ? 'bg-red-100 text-red-800' :
                            processingState.isPaused ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {processingState.isPaused ? 'Paused' : processingState.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Started: {processingState.overallProgress.startTime.toLocaleTimeString()}
                        </div>
                      </div>

                      {/* Detailed Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 border rounded">
                          <div className="text-xl font-bold text-blue-600">
                            {processingState.chunks.length}
                          </div>
                          <div className="text-sm text-gray-600">Total Chunks</div>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <div className="text-xl font-bold text-green-600">
                            {processingState.chunks.filter(c => c.status === 'completed').length}
                          </div>
                          <div className="text-sm text-gray-600">Completed</div>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <div className="text-xl font-bold text-yellow-600">
                            {processingState.chunks.filter(c => c.status === 'processing' || c.status === 'paused').length}
                          </div>
                          <div className="text-sm text-gray-600">In Progress</div>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <div className="text-xl font-bold text-red-600">
                            {processingState.chunks.filter(c => c.status === 'failed').length}
                          </div>
                          <div className="text-sm text-gray-600">Failed</div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      {processingState.overallProgress.totalProcessed > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Performance Metrics</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Processing Rate:</span>
                              <span className="ml-2 font-medium">
                                {Math.round(processingState.overallProgress.totalProcessed / 
                                  ((Date.now() - processingState.overallProgress.startTime.getTime()) / 1000))} records/sec
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Success Rate:</span>
                              <span className="ml-2 font-medium">
                                {Math.round((processingState.overallProgress.totalInserted / 
                                  processingState.overallProgress.totalProcessed) * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Processing</h3>
                    <p className="text-gray-600">Upload a CSV file to see real-time processing progress</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* CSV Reconciliation Dialog */}
        {showReconciliation && (
          <CSVReconciliation
            sessionId={reconciliationSessionId}
            onClose={() => setShowReconciliation(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

