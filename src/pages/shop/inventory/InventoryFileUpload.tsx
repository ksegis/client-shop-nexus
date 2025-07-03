import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface UploadResult {
  success: boolean;
  message: string;
  processed: number;
  errors: string[];
}

interface CSVRecord {
  [key: string]: string;
}

export function InventoryFileUpload() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processCSVFile = async (file: File) => {
    try {
      console.log('🔧 Using corrected component - proper CSV field mapping');
      console.log('📁 File details:', { name: file.name, size: file.size, type: file.type });
      
      setIsUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);

      // Read and parse CSV file
      const text = await file.text();
      console.log('📄 File content length:', text.length);
      
      const lines = text.split('\n').filter(line => line.trim());
      console.log('📊 Total lines found:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      // Parse CSV headers and data
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      console.log('📋 CSV headers:', headers);
      
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
      
      console.log('📦 Parsed records:', records.length);
      console.log('🔍 Sample record:', records[0]);

      // Process records in batches
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
      }
      
      console.log('🔄 Processing in', batches.length, 'batches of', batchSize);

      let processed = 0;
      let errors: string[] = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} items`);

        for (const record of batch) {
          try {
            // Map CSV fields to database columns with correct field names
            const inventoryItem = {
              // Use LongDescription from CSV for description field
              name: record['LongDescription'] || record['PartNumber'] || 'Unknown Item',
              description: record['LongDescription'] || null,
              sku: record['PartNumber'] || record['VCPN'] || null,
              quantity: parseInt(record['TotalQty'] || '0') || 0,
              price: parseFloat(record['JobberPrice'] || '0') || 0,
              cost: parseFloat(record['Cost'] || '0') || null,
              category: null, // Not in CSV, could be derived from other fields if needed
              supplier: record['VendorName'] || null,
              reorder_level: null, // Not in CSV
              core_charge: parseFloat(record['CoreCharge'] || '0') || null,
              // FTP specific fields from your CSV
              vendor_code: record['VendorCode'] || null,
              manufacturer_part_no: record['ManufacturerPartNo'] || null,
              case_qty: parseInt(record['CaseQty'] || '0') || null,
              // Regional quantities from your CSV
              california_qty: parseInt(record['CaliforniaQty'] || '0') || null,
              east_qty: parseInt(record['EastQty'] || '0') || null,
              florida_qty: parseInt(record['FloridaQty'] || '0') || null,
              great_lakes_qty: parseInt(record['GreatLakesQty'] || '0') || null,
              midwest_qty: parseInt(record['MidwestQty'] || '0') || null,
              pacific_nw_qty: parseInt(record['PacificNWQty'] || '0') || null,
              southeast_qty: parseInt(record['SoutheastQty'] || '0') || null,
              texas_qty: parseInt(record['TexasQty'] || '0') || null,
            };

            console.log('💾 Processing item:', inventoryItem.name, 'SKU:', inventoryItem.sku);
            console.log('📝 Description:', inventoryItem.description);

            // Check if item exists by SKU (PartNumber)
            let existingItem = null;
            if (inventoryItem.sku) {
              const { data: existing } = await supabase
                .from('inventory')
                .select('id')
                .eq('sku', inventoryItem.sku)
                .single();
              existingItem = existing;
            }

            if (existingItem) {
              // Update existing item
              console.log('🔄 Updating existing item with ID:', existingItem.id);
              const { error } = await supabase
                .from('inventory')
                .update(inventoryItem)
                .eq('id', existingItem.id);

              if (error) {
                console.error('❌ Update error:', error);
                errors.push(`Failed to update ${inventoryItem.name}: ${error.message}`);
              } else {
                console.log('✅ Updated successfully');
              }
            } else {
              // Insert new item
              console.log('➕ Inserting new item');
              const { error } = await supabase
                .from('inventory')
                .insert([inventoryItem]);

              if (error) {
                console.error('❌ Insert error:', error);
                errors.push(`Failed to insert ${inventoryItem.name}: ${error.message}`);
              } else {
                console.log('✅ Inserted successfully');
              }
            }

            processed++;
          } catch (error) {
            console.error('❌ Item processing error:', error);
            errors.push(`Error processing item: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Update progress
        const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
        setUploadProgress(progress);
        console.log('📊 Progress:', progress + '%');
      }

      // Invalidate queries to refresh the inventory list
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      console.log('🔄 Invalidated inventory queries');

      const result: UploadResult = {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Successfully processed ${processed} items`
          : `Processed ${processed} items with ${errors.length} errors`,
        processed,
        errors
      };

      console.log('🎯 Final result:', result);
      setUploadResult(result);
      setUploadStatus(errors.length === 0 ? 'success' : 'error');

      toast({
        title: errors.length === 0 ? "Upload Successful" : "Upload Completed with Errors",
        description: result.message,
        variant: errors.length === 0 ? "default" : "destructive",
      });

    } catch (error) {
      console.error('💥 Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadResult({
        success: false,
        message: errorMessage,
        processed: 0,
        errors: [errorMessage]
      });
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      console.log('🏁 Upload process completed');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📁 File selected:', file.name);
      processCSVFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      console.log('📁 File dropped:', file.name);
      processCSVFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const resetUpload = () => {
    console.log('🔄 Resetting upload state');
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => {
          console.log('🚀 Opening upload dialog');
          resetUpload();
        }}>
          <Upload className="w-4 h-4 mr-2" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Inventory CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {uploadStatus === 'idle' && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your CSV file here, or click to select
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
                disabled={isUploading}
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" className="cursor-pointer" disabled={isUploading}>
                  Select CSV File
                </Button>
              </label>
            </div>
          )}

          {uploadStatus === 'uploading' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 animate-spin" />
                <span className="text-sm">Uploading inventory data...</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-gray-500 text-center">
                {uploadProgress}% complete
              </p>
            </div>
          )}

          {uploadStatus === 'success' && uploadResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Upload Successful!</span>
              </div>
              <div className="bg-green-50 p-3 rounded-md">
                <p className="text-sm text-green-800">{uploadResult.message}</p>
                <p className="text-xs text-green-600 mt-1">
                  Processed {uploadResult.processed} items
                </p>
              </div>
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          )}

          {uploadStatus === 'error' && uploadResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Upload Error</span>
              </div>
              <div className="bg-red-50 p-3 rounded-md">
                <p className="text-sm text-red-800">{uploadResult.message}</p>
                {uploadResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-red-600 font-medium">Errors:</p>
                    <ul className="text-xs text-red-600 mt-1 space-y-1">
                      {uploadResult.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <li>• ... and {uploadResult.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <Button onClick={resetUpload} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={() => setIsOpen(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

