import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  success: boolean;
  uploadId?: string;
  totalRecords?: number;
  successCount?: number;
  failCount?: number;
  errors?: Array<{
    row: number;
    partNumber: string;
    error: string;
  }>;
  message?: string;
}

interface InventoryFileUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
}

export const InventoryFileUpload: React.FC<InventoryFileUploadProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Read file content
      const fileContent = await selectedFile.text();
      setUploadProgress(25);

      // Prepare upload data
      const uploadData = {
        csvData: fileContent,
        filename: selectedFile.name,
        userId: user.id
      };

      setUploadProgress(50);

      // Upload to API
      const response = await fetch('/api/upload-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData),
      });

      setUploadProgress(75);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result: UploadResult = await response.json();
      setUploadProgress(100);
      setUploadResult(result);

      toast({
        title: "Upload completed",
        description: result.message || "Inventory file uploaded successfully.",
        variant: result.failCount && result.failCount > 0 ? "default" : "default",
      });

      // Call callback if provided
      if (onUploadComplete) {
        onUploadComplete(result);
      }

      // Clear file selection
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadResult({
        success: false,
        message: errorMessage
      });

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setUploadResult(null);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          FTP Inventory Upload
        </CardTitle>
        <CardDescription>
          Upload CSV inventory files to update the inventory database. 
          Supported format: CSV with standard FTP inventory columns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Selection Area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <FileText className="h-8 w-8" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              <Upload className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">Drop CSV file here or click to browse</p>
              <p className="text-sm">Supports .csv files up to 10MB</p>
            </div>
          )}
        </div>

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

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload Inventory File'}
        </Button>

        {/* Upload Results */}
        {uploadResult && (
          <Alert className={uploadResult.success ? "border-green-500" : "border-red-500"}>
            <div className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                  </p>
                  <p>{uploadResult.message}</p>
                  
                  {uploadResult.success && uploadResult.totalRecords && (
                    <div className="text-sm space-y-1">
                      <p>Total Records: {uploadResult.totalRecords}</p>
                      <p>Successful: {uploadResult.successCount}</p>
                      {uploadResult.failCount && uploadResult.failCount > 0 && (
                        <p>Failed: {uploadResult.failCount}</p>
                      )}
                    </div>
                  )}

                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        First few errors:
                      </p>
                      <ul className="text-xs space-y-1 mt-1">
                        {uploadResult.errors.slice(0, 3).map((error, index) => (
                          <li key={index} className="text-red-600">
                            Row {error.row} ({error.partNumber}): {error.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium">CSV Format Requirements:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>First row must contain column headers</li>
            <li>Required columns: VendorName, VCPN, PartNumber, LongDescription</li>
            <li>Boolean values should be TRUE/FALSE</li>
            <li>Numeric values should be properly formatted (no commas)</li>
            <li>Existing items will be updated, new items will be created</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

