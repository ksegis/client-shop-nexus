'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { getSupabaseClient } from "@/lib/supabase";

// Types
interface PricingRecord {
  id: string;
  keystone_vcpn: string;
  part_name: string;
  part_sku?: string;
  cost: number;
  list_price: number;
  markup_percentage: number;
  core_charge: number;
  minimum_price: number;
  maximum_discount_percentage: number;
  currency: string;
  effective_start_date: string;
  effective_end_date?: string;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;
  approved_by?: string;
  approved_at?: string;
  status: string;
  notes?: string;
  reason_for_change?: string;
  auto_update_enabled: boolean;
  minimum_markup_percentage: number;
  last_supplier_cost?: number;
  last_cost_check?: string;
}

interface PriceRecommendation {
  currentPrice: number;
  recommendedPrice: number;
  supplierCost: number;
  currentMarkup: number;
  recommendedMarkup: number;
  priceChange: number;
  priceChangePercent: number;
  reason: string;
  requiresApproval: boolean;
  warnings: string[];
}

interface PricingSettings {
  defaultMarkupPercent: number;
  minimumMarkupPercent: number;
  requireApprovalThreshold: number;
  autoUpdateEnabled: boolean;
  categoryMarkups: { [key: string]: number };
}

interface InventoryPart {
  id: string;
  name: string;
  sku: string;
  keystone_vcpn?: string;
  category: string;
  cost: number;
  list_price: number;
  quantity_on_hand: number;
}

