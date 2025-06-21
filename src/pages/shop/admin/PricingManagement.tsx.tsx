import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus } from 'lucide-react';
import { getSupabaseClient } from "@/lib/supabase";

interface InventoryItem {
  id: string;
  keystone_vcpn: string;
  name?: string;
  part_name?: string;
  part_number?: string;
  sku?: string;
  brand?: string;
  description?: string;
  cost?: number;
  price?: number;
  list_price?: number;
  quantity?: number;
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
  const [showNewPricingDialog, setShowNewPricingDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [pricingRecords, setPricingRecords] = useState<PricingRecord[]>([]);
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [selectedPart, setSelectedPart] = useState<InventoryItem | null>(null);
  
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

  // Load pricing records
  const loadPricingRecords = useCallback(async () => {
    console.log('🔄 Loading pricing records...');
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('pricing_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading pricing records:', error);
      } else {
        console.log('✅ Loaded pricing records:', data?.length || 0, 'records');
        setPricingRecords(data || []);
      }
    } catch (error) {
      console.error('❌ Exception loading pricing records:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Search inventory
  const searchInventory = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    console.log('🔍 Searching inventory for:', term);

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(`part_name.ilike.%${term}%,name.ilike.%${term}%,part_number.ilike.%${term}%,keystone_vcpn.ilike.%${term}%,brand.ilike.%${term}%`)
        .limit(20);

      if (error) {
        console.error('❌ Search error:', error);
      } else {
        console.log('✅ Search results:', data?.length || 0, 'items found');
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('❌ Search exception:', error);
    }
  }, [supabase]);

  // Handle part selection
  const handlePartSelect = (part: InventoryItem) => {
    console.log('✅ Selected part:', part.part_name || part.name);
    
    setSelectedPart(part);
    setFormData({
      keystone_vcpn: part.keystone_vcpn,
      part_name: part.part_name || part.name || '',
      cost: part.cost || 0,
      list_price: part.list_price || part.price || 0,
      markup_percentage: part.cost && part.list_price ? 
        Math.round(((part.list_price - part.cost) / part.cost) * 100) : 0,
      notes: ''
    });
    setSearchResults([]);
    setSearchTerm('');
  };

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate markup percentage
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
    console.log('💾 Starting save process...');
    
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

      console.log('💾 Saving pricing data:', pricingData);

      const { data, error } = await supabase
        .from('pricing_records')
        .insert([pricingData])
        .select();

      if (error) {
        console.error('❌ Error saving pricing record:', error);
        alert('Error saving pricing record: ' + error.message);
      } else {
        console.log('✅ Pricing record saved successfully:', data);
        
        // Reset form
        setFormData({
          keystone_vcpn: '',
          part_name: '',
          cost: 0,
          list_price: 0,
          markup_percentage: 0,
          notes: ''
        });
        setSelectedPart(null);
        setShowNewPricingDialog(false);
        
        // Reload pricing records
        console.log('🔄 Reloading pricing records after save...');
        await loadPricingRecords();
        
        alert('Pricing record saved successfully!');
      }
    } catch (error) {
      console.error('❌ Exception saving pricing record:', error);
      alert('Error saving pricing record');
    } finally {
      setSaving(false);
    }
  };

  // Initialize component
  useEffect(() => {
    console.log('🚀 Initializing Pricing Management component...');
    loadPricingRecords();
  }, [loadPricingRecords]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchInventory(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchInventory]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground">
            Manage pricing, markups, and effective dates for your inventory
          </p>
          <p className="text-sm text-blue-600">
            Total Records: {pricingRecords.length} | Loading: {loading ? 'Yes' : 'No'}
          </p>
        </div>
        
        <Dialog open={showNewPricingDialog} onOpenChange={setShowNewPricingDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Pricing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Pricing</DialogTitle>
              <DialogDescription>
                Search for a part and set pricing with markup calculations
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Part Search */}
              <div className="space-y-4">
                <Label htmlFor="search">Search Parts *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by part name, number, VCPN, or brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  
                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                      <ScrollArea className="max-h-60">
                        {searchResults.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                            onClick={() => handlePartSelect(item)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {item.part_name || item.name || 'Unnamed Part'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {item.part_number || item.sku} • {item.keystone_vcpn}
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Selected Part</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Part Name</Label>
                        <p className="text-sm">{selectedPart.part_name || selectedPart.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Part Number</Label>
                        <p className="text-sm">{selectedPart.part_number || selectedPart.sku}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">VCPN</Label>
                        <p className="text-sm">{selectedPart.keystone_vcpn}</p>
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
                    <Label htmlFor="vcpn">Keystone VCPN *</Label>
                    <Input
                      id="vcpn"
                      value={formData.keystone_vcpn}
                      onChange={(e) => handleFormChange('keystone_vcpn', e.target.value)}
                      placeholder="Enter VCPN"
                      disabled={!!selectedPart}
                    />
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
                  onClick={() => setShowNewPricingDialog(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePricing}
                  disabled={saving || !formData.keystone_vcpn || !formData.part_name}
                >
                  {saving ? 'Saving...' : 'Save Pricing'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pricing Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Records</CardTitle>
          <CardDescription>
            {loading ? 'Loading pricing records...' : 
             pricingRecords.length === 0 ? 'No pricing records found. Create your first pricing record to get started.' :
             `Showing ${pricingRecords.length} pricing records`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading pricing records...</div>
            </div>
          ) : pricingRecords.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                No pricing records found
              </div>
              <Button onClick={() => setShowNewPricingDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Pricing Record
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Name</TableHead>
                    <TableHead>VCPN</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>List Price</TableHead>
                    <TableHead>Markup %</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingRecords.map((record) => (
                    <TableRow key={record.id}>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingManagement;

