import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInventoryContext } from './InventoryContext';

interface UploadResult {
  success: boolean;
  message: string;
  processed: number;
  updated: number;
  inserted: number;
  errors: string[];
  warnings: string[];
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
  const { refetchInventory } = useInventoryContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processCSVFile = async (file: File) => {
    try {
      console.log('🔧 Processing large CSV file with optimized component');
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

      // Show warning for large datasets
      if (records.length > 1000) {
        console.log('⚠️ Large dataset detected:', records.length, 'records');
      }

      // Process records in smaller batches for large datasets
      const batchSize = records.length > 1000 ? 25 : 10;
      const batches = [];
      for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
      }
      
      console.log('🔄 Processing in', batches.length, 'batches of', batchSize);

      let processed = 0;
      let updated = 0;
      let inserted = 0;
      let errors: string[] = [];
      let warnings: string[] = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} items`);

        // Process batch items
        for (const record of batch) {
          try {
            // Map CSV fields to database columns with correct field names
            const inventoryItem = {
              // Use LongDescription from CSV for both name and description
              name: record['LongDescription'] || record['PartNumber'] || 'Unknown Item',
              description: record['LongDescription'] || null,
              sku: record['PartNumber'] || record['VCPN'] || null,
              quantity: parseInt(record['TotalQty'] || '0') || 0,
              price: parseFloat(record['JobberPrice'] || '0') || 0,
              cost: parseFloat(record['Cost'] || '0') || null,
              category: null,
              supplier: record['VendorName'] || null,
              reorder_level: null,
              core_charge: parseFloat(record['CoreCharge'] || '0') || null,
              // FTP specific fields
              vendor_code: record['VendorCode'] || null,
              manufacturer_part_no: record['ManufacturerPartNo'] || null,
              case_qty: parseInt(record['CaseQty'] || '0') || null,
              // Regional quantities
              california_qty: parseInt(record['CaliforniaQty'] || '0') || null,
              east_qty: parseInt(record['EastQty'] || '0') || null,
              florida_qty: parseInt(record['FloridaQty'] || '0') || null,
              great_lakes_qty: parseInt(record['GreatLakesQty'] || '0') || null,
              midwest_qty: parseInt(record['MidwestQty'] || '0') || null,
              pacific_nw_qty: parseInt(record['PacificNWQty'] || '0') || null,
              southeast_qty: parseInt(record['SoutheastQty'] || '0') || null,
              texas_qty: parseInt(record['TexasQty'] || '0') || null,
            };

            // Validate required fields
            if (!inventoryItem.name || inventoryItem.name === 'Unknown Item') {
              warnings.push(`Row ${processed + 1}: Missing product name/description`);
            }

            if (!inventoryItem.sku) {
              warnings.push(`Row ${processed + 1}: Missing SKU/Part Number`);
            }

            console.log('💾 Processing item:', inventoryItem.name, 'SKU:', inventoryItem.sku);

            // Check if item exists by SKU
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
                updated++;
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
                inserted++;
              }
            }

            processed++;
          } catch (error) {
            console.error('❌ Item processing error:', error);
            errors.push(`Error processing row ${processed + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Update progress
        const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
        setUploadProgress(progress);
        console.log('📊 Progress:', progress + '%');

        // Add small delay for large batches to prevent overwhelming the database
        if (records.length > 1000 && batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Refresh inventory data (this will respect current pagination)
      await refetchInventory();
      console.log('🔄 Refreshed inventory data');

      const result: UploadResult = {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Successfully processed ${processed} items (${inserted} new, ${updated} updated)`
          : `Processed ${processed} items with ${errors.length} errors (${inserted} new, ${updated} updated)`,
        processed,
        updated,
        inserted,
        errors,
        warnings
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
        updated: 0,
        inserted: 0,
        errors: [errorMessage],
        warnings: []
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
      console.log('📁 File selected via button:', file.name);
      
      // Check file size (warn if > 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Large File Detected",
          description: "This file is quite large. Upload may take several minutes.",
          variant: "default",
        });
      }
      
      processCSVFile(file);
    }
  };

  const handleButtonClick = () => {
    console.log('🖱️ File selection button clicked');
    fileInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      console.log('📁 File dropped:', file.name);
      
      // Check file size
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Large File Detected",
          description: "This file is quite large. Upload may take several minutes.",
          variant: "default",
        });
      }
      
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
              <p className="text-xs text-gray-500 mb-4">
                Supports large files up to 12,000+ records
              </p>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={isUploading}
              />
              
              {/* Clickable button */}
              <Button 
                variant="outline" 
                onClick={handleButtonClick}
                disabled={isUploading}
                type="button"
              >
                Select CSV File
              </Button>
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
              {uploadProgress > 0 && (
                <p className="text-xs text-gray-400 text-center">
                  Processing large datasets may take several minutes
                </p>
              )}
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
                <div className="text-xs text-green-600 mt-2 space-y-1">
                  <p>• {uploadResult.inserted} new items added</p>
                  <p>• {uploadResult.updated} existing items updated</p>
                  <p>• {uploadResult.processed} total items processed</p>
                </div>
                {uploadResult.warnings.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-xs font-medium text-yellow-800">
                        {uploadResult.warnings.length} warnings
                      </span>
                    </div>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                      {uploadResult.warnings.slice(0, 3).map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                      {uploadResult.warnings.length > 3 && (
                        <li>• ... and {uploadResult.warnings.length - 3} more warnings</li>
                      )}
                    </ul>
                  </div>
                )}
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

