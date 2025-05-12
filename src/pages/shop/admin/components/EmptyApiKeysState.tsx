
import React from 'react';

const EmptyApiKeysState: React.FC = () => {
  return (
    <div className="text-center py-8 border rounded-md">
      <p className="text-muted-foreground">No API keys found. Add your first key to get started.</p>
    </div>
  );
};

export default EmptyApiKeysState;
