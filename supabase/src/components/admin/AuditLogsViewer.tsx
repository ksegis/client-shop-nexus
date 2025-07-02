
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { viewAuditLogFile, AuditLogType, getAuditLogs } from '@/utils/auditUtils';

const AuditLogsViewer = () => {
  const [selectedLog, setSelectedLog] = useState<AuditLogType>(AuditLogType.DEV_MODE_DISABLED);
  const [logContent, setLogContent] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Load log content when the selected log type changes or refresh is triggered
  useEffect(() => {
    setLogContent(viewAuditLogFile(selectedLog));
  }, [selectedLog, refreshTrigger]);
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Get log entry counts for the badge display
  const devModeEnabledCount = getAuditLogs(AuditLogType.DEV_MODE_ENABLED).length;
  const devModeDisabledCount = getAuditLogs(AuditLogType.DEV_MODE_DISABLED).length;
  const impersonationCount = getAuditLogs(AuditLogType.DEV_CUSTOMER_IMPERSONATION).length;
  const skipAuthCount = getAuditLogs(AuditLogType.SKIP_AUTH).length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Audit Logs</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>Refresh</Button>
        </CardTitle>
        <CardDescription>
          View detailed logs of system events and mode changes
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue={AuditLogType.DEV_MODE_DISABLED} onValueChange={(value) => setSelectedLog(value as AuditLogType)}>
        <TabsList className="grid grid-cols-4 mb-4 mx-6">
          <TabsTrigger value={AuditLogType.DEV_MODE_DISABLED} className="relative">
            Dev Mode Disabled
            {devModeDisabledCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {devModeDisabledCount}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={AuditLogType.DEV_MODE_ENABLED} className="relative">
            Dev Mode Enabled
            {devModeEnabledCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {devModeEnabledCount}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={AuditLogType.DEV_CUSTOMER_IMPERSONATION} className="relative">
            Customer Impersonation
            {impersonationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {impersonationCount}
              </span>
            )}
          </TabsTrigger>
          
          <TabsTrigger value={AuditLogType.SKIP_AUTH} className="relative">
            Skip Auth
            {skipAuthCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {skipAuthCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <CardContent>
          <TabsContent value={selectedLog} forceMount className="mt-0">
            <div className="border rounded-md p-4 bg-muted/50">
              <ScrollArea className="h-[400px] w-full">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {logContent || `No logs available for ${selectedLog}`}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default AuditLogsViewer;
