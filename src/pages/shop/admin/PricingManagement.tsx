import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Edit, Plus, X, Calendar, Settings, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
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
  effective_end_date?: string;
  status: string;
  created_at: string;
  notes?: string;
  // Enhanced fields for automation
  auto_update_enabled?: boolean;
  minimum_markup_percentage?: number;
  last_supplier_cost?: number;
  last_cost_check?: string;
  pricing_alerts?: string[];
}

interface PricingSettings {
  enabled: boolean;
  defaultMarkupPercent: number;
  minimumMarkupPercent: number;
  categoryMarkups: Record<string, number>;
  autoUpdateEnabled: boolean;
  requireApprovalThreshold: number;
  notificationEnabled: boolean;
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

const EnhancedPricingManagement: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
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
  const [priceRecommendations, setPriceRecommendations] = useState<Record<string, PriceRecommendation>>({});
  
  // Settings state
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({
    enabled: true,
    defaultMarkupPercent: 30,
    minimumMarkupPercent: 15,
    categoryMarkups: {
      'Lighting': 35,
      'Protection': 40,
      'Electrical': 30,
      'Accessories': 25
    },
    autoUpdateEnabled: true,
    requireApprovalThreshold: 50,
    notificationEnabled: true
  });
  
  // Form state
  const [formData, setFormData] = useState({
    keystone_vcpn: '',
    part_name: '',
    cost: 0,
    list_price: 0,
    markup_percentage: 0,
    effective_start_date: new Date().toISOString().split('T')[0],
    effective_end_date: '',
    notes: '',
    auto_update_enabled: true,
    minimum_markup_percentage: 15
  });

  const supabase = getSupabaseClient();

  // Load pricing settings from localStorage
  const loadPricingSettings = useCallback(() => {
    try {
      const saved = localStorage.getItem('pricing_settings');
      if (saved) {
        setPricingSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading pricing settings:', error);
    }
  }, []);

  // Save pricing settings to localStorage
  const savePricingSettings = useCallback((settings: PricingSettings) => {
    try {
      localStorage.setItem('pricing_settings', JSON.stringify(settings));
      setPricingSettings(settings);
    } catch (error) {
      console.error('Error saving pricing settings:', error);
    }
  }, []);

  // Get current date for comparisons
  const getCurrentDate = () => new Date().toISOString().split('T')[0];

  // Calculate record status based on effective dates
  const calculateRecordStatus = (startDate: string, endDate?: string): { status: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    const today = getCurrentDate();
    const start = startDate;
    const end = endDate;

    if (start > today) {
      return { status: 'Future', variant: 'secondary' };
    } else if (end && end <= today) {
      return { status: 'Expired', variant: 'destructive' };
    } else {
      return { status: 'Active', variant: 'default' };
    }
  };

  // Calculate pricing recommendation based on supplier cost
  const calculatePriceRecommendation = (
    record: PricingRecord, 
    supplierCost: number,
    category?: string
  ): PriceRecommendation => {
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
  }, [supabase, pricingSettings]);

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      keystone_vcpn: '',
      part_name: '',
      cost: 0,
      list_price: 0,
      markup_percentage: 0,
      effective_start_date: getCurrentDate(),
      effective_end_date: '',
      notes: '',
      auto_update_enabled: true,
      minimum_markup_percentage: pricingSettings.minimumMarkupPercent
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
        const records = (data || []) as PricingRecord[];
        setPricingRecords(records);
        setFilteredPricingRecords(records);
        
