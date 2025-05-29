
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Copy, Eye, EyeOff, Plus, Trash2, Key } from 'lucide-react';
import { useCustomerApiKeys } from '@/hooks/customer/useCustomerApiKeys';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const CustomerApiKeysManager = () => {
  const { apiKeys, loading, generateApiKey, toggleApiKey, deleteApiKey } = useCustomerApiKeys();
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState('');
  const [expirationDays, setExpirationDays] = useState<string>('');
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a key name",
      });
      return;
    }

    const expDays = expirationDays ? parseInt(expirationDays) : undefined;
    const result = await generateApiKey(newKeyName, expDays);
    
    if (result) {
      setNewKeyName('');
      setExpirationDays('');
      setIsGenerateDialogOpen(false);
      
      // Show the new key briefly
      setVisibleKeys(prev => new Set([...prev, result.id]));
      setTimeout(() => {
        setVisibleKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(result.id);
          return newSet;
        });
      }, 10000); // Hide after 10 seconds
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const maskApiKey = (key: string) => {
    return key.slice(0, 8) + '•'.repeat(48) + key.slice(-8);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys
        </CardTitle>
        <CardDescription>
          Generate and manage API keys for accessing your account data programmatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Generate New API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for accessing your account data. Choose a descriptive name to help you remember what this key is used for.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., TestSprite Integration"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="expiration">Expiration (Optional)</Label>
                <Select value={expirationDays} onValueChange={setExpirationDays}>
                  <SelectTrigger>
                    <SelectValue placeholder="Never expires" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Never expires</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleGenerateKey} className="flex-1">
                  Generate Key
                </Button>
                <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No API keys generated yet.</p>
            <p className="text-sm">Generate your first API key to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((apiKey) => {
              const isVisible = visibleKeys.has(apiKey.id);
              const isExpired = apiKey.expires_at && new Date(apiKey.expires_at) < new Date();
              
              return (
                <div key={apiKey.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{apiKey.key_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created {format(new Date(apiKey.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apiKey.is_active && !isExpired ? "default" : "secondary"}>
                        {isExpired ? "Expired" : apiKey.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={apiKey.is_active}
                        onCheckedChange={(checked) => toggleApiKey(apiKey.id, checked)}
                        disabled={isExpired}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">
                      {isVisible ? apiKey.api_key : maskApiKey(apiKey.api_key)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.api_key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the API key "{apiKey.key_name}"? This action cannot be undone and any applications using this key will stop working.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteApiKey(apiKey.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {apiKey.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {format(new Date(apiKey.expires_at), 'MMM d, yyyy')}
                    </p>
                  )}

                  {apiKey.last_used_at && (
                    <p className="text-xs text-muted-foreground">
                      Last used: {format(new Date(apiKey.last_used_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerApiKeysManager;
