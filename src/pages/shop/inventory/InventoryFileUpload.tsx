import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Clock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInventoryContext } from './InventoryContext';
import { useToast } from '@/hooks/use-toast';
import { 
  createUploadSession, 
  processCSVInBackground, 
  getUploadSession, 
  ProcessingProgress,
  CSVProcessingSession 
} from '@/utils/csvProcessor';

interface UploadResult {
  sessionId: string;
  session: CSVProcessingSession;
  validationSummary?: any;
  syncSummary?: any;
}

export function InventoryFileUploadEnhanced() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<CSVProcessingSession[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refetchInventory } = useInventoryContext();
  const { toast } = useToast();

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

  // Load recent upload sessions
  const loadRecentSessions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('csv_upload_sessions')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    }
  };

  // Handle button click
  const handleUploadClick = () => {
    setShowUploadDialog(true);
    setUploadResult(null);
    setSelectedFile(null);
    setPreviewData([]);
    setUploadProgress(0);
    setProcessingStage('');
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        return record;
      }).filter(record => Object.values(record).some(value => value.length > 0));

      setPreviewData(preview);
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview Error",
        description: "Could not preview the CSV file",
        variant: "destructive",
      });
    }
  };

  // Process CSV file with background processing
  const processCSVFile = async () => {
    if (!selectedFile || !currentUser) {
      toast({
        title: "Error",
        description: "No file selected or user not authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setProcessingStage('Initializing...');
    setUploadResult(null);

    try {
      // Create upload session
      const sessionId = await createUploadSession(
        selectedFile.name,
        selectedFile.name,
        selectedFile.size,
        currentUser.id
      );

      // Read CSV content
      const csvContent = await selectedFile.text();

      // Process in background with progress updates
      await processCSVInBackground(csvContent, sessionId, (progress: ProcessingProgress) => {
        setUploadProgress(progress.progress);
        setProcessingStage(progress.message);
        
        if (progress.stage === 'completed') {
          // Processing completed successfully
          handleProcessingComplete(sessionId, progress.details);
        } else if (progress.stage === 'failed') {
          throw new Error(progress.message);
        }
      });

    } catch (error) {
      console.error('Upload process error:', error);
      setProcessingStage('Processing failed');
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle processing completion
  const handleProcessingComplete = async (sessionId: string, details: any) => {
    try {
      const session = await getUploadSession(sessionId);
      if (session) {
        setUploadResult({
          sessionId,
          session,
          validationSummary: details?.validationSummary,
          syncSummary: details?.syncSummary
        });

        // Refresh recent sessions
        if (currentUser) {
          loadRecentSessions(currentUser.id);
        }

        // Refresh inventory data if records were processed
        if (details?.syncSummary?.inserted > 0 || details?.syncSummary?.updated > 0) {
          await refetchInventory();
        }

        toast({
          title: "Processing Complete",
          description: `Successfully processed ${session.validRecords} of ${session.totalRecords} records`,
        });
      }
    } catch (error) {
      console.error('Error handling completion:', error);
    }
  };

  // View session details
  const viewSessionDetails = (sessionId: string) => {
    // This would open the reconciliation interface
    // For now, we'll just show a toast
    toast({
      title: "Session Details",
      description: `Opening reconciliation interface for session ${sessionId}`,
    });
  };

  // Reset upload state
  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setProcessingStage('');
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Close dialog
  const closeDialog = () => {
    setShowUploadDialog(false);
    resetUpload();
  };

  // Format session status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Enhanced CSV Upload</h2>
              <Button variant="outline" onClick={closeDialog} disabled={isUploading}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Recent Sessions */}
              {recentSessions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Upload Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{session.originalFilename}</div>
                            <div className="text-xs text-gray-500">
                              {session.totalRecords} records • {new Date(session.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(session.status)}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => viewSessionDetails(session.id)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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
                      Enhanced processing with validation and reconciliation
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

              {/* Processing Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{processingStage}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-gray-500">
                    Processing in background - you can continue working while this completes
                  </p>
                </div>
              )}

              {/* Upload Results */}
              {uploadResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Processing Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Badge variant="outline" className="mr-2">Total</Badge>
                          {uploadResult.session.totalRecords}
                        </div>
                        <div>
                          <Badge variant="default" className="mr-2">Valid</Badge>
                          {uploadResult.session.validRecords}
                        </div>
                        <div>
                          <Badge variant="destructive" className="mr-2">Invalid</Badge>
                          {uploadResult.session.invalidRecords}
                        </div>
                        <div>
                          <Badge variant="secondary" className="mr-2">Corrected</Badge>
                          {uploadResult.session.correctedRecords}
                        </div>
                      </div>

                      {uploadResult.syncSummary && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium mb-2">Sync Results:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>Inserted: {uploadResult.syncSummary.inserted}</div>
                            <div>Updated: {uploadResult.syncSummary.updated}</div>
                            <div>Deleted: {uploadResult.syncSummary.deleted}</div>
                            <div>Skipped: {uploadResult.syncSummary.skipped}</div>
                          </div>
                        </div>
                      )}

                      {(uploadResult.session.invalidRecords > 0 || uploadResult.session.correctedRecords > 0) && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="text-sm">
                              Some records need review. Use the reconciliation interface to correct errors and process remaining records.
                            </div>
                            <Button 
                              size="sm" 
                              className="mt-2"
                              onClick={() => viewSessionDetails(uploadResult.sessionId)}
                            >
                              Open Reconciliation
                            </Button>
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
                    {isUploading ? 'Processing...' : 'Process CSV'}
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

export default InventoryFileUploadEnhanced;

