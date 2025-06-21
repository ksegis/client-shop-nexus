import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Plus, Edit, History, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
  effective_end_date?: string;
  status: 'active' | 'draft' | 'pending_approval' | 'expired';
  created_by: string;
  created_at: string;
  notes?: string;
}

interface PricingFormData {
  keystone_vcpn: string;
  part_name: string;
  cost: number;
  list_price: number;
  markup_percentage: number;
  effective_start_date: Date;
  effective_end_date?: Date;
  notes: string;
}

const PricingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [showNewPricingDialog, setShowNewPricingDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVcpn, setSelectedVcpn] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [pricingRecords, setPricingRecords] = useState<PricingRecord[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricingRecord[]>([]);
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [selectedPart, setSelectedPart] = useState<InventoryItem | null>(null);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<PricingFormData>({
    keystone_vcpn: '',
    part_name: '',
    cost: 0,
    list_price: 0,
    markup_percentage: 0,
    effective_start_date: new Date(),
    notes: ''
  });

  const supabase = getSupabaseClient();

  // Add debug message
  const addDebugMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `[${timestamp}] ${message}`;
    console.log(debugMessage);
    setDebugInfo(prev => [...prev, debugMessage].slice(-20)); // Keep last 20 messages
  };

  // Test database connection and table structure
  const testDatabaseConnection = useCallback(async () => {
    addDebugMessage('🔍 Testing database connection...');
    
    try {
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from('inventory')
        .select('id')
        .limit(1);
      
      if (testError) {
        addDebugMessage(`❌ Database connection failed: ${testError.message}`);
        return false;
      }
      
      addDebugMessage('✅ Database connection successful');
      
      // Check if pricing_records table exists
      const { data: pricingTest, error: pricingError } = await supabase
        .from('pricing_records')
        .select('id')
        .limit(1);
      
      if (pricingError) {
        addDebugMessage(`❌ pricing_records table error: ${pricingError.message}`);
        addDebugMessage('💡 You may need to create the pricing_records table in Supabase');
        return false;
      }
      
      addDebugMessage('✅ pricing_records table exists and accessible');
      return true;
      
    } catch (error) {
      addDebugMessage(`❌ Database test failed: ${error}`);
      return false;
    }
  }, [supabase]);

  // Load pricing records with enhanced debugging
  const loadPricingRecords = useCallback(async () => {
    addDebugMessage('🔄 Loading pricing records...');
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('pricing_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        addDebugMessage(`❌ Error loading pricing records: ${error.message}`);
        addDebugMessage(`❌ Error details: ${JSON.stringify(error)}`);
        console.error('Error loading pricing records:', error);
      } else {
        addDebugMessage(`✅ Loaded pricing records: ${data?.length || 0} records`);
        addDebugMessage(`📊 Records data: ${JSON.stringify(data, null, 2)}`);
        setPricingRecords(data || []);
        
        if (data && data.length > 0) {
          addDebugMessage(`📋 First record: ${JSON.stringify(data[0])}`);
        } else {
          addDebugMessage('📋 No pricing records found in database');
        }
      }
    } catch (error) {
      addDebugMessage(`❌ Exception loading pricing records: ${error}`);
      console.error('Exception loading pricing records:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Load table structure
  const loadTableStructure = useCallback(async () => {
    addDebugMessage('🔍 Loading table structure...');
    
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .limit(1);

      if (error) {
        addDebugMessage(`❌ Error checking table structure: ${error.message}`);
        console.error('Error checking table structure:', error);
      } else if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        setTableColumns(columns);
        addDebugMessage(`✅ Available inventory columns: ${columns.join(', ')}`);
        console.log('Available inventory columns:', columns);
      }
    } catch (error) {
      addDebugMessage(`❌ Exception checking table structure: ${error}`);
      console.error('Error checking table structure:', error);
    }
  }, [supabase]);

  // Search inventory
  const searchInventory = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    addDebugMessage(`🔍 Searching inventory for: "${term}"`);

    try {
      const searchConditions = [];
      
      // Build search conditions based on available columns
      if (tableColumns.includes('part_name')) searchConditions.push(`part_name.ilike.%${term}%`);
      if (tableColumns.includes('name')) searchConditions.push(`name.ilike.%${term}%`);
      if (tableColumns.includes('part_number')) searchConditions.push(`part_number.ilike.%${term}%`);
      if (tableColumns.includes('sku')) searchConditions.push(`sku.ilike.%${term}%`);
      if (tableColumns.includes('keystone_vcpn')) searchConditions.push(`keystone_vcpn.ilike.%${term}%`);
      if (tableColumns.includes('brand')) searchConditions.push(`brand.ilike.%${term}%`);
      if (tableColumns.includes('description')) searchConditions.push(`description.ilike.%${term}%`);

      if (searchConditions.length === 0) {
        addDebugMessage('❌ No searchable columns found');
        console.warn('No searchable columns found');
        return;
      }

      addDebugMessage(`🔍 Search conditions: ${searchConditions.join(' OR ')}`);

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(searchConditions.join(','))
        .limit(20);

      if (error) {
        addDebugMessage(`❌ Search error: ${error.message}`);
        console.error('Search error:', error);
      } else {
        addDebugMessage(`✅ Search results: ${data?.length || 0} items found`);
        setSearchResults(data || []);
        console.log('Search results:', data);
      }
    } catch (error) {
      addDebugMessage(`❌ Search exception: ${error}`);
      console.error('Search error:', error);
    }
  }, [supabase, tableColumns]);

  // Handle part selection
  const handlePartSelect = (part: InventoryItem) => {
    addDebugMessage(`✅ Selected part: ${part.part_name || part.name} (${part.keystone_vcpn})`);
    
    setSelectedPart(part);
    setFormData(prev => ({
      ...prev,
      keystone_vcpn: part.keystone_vcpn,
      part_name: part.part_name || part.name || '',
      cost: part.cost || 0,
      list_price: part.list_price || part.price || 0,
      markup_percentage: part.cost && part.list_price ? 
        Math.round(((part.list_price - part.cost) / part.cost) * 100) : 0
    }));
    setSearchResults([]);
    setSearchTerm('');
  };

  // Calculate markup percentage
  const calculateMarkupPercentage = (cost: number, listPrice: number): number => {
    if (cost <= 0) return 0;
    return Math.round(((listPrice - cost) / cost) * 100);
  };

  // Calculate list price from markup
  const calculateListPrice = (cost: number, markupPercentage: number): number => {
    return Math.round((cost * (1 + markupPercentage / 100)) * 100) / 100;
  };

  // Handle form changes
  const handleFormChange = (field: keyof PricingFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate based on what changed
      if (field === 'cost' || field === 'list_price') {
        updated.markup_percentage = calculateMarkupPercentage(
          field === 'cost' ? value : updated.cost,
          field === 'list_price' ? value : updated.list_price
        );
      } else if (field === 'markup_percentage') {
        updated.list_price = calculateListPrice(updated.cost, value);
      }
      
      return updated;
    });
  };

  // Save pricing record with enhanced debugging
  const handleSavePricing = async () => {
    addDebugMessage('💾 Starting save process...');
    
    if (!formData.keystone_vcpn || !formData.part_name || formData.cost <= 0 || formData.list_price <= 0) {
      addDebugMessage('❌ Validation failed: Missing required fields');
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
        effective_start_date: formData.effective_start_date.toISOString().split('T')[0],
        effective_end_date: formData.effective_end_date ? 
          formData.effective_end_date.toISOString().split('T')[0] : null,
        status: 'active',
        created_by: 'admin',
        notes: formData.notes || null
      };

      addDebugMessage(`💾 Saving pricing data: ${JSON.stringify(pricingData)}`);

      const { data, error } = await supabase
        .from('pricing_records')
        .insert([pricingData])
        .select();

      if (error) {
        addDebugMessage(`❌ Error saving pricing record: ${error.message}`);
        addDebugMessage(`❌ Error details: ${JSON.stringify(error)}`);
        console.error('Error saving pricing record:', error);
        alert('Error saving pricing record: ' + error.message);
      } else {
        addDebugMessage(`✅ Pricing record saved successfully: ${JSON.stringify(data)}`);
        console.log('Pricing record saved successfully:', data);
        
        // Reset form
        setFormData({
          keystone_vcpn: '',
          part_name: '',
          cost: 0,
          list_price: 0,
          markup_percentage: 0,
          effective_start_date: new Date(),
          notes: ''
        });
        setSelectedPart(null);
        setShowNewPricingDialog(false);
        
        // Reload pricing records
        addDebugMessage('🔄 Reloading pricing records after save...');
        await loadPricingRecords();
        
        alert('Pricing record saved successfully!');
      }
    } catch (error) {
      addDebugMessage(`❌ Exception saving pricing record: ${error}`);
      console.error('Error saving pricing record:', error);
      alert('Error saving pricing record');
    } finally {
      setSaving(false);
    }
  };

  // Load price history
  const loadPriceHistory = async (vcpn: string) => {
    addDebugMessage(`🔍 Loading price history for: ${vcpn}`);
    
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('keystone_vcpn', vcpn)
        .order('effective_start_date', { ascending: false });

      if (error) {
        addDebugMessage(`❌ Error loading price history: ${error.message}`);
        console.error('Error loading price history:', error);
      } else {
        addDebugMessage(`✅ Loaded price history: ${data?.length || 0} records`);
        setPriceHistory(data || []);
      }
    } catch (error) {
      addDebugMessage(`❌ Exception loading price history: ${error}`);
      console.error('Error loading price history:', error);
    }
  };

  // Initialize component
  useEffect(() => {
    addDebugMessage('🚀 Initializing Pricing Management component...');
    testDatabaseConnection();
    loadTableStructure();
    loadPricingRecords();
  }, [testDatabaseConnection, loadTableStructure, loadPricingRecords]);

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

  // Filter pricing records
  const filteredRecords = pricingRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.keystone_vcpn.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  addDebugMessage(`📊 Filtered records: ${filteredRecords.length} of ${pricingRecords.length} total records`);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Debug Panel */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Debug Information</CardTitle>
          <CardDescription>Real-time debugging information</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            <div className="space-y-1">
              {debugInfo.map((message, index) => (
                <div key={index} className="text-xs font-mono">
                  {message}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-muted-foreground">
            Manage pricing, markups, and effective dates for your inventory
          </p>
          <p className="text-sm text-blue-600">
            Total Records: {pricingRecords.length} | Filtered: {filteredRecords.length} | Loading: {loading ? 'Yes' : 'No'}
          </p>
        </div>
        <Dialog open={showNewPricingDialog} onOpenChange={setShowNewPricingDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Pricing
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="max-w-none max-h-none"
            style={{
              width: '95vw',
              height: '95vh',
              maxWidth: '95vw',
              maxHeight: '95vh',
              margin: '2.5vh auto'
            }}
          >
            <DialogHeader>
              <DialogTitle>Create New Pricing</DialogTitle>
              <DialogDescription>
                Search for a part and set pricing with effective dates and markup calculations
              </DialogDescription>
            </DialogHeader>
            
            <div style={{ height: '80vh', overflow: 'auto', padding: '16px' }}>
              {/* Part Search */}
              <div className="space-y-4 mb-6">
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
                    <div 
                      className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1"
                      style={{ 
                        maxHeight: '400px',
                        minHeight: '200px',
                        width: '100%',
                        zIndex: 9999
                      }}
                    >
                      <ScrollArea className="max-h-96">
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
                                {item.description && (
                                  <div className="text-xs text-gray-400 mt-1 truncate">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                {item.cost && (
                                  <div className="text-sm">Cost: ${item.cost}</div>
                                )}
                                {(item.list_price || item.price) && (
                                  <div className="text-sm">Price: ${item.list_price || item.price}</div>
                                )}
                                {item.quantity && (
                                  <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
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
                <Card className="mb-6">
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
                {/* Basic Information */}
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
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      placeholder="Optional notes about this pricing"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Pricing Information */}
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

                  {/* Effective Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Effective Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.effective_start_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.effective_start_date ? (
                              format(formData.effective_start_date, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.effective_start_date}
                            onSelect={(date) => date && handleFormChange('effective_start_date', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>Effective End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.effective_end_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.effective_end_date ? (
                              format(formData.effective_end_date, "PPP")
                            ) : (
                              <span>No end date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.effective_end_date}
                            onSelect={(date) => handleFormChange('effective_end_date', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Current Pricing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="requests">Price Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by part name or VCPN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Records</CardTitle>
              <CardDescription>
                {loading ? 'Loading pricing records...' : 
                 filteredRecords.length === 0 ? 'No pricing records found. Create your first pricing record to get started.' :
                 `Showing ${filteredRecords.length} of ${pricingRecords.length} pricing records`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground">Loading pricing records...</div>
                </div>
              ) : filteredRecords.length === 0 ? (
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
                        <TableHead>Effective Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.part_name}</TableCell>
                          <TableCell>{record.keystone_vcpn}</TableCell>
                          <TableCell>${record.cost.toFixed(2)}</TableCell>
                          <TableCell>${record.list_price.toFixed(2)}</TableCell>
                          <TableCell>{record.markup_percentage}%</TableCell>
                          <TableCell>
                            {format(new Date(record.effective_start_date), "MMM dd, yyyy")}
                            {record.effective_end_date && (
                              <div className="text-xs text-muted-foreground">
                                to {format(new Date(record.effective_end_date), "MMM dd, yyyy")}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              record.status === 'active' ? 'default' :
                              record.status === 'draft' ? 'secondary' :
                              record.status === 'pending_approval' ? 'outline' : 'destructive'
                            }>
                              {record.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedVcpn(record.keystone_vcpn);
                                  loadPriceHistory(record.keystone_vcpn);
                                  setShowHistory(true);
                                }}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Analytics</CardTitle>
              <CardDescription>
                Analyze pricing trends and markup performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Price Change Requests</CardTitle>
              <CardDescription>
                Manage and approve pricing change requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Price request management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Price History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Price History</DialogTitle>
            <DialogDescription>
              View historical pricing changes and effective dates
            </DialogDescription>
          </DialogHeader>
          {selectedVcpn && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                VCPN: {selectedVcpn}
              </div>
              {priceHistory.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No price history found for this part
                </div>
              ) : (
                <div className="space-y-2">
                  {priceHistory.map((record, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">${record.list_price.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            Cost: ${record.cost.toFixed(2)} • Markup: {record.markup_percentage}%
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div>{format(new Date(record.effective_start_date), "MMM dd, yyyy")}</div>
                          <Badge variant="outline">{record.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManagement;

