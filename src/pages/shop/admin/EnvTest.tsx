// Vite vs Next.js Environment Variable Test
// Version: 1.1.0 - Test both Vite and Next.js environment variable methods
import React from 'react';

const EnvTestVite: React.FC = () => {
  // Test Next.js style (process.env)
  const processEnvAvailable = typeof process !== 'undefined' && process.env;
  
  // Test Vite style (import.meta.env)
  const importMetaEnvAvailable = typeof import.meta !== 'undefined' && import.meta.env;
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Vite vs Next.js Environment Test</h1>
      <p><strong>Version:</strong> 1.1.0</p>
      <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
      
      <h2>Build System Detection</h2>
      <div style={{ backgroundColor: '#f0f8ff', padding: '10px', marginBottom: '10px' }}>
        <strong>process available:</strong> {typeof process !== 'undefined' ? 'YES' : 'NO'}<br />
        <strong>process.env available:</strong> {processEnvAvailable ? 'YES' : 'NO'}<br />
        <strong>import.meta available:</strong> {typeof import.meta !== 'undefined' ? 'YES' : 'NO'}<br />
        <strong>import.meta.env available:</strong> {importMetaEnvAvailable ? 'YES' : 'NO'}
      </div>
      
      <h2>Next.js Style (process.env.NEXT_PUBLIC_*)</h2>
      <div style={{ backgroundColor: '#f5f5f5', padding: '10px', marginBottom: '10px' }}>
        <strong>NEXT_PUBLIC_KEYSTONE_ACCOUNT_NUMBER:</strong><br />
        {processEnvAvailable ? (process.env.NEXT_PUBLIC_KEYSTONE_ACCOUNT_NUMBER || 'undefined') : 'process.env not available'}
      </div>
      
      <h2>Vite Style (import.meta.env.VITE_*)</h2>
      <div style={{ backgroundColor: '#fff3cd', padding: '10px', marginBottom: '10px' }}>
        <strong>VITE_KEYSTONE_ACCOUNT_NUMBER:</strong><br />
        {importMetaEnvAvailable ? (import.meta.env.VITE_KEYSTONE_ACCOUNT_NUMBER || 'undefined') : 'import.meta.env not available'}
      </div>
      
      <h2>Test with Existing Variables</h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '10px', marginBottom: '10px' }}>
        <p><strong>If you see values below, that's your working method:</strong></p>
        
        <strong>Next.js method result:</strong><br />
        {processEnvAvailable ? (process.env.NEXT_PUBLIC_SUPABASE_URL || 'No value') : 'Method not available'}<br /><br />
        
        <strong>Vite method result:</strong><br />
        {importMetaEnvAvailable ? (import.meta.env.VITE_SUPABASE_URL || 'No value') : 'Method not available'}
      </div>

      <h2>All Available Environment Variables</h2>
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px' }}>
        <strong>process.env keys:</strong><br />
        <pre style={{ fontSize: '12px' }}>
          {processEnvAvailable ? Object.keys(process.env).join(', ') : 'Not available'}
        </pre>
        
        <strong>import.meta.env keys:</strong><br />
        <pre style={{ fontSize: '12px' }}>
          {importMetaEnvAvailable ? Object.keys(import.meta.env).join(', ') : 'Not available'}
        </pre>
      </div>
    </div>
  );
};

export default EnvTestVite;

