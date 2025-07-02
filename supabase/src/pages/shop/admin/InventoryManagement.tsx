import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  RefreshCw,
  Database,
  TrendingUp,
  Users,
  Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ImportBatch {
  id: string;
  batch_name: string;
  file_name: string;
  file_size: number;
  total_records: number;
  processed_records: number;
  inserted_records: number;
  updated_records: number;
  error_records: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  created_by: string;
  error_log?: string;
  processing_notes?: string;
}

interface ProcessingStats {
  totalRecords: number;
  processedRecords: number;
  insertedRecords: number;
  updatedRecords: number;
  errorRecords: number;
  currentChunk: number;
  totalChunks: number;
}

const InventoryManagement = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load import batches on component mount
  React.useEffect(() => {
    loadImportBatches();
  }, []);

  const loadImportBatches = async () => {
    setIsLoadingBatches(true);
    try {
      const { data, error } = await supabase
        .from('inventory_import_batches')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setImportBatches(data || []);
    } catch (error) {
      console.error('Error loading import batches:', error);
      toast({
        title: "Error",
        description: "Failed to load import history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 50MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const processCSVInChunks = async (csvContent: string, batchId: string) => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    const chunkSize = 1000; // Process 1000 records at a time
    const totalChunks = Math.ceil(dataLines.length / chunkSize);
    
    let processedRecords = 0;
    let insertedRecords = 0;
    let updatedRecords = 0;
    let errorRecords = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const chunkStart = chunkIndex * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, dataLines.length);
      const chunkData = dataLines.slice(chunkStart, chunkEnd);

      // Update progress
      setProcessingStats({
        totalRecords: dataLines.length,
        processedRecords,
        insertedRecords,
        updatedRecords,
        errorRecords,
        currentChunk: chunkIndex + 1,
        totalChunks
      });

      try {
        // Process chunk
        const chunkResults = await processInventoryChunk(chunkData, headers, batchId);
        
        processedRecords += chunkResults.processed;
        insertedRecords += chunkResults.inserted;
        updatedRecords += chunkResults.updated;
        errorRecords += chunkResults.errors;

        // Update batch progress in database
        await supabase
          .from('inventory_import_batches')
          .update({
            processed_records: processedRecords,
            inserted_records: insertedRecords,
            updated_records: updatedRecords,
            error_records: errorRecords,
            status: 'processing'
          })
          .eq('id', batchId);

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing chunk ${chunkIndex + 1}:`, error);
        errorRecords += chunkData.length;
      }
    }

    return {
      totalRecords: dataLines.length,
      processedRecords,
      insertedRecords,
      updatedRecords,
      errorRecords
    };
  };

  const processInventoryChunk = async (chunkData: string[], headers: string[], batchId: string) => {
    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const line of chunkData) {
      try {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const record: any = {};
        
        // Map CSV fields to database columns
        headers.forEach((header, index) => {
          const value = values[index] || '';
          
          switch (header.toLowerCase()) {
            case 'vendorname':
              record.supplier = value;
              break;
            case 'vcpn':
              record.vcpn = value;
              break;
            case 'vendorcode':
              record.vendor_code = value;
              break;
            case 'partnumber':
              record.sku = value;
              break;
            case 'manufacturerpartno':
              record.manufacturer_part_no = value;
              break;
            case 'longdescription':
              record.name = value;
              record.description = value;
              break;
            case 'jobberprice':
              record.price = parseFloat(value) || 0;
              break;
            case 'cost':
              record.cost = parseFloat(value) || 0;
              break;
            case 'upsable':
              record.upsable = value.toLowerCase() === 'true';
              break;
            case 'corecharge':
              record.core_charge = parseFloat(value) || 0;
              break;
            case 'caseqty':
              record.case_qty = parseInt(value) || 1;
              break;
            case 'isnonreturnable':
              record.is_non_returnable = value.toLowerCase() === 'true';
              break;
            case 'prop65toxicity':
              record.prop65_toxicity = value;
              break;
            case 'upccode':
              record.upc_code = value;
              break;
            case 'isoversized':
              record.is_oversized = value.toLowerCase() === 'true';
              break;
            case 'weight':
              record.weight = parseFloat(value) || 0;
              break;
            case 'height':
              record.height = parseFloat(value) || 0;
              break;
            case 'length':
              record.length = parseFloat(value) || 0;
              break;
            case 'width':
              record.width = parseFloat(value) || 0;
              break;
            case 'aaiacode':
              record.aaia_code = value;
              break;
            case 'ishazmat':
              record.is_hazmat = value.toLowerCase() === 'true';
              break;
            case 'ischemical':
              record.is_chemical = value.toLowerCase() === 'true';
              break;
            case 'ups_ground_assessorial':
              record.ups_ground_assessorial = parseFloat(value) || 0;
              break;
            case 'us_ltl':
              record.us_ltl = parseFloat(value) || 0;
              break;
            case 'eastqty':
              record.east_qty = parseInt(value) || 0;
              break;
            case 'midwestqty':
              record.midwest_qty = parseInt(value) || 0;
              break;
            case 'californiaqty':
              record.california_qty = parseInt(value) || 0;
              break;
            case 'southeastqty':
              record.southeast_qty = parseInt(value) || 0;
              break;
            case 'pacificnwqty':
              record.pacific_nw_qty = parseInt(value) || 0;
              break;
            case 'texasqty':
              record.texas_qty = parseInt(value) || 0;
              break;
            case 'greatlakesqty':
              record.great_lakes_qty = parseInt(value) || 0;
              break;
            case 'floridaqty':
              record.florida_qty = parseInt(value) || 0;
              break;
            case 'totalqty':
              record.quantity = parseInt(value) || 0;
              break;
            case 'kitcomponents':
              record.kit_components = value;
              break;
            case 'iskit':
              record.is_kit = value.toLowerCase() === 'true';
              break;
          }
        });

        // Add import tracking fields
        record.import_batch_id = batchId;
        record.last_import_date = new Date().toISOString();
        record.import_source = 'csv_upload';

        // Check if item exists (by SKU or VCPN)
        const { data: existingItem } = await supabase
          .from('inventory')
          .select('id')
          .or(`sku.eq.${record.sku},vcpn.eq.${record.vcpn}`)
          .single();

        if (existingItem) {
          // Update existing item
          const { error } = await supabase
            .from('inventory')
            .update(record)
            .eq('id', existingItem.id);

          if (error) throw error;
          updated++;
        } else {
          // Insert new item
          const { error } = await supabase
            .from('inventory')
            .insert(record);

          if (error) throw error;
          inserted++;
        }

        processed++;

      } catch (error) {
        console.error('Error processing record:', error);
        errors++;
      }
    }

    return { processed, inserted, updated, errors };
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create import batch record
      const { data: batch, error: batchError } = await supabase
        .from('inventory_import_batches')
        .insert({
          batch_name: `CSV Upload - ${new Date().toLocaleString()}`,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          created_by: 'admin', // You might want to get this from auth context
          status: 'pending'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Read file content
      const fileContent = await selectedFile.text();
      
      // Process CSV in chunks
      const results = await processCSVInChunks(fileContent, batch.id);

      // Update final batch status
      await supabase
        .from('inventory_import_batches')
        .update({
          total_records: results.totalRecords,
          processed_records: results.processedRecords,
          inserted_records: results.insertedRecords,
          updated_records: results.updatedRecords,
          error_records: results.errorRecords,
          status: results.errorRecords === 0 ? 'completed' : 'completed',
          completed_at: new Date().toISOString(),
          processing_notes: `Successfully processed ${results.processedRecords} records. ${results.insertedRecords} new items added, ${results.updatedRecords} items updated.`
        })
        .eq('id', batch.id);

      toast({
        title: "Upload Complete",
        description: `Processed ${results.processedRecords} records. ${results.insertedRecords} new items, ${results.updatedRecords} updated.`,
      });

      // Reset form
      setSelectedFile(null);
      setProcessingStats(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload batches
      loadImportBatches();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "An error occurred during the upload process",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Upload and manage inventory data via CSV files.
          </p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">CSV Upload</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Inventory CSV
              </CardTitle>
              <CardDescription>
                Upload a CSV file to update your inventory. The system will automatically add new items and update existing ones.
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

              {selectedFile && (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </AlertDescription>
                </Alert>
              )}

              {processingStats && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing chunk {processingStats.currentChunk} of {processingStats.totalChunks}</span>
                    <span>{processingStats.processedRecords} / {processingStats.totalRecords} records</span>
                  </div>
                  <Progress value={(processingStats.processedRecords / processingStats.totalRecords) * 100} />
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{processingStats.insertedRecords}</div>
                      <div className="text-muted-foreground">Inserted</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{processingStats.updatedRecords}</div>
                      <div className="text-muted-foreground">Updated</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-600">{processingStats.errorRecords}</div>
                      <div className="text-muted-foreground">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{processingStats.processedRecords}</div>
                      <div className="text-muted-foreground">Processed</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || isUploading}
                  className="flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload & Process
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSV Format Requirements</CardTitle>
              <CardDescription>
                Your CSV file should include the following columns:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>VendorName</div>
                <div>VCPN</div>
                <div>VendorCode</div>
                <div>PartNumber</div>
                <div>ManufacturerPartNo</div>
                <div>LongDescription</div>
                <div>JobberPrice</div>
                <div>Cost</div>
                <div>UPSable</div>
                <div>CoreCharge</div>
                <div>CaseQty</div>
                <div>IsNonReturnable</div>
                <div>Prop65Toxicity</div>
                <div>UPCCode</div>
                <div>IsOversized</div>
                <div>Weight</div>
                <div>Height</div>
                <div>Length</div>
                <div>Width</div>
                <div>AAIACode</div>
                <div>IsHazmat</div>
                <div>IsChemical</div>
                <div>UPS_Ground_Assessorial</div>
                <div>US_LTL</div>
                <div>EastQty</div>
                <div>MidwestQty</div>
                <div>CaliforniaQty</div>
                <div>SoutheastQty</div>
                <div>PacificNWQty</div>
                <div>TexasQty</div>
                <div>GreatLakesQty</div>
                <div>FloridaQty</div>
                <div>TotalQty</div>
                <div>KitComponents</div>
                <div>IsKit</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Import History
              </CardTitle>
              <CardDescription>
                View the history of all inventory imports and their results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBatches ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {importBatches.map((batch) => (
                    <div key={batch.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{batch.batch_name}</h3>
                          <p className="text-sm text-muted-foreground">{batch.file_name}</p>
                        </div>
                        {getStatusBadge(batch.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="font-medium">{batch.total_records}</div>
                          <div className="text-muted-foreground">Total Records</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-600">{batch.inserted_records}</div>
                          <div className="text-muted-foreground">Inserted</div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-600">{batch.updated_records}</div>
                          <div className="text-muted-foreground">Updated</div>
                        </div>
                        <div>
                          <div className="font-medium text-red-600">{batch.error_records}</div>
                          <div className="text-muted-foreground">Errors</div>
                        </div>
                        <div>
                          <div className="font-medium">{new Date(batch.started_at).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">Date</div>
                        </div>
                      </div>

                      {batch.processing_notes && (
                        <p className="text-sm text-muted-foreground">{batch.processing_notes}</p>
                      )}
                    </div>
                  ))}

                  {importBatches.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No import history found. Upload your first CSV file to get started.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryManagement;

