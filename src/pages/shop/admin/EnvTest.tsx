import React from 'react';

const EnvTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Environment Test Page</h1>
      <p>Version: 1.0.0</p>
      <p>This page is working!</p>
      
      <h2>Basic Test</h2>
      <p>If you can see this, the component is deployed correctly.</p>
      
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        <strong>Current time:</strong> {new Date().toISOString()}
      </div>
      
      <div style={{ backgroundColor: '#e6f3ff', padding: '10px', margin: '10px 0' }}>
        <strong>Window location:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server side'}
      </div>
    </div>
  );
};

export default EnvTest;

