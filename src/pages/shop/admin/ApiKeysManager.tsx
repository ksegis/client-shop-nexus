
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  service: string;
  created_at: string;
  updated_at: string;
}

const ApiKeysManager = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyService, setNewKeyService] = useState('distributor');
  const [newKey, setNewKey] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      // Use type assertion to handle the table that's not in the TypeScript definitions yet
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false }) as { 
          data: ApiKey[] | null; 
          error: Error | null 
        };
      
      if (error) throw error;
      
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load API keys",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim() || !newKeyService || !newKey.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All fields are required",
      });
      return;
    }
    
    try {
      // Use type assertion to handle the table that's not in the TypeScript definitions yet
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyName.trim(),
          key: newKey.trim(),
          service: newKeyService,
        })
        .select() as {
          data: ApiKey[] | null;
          error: Error | null
        };
      
      if (error) throw error;
      
      if (data) {
        setApiKeys([...data, ...apiKeys]);
      }
      
      setIsDialogOpen(false);
      setNewKeyName('');
      setNewKeyService('distributor');
      setNewKey('');
      
      toast({
        title: "Success",
        description: "API key added successfully",
      });
      
      fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create API key",
      });
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      // Use type assertion to handle the table that's not in the TypeScript definitions yet
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id) as {
          error: Error | null
        };
      
      if (error) throw error;
      
      setApiKeys(apiKeys.filter(key => key.id !== id));
      
      toast({
        title: "Success",
        description: "API key deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete API key",
      });
    }
  };

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell>{apiKey.name}</TableCell>
                <TableCell>
                  <span className="capitalize">{apiKey.service}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="font-mono text-sm">
                      {apiKey.key.substring(0, 8)}...
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{formatDate(apiKey.created_at)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteKey(apiKey.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No API keys found. Add your first key to get started.</p>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
            <DialogDescription>
              Enter the details for the new API key.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="E.g., Production GHL, Distributor ABC"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service">Service Type</Label>
              <Select
                value={newKeyService}
                onValueChange={setNewKeyService}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="ghl">Go High Level (GHL)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder="Paste API key here"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeysManager;
