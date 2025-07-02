import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

// Safe Array Access Utility
const safeArrayAccess = <T,>(
  array: T[] | undefined | null, 
  componentName: string = 'CsvUploadTab',
  propertyName: string = 'array',
  defaultValue: T[] = []
): T[] => {
  if (Array.isArray(array)) {
    return array;
  }
  
  console.warn(`[SafeArray] ${componentName}.${propertyName} is ${array === null ? 'null' : 'undefined'}, using default:`, defaultValue);
  return defaultValue;
};

interface CsvUploadTabProps {
  csvFile: File | null;
  csvUploadLoading: boolean;
  csvUploadProgress: number;
  csvUploadResults: any;
  csvImportHistory: any[];
  handleCsvFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCsvUpload: () => void;
  safeFormatDate: (date: any) => string;
}

const CsvUploadTab: React.FC<CsvUploadTabProps> = ({
  csvFile,
  csvUploadLoading,
  csvUploadProgress,
  csvUploadResults,
  csvImportHistory,
  handleCsvFileSelect,
  handleCsvUpload,
  safeFormatDate
}) => {
  // Component registration for debugging
  useEffect(() => {
    console.log('[CsvUploadTab] Component mounted - registering as potential p3e component');
    
    // Register this component for p3e tracking
    if (typeof window !== 'undefined' && window.ErrorTracker) {
      window.ErrorTracker.registerComponent('p3e', 'CsvUploadTab');
    }
    
    return () => {
      console.log('[CsvUploadTab] Component unmounted');
    };
  }, []);

  // Safe array handling for all array props
  const safeCsvImportHistory = safeArrayAccess(csvImportHistory, 'CsvUploadTab', 'csvImportHistory', []);
  const safeCsvUploadResultsErrors = safeArrayAccess(csvUploadResults?.errors, 'CsvUploadTab', 'csvUploadResultsErrors', []);

  return (
    <div data-component="CsvUploadTab" className="space-y-6">
      {/* CSV Upload Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV Inventory Upload
          </CardTitle>
          <CardDescription>
            Upload CSV files to bulk update inventory data with automatic matching and audit trail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection */}
          <div className="space-y-2">
            <label htmlFor="csv-file" className="text-sm font-medium">
              Select CSV File
            </label>
            <div className="flex items-center gap-4">
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleCsvFileSelect}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={csvUploadLoading}
              />
              {csvFile && (
                <div className="text-sm text-gray-600">
                  {csvFile.name} ({(csvFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleCsvUpload}
              disabled={!csvFile || csvUploadLoading}
              className="flex items-center gap-2"
            >
              {csvUploadLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {csvUploadLoading ? 'Processing...' : 'Upload CSV'}
            </Button>
          </div>

          {/* Progress Bar */}
          {csvUploadLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing CSV...</span>
                <span>{csvUploadProgress}%</span>
              </div>
              <Progress value={csvUploadProgress} className="w-full" />
            </div>
          )}

          {/* Upload Results - SAFE ARRAY ACCESS */}
          {csvUploadResults && (
            <Card className="p-4">
              <h3 className="font-medium mb-3">Upload Results</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-semibold">{csvUploadResults.totalProcessed || 0}</div>
                    <div className="text-gray-600">Processed</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-lg font-semibold text-green-600">{csvUploadResults.totalInserted || 0}</div>
                    <div className="text-gray-600">Inserted</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-lg font-semibold text-blue-600">{csvUploadResults.totalUpdated || 0}</div>
                    <div className="text-gray-600">Updated</div>
                  </div>
                </div>
                
                {/* SAFE ERROR ARRAY HANDLING */}
                {safeCsvUploadResultsErrors.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-red-800">Errors ({safeCsvUploadResultsErrors.length}):</h4>
                    {safeCsvUploadResultsErrors.map((error: string, index: number) => (
                      <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {error || 'Unknown error'}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Import History - SAFE ARRAY ACCESS */}
          {safeCsvImportHistory.length > 0 && (
            <Card className="p-4">
              <h3 className="font-medium mb-3">Recent Imports ({safeCsvImportHistory.length})</h3>
              <div className="space-y-2">
                {safeCsvImportHistory.map((batch) => (
                  <div key={batch?.id || Math.random()} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{batch?.filename || 'Unknown file'}</span>
                      <p className="text-sm text-muted-foreground">
                        {safeFormatDate(batch?.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {batch?.processed_records || 0} processed
                      </div>
                      <div className="text-xs text-muted-foreground">
                        +{batch?.inserted_records || 0} / ~{batch?.updated_records || 0}
                        {(batch?.error_records || 0) > 0 && ` / ${batch.error_records} errors`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Field Mapping Information */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-medium mb-3">CSV Field Mapping</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Required Fields:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <code>PartNumber</code> → SKU</li>
                  <li>• <code>VCPN</code> → Vendor Catalog Part Number</li>
                  <li>• <code>Description</code> → Product Description</li>
                  <li>• <code>JobberPrice</code> → Price</li>
                  <li>• <code>TotalQty</code> → Quantity</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Optional Fields:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <code>VendorName</code> → Supplier</li>
                  <li>• <code>Brand</code> → Brand</li>
                  <li>• <code>Category</code> → Category</li>
                  <li>• <code>Weight</code> → Weight</li>
                  <li>• <code>UPC</code> → UPC Code</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white rounded border">
              <h4 className="font-medium mb-1">Matching Logic:</h4>
              <p className="text-xs text-muted-foreground">
                Records are matched by SKU or VCPN. Existing items are updated, new items are created.
                All changes are logged in the audit trail with batch tracking.
              </p>
            </div>
          </Card>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
        <div className="font-semibold mb-1">🐛 CsvUploadTab Debug Info</div>
        <div>Component: CsvUploadTab (potential p3e component)</div>
        <div>Import History: {safeCsvImportHistory.length} items</div>
        <div>Upload Errors: {safeCsvUploadResultsErrors.length} items</div>
        <div>Current File: {csvFile ? csvFile.name : 'None selected'}</div>
        <div>Upload Progress: {csvUploadProgress}%</div>
        <div>Upload Loading: {csvUploadLoading ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
};

export default CsvUploadTab;

