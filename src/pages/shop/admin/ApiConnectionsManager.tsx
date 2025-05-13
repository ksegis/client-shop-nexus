
import React, { useState } from 'react';
import { useApiConnections } from '@/hooks/useApiConnections';
import { ApiConnection, ApiConnectionFormData, ApiConnectionType } from './types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Copy, 
  Plus, 
  Trash2, 
  ExternalLink, 
  ArrowRightLeft, 
  Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z.string().min(1, "API key is required"),
  type: z.enum(['zapier', 'n8n', 'ghl', 'other'] as const),
  url: z.string().optional()
});

const ApiConnectionsManager = () => {
  const { connections, loading, createConnection, deleteConnection, testConnection } = useApiConnections();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ApiConnectionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      key: '',
      type: 'other',
      url: ''
    }
  });

  const onSubmit = async (data: ApiConnectionFormData) => {
    const success = await createConnection(data);
    if (success) {
      setIsDialogOpen(false);
      form.reset();
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied",
      description: "API key copied to clipboard"
    });
  };

  const handleDeleteConnection = (connection: ApiConnection) => {
    setSelectedConnectionId(connection.id);
  };

  const confirmDeleteConnection = async () => {
    if (selectedConnectionId) {
      await deleteConnection(selectedConnectionId);
      setSelectedConnectionId(null);
    }
  };

  const handleTestConnection = async (connection: ApiConnection) => {
    setTestingId(connection.id);
    await testConnection(connection);
    setTestingId(null);
  };

  const getServiceLabel = (type: ApiConnectionType) => {
    switch (type) {
      case 'zapier':
        return 'Zapier';
      case 'n8n':
        return 'N8n';
      case 'ghl':
        return 'Go High Level';
      default:
        return 'Other';
    }
  };

  const renderConnectionForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Connection Name</FormLabel>
              <FormControl>
                <Input placeholder="Marketing Automation" {...field} />
              </FormControl>
              <FormDescription>A descriptive name for this connection</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Type</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  {...field}
                >
                  <option value="zapier">Zapier</option>
                  <option value="n8n">N8n</option>
                  <option value="ghl">Go High Level</option>
                  <option value="other">Other</option>
                </select>
              </FormControl>
              <FormDescription>Select the service you're connecting to</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input placeholder="xkeysib-..." {...field} />
              </FormControl>
              <FormDescription>The API key for authentication</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webhook URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://hooks.zapier.com/..." {...field} />
              </FormControl>
              <FormDescription>Webhook URL for this connection (if applicable)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit">Save Connection</Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">API Connections</h1>
          <p className="text-muted-foreground">Manage connections to external services like Zapier, N8n, and Go High Level</p>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)} className="mt-4 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : connections.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No API connections found</h3>
          <p className="text-muted-foreground mt-2">
            Create your first API connection to integrate with external services
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Connection
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
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
              {connections.map((connection) => (
                <TableRow key={connection.id}>
                  <TableCell className="font-medium">{connection.name}</TableCell>
                  <TableCell>{getServiceLabel(connection.type)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="text-xs font-mono bg-muted p-1 rounded mr-2">
                        {connection.key.substring(0, 8)}...
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleCopyKey(connection.key)}
                        className="h-6 w-6"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(connection.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      {connection.url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8"
                        >
                          <a href={connection.url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleTestConnection(connection)}
                        disabled={testingId === connection.id}
                      >
                        {testingId === connection.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRightLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteConnection(connection)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Connection Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add API Connection</DialogTitle>
            <DialogDescription>
              Create a new connection to an external service
            </DialogDescription>
          </DialogHeader>
          {renderConnectionForm()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!selectedConnectionId} 
        onOpenChange={(open) => !open && setSelectedConnectionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API connection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteConnection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApiConnectionsManager;
