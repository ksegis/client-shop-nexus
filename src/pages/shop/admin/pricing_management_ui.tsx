import React, { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, DollarSign, Calendar, History, Edit, Save, X, Plus, Search, Filter, Download, Upload, Eye, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, Percent, Calculator } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
const supabase = createClient(supabaseUrl, supabaseKey);

// Interfaces for pricing management
interface InventoryItem {
  id: string;
  keystone_vcpn: string;
  part_name: string;
  part_number: string;
  brand: string;
  category: string;
  description?: string;
  cost?: number;
  list_price?: number;
  core_charge?: number;
  quantity_available?: number;
}

interface PricingRecord {
  id: string;
  keystone_vcpn: string;
  part_name: string;
  part_sku?: string;
  cost: number;
  list_price: number;
  markup_percentage: number;
  effective_start_date: string;
  effective_end_date?: string;
  created_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  status: 'draft' | 'pending_approval' | 'active' | 'expired' | 'superseded';
  notes?: string;
  currency: string;
  core_charge?: number;
  minimum_price?: number;
  maximum_discount_percentage?: number;
}

interface PriceChangeRequest {
  id: string;
  keystone_vcpn: string;
  current_price: number;
  proposed_price: number;
  markup_percentage: number;
  effective_date: string;
  reason: string;
  requested_by: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

interface PriceHistory {
  id: string;
  keystone_vcpn: string;
  price: number;
  markup_percentage: number;
  effective_start: string;
  effective_end?: string;
  created_by: string;
  reason?: string;
}

// Price calculation utilities
const calculateMarkupPrice = (cost: number, markupPercentage: number): number => {
  return cost * (1 + markupPercentage / 100);
};

const calculateMarkupPercentage = (cost: number, price: number): number => {
  if (cost === 0) return 0;
  return ((price - cost) / cost) * 100;
};

// Part search component
const PartSearchSelector: React.FC<{
  onPartSelect: (part: InventoryItem) => void;
  selectedPart?: InventoryItem;
}> = ({ onPartSelect, selectedPart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Search inventory table
  const searchParts = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .or(`part_name.ilike.%${term}%,part_number.ilike.%${term}%,keystone_vcpn.ilike.%${term}%,brand.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(20);

      if (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchParts(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchParts]);

  const handlePartSelect = (part: InventoryItem) => {
    onPartSelect(part);
    setSearchTerm(`${part.part_name} (${part.part_number})`);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <Label htmlFor="part-search">Search Parts *</Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          id="part-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by part name, number, VCPN, brand..."
          className="pl-10"
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((part) => (
            <div
              key={part.id}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handlePartSelect(part)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{part.part_name}</div>
                  <div className="text-sm text-gray-600">
                    {part.part_number} • {part.brand}
                  </div>
                  <div className="text-xs text-gray-500">
                    VCPN: {part.keystone_vcpn}
                  </div>
                  {part.description && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {part.description}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm">
                  {part.cost && (
                    <div className="text-gray-600">Cost: ${part.cost.toFixed(2)}</div>
                  )}
                  {part.list_price && (
                    <div className="text-green-600 font-medium">List: ${part.list_price.toFixed(2)}</div>
                  )}
                  {part.quantity_available !== undefined && (
                    <div className="text-xs text-gray-500">Qty: {part.quantity_available}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
          <div className="text-gray-500 text-sm">No parts found matching "{searchTerm}"</div>
        </div>
      )}

      {/* Selected Part Display */}
      {selectedPart && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium text-blue-900">{selectedPart.part_name}</div>
              <div className="text-sm text-blue-700">
                {selectedPart.part_number} • {selectedPart.brand}
              </div>
              <div className="text-xs text-blue-600">
                VCPN: {selectedPart.keystone_vcpn}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onPartSelect({} as InventoryItem);
                setSearchTerm('');
                setShowResults(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Pricing form component
const PricingForm: React.FC<{
  pricing?: PricingRecord;
  onSave: (pricing: Partial<PricingRecord>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}> = ({ pricing, onSave, onCancel, isEditing = false }) => {
  const [selectedPart, setSelectedPart] = useState<InventoryItem | undefined>();
  const [formData, setFormData] = useState<Partial<PricingRecord>>({
    keystone_vcpn: pricing?.keystone_vcpn || '',
    part_name: pricing?.part_name || '',
    cost: pricing?.cost || 0,
    list_price: pricing?.list_price || 0,
    markup_percentage: pricing?.markup_percentage || 0,
    effective_start_date: pricing?.effective_start_date || new Date().toISOString().split('T')[0],
    effective_end_date: pricing?.effective_end_date || '',
    notes: pricing?.notes || '',
    currency: pricing?.currency || 'USD',
    core_charge: pricing?.core_charge || 0,
    minimum_price: pricing?.minimum_price || 0,
    maximum_discount_percentage: pricing?.maximum_discount_percentage || 0,
    status: pricing?.status || 'draft'
  });

  const [calculationMode, setCalculationMode] = useState<'markup' | 'price'>('markup');

  // Handle part selection
  const handlePartSelect = (part: InventoryItem) => {
    setSelectedPart(part);
    setFormData(prev => ({
      ...prev,
      keystone_vcpn: part.keystone_vcpn,
      part_name: part.part_name,
      part_sku: part.part_number,
      cost: part.cost || prev.cost,
      list_price: part.list_price || prev.list_price,
      core_charge: part.core_charge || prev.core_charge
    }));

    // Calculate markup if we have cost and price
    if (part.cost && part.list_price) {
      const markup = calculateMarkupPercentage(part.cost, part.list_price);
      setFormData(prev => ({
        ...prev,
        markup_percentage: markup
      }));
    }
  };

  // Handle cost change and auto-calculate price
  const handleCostChange = (cost: number) => {
    setFormData(prev => {
      const newData = { ...prev, cost };
      if (calculationMode === 'markup' && prev.markup_percentage) {
        newData.list_price = calculateMarkupPrice(cost, prev.markup_percentage);
      }
      return newData;
    });
  };

  // Handle markup percentage change and auto-calculate price
  const handleMarkupChange = (markupPercentage: number) => {
    setFormData(prev => {
      const newData = { ...prev, markup_percentage: markupPercentage };
      if (calculationMode === 'markup' && prev.cost) {
        newData.list_price = calculateMarkupPrice(prev.cost, markupPercentage);
      }
      return newData;
    });
  };

  // Handle price change and auto-calculate markup
  const handlePriceChange = (listPrice: number) => {
    setFormData(prev => {
      const newData = { ...prev, list_price: listPrice };
      if (calculationMode === 'price' && prev.cost && prev.cost > 0) {
        newData.markup_percentage = calculateMarkupPercentage(prev.cost, listPrice);
      }
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Part Selection */}
      {!isEditing && (
        <PartSearchSelector
          onPartSelect={handlePartSelect}
          selectedPart={selectedPart}
        />
      )}

      {/* Part Information (Read-only when editing) */}
      {(isEditing || selectedPart) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="part_name">Part Name</Label>
            <Input
              id="part_name"
              value={formData.part_name}
              onChange={(e) => setFormData(prev => ({ ...prev, part_name: e.target.value }))}
              placeholder="Part name"
              readOnly={isEditing}
              className={isEditing ? "bg-gray-50" : ""}
            />
          </div>
          <div>
            <Label htmlFor="part_sku">Part Number</Label>
            <Input
              id="part_sku"
              value={formData.part_sku}
              onChange={(e) => setFormData(prev => ({ ...prev, part_sku: e.target.value }))}
              placeholder="Part number"
              readOnly={isEditing}
              className={isEditing ? "bg-gray-50" : ""}
            />
          </div>
          <div>
            <Label htmlFor="vcpn">Keystone VCPN</Label>
            <Input
              id="vcpn"
              value={formData.keystone_vcpn}
              onChange={(e) => setFormData(prev => ({ ...prev, keystone_vcpn: e.target.value }))}
              placeholder="VCPN"
              readOnly={isEditing}
              className={isEditing ? "bg-gray-50" : ""}
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Only show pricing section if we have a part selected or are editing */}
      {(selectedPart || isEditing) && (
        <>
          {/* Pricing Calculation Mode */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Label>Calculation Mode:</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={calculationMode === 'price'}
                  onCheckedChange={(checked) => setCalculationMode(checked ? 'price' : 'markup')}
                />
                <span className="text-sm">
                  {calculationMode === 'markup' ? 'Calculate Price from Markup %' : 'Calculate Markup % from Price'}
                </span>
              </div>
            </div>

            {/* Cost Input */}
            <div>
              <Label htmlFor="cost">Cost *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Markup Percentage or List Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="markup">Markup Percentage</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="markup"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.markup_percentage?.toFixed(2)}
                    onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    placeholder="0.00"
                    disabled={calculationMode === 'price'}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="price">List Price *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.list_price?.toFixed(2)}
                    onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                    className="pl-10"
                    placeholder="0.00"
                    disabled={calculationMode === 'markup'}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Calculation Display */}
            {formData.cost > 0 && formData.list_price > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Pricing Calculation</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cost:</span>
                    <div className="font-medium">${formData.cost.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Markup:</span>
                    <div className="font-medium">{formData.markup_percentage?.toFixed(2)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-600">List Price:</span>
                    <div className="font-medium text-green-600">${formData.list_price.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Pricing Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="core_charge">Core Charge</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="core_charge"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.core_charge}
                  onChange={(e) => setFormData(prev => ({ ...prev, core_charge: parseFloat(e.target.value) || 0 }))}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="minimum_price">Minimum Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="minimum_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimum_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_price: parseFloat(e.target.value) || 0 }))}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Effective Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Effective Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.effective_start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, effective_start_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">Effective End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.effective_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, effective_end_date: e.target.value }))}
                placeholder="Leave blank for indefinite"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this pricing change..."
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedPart && !isEditing}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Pricing' : 'Create Pricing'}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

// Price history component
const PriceHistoryView: React.FC<{
  vcpn: string;
  history: PriceHistory[];
}> = ({ vcpn, history }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <History className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Price History for {vcpn}</h3>
      </div>
      
      <div className="space-y-2">
        {history.map((record, index) => (
          <Card key={record.id} className={index === 0 ? 'border-green-200 bg-green-50' : ''}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-green-600">
                      ${record.price.toFixed(2)}
                    </span>
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {record.markup_percentage.toFixed(1)}% markup
                    </Badge>
                    {index === 0 && <Badge variant="default">Current</Badge>}
                  </div>
                  <div className="text-sm text-gray-600">
                    Effective: {new Date(record.effective_start).toLocaleDateString()}
                    {record.effective_end && ` - ${new Date(record.effective_end).toLocaleDateString()}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    Created by {record.created_by}
                  </div>
                  {record.reason && (
                    <div className="text-sm text-gray-600">
                      Reason: {record.reason}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  {index === 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Main pricing management component
const PricingManagement: React.FC = () => {
  const [pricingRecords, setPricingRecords] = useState<PricingRecord[]>([]);
  const [priceChangeRequests, setPriceChangeRequests] = useState<PriceChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [editingPricing, setEditingPricing] = useState<PricingRecord | null>(null);
  const [selectedVcpn, setSelectedVcpn] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { toast } = useToast();

  // Load pricing data
  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      // const records = await pricingService.getAllPricingRecords();
      // const requests = await pricingService.getPriceChangeRequests();
      
      // Mock data for now
      setPricingRecords([]);
      setPriceChangeRequests([]);
      setError(null);
    } catch (error) {
      console.error('Failed to load pricing data:', error);
      setError('Failed to load pricing data');
      toast({
        title: "Loading Error",
        description: "Failed to load pricing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePricing = async (pricingData: Partial<PricingRecord>) => {
    try {
      // TODO: Replace with actual API call
      // if (editingPricing) {
      //   await pricingService.updatePricing(editingPricing.id, pricingData);
      // } else {
      //   await pricingService.createPricing(pricingData);
      // }
      
      toast({
        title: "Success",
        description: editingPricing ? "Pricing updated successfully" : "Pricing created successfully",
      });
      
      setShowPricingForm(false);
      setEditingPricing(null);
      await loadPricingData();
    } catch (error) {
      console.error('Failed to save pricing:', error);
      toast({
        title: "Error",
        description: "Failed to save pricing",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = async (vcpn: string) => {
    try {
      // TODO: Replace with actual API call
      // const history = await pricingService.getPriceHistory(vcpn);
      
      // Mock data for now
      const mockHistory: PriceHistory[] = [
        {
          id: '1',
          keystone_vcpn: vcpn,
          price: 125.99,
          markup_percentage: 35.5,
          effective_start: '2024-01-01',
          created_by: 'admin@example.com',
          reason: 'Current pricing'
        },
        {
          id: '2',
          keystone_vcpn: vcpn,
          price: 119.99,
          markup_percentage: 30.0,
          effective_start: '2023-06-01',
          effective_end: '2023-12-31',
          created_by: 'admin@example.com',
          reason: 'Summer pricing adjustment'
        }
      ];
      
      setPriceHistory(mockHistory);
      setSelectedVcpn(vcpn);
      setShowHistory(true);
    } catch (error) {
      console.error('Failed to load price history:', error);
      toast({
        title: "Error",
        description: "Failed to load price history",
        variant: "destructive",
      });
    }
  };

  // Filter pricing records
  const filteredRecords = pricingRecords.filter(record => {
    const matchesSearch = record.keystone_vcpn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.part_sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-gray-600 mt-2">
            Manage pricing, markups, and effective dates for your inventory
          </p>
        </div>
        
        <Button onClick={() => setShowPricingForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Pricing
        </Button>
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pricing">Current Pricing</TabsTrigger>
          <TabsTrigger value="requests">Price Change Requests</TabsTrigger>
          <TabsTrigger value="analytics">Pricing Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by part name, number, or VCPN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
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
                Manage pricing for all parts with effective date controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading pricing data...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pricing records found</p>
                  <Button 
                    onClick={() => setShowPricingForm(true)}
                    className="mt-4"
                  >
                    Create First Pricing Record
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Part Number</TableHead>
                      <TableHead>VCPN</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>List Price</TableHead>
                      <TableHead>Markup %</TableHead>
                      <TableHead>Effective Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.part_name}</TableCell>
                        <TableCell>{record.part_sku}</TableCell>
                        <TableCell className="text-sm text-gray-600">{record.keystone_vcpn}</TableCell>
                        <TableCell>${record.cost.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ${record.list_price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.markup_percentage.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(record.effective_start_date).toLocaleDateString()}</div>
                            {record.effective_end_date && (
                              <div className="text-gray-500">
                                to {new Date(record.effective_end_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              record.status === 'active' ? 'default' :
                              record.status === 'draft' ? 'secondary' :
                              record.status === 'pending_approval' ? 'outline' :
                              'destructive'
                            }
                          >
                            {record.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPricing(record);
                                setShowPricingForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistory(record.keystone_vcpn)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Price Change Requests</CardTitle>
              <CardDescription>
                Review and approve pending price changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pending price change requests</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Markup</p>
                    <p className="text-2xl font-bold">32.5%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Pricing Records</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pricing Form Dialog */}
      <Dialog open={showPricingForm} onOpenChange={setShowPricingForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPricing ? 'Edit Pricing' : 'Create New Pricing'}
            </DialogTitle>
            <DialogDescription>
              Search for a part and set pricing with effective dates and markup calculations
            </DialogDescription>
          </DialogHeader>
          <PricingForm
            pricing={editingPricing || undefined}
            onSave={handleSavePricing}
            onCancel={() => {
              setShowPricingForm(false);
              setEditingPricing(null);
            }}
            isEditing={!!editingPricing}
          />
        </DialogContent>
      </Dialog>

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
            <PriceHistoryView
              vcpn={selectedVcpn}
              history={priceHistory}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManagement;

