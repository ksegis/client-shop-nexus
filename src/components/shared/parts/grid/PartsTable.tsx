
import { useState } from 'react';
import { Part } from '@/types/parts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, ShoppingCart, FileText, ArrowLeftRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface PartsTableProps {
  parts: Part[];
  onAddToCart?: (part: Part) => void;
  onAddToQuotation?: (part: Part) => void;
  onViewDetails: (partId: string) => void;
  onOpenCoreReturn?: (part: Part) => void;
  showInventory?: boolean;
}

export const PartsTable = ({
  parts,
  onAddToCart,
  onAddToQuotation,
  onViewDetails,
  onOpenCoreReturn,
  showInventory
}: PartsTableProps) => {
  const [selectedParts, setSelectedParts] = useState<string[]>([]);

  const toggleSelectPart = (partId: string) => {
    setSelectedParts(prev => 
      prev.includes(partId) 
        ? prev.filter(id => id !== partId) 
        : [...prev, partId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedParts.length === parts.length) {
      setSelectedParts([]);
    } else {
      setSelectedParts(parts.map(part => part.id));
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox 
                checked={selectedParts.length === parts.length && parts.length > 0} 
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Part</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Supplier</TableHead>
            {showInventory && <TableHead>Inventory</TableHead>}
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.id}>
              <TableCell>
                <Checkbox 
                  checked={selectedParts.includes(part.id)} 
                  onCheckedChange={() => toggleSelectPart(part.id)} 
                />
              </TableCell>
              <TableCell>
                <div className="font-medium">{part.name}</div>
                <div className="text-sm text-muted-foreground line-clamp-1">{part.description}</div>
              </TableCell>
              <TableCell>{part.sku}</TableCell>
              <TableCell>
                <Badge variant="outline">{part.category}</Badge>
              </TableCell>
              <TableCell>{part.supplier}</TableCell>
              {showInventory && (
                <TableCell>
                  <div className="flex items-center">
                    <Badge variant={part.quantity > part.reorder_level ? "secondary" : "destructive"}>
                      {part.quantity} in stock
                    </Badge>
                  </div>
                </TableCell>
              )}
              <TableCell className="text-right font-medium">
                ${part.price.toFixed(2)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onViewDetails(part.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {onAddToCart && (
                    <Button variant="ghost" size="icon" onClick={() => onAddToCart(part)}>
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  )}
                  {onAddToQuotation && (
                    <Button variant="ghost" size="icon" onClick={() => onAddToQuotation(part)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                  {onOpenCoreReturn && (
                    <Button variant="ghost" size="icon" onClick={() => onOpenCoreReturn(part)}>
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
