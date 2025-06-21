import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Edit, Trash2, Plus, X } from 'lucide-react';
import { getSupabaseClient } from "@/lib/supabase";

interface InventoryItem {
  id: string;
  keystone_vcpn?: string;
  [key: string]: any;
}

interface PricingRecord {
  id: string;
  keystone_vcpn: string;
  part_name: string;
  cost: number;
  list_price: number;
  markup_percentage: number;
  effective_start_date: string;
  status: string;
  created_at: string;
  notes?: string;
}

const PricingManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [pricingSearchTerm, setPricingSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PricingRecord | null>(null);
  
  // Data states
  const [pricingRecords, setPricingRecords] = useState<PricingRecord[]>([]);
  const [filteredPricingRecords, setFilteredPricingRecords] = useState<PricingRecord[]>([]);
  const [inventorySearchResults, setInventorySearchResults] = useState<InventoryItem[]>([]);
  const [selectedPart, setSelectedPart] = useState<InventoryItem | null>(null);
  const [inventoryColumns, setInventoryColumns] = useState<string[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  
  // Form state
  const [formData, setFormData] = useState({
    keystone_vcpn: '',
    part_name: '',
    cost: 0,
    list_price: 0,
    markup_percentage: 0,
    notes: ''
  });

  const supabase = getSupabaseClient();

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      keystone_vcpn: '',
      part_name: '',
      cost: 0,
      list_price: 0,
      markup_percentage: 0,
      notes: ''
    });
    setSelectedPart(null);
    setInventorySearchTerm('');
    setInventorySearchResults([]);
    setEditingRecord(null);
  };

  // Detect inventory table columns
  const detectInventoryColumns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Error detecting columns:', error);
        return [];
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        setInventoryColumns(columns);
        return columns;
      }

      return [];
    } catch (error) {
      console.error('❌ Exception detecting columns:', error);
      return [];
    }
  }, [supabase]);

  // Load pricing records (only when searched)
  const loadPricingRecords = useCallback(async (searchTerm: string = '') => {
    if (!searchTerm.trim()) {
      setPricingRecords([]);
      setFilteredPricingRecords([]);
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('pricing_records')
        .select('*')
        .or(`part_name.ilike.%${searchTerm}%,keystone_vcpn.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Error loading pricing records:', error);
      } else {
        setPricingRecords(data || []);
        setFilteredPricingRecords(data || []);
      }
    } catch (error) {
      console.error('❌ Exception loading pricing records:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Search inventory with dynamic column detection
  const searchInventory = useCallback(async (term: string) => {
    if (term.length < 2) {
      setInventorySearchResults([]);
      return;
    }

    try {
      const searchConditions = [];
      
      const columnVariations = [
        'name', 'part_name', 'product_name', 'title',
        'part_number', 'sku', 'product_number', 'item_number',
        'keystone_vcpn', 'vcpn',
        'brand', 'manufacturer',
        'description', 'desc', 'product_description'
      ];

      columnVariations.forEach(col => {
        if (inventoryColumns.includes(col)) {
          searchConditions.push(`${col}.ilike.%${term}%`);
        }
      });

      if (searchConditions.length === 0) {
        return;
      }

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(searchConditions.join(','))
        .limit(20);

      if (error) {
        console.error('❌ Search error:', error);
      } else {
        setInventorySearchResults(data || []);
      }
    } catch (error) {
      console.error('❌ Search exception:', error);
    }
  }, [supabase, inventoryColumns]);

  // Get display name for a part
  const getPartDisplayName = (part: InventoryItem): string => {
    return part.name || part.part_name || part.product_name || part.title || 'Unnamed Part';
  };

  // Get part number for a part
  const getPartNumber = (part: InventoryItem): string => {
    return part.part_number || part.sku || part.product_number || part.item_number || 'N/A';
  };

  // Generate a unique identifier for parts without VCPN
  const generatePartId = (part: InventoryItem): string => {
    if (part.keystone_vcpn) return part.keystone_vcpn;
    
    const partNum = getPartNumber(part);
    if (partNum !== 'N/A') return partNum;
    
    return `ID-${part.id}`;
  };

  // Handle part selection
  const handlePartSelect = (part: InventoryItem) => {
    const partName = getPartDisplayName(part);
    const partId = generatePartId(part);
    
    setSelectedPart(part);
    setFormData({
      keystone_vcpn: partId,
      part_name: partName,
      cost: part.cost || 0,
      list_price: part.list_price || part.price || 0,
      markup_percentage: part.cost && (part.list_price || part.price) ? 
        Math.round(((part.list_price || part.price) - part.cost) / part.cost * 100) : 0,
      notes: ''
    });
    setInventorySearchResults([]);
    setInventorySearchTerm('');
  };

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'cost' || field === 'list_price') {
        const cost = field === 'cost' ? value : updated.cost;
        const listPrice = field === 'list_price' ? value : updated.list_price;
        if (cost > 0) {
          updated.markup_percentage = Math.round(((listPrice - cost) / cost) * 100);
        }
      } else if (field === 'markup_percentage') {
        updated.list_price = Math.round((updated.cost * (1 + value / 100)) * 100) / 100;
      }
      
      return updated;
    });
  };

  // Save pricing record
  const handleSavePricing = async () => {
    if (!formData.keystone_vcpn || !formData.part_name || formData.cost <= 0 || formData.list_price <= 0) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    setSaving(true);
    
    try {
      const pricingData = {
        keystone_vcpn: formData.keystone_vcpn,
        part_name: formData.part_name,
        cost: formData.cost,
        list_price: formData.list_price,
        markup_percentage: formData.markup_percentage,
        effective_start_date: new Date().toISOString().split('T')[0],
        status: 'active',
        created_by: 'admin',
        notes: formData.notes || null
      };

      let result;
      if (editingRecord) {
        result = await supabase
          .from('pricing_records')
          .update(pricingData)
          .eq('id', editingRecord.id)
          .select();
      } else {
        result = await supabase
          .from('pricing_records')
          .insert([pricingData])
          .select();
      }

      const { data, error } = result;

      if (error) {
        console.error('❌ Error saving pricing record:', error);
        alert('Error saving pricing record: ' + error.message);
      } else {
        resetForm();
        setShowCreateForm(false);
        setShowEditDialog(false);
        
        if (pricingSearchTerm) {
          await loadPricingRecords(pricingSearchTerm);
        }
        
        alert(`Pricing record ${editingRecord ? 'updated' : 'created'} successfully!`);
      }
    } catch (error) {
      console.error('❌ Exception saving pricing record:', error);
      alert('Error saving pricing record');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit record
  const handleEditRecord = (record: PricingRecord) => {
    setEditingRecord(record);
    setFormData({
      keystone_vcpn: record.keystone_vcpn,
      part_name: record.part_name,
      cost: record.cost,
      list_price: record.list_price,
      markup_percentage: record.markup_percentage,
      notes: record.notes || ''
    });
    setShowEditDialog(true);
  };

  // Handle record selection
  const handleRecordSelection = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedRecords(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(new Set(filteredPricingRecords.map(r => r.id)));
    } else {
      setSelectedRecords(new Set());
    }
  };

  // Delete selected records
  const handleDeleteSelected = async () => {
    if (selectedRecords.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedRecords.size} selected records?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pricing_records')
        .delete()
        .in('id', Array.from(selectedRecords));

      if (error) {
        console.error('❌ Error deleting records:', error);
        alert('Error deleting records: ' + error.message);
      } else {
        setSelectedRecords(new Set());
        
        if (pricingSearchTerm) {
          await loadPricingRecords(pricingSearchTerm);
        }
        
        alert('Records deleted successfully!');
      }
    } catch (error) {
      console.error('❌ Exception deleting records:', error);
      alert('Error deleting records');
    }
  };

  // Initialize component
  useEffect(() => {
    detectInventoryColumns();
  }, [detectInventoryColumns]);

  // Debounced inventory search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inventorySearchTerm && inventoryColumns.length > 0) {
        searchInventory(inventorySearchTerm);
      } else {
        setInventorySearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inventorySearchTerm, searchInventory, inventoryColumns]);

  // Debounced pricing search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPricingRecords(pricingSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [pricingSearchTerm, loadPricingRecords]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground">
            Create new pricing records and manage existing ones
          </p>
        </div>
        
        <div className="flex space-x-2">
          {selectedRecords.size > 0 && (
            <Button variant="destructive" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedRecords.size})
            </Button>
          )}
        </div>
      </div>

      {/* Create New Pricing Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Create New Pricing Record</CardTitle>
              <CardDescription>
                Search for a part from inventory and set pricing information
              </CardDescription>
            </div>
            {!showCreateForm ? (
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Pricing
              </Button>
            ) : (
              <Button 
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        
        {showCreateForm && (
          <CardContent className="space-y-6">
            {/* Part Search */}
            <div className="space-y-4">
              <Label htmlFor="search">Search Parts *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by part name, number, VCPN, or brand..."
                  value={inventorySearchTerm}
                  onChange={(e) => setInventorySearchTerm(e.target.value)}
                  className="pl-10"
                />
                
                {/* Search Results Dropdown */}
                {inventorySearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                    <ScrollArea className="max-h-60">
                      {inventorySearchResults.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          onClick={() => handlePartSelect(item)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">
                                {getPartDisplayName(item)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {getPartNumber(item)} • {item.keystone_vcpn || 'No VCPN'}
                              </div>
                              {item.brand && (
                                <div className="text-sm text-gray-500">{item.brand}</div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              {item.cost && (
                                <div className="text-sm">Cost: ${item.cost}</div>
                              )}
                              {(item.list_price || item.price) && (
                                <div className="text-sm">Price: ${item.list_price || item.price}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Part Display */}
            {selectedPart && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800">Selected Part</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Part Name</Label>
                      <p className="text-sm">{getPartDisplayName(selectedPart)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Part Number</Label>
                      <p className="text-sm">{getPartNumber(selectedPart)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Identifier</Label>
                      <p className="text-sm">{generatePartId(selectedPart)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Brand</Label>
                      <p className="text-sm">{selectedPart.brand || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div>
                  <Label htmlFor="vcpn">Part Identifier *</Label>
                  <Input
                    id="vcpn"
                    value={formData.keystone_vcpn}
                    onChange={(e) => handleFormChange('keystone_vcpn', e.target.value)}
                    placeholder="Enter part identifier"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    VCPN, Part Number, or unique identifier
                  </p>
                </div>

                <div>
                  <Label htmlFor="partName">Part Name *</Label>
                  <Input
                    id="partName"
                    value={formData.part_name}
                    onChange={(e) => handleFormChange('part_name', e.target.value)}
                    placeholder="Enter part name"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing Information</h3>
                
                <div>
                  <Label htmlFor="cost">Cost Price *</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => handleFormChange('cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="listPrice">List Price *</Label>
                  <Input
                    id="listPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.list_price}
                    onChange={(e) => handleFormChange('list_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="markup">Markup Percentage</Label>
                  <Input
                    id="markup"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.markup_percentage}
                    onChange={(e) => handleFormChange('markup_percentage', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated automatically when cost/price changes
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePricing}
                disabled={saving || !formData.keystone_vcpn || !formData.part_name}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Saving...' : 'Save Pricing Record'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Search Existing Pricing Records */}
      <Card>
        <CardHeader>
          <CardTitle>Search Existing Pricing Records</CardTitle>
          <CardDescription>
            Search for existing pricing records to view, edit, or manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pricing records by part name or identifier..."
              value={pricingSearchTerm}
              onChange={(e) => setPricingSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Records Table */}
      {pricingSearchTerm && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Records</CardTitle>
            <CardDescription>
              {loading ? 'Searching pricing records...' : 
               filteredPricingRecords.length === 0 ? 'No pricing records found for your search.' :
               `Found ${filteredPricingRecords.length} pricing records`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Searching pricing records...</div>
              </div>
            ) : filteredPricingRecords.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  No pricing records found for "{pricingSearchTerm}"
                </div>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Pricing Record
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRecords.size === filteredPricingRecords.length && filteredPricingRecords.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>List Price</TableHead>
                      <TableHead>Markup %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPricingRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRecords.has(record.id)}
                            onCheckedChange={(checked) => handleRecordSelection(record.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{record.part_name}</TableCell>
                        <TableCell>{record.keystone_vcpn}</TableCell>
                        <TableCell>${record.cost.toFixed(2)}</TableCell>
                        <TableCell>${record.list_price.toFixed(2)}</TableCell>
                        <TableCell>{record.markup_percentage}%</TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(record.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRecord(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Pricing Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pricing Record</DialogTitle>
            <DialogDescription>
              Update pricing information and markup calculations
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div>
                  <Label htmlFor="edit-vcpn">Part Identifier *</Label>
                  <Input
                    id="edit-vcpn"
                    value={formData.keystone_vcpn}
                    onChange={(e) => handleFormChange('keystone_vcpn', e.target.value)}
                    placeholder="Enter part identifier"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-partName">Part Name *</Label>
                  <Input
                    id="edit-partName"
                    value={formData.part_name}
                    onChange={(e) => handleFormChange('part_name', e.target.value)}
                    placeholder="Enter part name"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Input
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing Information</h3>
                
                <div>
                  <Label htmlFor="edit-cost">Cost Price *</Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => handleFormChange('cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-listPrice">List Price *</Label>
                  <Input
                    id="edit-listPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.list_price}
                    onChange={(e) => handleFormChange('list_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-markup">Markup Percentage</Label>
                  <Input
                    id="edit-markup"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.markup_percentage}
                    onChange={(e) => handleFormChange('markup_percentage', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculated automatically when cost/price changes
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePricing}
                disabled={saving || !formData.keystone_vcpn || !formData.part_name}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Updating...' : 'Update Pricing'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManagement;

