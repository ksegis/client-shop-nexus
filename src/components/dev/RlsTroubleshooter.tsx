
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Check, Info, Shield, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const RlsTroubleshooter = () => {
  const [rlsStatus, setRlsStatus] = useState<{
    loading: boolean;
    tablesWithRls: { table_name: string; row_security_active: boolean }[];
    policies: any[];
    error?: string;
  }>({
    loading: false,
    tablesWithRls: [],
    policies: [],
  });

  const checkRlsStatus = async () => {
    try {
      setRlsStatus(prev => ({ ...prev, loading: true, error: undefined }));
      
      // Get RLS status for each table
      const { data: rlsPolicies, error: rlsError } = await supabase.from('rls_status').select('*');
      
      if (rlsError) {
        throw new Error(`Error fetching RLS status: ${rlsError.message}`);
      }
      
      // Get list of tables with RLS enabled
      const tablesWithRls = rlsPolicies?.filter(table => table.row_security_active) || [];
      
      // For getting policies, we need to use raw SQL through a function since pg_policies is not accessible directly
      const { data: policies, error: policiesListError } = await supabase.rpc('list_policies');
      
      if (policiesListError) {
        console.error('Error fetching RLS policies:', policiesListError);
      }
      
      return {
        tablesWithRls,
        policies: policies || [],
      };
    } catch (error: any) {
      console.error('RLS check error:', error);
      return { 
        tablesWithRls: [],
        policies: [],
        error: error.message 
      };
    }
  };

  const handleCheckRls = async () => {
    setRlsStatus(prev => ({ ...prev, loading: true }));
    try {
      const result = await checkRlsStatus();
      setRlsStatus({ 
        loading: false, 
        tablesWithRls: result.tablesWithRls || [],
        policies: result.policies || [],
        error: result.error 
      });
      
      if (!result.error) {
        toast({
          title: 'RLS Check Complete',
          description: `Found ${result.tablesWithRls?.length || 0} tables with RLS enabled`,
        });
      }
    } catch (error: any) {
      setRlsStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message 
      }));
      toast({
        variant: 'destructive',
        title: 'RLS Check Failed',
        description: error.message,
      });
    }
  };

  // Helper function to analyze RLS setup and suggest fixes
  const analyzeRlsSetup = () => {
    const { tablesWithRls, policies } = rlsStatus;
    const issues = [];

    // Check for tables with RLS enabled but no policies
    const tablesWithNoPolicy = tablesWithRls
      .filter(table => !policies?.some((p: any) => p.table_name === table.table_name))
      .map(table => table.table_name);
    
    if (tablesWithNoPolicy.length > 0) {
      issues.push({
        type: 'warning',
        message: `Tables with RLS enabled but no policies: ${tablesWithNoPolicy.join(', ')}`,
        details: 'These tables have RLS enabled but no policies defined, making them inaccessible to most users.'
      });
    }

    // Check if inventory table has RLS 
    const inventoryHasRls = tablesWithRls.some(t => t.table_name === 'inventory');
    if (!inventoryHasRls) {
      issues.push({
        type: 'info',
        message: 'The inventory table does not have RLS enabled.',
        details: 'This might be intentional if you want all authenticated users to access inventory data.'
      });
    }

    return issues;
  };

  const issues = rlsStatus.tablesWithRls.length > 0 ? analyzeRlsSetup() : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Row-Level Security (RLS) Troubleshooter
        </CardTitle>
        <CardDescription>
          Check and troubleshoot Row-Level Security settings on your tables
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rlsStatus.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{rlsStatus.error}</AlertDescription>
          </Alert>
        )}
        
        {issues.map((issue, index) => (
          <Alert key={index} variant={issue.type === 'warning' ? 'destructive' : 'default'}>
            {issue.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            <AlertTitle>{issue.message}</AlertTitle>
            <AlertDescription>{issue.details}</AlertDescription>
          </Alert>
        ))}
        
        {rlsStatus.tablesWithRls.length > 0 && (
          <div className="rounded-md border">
            <div className="bg-muted px-4 py-2 font-medium">
              Tables with RLS Status
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 text-left">Table</th>
                  <th className="py-2 px-3 text-center">RLS Enabled</th>
                  <th className="py-2 px-3 text-center">Has Policies</th>
                </tr>
              </thead>
              <tbody>
                {rlsStatus.tablesWithRls.map((table) => (
                  <tr key={table.table_name} className="border-b">
                    <td className="py-2 px-3 font-mono text-sm">{table.table_name}</td>
                    <td className="py-2 px-3 text-center">
                      {table.row_security_active ? (
                        <Badge variant="outline" className="bg-green-500 text-white">Enabled</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-500">Disabled</Badge>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {rlsStatus.policies && 
                       Array.isArray(rlsStatus.policies) && 
                       rlsStatus.policies.some((p: any) => p.table_name === table.table_name) ? (
                        <Badge variant="default" className="bg-green-500">Yes</Badge>
                      ) : (
                        <Badge variant="destructive">No Policies</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleCheckRls} 
          disabled={rlsStatus.loading}
        >
          {rlsStatus.loading ? 'Checking...' : 'Check RLS Status'}
        </Button>
      </CardFooter>
    </Card>
  );
};