        // Check for price recommendations for active records
        for (const record of records) {
          if (record.status === 'active' && record.last_supplier_cost) {
            const recommendation = calculatePriceRecommendation(
              record, 
              record.last_supplier_cost,
              record.part_name // Could be enhanced to get actual category
            );
            setPriceRecommendations(prev => ({
              ...prev,
              [record.keystone_vcpn]: recommendation
            }));
          }
        }
      }
    } catch (error) {
      console.error('❌ Exception loading pricing records:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, pricingSettings]);

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
    
    // Get category-specific markup if available
    const category = part.category || 'default';
    const categoryMarkup = pricingSettings.categoryMarkups[category] || pricingSettings.defaultMarkupPercent;
    
    setSelectedPart(part);
    setFormData(prev => ({
      ...prev,
      keystone_vcpn: partId,
      part_name: partName,
      cost: part.cost || 0,
      list_price: part.list_price || part.price || 0,
      markup_percentage: part.cost && (part.list_price || part.price) ? 
        Math.round(((part.list_price || part.price) - part.cost) / part.cost * 100) : categoryMarkup,
      minimum_markup_percentage: pricingSettings.minimumMarkupPercent
    }));
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

  // Validate dates
  const validateDates = (): string | null => {
    const { effective_start_date, effective_end_date } = formData;
    
    if (effective_end_date && effective_end_date <= effective_start_date) {
      return 'End date must be after start date';
    }
    
    return null;
  };

  // Validate pricing rules
  const validatePricing = (): string[] => {
    const warnings: string[] = [];
    
    if (formData.markup_percentage < pricingSettings.minimumMarkupPercent) {
      warnings.push(`Markup (${formData.markup_percentage}%) is below minimum (${pricingSettings.minimumMarkupPercent}%)`);
    }
    
    if (formData.cost <= 0) {
      warnings.push('Cost must be greater than zero');
    }
    
    if (formData.list_price <= formData.cost) {
      warnings.push('List price must be greater than cost');
    }
    
    return warnings;
  };

  // Save pricing record
  const handleSavePricing = async () => {
    if (!formData.keystone_vcpn || !formData.part_name || formData.cost <= 0 || formData.list_price <= 0) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    const dateError = validateDates();
    if (dateError) {
      alert(dateError);
      return;
    }

    const pricingWarnings = validatePricing();
    if (pricingWarnings.length > 0) {
      const proceed = confirm(`Pricing warnings:\n${pricingWarnings.join('\n')}\n\nDo you want to proceed?`);
      if (!proceed) return;
    }

    setSaving(true);
    
    try {
      const pricingData = {
        keystone_vcpn: formData.keystone_vcpn,
        part_name: formData.part_name,
        cost: formData.cost,
        list_price: formData.list_price,
        markup_percentage: formData.markup_percentage,
        effective_start_date: formData.effective_start_date,
        effective_end_date: formData.effective_end_date || null,
        status: 'active',
        created_by: 'admin',
        notes: formData.notes || null,
        auto_update_enabled: formData.auto_update_enabled,
        minimum_markup_percentage: formData.minimum_markup_percentage,
        last_supplier_cost: formData.cost,
        last_cost_check: new Date().toISOString()
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
      effective_start_date: record.effective_start_date,
      effective_end_date: record.effective_end_date || '',
      notes: record.notes || '',
      auto_update_enabled: record.auto_update_enabled ?? true,
      minimum_markup_percentage: record.minimum_markup_percentage ?? pricingSettings.minimumMarkupPercent
    });
    setShowEditDialog(true);
  };

  // Apply price recommendation
  const applyPriceRecommendation = async (vcpn: string) => {
    const recommendation = priceRecommendations[vcpn];
    if (!recommendation) return;
    
    const record = pricingRecords.find(r => r.keystone_vcpn === vcpn);
    if (!record) return;
    
    try {
      const updatedRecord = {
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
        alert('Error applying price recommendation');
      } else {
        // Remove recommendation
        setPriceRecommendations(prev => {
          const updated = { ...prev };
          delete updated[vcpn];
          return updated;
        });
        
        // Refresh records
        if (pricingSearchTerm) {
          await loadPricingRecords(pricingSearchTerm);
        }
        
        alert('Price recommendation applied successfully!');
      }
    } catch (error) {
      console.error('Exception applying recommendation:', error);
      alert('Error applying price recommendation');
    }
  };

  // Initialize component
  useEffect(() => {
    detectInventoryColumns();
    loadPricingSettings();
  }, [detectInventoryColumns, loadPricingSettings]);

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

  // Expose checkPriceRecommendations for ProductPriceCheck integration
  useEffect(() => {
    // Make function available globally for ProductPriceCheck integration
    (window as any).checkPriceRecommendations = checkPriceRecommendations;
    
    return () => {
      delete (window as any).checkPriceRecommendations;
    };
  }, [checkPriceRecommendations]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Pricing Management</h1>
          <p className="text-muted-foreground">
            Automated pricing with supplier cost monitoring and markup enforcement
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowSettingsDialog(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Pricing Automation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pricing Automation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={pricingSettings.enabled ? "default" : "secondary"}>
                {pricingSettings.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <span className="text-sm">Automation</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {pricingSettings.defaultMarkupPercent}%
              </Badge>
              <span className="text-sm">Default Markup</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {pricingSettings.minimumMarkupPercent}%
              </Badge>
              <span className="text-sm">Minimum Markup</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                ${pricingSettings.requireApprovalThreshold}
              </Badge>
              <span className="text-sm">Approval Threshold</span>
            </div>
          </div>
          
          {Object.keys(priceRecommendations).length > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {Object.keys(priceRecommendations).length} pricing recommendations available. 
                Check the pricing records table for details.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manage">Manage Pricing</TabsTrigger>
          <TabsTrigger value="recommendations">
            Recommendations 
            {Object.keys(priceRecommendations).length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {Object.keys(priceRecommendations).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          {/* Create New Pricing Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Create New Pricing Record</CardTitle>
                  <CardDescription>
                    Search for a part from inventory and set pricing with automation rules
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                    <div>
                      <Label htmlFor="minMarkup">Minimum Markup %</Label>
                      <Input
                        id="minMarkup"
                        type="number"
                        step="1"
                        min="0"
                        value={formData.minimum_markup_percentage}
                        onChange={(e) => handleFormChange('minimum_markup_percentage', parseFloat(e.target.value) || 0)}
                        placeholder="15"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum markup for this product
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Automation & Dates</h3>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoUpdate"
                        checked={formData.auto_update_enabled}
                        onCheckedChange={(checked) => handleFormChange('auto_update_enabled', checked)}
                      />
                      <Label htmlFor="autoUpdate">Enable Auto-Update</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically update pricing when supplier costs change
                    </p>
                    
                    <div>
                      <Label htmlFor="startDate">Effective Start Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.effective_start_date}
                          onChange={(e) => handleFormChange('effective_start_date', e.target.value)}
                          disabled={editingRecord && formData.effective_start_date <= getCurrentDate()}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="endDate">Effective End Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.effective_end_date}
                          onChange={(e) => handleFormChange('effective_end_date', e.target.value)}
                          min={formData.effective_start_date}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave blank for indefinite pricing
                      </p>
                    </div>

                    {/* Status Preview */}
                    <div>
                      <Label className="text-sm font-medium">Status Preview</Label>
                      <div className="mt-1">
                        <Badge variant={calculateRecordStatus(formData.effective_start_date, formData.effective_end_date).variant}>
                          {calculateRecordStatus(formData.effective_start_date, formData.effective_end_date).status}
                        </Badge>
                      </div>
                    </div>

                    {/* Pricing Validation */}
                    {validatePricing().length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside text-sm">
                            {validatePricing().map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
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
                Search for existing pricing records to view, edit, or manage automation
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
                          <TableHead>Part Name</TableHead>
                          <TableHead>Identifier</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>List Price</TableHead>
                          <TableHead>Markup %</TableHead>
                          <TableHead>Auto-Update</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Recommendations</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPricingRecords.map((record) => {
                          const statusInfo = calculateRecordStatus(record.effective_start_date, record.effective_end_date);
                          const recommendation = priceRecommendations[record.keystone_vcpn];
                          
                          return (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">{record.part_name}</TableCell>
                              <TableCell>{record.keystone_vcpn}</TableCell>
                              <TableCell>${record.cost.toFixed(2)}</TableCell>
                              <TableCell>${record.list_price.toFixed(2)}</TableCell>
                              <TableCell>{record.markup_percentage}%</TableCell>
                              <TableCell>
                                <Badge variant={record.auto_update_enabled ? "default" : "secondary"}>
                                  {record.auto_update_enabled ? "Enabled" : "Disabled"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusInfo.variant}>
                                  {statusInfo.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {recommendation ? (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="destructive">
                                      ${Math.abs(recommendation.priceChange).toFixed(2)}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={!recommendation || recommendation.priceChange === 0}
                                      onClick={() => applyPriceRecommendation(record.keystone_vcpn)}
                                    >
                                      Apply
                                    </Button>
                                  </div>
                                ) : (
                                  <Badge variant="outline">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Current
                                  </Badge>
                                )}
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
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Price Recommendations
              </CardTitle>
              <CardDescription>
                Pricing recommendations based on supplier cost changes and markup rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(priceRecommendations).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <div className="text-lg font-medium">All Pricing Up to Date</div>
                  <div className="text-muted-foreground">
                    No pricing recommendations at this time
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(priceRecommendations).map(([vcpn, recommendation]) => {
                    const record = pricingRecords.find(r => r.keystone_vcpn === vcpn);
                    if (!record) return null;
                    
                    return (
                      <Card key={vcpn} className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{record.part_name}</h4>
                              <p className="text-sm text-muted-foreground">{vcpn}</p>
                              <p className="text-sm mt-2">{recommendation.reason}</p>
                              
                              {recommendation.warnings.length > 0 && (
                                <div className="mt-2">
                                  <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                      <ul className="list-disc list-inside text-sm">
                                        {recommendation.warnings.map((warning, index) => (
                                          <li key={index}>{warning}</li>
                                        ))}
                                      </ul>
                                    </AlertDescription>
                                  </Alert>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right ml-6">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="font-medium">Current</div>
                                  <div>${recommendation.currentPrice.toFixed(2)}</div>
                                  <div className="text-muted-foreground">{recommendation.currentMarkup.toFixed(1)}%</div>
                                </div>
                                <div>
                                  <div className="font-medium">Recommended</div>
                                  <div className="text-green-600">${recommendation.recommendedPrice.toFixed(2)}</div>
                                  <div className="text-muted-foreground">{recommendation.recommendedMarkup.toFixed(1)}%</div>
                                </div>
                              </div>
                              
                              <div className="mt-4 space-x-2">
                                <Button
                                  size="sm"
                                  disabled={!recommendation || recommendation.priceChange === 0}
                                  onClick={() => applyPriceRecommendation(vcpn)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Apply
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPriceRecommendations(prev => {
                                      const updated = { ...prev };
                                      delete updated[vcpn];
                                      return updated;
                                    });
                                  }}
                                >
                                  Dismiss
                                </Button>
                              </div>
                              
                              {recommendation.requiresApproval && (
                                <Badge variant="destructive" className="mt-2">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Requires Approval
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pricing Automation Settings</DialogTitle>
            <DialogDescription>
              Configure automatic pricing rules and markup settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Global Settings</h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAutomation"
                    checked={pricingSettings.enabled}
                    onCheckedChange={(checked) => 
                      setPricingSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label htmlFor="enableAutomation">Enable Pricing Automation</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAutoUpdate"
                    checked={pricingSettings.autoUpdateEnabled}
                    onCheckedChange={(checked) => 
                      setPricingSettings(prev => ({ ...prev, autoUpdateEnabled: checked }))
                    }
                  />
                  <Label htmlFor="enableAutoUpdate">Enable Auto-Updates</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableNotifications"
                    checked={pricingSettings.notificationEnabled}
                    onCheckedChange={(checked) => 
                      setPricingSettings(prev => ({ ...prev, notificationEnabled: checked }))
                    }
                  />
                  <Label htmlFor="enableNotifications">Enable Notifications</Label>
                </div>
                
                <div>
                  <Label htmlFor="defaultMarkup">Default Markup %</Label>
                  <Input
                    id="defaultMarkup"
                    type="number"
                    step="1"
                    min="0"
                    value={pricingSettings.defaultMarkupPercent}
                    onChange={(e) => 
                      setPricingSettings(prev => ({ 
                        ...prev, 
                        defaultMarkupPercent: parseFloat(e.target.value) || 0 
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="minimumMarkup">Minimum Markup %</Label>
                  <Input
                    id="minimumMarkup"
                    type="number"
                    step="1"
                    min="0"
                    value={pricingSettings.minimumMarkupPercent}
                    onChange={(e) => 
                      setPricingSettings(prev => ({ 
                        ...prev, 
                        minimumMarkupPercent: parseFloat(e.target.value) || 0 
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="approvalThreshold">Approval Threshold ($)</Label>
                  <Input
                    id="approvalThreshold"
                    type="number"
                    step="1"
                    min="0"
                    value={pricingSettings.requireApprovalThreshold}
                    onChange={(e) => 
                      setPricingSettings(prev => ({ 
                        ...prev, 
                        requireApprovalThreshold: parseFloat(e.target.value) || 0 
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Price changes above this amount require manual approval
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Category Markups</h3>
                
                {Object.entries(pricingSettings.categoryMarkups).map(([category, markup]) => (
                  <div key={category}>
                    <Label htmlFor={`category-${category}`}>{category} Markup %</Label>
                    <Input
                      id={`category-${category}`}
                      type="number"
                      step="1"
                      min="0"
                      value={markup}
                      onChange={(e) => 
                        setPricingSettings(prev => ({
                          ...prev,
                          categoryMarkups: {
                            ...prev.categoryMarkups,
                            [category]: parseFloat(e.target.value) || 0
                          }
                        }))
                      }
                    />
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Add New Category</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Category name"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const category = input.value.trim();
                          if (category && !pricingSettings.categoryMarkups[category]) {
                            setPricingSettings(prev => ({
                              ...prev,
                              categoryMarkups: {
                                ...prev.categoryMarkups,
                                [category]: prev.defaultMarkupPercent
                              }
                            }));
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                        if (input) {
                          const category = input.value.trim();
                          if (category && !pricingSettings.categoryMarkups[category]) {
                            setPricingSettings(prev => ({
                              ...prev,
                              categoryMarkups: {
                                ...prev.categoryMarkups,
                                [category]: prev.defaultMarkupPercent
                              }
                            }));
                            input.value = '';
                          }
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowSettingsDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  savePricingSettings(pricingSettings);
                  setShowSettingsDialog(false);
                  alert('Pricing settings saved successfully!');
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Pricing Dialog - Enhanced with automation features */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pricing Record</DialogTitle>
            <DialogDescription>
              Update pricing information, automation settings, and effective dates
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-autoUpdate"
                    checked={formData.auto_update_enabled}
                    onCheckedChange={(checked) => handleFormChange('auto_update_enabled', checked)}
                  />
                  <Label htmlFor="edit-autoUpdate">Enable Auto-Update</Label>
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

                <div>
                  <Label htmlFor="edit-minMarkup">Minimum Markup %</Label>
                  <Input
                    id="edit-minMarkup"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.minimum_markup_percentage}
                    onChange={(e) => handleFormChange('minimum_markup_percentage', parseFloat(e.target.value) || 0)}
                    placeholder="15"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum markup for this product
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Effective Dates</h3>
                
                <div>
                  <Label htmlFor="edit-startDate">Effective Start Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={formData.effective_start_date}
                      onChange={(e) => handleFormChange('effective_start_date', e.target.value)}
                      disabled={formData.effective_start_date <= getCurrentDate()}
                      className="pl-10"
                    />
                  </div>
                  {formData.effective_start_date <= getCurrentDate() && (
                    <p className="text-xs text-amber-600 mt-1">
                      Start date cannot be changed for active/past records
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-endDate">Effective End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={formData.effective_end_date}
                      onChange={(e) => handleFormChange('effective_end_date', e.target.value)}
                      min={formData.effective_start_date}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set to today or future date to make pricing inactive
                  </p>
                </div>

                {/* Status Preview */}
                <div>
                  <Label className="text-sm font-medium">Status Preview</Label>
                  <div className="mt-1">
                    <Badge variant={calculateRecordStatus(formData.effective_start_date, formData.effective_end_date).variant}>
                      {calculateRecordStatus(formData.effective_start_date, formData.effective_end_date).status}
                    </Badge>
                  </div>
                </div>

                {/* Pricing Validation */}
                {validatePricing().length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside text-sm">
                        {validatePricing().map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
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

export default EnhancedPricingManagement;

