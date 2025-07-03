import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface InventoryFileUploadProps {
  onUploadComplete?: () => void;
}

interface CSVRecord {
  [key: string]: string;
}

export const InventoryFileUpload: React.FC<InventoryFileUploadProps> = ({
  onUploadComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadResults, setUploadResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const parseCSV = (csvText: string): CSVRecord[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const records: CSVRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const record: CSVRecord = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        records.push(record);
      }
    }

    return records;
  };

  const mapCSVToInventory = (record: CSVRecord) => {
    // Map CSV columns to database columns based on your existing structure
    return {
      name: record['Description'] || record['description'] || record['Name'] || record['name'] || '',
      description: record['Description'] || record['description'] || null,
      sku: record['VCPN'] || record['vcpn'] || record['SKU'] || record['sku'] || null,
      quantity: parseInt(record['TotalQty'] || record['total_qty'] || record['Quantity'] || record['quantity'] || '0') || 0,
      price: parseFloat(record['JobberPrice'] || record['jobber_price'] || record['Price'] || record['price'] || '0') || 0,
      cost: parseFloat(record['Cost'] || record['cost'] || '0') || null,
      category: record['Category'] || record['category'] || null,
      supplier: record['VendorName'] || record['vendor_name'] || record['Supplier'] || record['supplier'] || null,
      reorder_level: parseInt(record['ReorderLevel'] || record['reorder_level'] || '0') || null,
      core_charge: parseFloat(record['CoreCharge'] || record['core_charge'] || '0') || null,
      // Map regional quantities if they exist
      east_qty: parseInt(record['EastQty'] || record['east_qty'] || '0') || null,
      california_qty: parseInt(record['CaliforniaQty'] || record['california_qty'] || '0') || null,
      florida_qty: parseInt(record['FloridaQty'] || record['florida_qty'] || '0') || null,
      great_lakes_qty: parseInt(record['GreatLakesQty'] || record['great_lakes_qty'] || '0') || null,
      midwest_qty: parseInt(record['MidwestQty'] || record['midwest_qty'] || '0') || null,
      pacific_nw_qty: parseInt(record['PacificNWQty'] || record['pacific_nw_qty'] || '0') || null,
      southeast_qty: parseInt(record['SoutheastQty'] || record['southeast_qty'] || '0') || null,
      texas_qty: parseInt(record['TexasQty'] || record['texas_qty'] || '0') || null,
      case_qty: parseInt(record['CaseQty'] || record['case_qty'] || '0') || null,
      manufacturer_part_no: record['ManufacturerPartNo'] || record['manufacturer_part_no'] || null,
      vendor_code: record['VendorCode'] || record['vendor_code'] || null,
    };
  };

  const processCSVFile = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadStatus('uploading');
      setProgress(0);
      setUploadResults(null);

      // Read file content
      const text = await file.text();
      if (!text.trim()) {
        throw new Error('File is empty');
      }

      // Parse CSV
      const records = parseCSV(text);
      if (records.length === 0) {
        throw new Error('No valid records found in CSV file');
      }

      setProgress(10);

      const results = {
        total: records.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process records in batches to avoid overwhelming the database
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        for (const record of batch) {
          try {
            const inventoryItem = mapCSVToInventory(record);
            
            // Validate required fields
            if (!inventoryItem.name) {
              results.failed++;
              results.errors.push(`Row ${records.indexOf(record) + 2}: Name is required`);
              continue;
            }

            // Check if item already exists by name or SKU
            let existingItem = null;
            if (inventoryItem.sku) {
              const { data: existingBySku } = await supabase
                .from('inventory')
                .select('id')
                .eq('sku', inventoryItem.sku)
                .single();
              existingItem = existingBySku;
            }

            if (!existingItem) {
              const { data: existingByName } = await supabase
                .from('inventory')
                .select('id')
                .eq('name', inventoryItem.name)
                .single();
              existingItem = existingByName;
            }

            if (existingItem) {
              // Update existing item
              const { error: updateError } = await supabase
                .from('inventory')
                .update({
                  ...inventoryItem,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingItem.id);

              if (updateError) {
                console.error('Supabase update error:', updateError.message, updateError.details);
                results.failed++;
                results.errors.push(`Row ${records.indexOf(record) + 2}: ${updateError.message}`);
              } else {
                results.successful++;
              }
            } else {
              // Insert new item
              const { error: insertError } = await supabase
                .from('inventory')
                .insert(inventoryItem);

              if (insertError) {
                console.error('Supabase insert error:', insertError.message, insertError.details);
                results.failed++;
                results.errors.push(`Row ${records.indexOf(record) + 2}: ${insertError.message}`);
              } else {
                results.successful++;
              }
            }

          } catch (recordError: any) {
            console.error('Record processing error:', recordError);
            results.failed++;
            results.errors.push(`Row ${records.indexOf(record) + 2}: ${recordError.message || 'Unknown error'}`);
          }
        }

        // Update progress
        const progressPercent = Math.round(((batchIndex + 1) / batches.length) * 90) + 10;
        setProgress(progressPercent);
      }

      setProgress(100);
      setUploadResults(results);
      setUploadStatus('success');

      // Refresh inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });

      if (onUploadComplete) {
        onUploadComplete();
      }

      toast({
        title: "Upload Complete",
        description: `Successfully processed ${results.successful} items. ${results.failed} failed.`,
        variant: results.failed > 0 ? "destructive" : "default",
      });

    } catch (error: any) {
      console.error('CSV processing error:', error);
      setUploadStatus('error');
      
      let errorMessage = 'Failed to process CSV file';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    processCSVFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      processCSVFile(file);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please drop a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setProgress(0);
    setUploadResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Upload CSV
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Inventory CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {uploadStatus === 'idle' && (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                <Button variant="outline">Select File</Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {uploadStatus === 'uploading' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Processing CSV file...</span>
                </div>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-500">{progress}% complete</p>
              </div>
            )}

            {uploadStatus === 'success' && uploadResults && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Upload Complete</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Total Records:</strong> {uploadResults.total}</p>
                  <p><strong>Successful:</strong> {uploadResults.successful}</p>
                  <p><strong>Failed:</strong> {uploadResults.failed}</p>
                  {uploadResults.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-red-600 mb-2">Errors:</p>
                      <div className="max-h-32 overflow-y-auto text-sm">
                        {uploadResults.errors.slice(0, 10).map((error, index) => (
                          <p key={index} className="text-red-600">{error}</p>
                        ))}
                        {uploadResults.errors.length > 10 && (
                          <p className="text-gray-500">... and {uploadResults.errors.length - 10} more errors</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={resetUpload} variant="outline">Upload Another</Button>
                  <Button onClick={() => setIsOpen(false)}>Close</Button>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Upload Failed</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={resetUpload} variant="outline">Try Again</Button>
                  <Button onClick={() => setIsOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

