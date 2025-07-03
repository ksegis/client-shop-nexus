import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInventoryContext } from './InventoryContext';
import { useToast } from '@/hooks/use-toast';

interface CSVUploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

interface CSVRecord {
  [key: string]: string;
}

export function InventoryFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<CSVUploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewData, setPreviewData] = useState<CSVRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refetchInventory } = useInventoryContext();
  const { toast } = useToast();

  // Handle button click - simplified
  const handleUploadClick = () => {
    console.log('🖱️ Upload button clicked');
    setShowUploadDialog(true);
    setUploadResult(null);
    setSelectedFile(null);
    setPreviewData([]);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📁 File selected:', file.name, file.size);
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
      console.log('👀 CSV Preview:', { headers, preview: preview.length });
    } catch (error) {
      console.error('❌ Preview error:', error);
      toast({
        title: "Preview Error",
        description: "Could not preview the CSV file",
        variant: "destructive",
      });
    }
  };

  // Parse CSV content
  const parseCSV = (csvText: string): CSVRecord[] => {
    try {
      const lines = csvText.split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
      
      console.log('📋 CSV Headers found:', headers);
      
      const records: CSVRecord[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: CSVRecord = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        
        // Only include records with at least a name or part number
        if (record['LongDescription'] || record['PartNumber'] || record['Description']) {
          records.push(record);
        }
      }
      
      console.log('✅ Parsed CSV records:', records.length);
      return records;
    } catch (error) {
      console.error('❌ CSV parsing error:', error);
      throw new Error('Failed to parse CSV file');
    }
  };

  // Map CSV record to inventory item
  const mapCSVToInventoryItem = (record: CSVRecord) => {
    try {
      const item = {
        name: record['LongDescription'] || record['Description'] || record['PartNumber'] || 'Unknown Item',
        description: record['LongDescription'] || record['Description'] || null,
        sku: record['PartNumber'] || record['SKU'] || null,
        quantity: parseInt(record['QtyOnHand'] || record['Quantity'] || '0') || 0,
        price: parseFloat(record['Price'] || record['SellPrice'] || '0') || 0,
        cost: parseFloat(record['Cost'] || record['CostPrice'] || '0') || null,
        category: record['Category'] || record['ProductCategory'] || null,
        supplier: record['Supplier'] || record['Vendor'] || null,
        reorder_level: parseInt(record['ReorderLevel'] || record['MinQty'] || '0') || null,
      };

      return item;
    } catch (error) {
      console.error('❌ Mapping error for record:', record, error);
      throw new Error(`Failed to map CSV record: ${error}`);
    }
  };

  // Process CSV file
  const processCSVFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Starting CSV upload process:', selectedFile.name);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    const result: CSVUploadResult = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      // Read and parse CSV
      const csvText = await selectedFile.text();
      const records = parseCSV(csvText);
      result.total = records.length;

      console.log(`📊 Processing ${records.length} records`);

      // Process in batches
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
      }

      console.log(`🔄 Processing ${batches.length} batches`);

      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length}`);

        // Process items in current batch
        for (const record of batch) {
          try {
            const inventoryItem = mapCSVToInventoryItem(record);
            
            // Insert item
            const { error } = await supabase
              .from('inventory')
              .insert([inventoryItem]);

            if (error) {
              console.error('❌ Insert error:', error);
              result.failed++;
              result.errors.push(`${inventoryItem.name}: ${error.message}`);
            } else {
              result.successful++;
              console.log('✅ Item inserted:', inventoryItem.name);
            }
          } catch (error) {
            console.error('❌ Item processing error:', error);
            result.failed++;
            result.errors.push(`Row processing error: ${error}`);
          }
        }

        // Update progress
        const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
        setUploadProgress(progress);

        // Small delay between batches
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('✅ Upload completed:', result);
      setUploadResult(result);

      // Refresh inventory data
      await refetchInventory();

      toast({
        title: "Upload Complete",
        description: `Successfully processed ${result.successful} of ${result.total} items`,
      });

    } catch (error) {
      console.error('💥 Upload process error:', error);
      result.errors.push(`Upload failed: ${error}`);
      setUploadResult(result);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  // Reset upload state
  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open file picker
  const openFilePicker = () => {
    console.log('📁 Opening file picker');
    fileInputRef.current?.click();
  };

  // Close dialog
  const closeDialog = () => {
    setShowUploadDialog(false);
    resetUpload();
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

      {/* Upload Dialog - Simple Modal */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Upload Inventory CSV</h2>
              <Button variant="outline" onClick={closeDialog} disabled={isUploading}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
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
                      Click below to select your CSV file
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
                    <CardTitle className="text-sm">CSV Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs space-y-2">
                      <p><strong>Detected Fields:</strong> {Object.keys(previewData[0] || {}).join(', ')}</p>
                      <p><strong>Sample Records:</strong> {previewData.length} shown</p>
                      <div className="bg-gray-50 p-2 rounded text-xs max-h-32 overflow-y-auto">
                        {previewData.map((record, index) => (
                          <div key={index} className="mb-1">
                            <strong>Row {index + 1}:</strong> {record['LongDescription'] || record['PartNumber'] || 'Unknown'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Upload Results */}
              {uploadResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      {uploadResult.successful === uploadResult.total ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : uploadResult.failed > 0 ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                      )}
                      Upload Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Badge variant="outline" className="mr-2">Total</Badge>
                          {uploadResult.total}
                        </div>
                        <div>
                          <Badge variant="default" className="mr-2">Success</Badge>
                          {uploadResult.successful}
                        </div>
                        <div>
                          <Badge variant="destructive" className="mr-2">Failed</Badge>
                          {uploadResult.failed}
                        </div>
                      </div>

                      {uploadResult.errors.length > 0 && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <details className="text-xs">
                              <summary className="cursor-pointer font-medium">
                                {uploadResult.errors.length} errors occurred
                              </summary>
                              <div className="mt-2 max-h-32 overflow-y-auto">
                                {uploadResult.errors.slice(0, 5).map((error, index) => (
                                  <div key={index} className="text-xs text-red-600">
                                    {error}
                                  </div>
                                ))}
                                {uploadResult.errors.length > 5 && (
                                  <div className="text-xs text-gray-500">
                                    ... and {uploadResult.errors.length - 5} more errors
                                  </div>
                                )}
                              </div>
                            </details>
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
                    {isUploading ? 'Uploading...' : 'Upload CSV'}
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

