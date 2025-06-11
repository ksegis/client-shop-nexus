// Simple Environment Variable Test Page
// Version: 1.0.0 - Basic test to isolate environment variable issues
import React from 'react';

const EnvTestPage: React.FC = () => {
  // Test if process.env is available
  const processEnvAvailable = typeof process !== 'undefined' && process.env;
  
  // Try to get environment variables
  const testVars = {
    accountNumber: processEnvAvailable ? process.env.NEXT_PUBLIC_KEYSTONE_ACCOUNT_NUMBER : 'process.env not available',
    proxyUrl: processEnvAvailable ? process.env.NEXT_PUBLIC_KEYSTONE_PROXY_URL : 'process.env not available',
    supabaseUrl: processEnvAvailable ? process.env.NEXT_PUBLIC_SUPABASE_URL : 'process.env not available',
    nodeEnv: processEnvAvailable ? process.env.NODE_ENV : 'process.env not available'
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variable Test</h1>
      <p><strong>Version:</strong> 1.0.0</p>
      <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
      
      <h2>Process Environment Status</h2>
      <p><strong>process available:</strong> {typeof process !== 'undefined' ? 'YES' : 'NO'}</p>
      <p><strong>process.env available:</strong> {processEnvAvailable ? 'YES' : 'NO'}</p>
      
      <h2>Environment Variables</h2>
      <div style={{ backgroundColor: '#f5f5f5', padding: '10px', marginBottom: '10px' }}>
        <strong>NEXT_PUBLIC_KEYSTONE_ACCOUNT_NUMBER:</strong><br />
        {testVars.accountNumber || 'undefined'}
      </div>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '10px', marginBottom: '10px' }}>
        <strong>NEXT_PUBLIC_KEYSTONE_PROXY_URL:</strong><br />
        {testVars.proxyUrl || 'undefined'}
      </div>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '10px', marginBottom: '10px' }}>
        <strong>NEXT_PUBLIC_SUPABASE_URL:</strong><br />
        {testVars.supabaseUrl || 'undefined'}
      </div>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '10px', marginBottom: '10px' }}>
        <strong>NODE_ENV:</strong><br />
        {testVars.nodeEnv || 'undefined'}
      </div>

      <h2>All NEXT_PUBLIC Variables</h2>
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px' }}>
        {processEnvAvailable ? (
          <pre>
            {JSON.stringify(
              Object.keys(process.env)
                .filter(key => key.startsWith('NEXT_PUBLIC'))
                .reduce((obj, key) => {
                  obj[key] = process.env[key];
                  return obj;
                }, {} as Record<string, string | undefined>),
              null,
              2
            )}
          </pre>
        ) : (
          <p>process.env not available - cannot list variables</p>
        )}
      </div>

      <h2>Debug Information</h2>
      <div style={{ backgroundColor: '#fff3cd', padding: '10px' }}>
        <p><strong>Window location:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
        <p><strong>User agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'SSR'}</p>
      </div>
    </div>
  );
};

export default EnvTestPage;

