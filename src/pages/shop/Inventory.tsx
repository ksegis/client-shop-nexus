import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, AlertCircle, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  cost: number | null;
  category: string | null;
  supplier: string | null;
  reorder_level: number | null;
  created_at: string;
  updated_at: string;
}

const inventoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  price: z.number().min(0, 'Price cannot be negative'),
  cost: z.number().min(0, 'Cost cannot be negative').optional().nullable(),
  category: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  reorder_level: z.number().min(0, 'Reorder level cannot be negative').optional().nullable(),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

const Inventory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [sortField, setSortField] = useState<keyof InventoryItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      quantity: 0,
      price: 0,
      cost: 0,
      category: '',
      supplier: '',
      reorder_level: 10,
    },
  });

  // Fetch inventory items
  const { data: inventoryItems, isLoading, error } = useQuery({
    queryKey: ['inventory', sortField, sortDirection],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  // Add inventory item mutation
  const addItemMutation = useMutation({
    mutationFn: async (values: InventoryFormValues) => {
      // Fix: Ensure the values object has all required fields including name
      if (!values.name) {
        throw new Error("Name is required");
      }
      
      const { error } = await supabase.from('inventory').insert({
        name: values.name,
        description: values.description,
        sku: values.sku,
        quantity: values.quantity,
        price: values.price,
        cost: values.cost,
        category: values.category,
        supplier: values.supplier,
        reorder_level: values.reorder_level
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Item added",
        description: "Inventory item has been added successfully",
      });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error adding item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (values: InventoryFormValues & { id: string }) => {
      const { id, ...itemData } = values;
      
      // Fix: Ensure name is included and not undefined
      if (!itemData.name) {
        throw new Error("Name is required");
      }
      
      const { error } = await supabase
        .from('inventory')
        .update(itemData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully",
      });
      setEditingItem(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete inventory item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Item deleted",
        description: "Inventory item has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: InventoryFormValues) => {
    if (editingItem) {
      updateItemMutation.mutate({ ...values, id: editingItem.id });
    } else {
      addItemMutation.mutate(values);
    }
  };

  // Open edit dialog
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      description: item.description || '',
      sku: item.sku || '',
      quantity: item.quantity,
      price: item.price,
      cost: item.cost || 0,
      category: item.category || '',
      supplier: item.supplier || '',
      reorder_level: item.reorder_level || 10,
    });
  };

  // Handle sort
  const handleSort = (field: keyof InventoryItem) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter items by search term
  const filteredItems = inventoryItems?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <Layout portalType="shop">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">
              Track and manage your shop's inventory items.
            </p>
          </div>
          <Button onClick={() => {
            form.reset();
            setEditingItem(null);
            setShowAddDialog(true);
          }}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              View and manage all items in your inventory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory items..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-4">Loading inventory data...</div>
            ) : error ? (
              <div className="flex items-center justify-center py-4 text-red-500">
                <AlertCircle className="mr-2 h-4 w-4" />
                Error loading inventory data
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] cursor-pointer" onClick={() => handleSort('name')}>
                        <div className="flex items-center">
                          Name
                          {sortField === 'name' && (
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('quantity')}>
                        <div className="flex items-center">
                          Quantity
                          {sortField === 'quantity' && (
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                        <div className="flex items-center">
                          Price
                          {sortField === 'price' && (
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Stock Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          No inventory items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => {
                        // Calculate stock status
                        const reorderLevel = item.reorder_level || 10;
                        const stockStatus = 
                          item.quantity === 0 ? 'out-of-stock' :
                          item.quantity <= reorderLevel ? 'low-stock' : 'in-stock';

                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">{item.name}</div>
                              {item.sku && (
                                <div className="text-xs text-muted-foreground">
                                  SKU: {item.sku}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.category ? (
                                <Badge variant="outline">{item.category}</Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-24">
                                  <Progress
                                    value={Math.min((item.quantity / (reorderLevel * 2)) * 100, 100)}
                                    className={
                                      stockStatus === 'out-of-stock' ? 'bg-red-200' :
                                      stockStatus === 'low-stock' ? 'bg-amber-200' : ''
                                    }
                                  />
                                </div>
                                <Badge
                                  variant={
                                    stockStatus === 'out-of-stock' ? 'destructive' :
                                    stockStatus === 'low-stock' ? 'outline' : 'default'
                                  }
                                >
                                  {stockStatus === 'out-of-stock' ? 'Out of Stock' :
                                   stockStatus === 'low-stock' ? 'Low Stock' : 'In Stock'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-60">
                                    <div className="space-y-4">
                                      <div className="font-medium">Delete Item</div>
                                      <div className="text-sm text-muted-foreground">
                                        Are you sure you want to delete this item? This action cannot be undone.
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm">Cancel</Button>
                                        <Button 
                                          variant="destructive" 
                                          size="sm"
                                          onClick={() => deleteItemMutation.mutate(item.id)}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showAddDialog || editingItem !== null} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingItem(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details of your inventory item below.' : 'Enter the details of the new inventory item below.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Item description" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Stock keeping unit" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Category" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <FormControl>
                        <Input placeholder="Supplier name" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reorder_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Level</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </DialogFooter>
            </form>
          </Form>

        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Inventory;
