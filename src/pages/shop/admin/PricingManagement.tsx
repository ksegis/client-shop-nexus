// Fixed version of PricingManagement with smart auto-calculation that respects manual changes
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  DollarSign,
  Calculator
} from 'lucide-react';
import { getSupabaseClient } from "@/lib/supabase";

// Types (same as original)
interface PricingRecord {
  id?: string;
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
  created_at?: string;
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
  isNegativeMargin?: boolean;
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
  
  // State (same as original)
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
  
  // ✅ NEW: Track if price was manually set by user
  const [priceManuallySet, setPriceManuallySet] = useState(false);
  const lastCalculatedPrice = useRef<number>(0);
  
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

  // ✅ ENHANCED: Automatic list price calculation
  const calculateListPrice = useCallback((cost: number, markupPercent: number): number => {
    if (!cost || cost <= 0 || !markupPercent || markupPercent < 0) {
      return 0;
    }
    
    const calculatedPrice = cost * (1 + markupPercent / 100);
    return Math.round(calculatedPrice * 100) / 100; // Round to 2 decimal places
  }, []);

  // ✅ IMPROVED: Smart auto-calculation that respects manual changes
  useEffect(() => {
    if (formData.cost && formData.markup_percentage) {
      const newCalculatedPrice = calculateListPrice(formData.cost, formData.markup_percentage);
      
      // Only auto-update if:
      // 1. Price hasn't been manually set by user, AND
      // 2. Current price is 0 (initial state), OR
      // 3. Current price matches the last calculated price (meaning it was auto-calculated)
      const shouldAutoUpdate = !priceManuallySet && (
        formData.list_price === 0 || 
        formData.list_price === lastCalculatedPrice.current
      );
      
      if (shouldAutoUpdate) {
        setFormData(prev => ({
          ...prev,
          list_price: newCalculatedPrice
        }));
      }
      
      // Always update the last calculated price for reference
      lastCalculatedPrice.current = newCalculatedPrice;
    }
  }, [formData.cost, formData.markup_percentage, calculateListPrice, priceManuallySet]);

  // ✅ NEW: Handle manual price input
  const handlePriceChange = (newPrice: number) => {
    const calculatedPrice = calculateListPrice(formData.cost || 0, formData.markup_percentage || 0);
    
    // If the new price is different from the calculated price, mark as manually set
    if (Math.abs(newPrice - calculatedPrice) > 0.01) {
      setPriceManuallySet(true);
    } else {
      setPriceManuallySet(false);
    }
    
    setFormData(prev => ({
      ...prev,
      list_price: newPrice
    }));
  };

  // ✅ NEW: Reset manual flag when form is cleared or new item selected
  const resetPriceManualFlag = () => {
    setPriceManuallySet(false);
    lastCalculatedPrice.current = 0;
  };

  // ✅ ENHANCED: Better error handling function
  const handleDatabaseError = (error: any, operation: string) => {
    console.error(`Error ${operation}:`, error);
    
    let userMessage = `Error ${operation}`;
    
    if (error?.message) {
      if (error.message.includes('duplicate key')) {
        userMessage = 'A pricing record with this VCPN already exists';
      } else if (error.message.includes('foreign key')) {
        userMessage = 'Invalid reference to inventory item';
      } else if (error.message.includes('not assigned yet') || error.message.includes('RLS')) {
        userMessage = 'Database permission issue - please contact administrator';
      } else if (error.message.includes('violates check constraint')) {
        userMessage = 'Invalid data values - please check all fields';
      } else {
        userMessage = `Database error: ${error.message}`;
      }
    }
    
    alert(userMessage);
    return userMessage;
  };

  // ✅ ENHANCED: Validate form data before saving
  const validateFormData = (data: Partial<PricingRecord>): string[] => {
    const errors: string[] = [];
    
    if (!data.keystone_vcpn?.trim()) {
      errors.push('Keystone VCPN is required');
    }
    
    if (!data.part_name?.trim()) {
      errors.push('Part name is required');
    }
    
    if (!data.cost || data.cost < 0) {
      errors.push('Cost must be greater than 0');
    }
    
    if (!data.list_price || data.list_price < 0) {
      errors.push('List price must be greater than 0');
    }
    
    if (!data.markup_percentage || data.markup_percentage < 0) {
      errors.push('Markup percentage must be greater than 0');
    }
    
    if (!data.effective_start_date) {
      errors.push('Effective start date is required');
    }
    
    return errors;
  };

