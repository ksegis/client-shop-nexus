import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Upload, AlertTriangle, FileText, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InventoryFileUploadEnhanced } from './InventoryFileUploadEnhanced';

// Basic inventory item type
interface BasicInventoryItem {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  price: number;
  cost?: number;
  category?: string;
  supplier?: string;
  reorder_level?: number;
}

// Form data type
interface InventoryFormData {
  name: string;
  description: string;
  sku: string;
  quantity: string;
  price: string;
  cost: string;
  category: string;
  supplier: string;
  reorder_level: string;
}

// CSV Upload interfaces
interface CSVUploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
}

interface CSVRecord {
  [key: string]: string;
}

// Pagination interface
interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function Inventory() {
  const [items, setItems] = useState<BasicInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BasicInventoryItem | null>(null);
  const [rlsError, setRlsError] = useState<string | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    description: '',
    sku: '',
    quantity: '0',
    price: '0',
    cost: '0',
    category: '',
    supplier: '',
    reorder_level: '0'
  });

  // Pagination states
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Legacy CSV Upload states (keeping for backward compatibility)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<CSVUploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Fetch inventory with pagination
  const fetchInventory = async (page: number = pagination.currentPage, pageSize: number = pagination.pageSize, search: string = searchTerm) => {
    try {
      console.log(`🔍 Fetching inventory - Page: ${page}, Size: ${pageSize}, Search: "${search}"`);
      setIsLoading(true);
      setError(null);

      // Calculate offset
      const offset = (page - 1) * pageSize;

      // Build query
      let query = supabase
        .from('inventory')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      // Add search filter if provided
      if (search.trim()) {
        const searchFilter = search.trim();
        query = query.or(`name.ilike.%${searchFilter}%,description.ilike.%${searchFilter}%,sku.ilike.%${searchFilter}%,supplier.ilike.%${searchFilter}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Fetch error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      const safeData = data || [];
      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      console.log(`✅ Fetched ${safeData.length} items (${totalItems} total, ${totalPages} pages)`);
      
      setItems(safeData);
      setPagination({
        currentPage: page,
        pageSize,
        totalItems,
        totalPages
      });

    } catch (err) {
      console.error('💥 Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchInventory(newPage, pagination.pageSize, searchTerm);
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const pageSize = parseInt(newPageSize);
    fetchInventory(1, pageSize, searchTerm);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    fetchInventory(1, pagination.pageSize, search);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchInventory(1, pagination.pageSize, '');
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      quantity: '0',
      price: '0',
      cost: '0',
      category: '',
      supplier: '',
      reorder_level: '0'
    });
  };

  // Handle form input changes
  const handleInputChange = (field: keyof InventoryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add new item
  const handleAddItem = async () => {
    try {
      console.log('➕ Adding new item:', formData.name);

      if (!formData.name.trim()) {
        throw new Error('Item name is required');
      }

      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sku: formData.sku.trim() || null,
        quantity: parseInt(formData.quantity) || 0,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || null,
        category: formData.category.trim() || null,
        supplier: formData.supplier.trim() || null,
        reorder_level: parseInt(formData.reorder_level) || null,
      };

      const { data, error } = await supabase
        .from('inventory')
        .insert([itemData])
        .select()
        .single();

      if (error) {
        console.error('❌ Add error:', error);
        throw new Error(`Failed to add item: ${error.message}`);
      }

      console.log('✅ Item added:', data.id);
      resetForm();
      setIsAddDialogOpen(false);

      // Refresh current page
      await fetchInventory(pagination.currentPage, pagination.pageSize, searchTerm);

      toast({
        title: "Success",
        description: "Item added successfully",
      });
    } catch (err) {
      console.error('❌ Add item error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Edit item
  const handleEditItem = async () => {
    if (!editingItem) return;

    try {
      console.log('🔄 Updating item:', editingItem.id);

      if (!formData.name.trim()) {
        throw new Error('Item name is required');
      }

      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sku: formData.sku.trim() || null,
        quantity: parseInt(formData.quantity) || 0,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || null,
        category: formData.category.trim() || null,
        supplier: formData.supplier.trim() || null,
        reorder_level: parseInt(formData.reorder_level) || null,
      };

      const { data, error } = await supabase
        .from('inventory')
        .update(itemData)
        .eq('id', editingItem.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Update error:', error);
        throw new Error(`Failed to update item: ${error.message}`);
      }

      console.log('✅ Item updated:', data.id);

      resetForm();
      setIsEditDialogOpen(false);
      setEditingItem(null);

      // Refresh current page
      await fetchInventory(pagination.currentPage, pagination.pageSize, searchTerm);

      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (err) {
      console.error('❌ Update item error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Delete with RLS workaround
  const handleDelete = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Attempting to delete item:', id);
      
      // Method 1: Try standard delete
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Standard delete failed:', deleteError);
        
        // Check if it's an RLS error
        if (deleteError.message.includes('new_record') || deleteError.message.includes('RLS') || deleteError.message.includes('policy')) {
          setRlsError(`RLS Policy Error: ${deleteError.message}`);
          
          // Method 2: Try soft delete (update a deleted flag)
          console.log('🔄 Trying soft delete workaround...');
          const { error: softDeleteError } = await supabase
            .from('inventory')
            .update({ 
              name: `[DELETED] ${itemName}`,
              quantity: 0,
              description: 'This item has been marked for deletion due to RLS policy restrictions.'
            })
            .eq('id', id);

          if (softDeleteError) {
            throw new Error(`Both delete methods failed. RLS policies need to be fixed. Error: ${deleteError.message}`);
          }

          console.log('✅ Soft delete successful');
          toast({
            title: "Item Marked for Deletion",
            description: "Item has been marked as deleted due to database policy restrictions. Please contact your administrator to fix RLS policies.",
            variant: "destructive",
          });
        } else {
          throw deleteError;
        }
      } else {
        console.log('✅ Standard delete successful');
        toast({
          title: "Success",
          description: "Item deleted successfully",
        });
      }

      // Refresh current page
      await fetchInventory(pagination.currentPage, pagination.pageSize, searchTerm);

    } catch (err) {
      console.error('❌ Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (item: BasicInventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      sku: item.sku || '',
      quantity: item.quantity?.toString() || '0',
      price: item.price?.toString() || '0',
      cost: item.cost?.toString() || '0',
      category: item.category || '',
      supplier: item.supplier || '',
      reorder_level: item.reorder_level?.toString() || '0'
    });
    setIsEditDialogOpen(true);
  };

  // Legacy CSV Upload Functions (keeping for backward compatibility)
  const handleUploadClick = () => {
    console.log('📤 Upload CSV button clicked');
    setIsUploadDialogOpen(true);
    setUploadResult(null);
    setSelectedFile(null);
    setPreviewData([]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📁 File selected:', file.name, file.size);
      setSelectedFile(file);
      setUploadResult(null);
      previewCSVFile(file);
    }
  };

  const previewCSVFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
      
      const preview = lines.slice(1, 4).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: CSVRecord = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        return record;
      }).filter(record => Object.values(record).some(value => value.length > 0));

      setPreviewData(preview);
      console.log('👀 CSV Preview:', { headers, preview: preview.length });
    } catch (error) {
      console.error('❌ Preview error:', error);
      toast({
        title: "Preview Error",
        description: "Could not preview the CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (csvText: string): CSVRecord[] => {
    try {
      const lines = csvText.split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
      
      console.log('📋 CSV Headers found:', headers);
      
      const records: CSVRecord[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: CSVRecord = {};
        
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        
        if (record['LongDescription'] || record['PartNumber'] || record['Description']) {
          records.push(record);
        }
      }
      
      console.log('✅ Parsed CSV records:', records.length);
      return records;
    } catch (error) {
      console.error('❌ CSV parsing error:', error);
      throw new Error('Failed to parse CSV file');
    }
  };

  const mapCSVToInventoryItem = (record: CSVRecord) => {
    try {
      const item = {
        name: record['LongDescription'] || record['Description'] || record['PartNumber'] || 'Unknown Item',
        description: record['LongDescription'] || record['Description'] || null,
        sku: record['PartNumber'] || record['SKU'] || null,
        quantity: parseInt(record['QtyOnHand'] || record['Quantity'] || '0') || 0,
        price: parseFloat(record['Price'] || record['SellPrice'] || '0') || 0,
        cost: parseFloat(record['Cost'] || record['CostPrice'] || '0') || null,
        category: record['Category'] || record['ProductCategory'] || null,
        supplier: record['Supplier'] || record['Vendor'] || null,
        reorder_level: parseInt(record['ReorderLevel'] || record['MinQty'] || '0') || null,
      };

      return item;
    } catch (error) {
      console.error('❌ Mapping error for record:', record, error);
      throw new Error(`Failed to map CSV record: ${error}`);
    }
  };

  const processCSVFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Starting CSV upload process:', selectedFile.name);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    const result: CSVUploadResult = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      const csvText = await selectedFile.text();
      const records = parseCSV(csvText);
      result.total = records.length;

      console.log(`📊 Processing ${records.length} records`);

      const batchSize = 25; // Larger batch size for better performance
      const batches = [];
      for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
      }

      console.log(`🔄 Processing ${batches.length} batches`);

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length}`);

        for (const record of batch) {
          try {
            const inventoryItem = mapCSVToInventoryItem(record);
            
            const { error } = await supabase
              .from('inventory')
              .insert([inventoryItem]);

            if (error) {
              console.error('❌ Insert error:', error);
              result.failed++;
              result.errors.push(`${inventoryItem.name}: ${error.message}`);
            } else {
              result.successful++;
              console.log('✅ Item inserted:', inventoryItem.name);
            }
          } catch (error) {
            console.error('❌ Item processing error:', error);
            result.failed++;
            result.errors.push(`Row processing error: ${error}`);
          }
        }

        const progress = Math.round(((batchIndex + 1) / batches.length) * 100);
        setUploadProgress(progress);

        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Shorter delay for better performance
        }
      }

      console.log('✅ Upload completed:', result);
      setUploadResult(result);

      // Refresh inventory to show new items
      await fetchInventory(1, pagination.pageSize, searchTerm);

      toast({
        title: "Upload Complete",
        description: `Successfully processed ${result.successful} of ${result.total} items`,
      });

    } catch (error) {
      console.error('💥 Upload process error:', error);
      result.errors.push(`Upload failed: ${error}`);
      setUploadResult(result);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFilePicker = () => {
    console.log('📁 Opening file picker');
    fileInputRef.current?.click();
  };

  const getStockStatus = (quantity: number, reorderLevel?: number) => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (reorderLevel && quantity <= reorderLevel) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Pagination component
  const PaginationControls = () => {
    const startItem = (pagination.currentPage - 1) * pagination.pageSize + 1;
    const endItem = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);

    return (
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700">
            Showing {startItem} to {endItem} of {pagination.totalItems} items
            {searchTerm && (
              <span className="text-blue-600"> (filtered by "{searchTerm}")</span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="pageSize" className="text-sm">Items per page:</Label>
            <Select value={pagination.pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm px-3">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading inventory...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <h2 className="text-lg font-semibold mb-2">Error Loading Inventory</h2>
              <p>{error}</p>
              <Button onClick={() => fetchInventory()} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">
            {pagination.totalItems} total items • Page {pagination.currentPage} of {pagination.totalPages}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => fetchInventory(pagination.currentPage, pagination.pageSize, searchTerm)} variant="outline">
            Refresh
          </Button>
          <InventoryFileUploadEnhanced />
          <Button variant="outline" onClick={handleUploadClick}>
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV (Legacy)
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Item name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="SKU"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      placeholder="Category"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => handleInputChange('supplier', e.target.value)}
                      placeholder="Supplier"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleAddItem} className="flex-1">
                    Add Item
                  </Button>
                  <Button onClick={() => setIsAddDialogOpen(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search inventory by name, description, SKU, or supplier..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1"
            />
            {searchTerm && (
              <Button variant="outline" size="sm" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legacy CSV Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Inventory CSV (Legacy)</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* File Selection */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              
              <div className="space-y-2">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium">
                    {selectedFile ? selectedFile.name : 'Select CSV File'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Click below to select your CSV file
                  </p>
                  {selectedFile && (
                    <p className="text-xs text-gray-400 mt-1">
                      Size: {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                <Button onClick={openFilePicker} disabled={isUploading}>
                  Select File
                </Button>
              </div>
            </div>

            {/* CSV Preview */}
            {previewData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">CSV Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs space-y-2">
                    <p><strong>Detected Fields:</strong> {Object.keys(previewData[0] || {}).join(', ')}</p>
                    <p><strong>Sample Records:</strong> {previewData.length} shown</p>
                    <div className="bg-gray-50 p-2 rounded text-xs max-h-32 overflow-y-auto">
                      {previewData.map((record, index) => (
                        <div key={index} className="mb-1">
                          <strong>Row {index + 1}:</strong> {record['LongDescription'] || record['PartNumber'] || 'Unknown'}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Upload Results */}
            {uploadResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    {uploadResult.successful === uploadResult.total ? (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    ) : uploadResult.failed > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 mr-2" />
                    )}
                    Upload Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Badge variant="outline" className="mr-2">Total</Badge>
                        {uploadResult.total}
                      </div>
                      <div>
                        <Badge variant="default" className="mr-2">Success</Badge>
                        {uploadResult.successful}
                      </div>
                      <div>
                        <Badge variant="destructive" className="mr-2">Failed</Badge>
                        {uploadResult.failed}
                      </div>
                    </div>

                    {uploadResult.errors.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <details className="text-xs">
                            <summary className="cursor-pointer font-medium">
                              {uploadResult.errors.length} errors occurred
                            </summary>
                            <div className="mt-2 max-h-32 overflow-y-auto">
                              {uploadResult.errors.slice(0, 5).map((error, index) => (
                                <div key={index} className="text-xs text-red-600">
                                  {error}
                                </div>
                              ))}
                              {uploadResult.errors.length > 5 && (
                                <div className="text-xs text-gray-500">
                                  ... and {uploadResult.errors.length - 5} more errors
                                </div>
                              )}
                            </div>
                          </details>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={resetUpload}
                disabled={isUploading}
              >
                Reset
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  Close
                </Button>
                <Button
                  onClick={processCSVFile}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload CSV'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RLS Error Warning */}
      {rlsError && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-red-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              RLS Policy Issue Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-red-600 space-y-2">
              <p><strong>Error:</strong> {rlsError}</p>
              <p><strong>Solution:</strong> Run the RLS fix SQL commands in your Supabase dashboard.</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setRlsError(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls - Top */}
      <Card>
        <CardContent className="p-4">
          <PaginationControls />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Item name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Item description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="SKU"
                />
              </div>
              <div>
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-cost">Cost</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Category"
                />
              </div>
              <div>
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Input
                  id="edit-supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Supplier"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleEditItem} className="flex-1">
                Update Item
              </Button>
              <Button onClick={() => setIsEditDialogOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory Items */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              {searchTerm ? (
                <>
                  <p>No items found matching "{searchTerm}".</p>
                  <p className="text-sm mt-1">Try a different search term or clear the search.</p>
                </>
              ) : (
                <>
                  <p>No inventory items found.</p>
                  <p className="text-sm mt-1">Add some items to get started.</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const stockStatus = getStockStatus(item.quantity, item.reorder_level);
            
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {item.name || 'Unknown Item'}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            {item.category && <span>{item.category}</span>}
                            {item.supplier && <span>Supplier: {item.supplier}</span>}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 ml-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              Qty: {item.quantity || 0}
                            </div>
                            <Badge variant={stockStatus.variant} className="mt-1">
                              {stockStatus.label}
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatCurrency(item.price || 0)}
                            </div>
                            {item.cost && (
                              <div className="text-sm text-gray-500">
                                Cost: {formatCurrency(item.cost)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls - Bottom */}
      <Card>
        <CardContent className="p-4">
          <PaginationControls />
        </CardContent>
      </Card>

      {/* Footer Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-blue-600">{pagination.totalItems}</div>
                <div className="text-xs">Total Items</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">{pagination.totalPages}</div>
                <div className="text-xs">Total Pages</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-purple-600">{pagination.pageSize}</div>
                <div className="text-xs">Items per Page</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              ✅ Enhanced CSV Upload • ✅ Background Processing • ✅ Validation & Reconciliation • ✅ Legacy Support
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

