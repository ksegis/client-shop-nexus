import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardDrive, RefreshCw, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';

interface FtpSyncTabProps {
  ftpSyncStatus: any;
  ftpSyncLoading: boolean;
  ftpSyncResults: any;
  syncRecommendations: any[];
  syncMethodTest: any;
  selectedSyncType: string;
  setSelectedSyncType: (type: string) => void;
  syncStrategy: any;
  rateLimitStatus: any;
  testSyncMethods: () => void;
  executeFtpSync: (syncType?: string, forceMethod?: string) => void;
  renderRateLimitStatus: () => React.ReactNode;
  safeFormatDate: (date: any) => string;
  safeFormatRelativeTime: (date: any) => string;
}

const FtpSyncTab: React.FC<FtpSyncTabProps> = ({
  ftpSyncStatus,
  ftpSyncLoading,
  ftpSyncResults,
  syncRecommendations,
  syncMethodTest,
  selectedSyncType,
  setSelectedSyncType,
  syncStrategy,
  rateLimitStatus,
  testSyncMethods,
  executeFtpSync,
  renderRateLimitStatus,
  safeFormatDate,
  safeFormatRelativeTime
}) => {
  return (
    <div className="space-y-6">
      {/* Rate Limit Status */}
      {renderRateLimitStatus()}

      {/* Sync Recommendations */}
      {syncRecommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Sync Recommendations</h3>
          {syncRecommendations.map((rec, index) => (
            <Alert key={index} className={
              rec.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              rec.type === 'info' ? 'border-blue-200 bg-blue-50' :
              'border-gray-200 bg-gray-50'
            }>
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{rec.title}</strong> - {rec.message}
                  </div>
                  <Badge variant="outline">{rec.priority}</Badge>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* FTP Sync Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            FTP Sync Operations
          </CardTitle>
          <CardDescription>
            Advanced sync operations using FTP and API methods with intelligent strategy selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sync Type Selection */}
          <div>
            <label className="text-sm font-medium">Sync Type</label>
            <Select value={selectedSyncType} onValueChange={setSelectedSyncType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventory">Full Inventory Sync</SelectItem>
                <SelectItem value="delta_inventory">Delta Inventory Sync</SelectItem>
                <SelectItem value="delta_quantity">Quantity Delta Only</SelectItem>
                <SelectItem value="pricing">Pricing Updates</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sync Strategy Display */}
          {syncStrategy && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription>
                <div className="space-y-1">
                  <div><strong>Recommended Strategy:</strong> {syncStrategy.method}</div>
                  <div className="text-sm">{syncStrategy.reason}</div>
                  {syncStrategy.estimatedTime && (
                    <div className="text-xs">Estimated time: {syncStrategy.estimatedTime}</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={testSyncMethods}
              disabled={ftpSyncLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${ftpSyncLoading ? 'animate-spin' : ''}`} />
              Test Methods
            </Button>

            <Button
              onClick={() => executeFtpSync(selectedSyncType)}
              disabled={ftpSyncLoading}
              className="flex items-center gap-2"
            >
              <HardDrive className="h-4 w-4" />
              Execute Sync
            </Button>

            <Button
              onClick={() => executeFtpSync(selectedSyncType, 'ftp')}
              disabled={ftpSyncLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Force FTP
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync Method Test Results */}
      {syncMethodTest && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Method Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {syncMethodTest.error ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Test Failed:</strong> {syncMethodTest.error}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {Object.entries(syncMethodTest).map(([method, result]: [string, any]) => (
                  <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{method}</span>
                      <p className="text-sm text-muted-foreground">
                        {result.available ? 'Available' : 'Unavailable'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={result.available ? 'default' : 'secondary'}>
                        {result.available ? 'Ready' : 'Not Available'}
                      </Badge>
                      {result.responseTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.responseTime}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* FTP Sync Results */}
      {ftpSyncResults && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {ftpSyncResults.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {ftpSyncResults.success ? 'Sync Completed Successfully' : 'Sync Failed'}
                </span>
              </div>

              {ftpSyncResults.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Records Processed</div>
                    <div className="text-muted-foreground">{ftpSyncResults.summary.processed || 0}</div>
                  </div>
                  <div>
                    <div className="font-medium">Records Updated</div>
                    <div className="text-muted-foreground">{ftpSyncResults.summary.updated || 0}</div>
                  </div>
                  <div>
                    <div className="font-medium">Duration</div>
                    <div className="text-muted-foreground">{ftpSyncResults.summary.duration || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="font-medium">Method Used</div>
                    <div className="text-muted-foreground">{ftpSyncResults.method || 'Unknown'}</div>
                  </div>
                </div>
              )}

              {ftpSyncResults.errors && ftpSyncResults.errors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Sync Errors:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {ftpSyncResults.errors.slice(0, 5).map((error: string, index: number) => (
                        <li key={index} className="text-xs">{error}</li>
                      ))}
                    </ul>
                    {ftpSyncResults.errors.length > 5 && (
                      <p className="text-xs mt-1">
                        ... and {ftpSyncResults.errors.length - 5} more errors
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FTP Status Information */}
      {ftpSyncStatus && (
        <Card>
          <CardHeader>
            <CardTitle>FTP Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {ftpSyncStatus.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {ftpSyncStatus.success ? 'FTP Connection Active' : 'FTP Connection Issues'}
                </span>
              </div>

              {ftpSyncStatus.lastConnection && (
                <div className="text-sm">
                  <strong>Last Connection:</strong> {safeFormatRelativeTime(ftpSyncStatus.lastConnection)}
                </div>
              )}

              {ftpSyncStatus.availableFiles && ftpSyncStatus.availableFiles.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Available Files:</h4>
                  <div className="space-y-1">
                    {ftpSyncStatus.availableFiles.slice(0, 5).map((file: any, index: number) => (
                      <div key={index} className="text-sm flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{file.name}</span>
                        <span className="text-muted-foreground">{safeFormatDate(file.modified)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!ftpSyncStatus.success && ftpSyncStatus.message && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {ftpSyncStatus.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FtpSyncTab;