  // ✅ ENHANCED: Safe data preparation for database
  const prepareDataForDatabase = (data: Partial<PricingRecord>): any => {
    return {
      keystone_vcpn: data.keystone_vcpn?.trim() || '',
      part_name: data.part_name?.trim() || '',
      part_sku: data.part_sku?.trim() || null,
      cost: Number(data.cost) || 0,
      list_price: Number(data.list_price) || 0,
      markup_percentage: Number(data.markup_percentage) || 0,
      core_charge: Number(data.core_charge) || 0,
      minimum_price: Number(data.minimum_price) || 0,
      maximum_discount_percentage: Number(data.maximum_discount_percentage) || 0,
      currency: data.currency || 'USD',
      effective_start_date: data.effective_start_date || new Date().toISOString().split('T')[0],
      effective_end_date: data.effective_end_date || null,
      status: data.status || 'active',
      notes: data.notes?.trim() || null,
      reason_for_change: data.reason_for_change?.trim() || null,
      auto_update_enabled: Boolean(data.auto_update_enabled),
      minimum_markup_percentage: Number(data.minimum_markup_percentage) || 15,
      last_supplier_cost: data.last_supplier_cost ? Number(data.last_supplier_cost) : null,
      last_cost_check: data.last_cost_check || null
    };
  };

  // Load pricing records (same as original)
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
      if (error) {
        handleDatabaseError(error, 'loading pricing records');
        return;
      }
      
