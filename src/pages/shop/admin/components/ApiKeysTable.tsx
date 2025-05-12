
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Trash } from 'lucide-react';
import { ApiKey } from '@/hooks/useApiKeys';

interface ApiKeysTableProps {
  apiKeys: ApiKey[];
  onDeleteKey: (id: string) => Promise<void>;
  onCopyKey: (text: string) => void;
  formatDate: (dateString: string) => string;
}

const ApiKeysTable: React.FC<ApiKeysTableProps> = ({ apiKeys, onDeleteKey, onCopyKey, formatDate }) => {
  return (
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
                  onClick={() => onCopyKey(apiKey.key)}
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
                onClick={() => onDeleteKey(apiKey.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ApiKeysTable;
