
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldOff, 
  User, 
  Database,
  Check, 
  X,
  RefreshCw
} from 'lucide-react';

export const RlsTroubleshooter = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const checkRlsStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check auth status
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check RLS status on tables
      const { data: rlsData, error: rlsError } = await supabase
        .rpc('test_rls_policies');
        
      if (rlsError) throw rlsError;
      
      // Additional checks
      const tableResults = await Promise.all(['inventory', 'profiles', 'vehicles'].map(async (table) => {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('count(*)')
            .limit(1);
            
          return {
            table,
            success: !error,
            error: error?.message || null,
            hasData: (data?.length || 0) > 0
          };
        } catch (err: any) {
          return {
            table,
            success: false,
            error: err.message,
            hasData: false
          };
        }
      }));
      
      setResults({
        auth: {
          isAuthenticated: !!session,
          userId: session?.user?.id || null,
          userRole: user?.app_metadata?.role || user?.user_metadata?.role || null
        },
        rls: rlsData,
        tableAccess: tableResults
      });
    } catch (err: any) {
      console.error('Error checking RLS:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const testRlsPolicy = async () => {
    setTesting(true);
    try {
      // Try to insert and fetch data with RLS rules
      const testItem = {
        name: 'RLS Test Item',
        description: 'Testing RLS policies',
        quantity: 1,
        price: 10.99
      };
      
      // Try insert
      const { data: insertData, error: insertError } = await supabase
        .from('inventory')
        .insert(testItem)
        .select();
        
      // Try fetch
      const { data: fetchData, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .limit(5);
        
      setResults({
        ...results,
        test: {
          insert: {
            success: !insertError,
            error: insertError?.message || null,
            data: insertData
          },
          fetch: {
            success: !fetchError,
            error: fetchError?.message || null,
            count: fetchData?.length || 0
          }
        }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTesting(false);
    }
  };
  
  const disableRls = async () => {
    setLoading(true);
    try {
      // This should only work for admin users
      const { error } = await supabase.rpc('disable_all_rls');
      
      if (error) throw error;
      
      // Refresh status
      await checkRlsStatus();
    } catch (err: any) {
      console.error('Failed to disable RLS:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          RLS Troubleshooter
        </CardTitle>
        <CardDescription>
          Diagnose Row Level Security issues and test your policies
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">Auth Status:</span>
          </div>
          <div>
            {user ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" /> Authenticated as {user.email}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <X className="h-3 w-3 mr-1" /> Not authenticated
              </Badge>
            )}
          </div>
        </div>
        
        {results && (
          <>
            <div className="mt-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Database className="h-4 w-4" /> 
                Table Access Results
              </h3>
              <div className="grid gap-2">
                {results.tableAccess?.map((result: any) => (
                  <div key={result.table} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="font-medium">{result.table}</span>
                    {result.success ? (
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Access OK
                      </Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-700 border-red-200">
                        <X className="h-3 w-3 mr-1" /> Access Denied: {result.error}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {results.rls && (
              <div className="mt-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> 
                  RLS Policy Status
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-2 text-left">Table</th>
                        <th className="p-2 text-left">RLS Active</th>
                        <th className="p-2 text-left">Admin Policy</th>
                        <th className="p-2 text-left">Owner Policy</th>
                        <th className="p-2 text-left">Ownership Column</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.rls.map((table: any) => (
                        <tr key={table.table_name} className="border-t">
                          <td className="p-2">{table.table_name}</td>
                          <td className="p-2">
                            {table.has_rls ? (
                              <Badge className="bg-green-50 text-green-700">Enabled</Badge>
                            ) : (
                              <Badge className="bg-red-50 text-red-700">Disabled</Badge>
                            )}
                          </td>
                          <td className="p-2">
                            {table.has_admin_policy ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                          </td>
                          <td className="p-2">
                            {table.has_owner_policy ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                          </td>
                          <td className="p-2">
                            {table.ownership_column !== 'none' ? (
                              <Badge variant="outline">{table.ownership_column}</Badge>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {results.test && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">RLS Test Results</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>Insert Operation</span>
                    {results.test.insert.success ? (
                      <Badge className="bg-green-50 text-green-700">Success</Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-700">
                        Failed: {results.test.insert.error}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span>Fetch Operation</span>
                    {results.test.fetch.success ? (
                      <Badge className="bg-green-50 text-green-700">
                        Success ({results.test.fetch.count} items)
                      </Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-700">
                        Failed: {results.test.fetch.error}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2">
        <Button 
          onClick={checkRlsStatus} 
          disabled={loading}
          variant="outline"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Check RLS Status
        </Button>
        
        <Button 
          onClick={testRlsPolicy}
          disabled={testing || !results}
          variant="outline"
        >
          {testing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4 mr-2" />
          )}
          Test RLS Policies
        </Button>
        
        <Button 
          onClick={disableRls}
          disabled={loading}
          variant="outline"
          className="text-amber-600 hover:text-amber-700"
        >
          <ShieldOff className="h-4 w-4 mr-2" />
          Disable RLS (Dev Only)
        </Button>
      </CardFooter>
    </Card>
  );
};