      setPricingRecords(data || []);
      checkForNegativeMargins(data || []);
    } catch (error) {
      handleDatabaseError(error, 'loading pricing records');
    } finally {
      setIsLoading(false);
    }
  };

  // Load inventory parts (same as original)
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
      if (error) {
        handleDatabaseError(error, 'loading inventory parts');
        return;
      }
      setInventoryParts(data || []);
    } catch (error) {
      handleDatabaseError(error, 'loading inventory parts');
    }
  };

  // ✅ ENHANCED: Save pricing record with better error handling
  const savePricingRecord = async () => {
    try {
      console.log('🔥 Starting save operation...');
      
      // Validate form data
      const validationErrors = validateFormData(formData);
      if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n' + validationErrors.join('\n'));
        return;
      }
      
      // Prepare data for database
      const dbData = prepareDataForDatabase(formData);
      console.log('📝 Prepared data:', dbData);
      
      if (editingRecord) {
        // Update existing record
        console.log('🔄 Updating existing record...');
        
        const updateData = {
          ...dbData,
          updated_by: 'admin',
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('pricing_records')
          .update(updateData)
          .eq('id', editingRecord.id);

        if (error) {
          console.error('❌ Update error:', error);
          handleDatabaseError(error, 'updating pricing record');
          return;
        }
        
        console.log('✅ Update successful');
      } else {
        // Create new record
        console.log('➕ Creating new record...');
        
        const insertData = {
          ...dbData,
          created_by: 'admin',
          created_at: new Date().toISOString()
        };
        
        // ✅ ENHANCED: Try insert with better error handling
        const { data: insertResult, error } = await supabase
          .from('pricing_records')
          .insert(insertData)
          .select();

        if (error) {
          console.error('❌ Insert error:', error);
          handleDatabaseError(error, 'creating pricing record');
          return;
        }
        
        console.log('✅ Insert successful:', insertResult);
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
      resetPriceManualFlag(); // ✅ NEW: Reset manual flag

      // Reload records
      await loadPricingRecords(pricingSearchTerm);
      
      alert('Pricing record saved successfully!');
    } catch (error) {
      console.error('❌ Exception in save operation:', error);
      handleDatabaseError(error, 'saving pricing record');
    }
  };

  // ✅ ENHANCED: Delete with better error handling
  const deletePricingRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing record?')) return;

    try {
      console.log('🗑️ Deleting record:', id);
      
      const { error } = await supabase
        .from('pricing_records')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Delete error:', error);
        handleDatabaseError(error, 'deleting pricing record');
        return;
      }
      
      console.log('✅ Delete successful');
      await loadPricingRecords(pricingSearchTerm);
      alert('Pricing record deleted successfully!');
    } catch (error) {
      console.error('❌ Exception in delete operation:', error);
      handleDatabaseError(error, 'deleting pricing record');
    }
  };

  // Keep all other functions from original (checkForNegativeMargins, generateNegativeMarginRecommendation, etc.)
  const checkForNegativeMargins = (records: PricingRecord[]) => {
    const negativeMarginRecommendations: { [vcpn: string]: PriceRecommendation } = {};
    
    records.forEach(record => {
      if (record.status === 'active' && record.list_price < record.cost) {
        const recommendation = generateNegativeMarginRecommendation(record);
        if (recommendation) {
          negativeMarginRecommendations[record.keystone_vcpn] = recommendation;
        }
      }
    });
    
    if (Object.keys(negativeMarginRecommendations).length > 0) {
      setPriceRecommendations(prev => ({
        ...prev,
        ...negativeMarginRecommendations
      }));
    }
  };

  const generateNegativeMarginRecommendation = (record: PricingRecord): PriceRecommendation | null => {
    const currentPrice = record.list_price;
    const currentCost = record.cost;
    
    const targetMarkup = Math.max(
      record.minimum_markup_percentage || pricingSettings.minimumMarkupPercent,
      pricingSettings.minimumMarkupPercent
    );
    
    const recommendedPrice = Math.round((currentCost * (1 + targetMarkup / 100)) * 100) / 100;
    const priceChange = recommendedPrice - currentPrice;
    const priceChangePercent = (priceChange / currentPrice) * 100;
    const actualCurrentMarkup = ((currentPrice - currentCost) / currentCost) * 100;
    
    return {
      currentPrice,
      recommendedPrice,
      supplierCost: currentCost,
      currentMarkup: actualCurrentMarkup,
      recommendedMarkup: targetMarkup,
      priceChange,
      priceChangePercent,
      reason: 'CRITICAL: Negative margin detected - selling below cost',
      requiresApproval: true,
      warnings: [
        'NEGATIVE MARGIN: Current price is below cost',
        `Losing $${(currentCost - currentPrice).toFixed(2)} per unit`,
        'Immediate price correction required'
      ],
      isNegativeMargin: true
    };
  };

  // Get status badge (same as original)
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

  // Save settings (same as original)
  const saveSettings = () => {
    localStorage.setItem('pricingSettings', JSON.stringify(pricingSettings));
    setIsSettingsDialogOpen(false);
    alert('Settings saved successfully!');
  };

  // ✅ ENHANCED: Manual recalculate function that resets manual flag
  const recalculateListPrice = () => {
    if (formData.cost && formData.markup_percentage) {
      const newListPrice = calculateListPrice(formData.cost, formData.markup_percentage);
      setFormData(prev => ({
        ...prev,
        list_price: newListPrice
      }));
      setPriceManuallySet(false); // ✅ NEW: Reset manual flag when user explicitly recalculates
      lastCalculatedPrice.current = newListPrice;
    }
  };

  // Load settings on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pricingSettings');
    if (savedSettings) {
      setPricingSettings(JSON.parse(savedSettings));
    }
    loadPricingRecords();
  }, []);

  // Search effects (same as original)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPricingRecords(pricingSearchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [pricingSearchTerm]);

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
  const negativeMarginCount = Object.values(priceRecommendations).filter(r => r.isNegativeMargin).length;

  // ✅ ENHANCED: Add debug info for troubleshooting
  const debugInfo = {
    formDataValid: validateFormData(formData).length === 0,
    hasRequiredFields: !!(formData.keystone_vcpn && formData.part_name && formData.cost && formData.list_price),
    formDataPreview: prepareDataForDatabase(formData),
    calculatedPrice: formData.cost && formData.markup_percentage ? calculateListPrice(formData.cost, formData.markup_percentage) : 0,
    priceManuallySet: priceManuallySet,
    lastCalculatedPrice: lastCalculatedPrice.current
  };

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

      {/* ✅ ENHANCED: Debug info for troubleshooting */}
      {process.env.NODE_ENV === 'development' && (
        <Alert>
          <AlertDescription>
            <strong>Debug Info:</strong> Form Valid: {debugInfo.formDataValid ? '✅' : '❌'} | 
            Required Fields: {debugInfo.hasRequiredFields ? '✅' : '❌'} | 
            Records: {pricingRecords.length} | 
            Calculated: ${debugInfo.calculatedPrice.toFixed(2)} | 
            Manual: {debugInfo.priceManuallySet ? '🔒' : '🔄'}
          </AlertDescription>
        </Alert>
      )}

      {/* ✅ NEW: Price calculation status indicator */}
      {priceManuallySet && (
        <Alert className="border-blue-300 bg-blue-50">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Manual Price Set:</strong> Auto-calculation is disabled. Use the calculator button to recalculate based on cost and markup.
          </AlertDescription>
        </Alert>
      )}

      {/* Automation Status */}
      {pricingSettings.autoUpdateEnabled && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            Automation: {pricingSettings.defaultMarkupPercent}% Default Markup, {pricingSettings.minimumMarkupPercent}% Minimum Markup, ${pricingSettings.requireApprovalThreshold} Approval Threshold
          </AlertDescription>
        </Alert>
      )}

      {/* Critical Negative Margin Alert */}
      {negativeMarginCount > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>CRITICAL:</strong> {negativeMarginCount} product{negativeMarginCount > 1 ? 's' : ''} selling below cost (negative margin). Immediate attention required!
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
              <Badge variant={negativeMarginCount > 0 ? "destructive" : "secondary"} className="ml-2">
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
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingRecords.map((record) => {
                        const statusBadge = getStatusBadge(record);
                        const hasNegativeMargin = record.list_price < record.cost;
                        
                        return (
                          <tr key={record.id} className={`border-b hover:bg-gray-50 ${hasNegativeMargin ? 'bg-red-50' : ''}`}>
                            <td className="p-2">{record.part_name}</td>
                            <td className="p-2">{record.keystone_vcpn}</td>
                            <td className="p-2">${record.cost.toFixed(2)}</td>
                            <td className={`p-2 ${hasNegativeMargin ? 'text-red-600 font-bold' : ''}`}>
                              ${record.list_price.toFixed(2)}
                              {hasNegativeMargin && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  LOSS
                                </Badge>
                              )}
                            </td>
                            <td className={`p-2 ${hasNegativeMargin ? 'text-red-600 font-bold' : ''}`}>
                              {hasNegativeMargin ? (
                                <span>-{(((record.cost - record.list_price) / record.cost) * 100).toFixed(1)}%</span>
                              ) : (
                                <span>{record.markup_percentage.toFixed(1)}%</span>
                              )}
                            </td>
                            <td className="p-2">
                              <Badge variant={statusBadge.variant}>
                                {statusBadge.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingRecord(record);
                                    setFormData(record);
                                    setPriceManuallySet(true); // ✅ NEW: Mark as manual when editing existing record
                                    setIsCreateDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deletePricingRecord(record.id!)}
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
                            const calculatedPrice = calculateListPrice(part.cost, pricingSettings.defaultMarkupPercent);
                            setFormData(prev => ({
                              ...prev,
                              keystone_vcpn: part.keystone_vcpn || '',
                              part_name: part.name,
                              part_sku: part.sku,
                              cost: part.cost,
                              list_price: calculatedPrice, // ✅ Auto-calculate on selection
                              markup_percentage: pricingSettings.defaultMarkupPercent
                            }));
                            resetPriceManualFlag(); // ✅ NEW: Reset manual flag when selecting new item
                            lastCalculatedPrice.current = calculatedPrice;
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
                    <Label htmlFor="vcpn">Keystone VCPN *</Label>
                    <Input
                      id="vcpn"
                      value={formData.keystone_vcpn}
                      onChange={(e) => setFormData(prev => ({ ...prev, keystone_vcpn: e.target.value }))}
                      className={!formData.keystone_vcpn ? 'border-red-300' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="partName">Part Name *</Label>
                    <Input
                      id="partName"
                      value={formData.part_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, part_name: e.target.value }))}
                      className={!formData.part_name ? 'border-red-300' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost *</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                      className={!formData.cost || formData.cost <= 0 ? 'border-red-300' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="listPrice">List Price *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="listPrice"
                        type="number"
                        step="0.01"
                        value={formData.list_price}
                        onChange={(e) => handlePriceChange(Number(e.target.value))} // ✅ NEW: Use smart handler
                        className={!formData.list_price || formData.list_price <= 0 ? 'border-red-300' : ''}
                      />
                      {/* ✅ ENHANCED: Manual recalculate button with better tooltip */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={recalculateListPrice}
                        disabled={!formData.cost || !formData.markup_percentage}
                        title={priceManuallySet ? "Recalculate and enable auto-calculation" : "Recalculate list price based on cost and markup"}
                      >
                        <Calculator className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* ✅ ENHANCED: Show calculated price info with manual status */}
                    {formData.cost && formData.markup_percentage && (
                      <div className="text-xs text-gray-500 mt-1">
                        Auto-calculated: ${calculateListPrice(formData.cost, formData.markup_percentage).toFixed(2)} 
                        (${formData.cost} × {(1 + formData.markup_percentage / 100).toFixed(2)})
                        {priceManuallySet && <span className="text-blue-600 ml-2">🔒 Manual override active</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="markup">Markup % *</Label>
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

                {/* ✅ ENHANCED: Show validation status */}
                {validateFormData(formData).length > 0 && (
                  <Alert className="border-red-300 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Please fix:</strong>
                      <ul className="list-disc ml-4 mt-1">
                        {validateFormData(formData).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={savePricingRecord}
                    disabled={validateFormData(formData).length > 0}
                  >
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
                      resetPriceManualFlag(); // ✅ NEW: Reset manual flag when clearing form
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

        {/* Recommendations Tab - simplified for now */}
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
                  Recommendations will appear when cost changes or negative margins are detected.
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Recommendations feature temporarily simplified for debugging.
                  <br />
                  Check the pricing records table for negative margin alerts.
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
                <Label htmlFor="dialogVcpn">Keystone VCPN *</Label>
                <Input
                  id="dialogVcpn"
                  value={formData.keystone_vcpn}
                  onChange={(e) => setFormData(prev => ({ ...prev, keystone_vcpn: e.target.value }))}
                  className={!formData.keystone_vcpn ? 'border-red-300' : ''}
                />
              </div>
              <div>
                <Label htmlFor="dialogPartName">Part Name *</Label>
                <Input
                  id="dialogPartName"
                  value={formData.part_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, part_name: e.target.value }))}
                  className={!formData.part_name ? 'border-red-300' : ''}
                />
              </div>
              <div>
                <Label htmlFor="dialogCost">Cost *</Label>
                <Input
                  id="dialogCost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                  className={!formData.cost || formData.cost <= 0 ? 'border-red-300' : ''}
                />
              </div>
              <div>
                <Label htmlFor="dialogListPrice">List Price *</Label>
                <div className="flex gap-2">
                  <Input
                    id="dialogListPrice"
                    type="number"
                    step="0.01"
                    value={formData.list_price}
                    onChange={(e) => handlePriceChange(Number(e.target.value))} // ✅ NEW: Use smart handler in dialog too
                    className={!formData.list_price || formData.list_price <= 0 ? 'border-red-300' : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={recalculateListPrice}
                    disabled={!formData.cost || !formData.markup_percentage}
                    title="Recalculate list price"
                  >
                    <Calculator className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="dialogMarkup">Markup % *</Label>
                <Input
                  id="dialogMarkup"
                  type="number"
                  step="0.1"
                  value={formData.markup_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, markup_percentage: Number(e.target.value) }))}
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
            
            {/* ✅ ENHANCED: Show validation in dialog too */}
            {validateFormData(formData).length > 0 && (
              <Alert className="border-red-300 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Please fix:</strong>
                  <ul className="list-disc ml-4 mt-1">
                    {validateFormData(formData).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={savePricingRecord}
                disabled={validateFormData(formData).length > 0}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingManagement;

