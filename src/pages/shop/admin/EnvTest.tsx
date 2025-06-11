import React from 'react';

const EnvTest = () => {
  // Test both Vite and Next.js environment variable methods
  const viteMeta = typeof import.meta !== 'undefined' && import.meta.env;
  const processEnv = typeof process !== 'undefined' && process.env;
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Environment Test Page</h1>
      <p>Version: 1.1.0</p>
      <p>This page is working!</p>
      
      <h2>Environment System Detection</h2>
      <div style={{ backgroundColor: '#f0f8ff', padding: '10px', margin: '10px 0' }}>
        <strong>import.meta.env available:</strong> {viteMeta ? 'YES' : 'NO'}<br />
        <strong>process.env available:</strong> {processEnv ? 'YES' : 'NO'}
      </div>
      
      <h2>Vite Environment Variables (import.meta.env.VITE_*)</h2>
      <div style={{ backgroundColor: '#fff3cd', padding: '10px', margin: '10px 0' }}>
        <strong>VITE_KEYSTONE_ACCOUNT_NUMBER:</strong><br />
        {viteMeta ? (viteMeta.VITE_KEYSTONE_ACCOUNT_NUMBER || 'undefined') : 'import.meta.env not available'}<br /><br />
        
        <strong>VITE_SUPABASE_URL:</strong><br />
        {viteMeta ? (viteMeta.VITE_SUPABASE_URL || 'undefined') : 'import.meta.env not available'}<br /><br />
        
        <strong>VITE_KEYSTONE_PROXY_URL:</strong><br />
        {viteMeta ? (viteMeta.VITE_KEYSTONE_PROXY_URL || 'undefined') : 'import.meta.env not available'}
      </div>
      
      <h2>All Available VITE_ Variables</h2>
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          {viteMeta ? 
            Object.keys(viteMeta)
              .filter(key => key.startsWith('VITE_'))
              .map(key => `${key}: ${viteMeta[key]}`)
              .join('\n') || 'No VITE_ variables found'
            : 'import.meta.env not available'
          }
        </pre>
      </div>
      
      <h2>Basic Test</h2>
      <div style={{ backgroundColor: '#f5f5f5', padding: '10px', margin: '10px 0' }}>
        <strong>Current time:</strong> {new Date().toISOString()}<br />
        <strong>Window location:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server side'}
      </div>
    </div>
  );
};

export default EnvTest;

