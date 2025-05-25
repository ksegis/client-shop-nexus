
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function UserTableDebug() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      setIsTestLoading(true);
      try {
        console.log('UserTableDebug: Testing direct Supabase connection...');
        
        // Test basic connection
        const { data: authData, error: authError } = await supabase.auth.getUser();
        console.log('UserTableDebug: Auth data:', { authData, authError });
        
        // Test profiles table access
        const { data, error, count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact' });
          
        console.log('UserTableDebug: Direct query result:', { 
          data, 
          error, 
          count,
          dataLength: data?.length 
        });
        
        setTestResult({ 
          data, 
          error, 
          count,
          dataLength: data?.length,
          authData,
          authError
        });
      } catch (err) {
        console.error('UserTableDebug: Test failed:', err);
        setTestResult({ error: err });
      } finally {
        setIsTestLoading(false);
      }
    };

    testConnection();
  }, []);

  if (isTestLoading) {
    return <div className="p-4 bg-yellow-100">Testing database connection...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 mb-4">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <pre className="text-xs overflow-auto max-h-32">
        {JSON.stringify(testResult, null, 2)}
      </pre>
    </div>
  );
}
