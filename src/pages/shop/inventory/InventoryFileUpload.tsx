import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UploadResult {
  totalRecords: number;
  successCount: number;
  failCount: number;
  errors: Array<{ row: number; partNumber: string; error: string }>;
}

export const InventoryFileUpload: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse CSV data
  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        records.push(record);
      }
    }
    
    return records;
  };

  // Upload mutation - simplified to only use existing inventory table and columns
  const uploadMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const records = parseCSV(csvData);
      let successCount = 0;
      let failCount = 0;
      const errors: Array<{ row: number; partNumber: string; error: string }> = [];

      // Process each record
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        setUploadProgress(((i + 1) / records.length) * 100);

        try {
          // Map CSV columns to ONLY existing database columns
          const inventoryItem = {
            // Core identification - using existing columns only
            name: record.PartNumber || '',
            description: record.LongDescription || '',
            sku: record.PartNumber || '',
            category: 'FTP Import',
            supplier: record.VendorName || '',
            
            // Pricing - existing columns
            cost: parseFloat(record.Cost) || 0,
            price: parseFloat(record.JobberPrice) || 0,
            
            // Quantities - existing columns
            quantity: parseInt(record.TotalQty) || 0,
            
            // Existing FTP columns (only the ones we confirmed exist)
            vendor_code: record.VendorCode || '',
            manufacturer_part_no: record.ManufacturerPartNo || '',
            case_qty: parseInt(record.CaseQty) || 1,
            east_qty: parseInt(record.EastQty) || 0,
            midwest_qty: parseInt(record.MidwestQty) || 0,
            california_qty: parseInt(record.CaliforniaQty) || 0,
            southeast_qty: parseInt(record.SoutheastQty) || 0,
            pacific_nw_qty: parseInt(record.PacificNWQty) || 0,
            texas_qty: parseInt(record.TexasQty) || 0,
            great_lakes_qty: parseInt(record.GreatLakesQty) || 0,
            florida_qty: parseInt(record.FloridaQty) || 0
          };

          // Check if item already exists (by part number)
          const { data: existingItem } = await supabase
            .from('inventory')
            .select('id')
            .eq('name', record.PartNumber)
            .single();

          if (existingItem) {
            // Update existing item
            const { error: updateError } = await supabase
              .from('inventory')
              .update(inventoryItem)
              .eq('id', existingItem.id);

            if (updateError) throw updateError;
          } else {
            // Insert new item
            const { error: insertError } = await supabase
              .from('inventory')
              .insert(inventoryItem);

            if (insertError) throw insertError;
          }

          successCount++;
        } catch (itemError: any) {
          failCount++;
          errors.push({
            row: i + 1,
            partNumber: record.PartNumber || 'Unknown',
            error: itemError.message
          });
          console.error(`Error processing row ${i + 1}:`, itemError);
        }
      }

      return {
        totalRecords: records.length,
        successCount,
        failCount,
        errors: errors.slice(0, 10)
      };
    },
    onSuccess: (result) => {
      setUploadResult(result);
      // Invalidate and refetch inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      toast({
        title: "Upload Complete",
        description: `Successfully processed ${result.successCount} out of ${result.totalRecords} records`,
        variant: result.failCount === 0 ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
      setUploadProgress(0);
    }
  });

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const handleUpload = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      uploadMutation.mutate(csvData);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Inventory CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!file && (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your CSV file here, or click to browse
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
              />
            </div>
          )}

          {file && !uploadResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetUpload}>
                  Remove
                </Button>
              </div>

              {uploadMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {!uploadMutation.isPending && (
                <Button onClick={handleUpload} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Inventory Data
                </Button>
              )}
            </div>
          )}

          {uploadResult && (
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-green-50 rounded">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Upload Complete</p>
                  <p className="text-xs text-gray-600">
                    {uploadResult.successCount} successful, {uploadResult.failCount} failed
                  </p>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center text-amber-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Errors:</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-amber-50 rounded">
                        Row {error.row} ({error.partNumber}): {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={resetUpload} className="w-full">
                Upload Another File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