const PricingManagement: React.FC = () => {
  const supabase = getSupabaseClient();
  
  // State
  const [pricingRecords, setPricingRecords] = useState<PricingRecord[]>([]);
  const [inventoryParts, setInventoryParts] = useState<InventoryPart[]>([]);
  const [pricingSearchTerm, setPricingSearchTerm] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PricingRecord | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedInventoryPart, setSelectedInventoryPart] = useState<InventoryPart | null>(null);
  const [priceRecommendations, setPriceRecommendations] = useState<{ [vcpn: string]: PriceRecommendation }>({});
  
  // Pricing settings with defaults
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({
    defaultMarkupPercent: 30,
    minimumMarkupPercent: 15,
    requireApprovalThreshold: 50,
    autoUpdateEnabled: true,
    categoryMarkups: {
      'Lighting': 35,
      'Protection': 25,
      'Performance': 40,
      'Exterior': 30,
      'Interior': 28
    }
  });

  // Form state for new/edit record
  const [formData, setFormData] = useState<Partial<PricingRecord>>({
    keystone_vcpn: '',
    part_name: '',
    part_sku: '',
    cost: 0,
    list_price: 0,
    markup_percentage: 30,
    core_charge: 0,
    minimum_price: 0,
    maximum_discount_percentage: 0,
    currency: 'USD',
    effective_start_date: new Date().toISOString().split('T')[0],
    status: 'active',
    notes: '',
    reason_for_change: '',
    auto_update_enabled: true,
    minimum_markup_percentage: 15
  });

  // Load pricing records
  const loadPricingRecords = async (searchTerm: string = '') => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('pricing_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`part_name.ilike.%${searchTerm}%,keystone_vcpn.ilike.%${searchTerm}%,part_sku.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPricingRecords(data || []);
    } catch (error) {
      console.error('Error loading pricing records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load inventory parts for selection
  const loadInventoryParts = async (searchTerm: string = '') => {
    try {
      let query = supabase
        .from('inventory')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,keystone_vcpn.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      setInventoryParts(data || []);
    } catch (error) {
      console.error('Error loading inventory parts:', error);
    }
  };

  // Get status badge
  const getStatusBadge = (record: PricingRecord) => {
    const now = new Date();
    const endDate = record.effective_end_date ? new Date(record.effective_end_date) : null;
    
    if (record.status === 'inactive') {
      return { status: 'Inactive', variant: 'secondary' as const };
    } else if (endDate && endDate < now) {
      return { status: 'Expired', variant: 'destructive' as const };
    } else {
      return { status: 'Active', variant: 'default' as const };
    }
  };

  // Calculate pricing recommendation based on supplier cost
  const calculatePriceRecommendation = (
    record: PricingRecord, 
    supplierCost: number,
    category?: string
  ): PriceRecommendation | null => {
    const currentPrice = record.list_price;
    const currentMarkup = record.markup_percentage;
    
    // Determine markup to use
    const categoryMarkup = category ? pricingSettings.categoryMarkups[category] : null;
    const targetMarkup = record.minimum_markup_percentage || 
                        categoryMarkup || 
                        pricingSettings.defaultMarkupPercent;
    
    // Ensure minimum markup
    const finalMarkup = Math.max(targetMarkup, pricingSettings.minimumMarkupPercent);
    
    // Calculate recommended price
    const recommendedPrice = Math.round((supplierCost * (1 + finalMarkup / 100)) * 100) / 100;
    
    // Calculate changes
    const priceChange = recommendedPrice - currentPrice;
    const priceChangePercent = (priceChange / currentPrice) * 100;
    
    // ✅ FIXED: Only generate recommendation if there's a meaningful change
    const MINIMUM_CHANGE_THRESHOLD = 0.01; // $0.01 minimum change
    if (Math.abs(priceChange) < MINIMUM_CHANGE_THRESHOLD) {
      return null; // No recommendation needed
    }
    
    // Determine reason
    let reason = '';
    if (supplierCost > record.cost) {
      reason = 'Supplier cost increased - price adjustment recommended';
    } else if (currentMarkup < pricingSettings.minimumMarkupPercent) {
      reason = 'Current markup below minimum threshold';
    } else if (supplierCost < record.cost && recommendedPrice < currentPrice * 0.95) {
      reason = 'Supplier cost decreased - price reduction opportunity';
    } else {
      reason = 'Price optimization based on current settings';
    }
    
    // Check if approval required
    const requiresApproval = Math.abs(priceChange) >= pricingSettings.requireApprovalThreshold;
    
    // Generate warnings
    const warnings: string[] = [];
    if (finalMarkup < pricingSettings.minimumMarkupPercent) {
      warnings.push(`Markup (${finalMarkup}%) below minimum (${pricingSettings.minimumMarkupPercent}%)`);
    }
    if (priceChangePercent > 50) {
      warnings.push('Large price increase may impact sales');
    }
    if (priceChangePercent < -25) {
      warnings.push('Large price decrease may impact margins');
    }
    
    return {
      currentPrice,
      recommendedPrice,
      supplierCost,
      currentMarkup,
      recommendedMarkup: finalMarkup,
      priceChange,
      priceChangePercent,
      reason,
      requiresApproval,
      warnings
    };
  };

  // Process automatic price update
  const processAutomaticPriceUpdate = async (record: PricingRecord, recommendation: PriceRecommendation) => {
    if (!record.auto_update_enabled || !pricingSettings.autoUpdateEnabled) {
      return false;
    }
    
    if (recommendation.requiresApproval) {
      // Add to approval queue (for now, just show notification)
      alert(`Price change for ${record.part_name} requires approval: ${recommendation.reason}`);
      return false;
    }
    
    try {
      const updatedRecord = {
        ...record,
        cost: recommendation.supplierCost,
        list_price: recommendation.recommendedPrice,
        markup_percentage: recommendation.recommendedMarkup,
        last_supplier_cost: recommendation.supplierCost,
        last_cost_check: new Date().toISOString(),
        notes: `${record.notes || ''}\nAuto-updated: ${recommendation.reason}`.trim()
      };
      
      const { error } = await supabase
        .from('pricing_records')
        .update(updatedRecord)
        .eq('id', record.id);
      
      if (error) {
        console.error('Error auto-updating price:', error);
        return false;
      }
      
      // Refresh records
      if (pricingSearchTerm) {
        await loadPricingRecords(pricingSearchTerm);
      }
      
      return true;
    } catch (error) {
      console.error('Exception auto-updating price:', error);
      return false;
    }
  };

  // Check for price recommendations (called from ProductPriceCheck integration)
  const checkPriceRecommendations = useCallback(async (vcpn: string, supplierCost: number, category?: string) => {
    try {
      // Find existing pricing record
      const { data: records, error } = await supabase
        .from('pricing_records')
        .select('*')
        .eq('keystone_vcpn', vcpn)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || !records || records.length === 0) {
        return null;
      }
      
      const record = records[0] as PricingRecord;
      const recommendation = calculatePriceRecommendation(record, supplierCost, category);
      
      // ✅ FIXED: Only store and process if there's an actual recommendation
      if (!recommendation) {
        return null;
      }
      
      // Store recommendation
      setPriceRecommendations(prev => ({
        ...prev,
        [vcpn]: recommendation
      }));
      
      // Process automatic update if enabled
      if (pricingSettings.autoUpdateEnabled && record.auto_update_enabled) {
        const updated = await processAutomaticPriceUpdate(record, recommendation);
        if (updated) {
          console.log(`✅ Auto-updated pricing for ${record.part_name}`);
        }
      }
      
      return recommendation;
    } catch (error) {
      console.error('Error checking price recommendations:', error);
      return null;
    }
  }, [pricingSettings]);

  // Apply price recommendation
  const applyPriceRecommendation = async (vcpn: string) => {
    const recommendation = priceRecommendations[vcpn];
    if (!recommendation) return;

    try {
      const { data: records, error: fetchError } = await supabase
        .from('pricing_records')
        .select('*')
        .eq('keystone_vcpn', vcpn)
        .eq('status', 'active')
        .limit(1);

      if (fetchError || !records || records.length === 0) {
        alert('Error: Could not find pricing record');
        return;
      }

      const record = records[0] as PricingRecord;
      const updatedRecord = {
        ...record,
        cost: recommendation.supplierCost,
        list_price: recommendation.recommendedPrice,
        markup_percentage: recommendation.recommendedMarkup,
        last_supplier_cost: recommendation.supplierCost,
        last_cost_check: new Date().toISOString(),
        notes: `${record.notes || ''}\nManual update: ${recommendation.reason}`.trim()
      };

      const { error } = await supabase
        .from('pricing_records')
        .update(updatedRecord)
        .eq('id', record.id);

      if (error) {
        console.error('Error applying recommendation:', error);
        alert('Error applying recommendation');
        return;
      }

      // Remove applied recommendation
      setPriceRecommendations(prev => {
        const updated = { ...prev };
        delete updated[vcpn];
        return updated;
      });

      // Refresh records
      await loadPricingRecords(pricingSearchTerm);
      alert('Price recommendation applied successfully!');
    } catch (error) {
      console.error('Exception applying recommendation:', error);
      alert('Error applying recommendation');
    }
  };

  // Save pricing record
  const savePricingRecord = async () => {
    try {
      if (editingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('pricing_records')
          .update({
            ...formData,
            updated_by: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('pricing_records')
          .insert({
            ...formData,
            created_by: 'admin',
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Reset form and close dialog
      setFormData({
        keystone_vcpn: '',
        part_name: '',
        part_sku: '',
        cost: 0,
        list_price: 0,
        markup_percentage: 30,
        core_charge: 0,
        minimum_price: 0,
        maximum_discount_percentage: 0,
        currency: 'USD',
        effective_start_date: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: '',
        reason_for_change: '',
        auto_update_enabled: true,
        minimum_markup_percentage: 15
      });
      setEditingRecord(null);
      setIsCreateDialogOpen(false);
      setSelectedInventoryPart(null);

      // Reload records
      await loadPricingRecords(pricingSearchTerm);
    } catch (error) {
      console.error('Error saving pricing record:', error);
      alert('Error saving pricing record');
    }
  };

  // Delete pricing record
  const deletePricingRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing record?')) return;

    try {
      const { error } = await supabase
        .from('pricing_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPricingRecords(pricingSearchTerm);
    } catch (error) {
      console.error('Error deleting pricing record:', error);
      alert('Error deleting pricing record');
    }
  };

  // Save settings
  const saveSettings = () => {
    // In a real app, you'd save to database or localStorage
    localStorage.setItem('pricingSettings', JSON.stringify(pricingSettings));
    setIsSettingsDialogOpen(false);
    alert('Settings saved successfully!');
  };

  // Load settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pricingSettings');
    if (savedSettings) {
      setPricingSettings(JSON.parse(savedSettings));
    }
    loadPricingRecords();
  }, []);

  // Expose function globally for ProductPriceCheck integration
  useEffect(() => {
    (window as any).checkPriceRecommendations = checkPriceRecommendations;
    return () => {
      delete (window as any).checkPriceRecommendations;
    };
  }, [checkPriceRecommendations]);

  // Search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPricingRecords(pricingSearchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [pricingSearchTerm]);

  // Inventory search effect
  useEffect(() => {
    if (inventorySearchTerm) {
      const timeoutId = setTimeout(() => {
        loadInventoryParts(inventorySearchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [inventorySearchTerm]);

  // Get recommendation count
  const recommendationCount = Object.keys(priceRecommendations).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pricing Management</h1>
          <p className="text-gray-600">Manage product pricing and automated recommendations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Pricing Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultMarkup">Default Markup %</Label>
                    <Input
                      id="defaultMarkup"
                      type="number"
                      value={pricingSettings.defaultMarkupPercent}
                      onChange={(e) => setPricingSettings(prev => ({
                        ...prev,
                        defaultMarkupPercent: Number(e.target.value)
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimumMarkup">Minimum Markup %</Label>
                    <Input
                      id="minimumMarkup"
                      type="number"
                      value={pricingSettings.minimumMarkupPercent}
                      onChange={(e) => setPricingSettings(prev => ({
                        ...prev,
                        minimumMarkupPercent: Number(e.target.value)
                      }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="approvalThreshold">Approval Threshold ($)</Label>
                  <Input
                    id="approvalThreshold"
                    type="number"
                    value={pricingSettings.requireApprovalThreshold}
                    onChange={(e) => setPricingSettings(prev => ({
                      ...prev,
                      requireApprovalThreshold: Number(e.target.value)
                    }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoUpdate"
                    checked={pricingSettings.autoUpdateEnabled}
                    onChange={(e) => setPricingSettings(prev => ({
                      ...prev,
                      autoUpdateEnabled: e.target.checked
                    }))}
                  />
                  <Label htmlFor="autoUpdate">Enable Automatic Updates</Label>
                </div>
                <div className="space-y-2">
                  <Label>Category Markups</Label>
                  {Object.entries(pricingSettings.categoryMarkups).map(([category, markup]) => (
                    <div key={category} className="flex items-center gap-2">
                      <span className="w-24 text-sm">{category}:</span>
                      <Input
                        type="number"
                        value={markup}
                        onChange={(e) => setPricingSettings(prev => ({
                          ...prev,
                          categoryMarkups: {
                            ...prev.categoryMarkups,
                            [category]: Number(e.target.value)
                          }
                        }))}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveSettings}>Save Settings</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Automation Status */}
      {pricingSettings.autoUpdateEnabled && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            Automation: {pricingSettings.defaultMarkupPercent}% Default Markup, {pricingSettings.minimumMarkupPercent}% Minimum Markup, ${pricingSettings.requireApprovalThreshold} Approval Threshold
          </AlertDescription>
        </Alert>
      )}

      {/* Recommendations Alert */}
      {recommendationCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {recommendationCount} pricing recommendations available. Check the pricing records table for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="pricing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pricing">Pricing Records</TabsTrigger>
          <TabsTrigger value="create">Create Pricing</TabsTrigger>
          <TabsTrigger value="recommendations">
            Recommendations
            {recommendationCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {recommendationCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pricing Records Tab */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Records</CardTitle>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search existing pricing records..."
                    value={pricingSearchTerm}
                    onChange={(e) => setPricingSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Part Name</th>
                        <th className="text-left p-2">VCPN</th>
                        <th className="text-left p-2">Cost</th>
                        <th className="text-left p-2">List Price</th>
                        <th className="text-left p-2">Markup</th>
                        <th className="text-left p-2">Auto Update</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Recommendations</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingRecords.map((record) => {
                        const statusBadge = getStatusBadge(record);
                        const recommendation = priceRecommendations[record.keystone_vcpn];
                        
                        return (
                          <tr key={record.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{record.part_name}</td>
                            <td className="p-2">{record.keystone_vcpn}</td>
                            <td className="p-2">${record.cost.toFixed(2)}</td>
                            <td className="p-2">${record.list_price.toFixed(2)}</td>
                            <td className="p-2">{record.markup_percentage.toFixed(1)}%</td>
                            <td className="p-2">
                              {record.auto_update_enabled ? (
                                <Badge variant="default">Enabled</Badge>
                              ) : (
                                <Badge variant="secondary">Disabled</Badge>
                              )}
                            </td>
                            <td className="p-2">
                              <Badge variant={statusBadge.variant}>
                                {statusBadge.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              {recommendation && (
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm ${recommendation.priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {recommendation.priceChange > 0 ? '+' : ''}${recommendation.priceChange.toFixed(2)}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!recommendation || recommendation.priceChange === 0}
                                    onClick={() => applyPriceRecommendation(record.keystone_vcpn)}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingRecord(record);
                                    setFormData(record);
                                    setIsCreateDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deletePricingRecord(record.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Pricing Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Pricing Record</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search Inventory */}
                <div>
                  <Label htmlFor="inventorySearch">Search Inventory Parts</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="inventorySearch"
                      placeholder="Search for parts to add pricing..."
                      value={inventorySearchTerm}
                      onChange={(e) => setInventorySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Inventory Results */}
                {inventoryParts.length > 0 && (
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <h4 className="font-medium mb-2">Select a part:</h4>
                    <div className="space-y-2">
                      {inventoryParts.map((part) => (
                        <div
                          key={part.id}
                          className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                            selectedInventoryPart?.id === part.id ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                          onClick={() => {
                            setSelectedInventoryPart(part);
                            setFormData(prev => ({
                              ...prev,
                              keystone_vcpn: part.keystone_vcpn || '',
                              part_name: part.name,
                              part_sku: part.sku,
                              cost: part.cost,
                              list_price: part.list_price
                            }));
                          }}
                        >
                          <div className="font-medium">{part.name}</div>
                          <div className="text-sm text-gray-600">
                            SKU: {part.sku} | VCPN: {part.keystone_vcpn || 'N/A'} | Cost: ${part.cost.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vcpn">Keystone VCPN</Label>
                    <Input
                      id="vcpn"
                      value={formData.keystone_vcpn}
                      onChange={(e) => setFormData(prev => ({ ...prev, keystone_vcpn: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="partName">Part Name</Label>
                    <Input
                      id="partName"
                      value={formData.part_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, part_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="listPrice">List Price</Label>
                    <Input
                      id="listPrice"
                      type="number"
                      step="0.01"
                      value={formData.list_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, list_price: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="markup">Markup %</Label>
                    <Input
                      id="markup"
                      type="number"
                      step="0.1"
                      value={formData.markup_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, markup_percentage: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minimumMarkup">Minimum Markup %</Label>
                    <Input
                      id="minimumMarkup"
                      type="number"
                      step="0.1"
                      value={formData.minimum_markup_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimum_markup_percentage: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoUpdate"
                    checked={formData.auto_update_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_update_enabled: e.target.checked }))}
                  />
                  <Label htmlFor="autoUpdate">Enable Auto-Update</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={savePricingRecord}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Pricing Record
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        keystone_vcpn: '',
                        part_name: '',
                        part_sku: '',
                        cost: 0,
                        list_price: 0,
                        markup_percentage: 30,
                        core_charge: 0,
                        minimum_price: 0,
                        maximum_discount_percentage: 0,
                        currency: 'USD',
                        effective_start_date: new Date().toISOString().split('T')[0],
                        status: 'active',
                        notes: '',
                        reason_for_change: '',
                        auto_update_enabled: true,
                        minimum_markup_percentage: 15
                      });
                      setSelectedInventoryPart(null);
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Form
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Price Recommendations</CardTitle>
              <p className="text-sm text-gray-600">
                Automated pricing recommendations based on supplier cost changes and markup rules.
              </p>
            </CardHeader>
            <CardContent>
              {recommendationCount === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No price recommendations available.
                  <br />
                  Recommendations will appear when ProductPriceCheck detects cost changes.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(priceRecommendations).map(([vcpn, recommendation]) => (
                    <div key={vcpn} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">VCPN: {vcpn}</h4>
                          <p className="text-sm text-gray-600">{recommendation.reason}</p>
                        </div>
                        <div className="flex gap-2">
                          {recommendation.requiresApproval && (
                            <Badge variant="destructive">Requires Approval</Badge>
                          )}
                          <Button
                            size="sm"
                            disabled={!recommendation || recommendation.priceChange === 0}
                            onClick={() => applyPriceRecommendation(vcpn)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Current Price:</span>
                          <div className="font-medium">${recommendation.currentPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Recommended Price:</span>
                          <div className="font-medium">${recommendation.recommendedPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Price Change:</span>
                          <div className={`font-medium ${recommendation.priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {recommendation.priceChange > 0 ? '+' : ''}${recommendation.priceChange.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Markup Change:</span>
                          <div className="font-medium">
                            {recommendation.currentMarkup.toFixed(1)}% → {recommendation.recommendedMarkup.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {recommendation.warnings.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm text-amber-600">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            Warnings:
                          </div>
                          <ul className="text-sm text-amber-600 ml-5 list-disc">
                            {recommendation.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Pricing Record' : 'Create Pricing Record'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dialogVcpn">Keystone VCPN</Label>
                <Input
                  id="dialogVcpn"
                  value={formData.keystone_vcpn}
                  onChange={(e) => setFormData(prev => ({ ...prev, keystone_vcpn: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dialogPartName">Part Name</Label>
                <Input
                  id="dialogPartName"
                  value={formData.part_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, part_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dialogCost">Cost</Label>
                <Input
                  id="dialogCost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="dialogListPrice">List Price</Label>
                <Input
                  id="dialogListPrice"
                  type="number"
                  step="0.01"
                  value={formData.list_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, list_price: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dialogNotes">Notes</Label>
              <Textarea
                id="dialogNotes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={savePricingRecord}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManagement;

