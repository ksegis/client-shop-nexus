
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import ApiKeyDialog from './components/ApiKeyDialog';
import ApiKeysTable from './components/ApiKeysTable';
import EmptyApiKeysState from './components/EmptyApiKeysState';

const ApiKeysManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { apiKeys, loading, createApiKey, deleteApiKey } = useApiKeys();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSaveKey = async (name: string, service: string, key: string) => {
    const success = await createApiKey(name, service, key);
    if (success) {
      setIsDialogOpen(false);
    }
    return success;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">API Keys</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New API Key
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading API keys...</div>
      ) : apiKeys.length > 0 ? (
        <ApiKeysTable 
          apiKeys={apiKeys} 
          onDeleteKey={deleteApiKey} 
          onCopyKey={copyToClipboard} 
          formatDate={formatDate} 
        />
      ) : (
        <EmptyApiKeysState />
      )}

      <ApiKeyDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onSave={handleSaveKey} 
      />
    </div>
  );
};

export default ApiKeysManager;
