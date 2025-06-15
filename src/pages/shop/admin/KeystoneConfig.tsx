import React from 'react';
import KeystoneConfigManager from '@/components/admin/KeystoneConfigManager';

const KeystoneConfig: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Keystone Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure your Keystone Automotive Operations API settings and test connectivity.
        </p>
      </div>
      
      <KeystoneConfigManager />
    </div>
  );
};

export default KeystoneConfig;

