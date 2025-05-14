
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Check, Database, Key, RefreshCw, Shield } from 'lucide-react';

const RlsTroubleshooter = () => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: rlsStatus, isLoading, refetch } = useQuery({
    queryKey: ['rls-status'],
    queryFn: async () => {
      const { data: rlsPolicies, error: policiesError } = await supabase
        .from('rls_status')
        .select('*');
      
      if (policiesError) {
        console.error('Error fetching RLS status:', policiesError);
        throw policiesError;
      }
      
      // Get list of tables with RLS enabled
      const tablesWithRls = rlsPolicies?.filter(table => table.row_security_active) || [];
      
      // Get active policies
      const { data: policies, error: policiesListError } = await supabase.rpc(
        'test_rls_policies'
      );
      
      if (policiesListError) {
        console.error('Error testing RLS policies:', policiesListError);
      }
      
      return {
        tablesWithRls,
        policies: policies || []
      };
    },
    enabled: isExpanded
  });

  const handleDisableRls = async () => {
    try {
      await supabase.rpc('disable_all_rls');
      refetch();
    } catch (error) {
      console.error('Error disabling RLS:', error);
    }
  };

  if (!isExpanded) {
    return (
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader className="pb-2">
          <Button 
            variant="ghost"
            className="p-0 h-auto hover:bg-transparent" 
            onClick={() => setIsExpanded(true)}
          >
            <CardTitle className="flex items-center text-sm text-slate-600">
              <Shield className="h-4 w-4 mr-2" />
              RLS Troubleshooter (Development Only)
            </CardTitle>
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Row Level Security (RLS) Troubleshooter
        </CardTitle>
        <CardDescription>
          Diagnose permissions and RLS policy issues in your database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Authentication Status</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-1" />
                    <span>Authenticated as {user.email}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>Not authenticated</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">User Role</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <Badge variant="outline" className="bg-blue-50">
                    {user.user_metadata?.role || 'No role defined'}
                  </Badge>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>Sign in to see role</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">User ID</CardTitle>
              </CardHeader>
              <CardContent className="text-xs font-mono overflow-hidden text-ellipsis">
                {user?.id || 'Not authenticated'}
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold flex items-center">
                <Database className="h-4 w-4 mr-1" /> Tables with RLS
              </h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {isLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Loading RLS status...
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b">
                      <th className="text-left py-2 px-3">Table</th>
                      <th className="text-center py-2 px-3">RLS Enabled</th>
                      <th className="text-center py-2 px-3">Has Policies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rlsStatus?.tablesWithRls.map((table, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 px-3 font-mono text-xs">
                          {table.table_name}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {table.row_security_active ? (
                            <Badge variant="default" className="bg-green-500">Enabled</Badge>
                          ) : (
                            <Badge variant="outline">Disabled</Badge>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {rlsStatus.policies.some(p => p.table_name === table.table_name) ? (
                            <Badge variant="default" className="bg-green-500">Yes</Badge>
                          ) : (
                            <Badge variant="destructive">No Policies</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!rlsStatus?.tablesWithRls || rlsStatus.tablesWithRls.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-center text-muted-foreground">
                          No tables with RLS found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-2">
            <div className="flex flex-col space-y-2">
              <div className="border border-yellow-300 bg-yellow-50 rounded-md p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Development Tools</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      These actions are for development purposes only. Never use in production.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                onClick={handleDisableRls}
              >
                <Key className="h-4 w-4 mr-2" />
                Temporarily Disable All RLS for Development
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            Close Troubleshooter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RlsTroubleshooter;
