import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Settings, 
  Package, 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  Download,
  Upload,
  Database,
  RotateCcw,
  Info,
  Eye,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { kitComponentService } from '@/services/kit_component_service';
import { KitComponentsDisplay } from '@/components/kit_components_display';

// Kit settings interface
interface KitSettings {
  enableKitExpansionInCart: boolean;
  autoSyncKitsOnInventoryUpdate: boolean;
  showKitComponentsInOrders: boolean;
  kitSyncBatchSize: number;
  kitCacheExpirationHours: number;
  enableKitPriceCalculation: boolean;
  kitDisplayMode: 'collapsed' | 'expanded' | 'summary';
}

// Kit sync result interface
interface KitSyncResult {
  success: number;
  failed: number;
  errors: string[];
  totalProcessed: number;
}

// Kit management component
const KitManagement: React.FC = () => {
  const [settings, setSettings] = useState<KitSettings>({
    enableKitExpansionInCart: true,
    autoSyncKitsOnInventoryUpdate: false,
    showKitComponentsInOrders: true,
    kitSyncBatchSize: 10,
    kitCacheExpirationHours: 24,
    enableKitPriceCalculation: false,
    kitDisplayMode: 'collapsed'
  });
  
  const [allKits, setAllKits] = useState<string[]>([]);
  const [isLoadingKits, setIsLoadingKits] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<KitSyncResult | null>(null);
  const [selectedKit, setSelectedKit] = useState<string | null>(null);
  const [kitSearchTerm, setKitSearchTerm] = useState('');
  const [vcpnInput, setVcpnInput] = useState('');
  
  const { toast } = useToast();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('kitSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading kit settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('kitSettings', JSON.stringify(settings));
  }, [settings]);

  // Load all kits on component mount
  useEffect(() => {
    loadAllKits();
  }, []);

  // Load all kits from database
  const loadAllKits = async () => {
    setIsLoadingKits(true);
    try {
      const kits = await kitComponentService.getAllKits();
      setAllKits(kits);
    } catch (error) {
      console.error('Error loading kits:', error);
      toast({
        title: "Error Loading Kits",
        description: "Failed to load kit list from database",
        variant: "destructive"
      });
    } finally {
      setIsLoadingKits(false);
    }
  };

  // Update setting
  const updateSetting = <K extends keyof KitSettings>(
    key: K, 
    value: KitSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Setting Updated",
      description: `${key} has been updated`
    });
  };

  // Sync single kit
  const syncSingleKit = async (vcpn: string) => {
    if (!vcpn.trim()) {
      toast({
        title: "Invalid VCPN",
        description: "Please enter a valid VCPN",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const response = await kitComponentService.getKitComponentsWithCache(vcpn, true);
      
      if (response.success && response.components.length > 0) {
        toast({
          title: "Kit Synced Successfully",
          description: `Synced ${response.components.length} components for kit ${vcpn}`
        });
        
        // Refresh kit list
        await loadAllKits();
        setVcpnInput('');
      } else {
        toast({
          title: "Sync Failed",
          description: response.error || "No components found for this VCPN",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error syncing kit:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync kit components",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync all kits
  const syncAllKits = async () => {
    if (allKits.length === 0) {
      toast({
        title: "No Kits Found",
        description: "No kits available to sync",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await kitComponentService.syncKitComponents(allKits);
      setSyncResult(result);
      
      if (result.success > 0) {
        toast({
          title: "Sync Completed",
          description: `Successfully synced ${result.success} kits. ${result.failed} failed.`
        });
      } else {
        toast({
          title: "Sync Failed",
          description: "No kits were successfully synced",
          variant: "destructive"
        });
      }
      
      // Refresh kit list
      await loadAllKits();
    } catch (error) {
      console.error('Error syncing all kits:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync kit components",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete kit components
  const deleteKit = async (vcpn: string) => {
    try {
      const success = await kitComponentService.deleteKitComponents(vcpn);
      
      if (success) {
        toast({
          title: "Kit Deleted",
          description: `Components for kit ${vcpn} have been deleted`
        });
        
        // Refresh kit list
        await loadAllKits();
        
        // Close dialog if this kit was selected
        if (selectedKit === vcpn) {
          setSelectedKit(null);
        }
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete kit components",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting kit:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete kit components",
        variant: "destructive"
      });
    }
  };

  // Filter kits based on search term
  const filteredKits = allKits.filter(kit => 
    kit.toLowerCase().includes(kitSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Kit Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Kit Configuration Settings
          </CardTitle>
          <CardDescription>
            Configure how kits are displayed and processed throughout the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cart Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Cart & Checkout Settings</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="kit-expansion">Enable Kit Expansion in Cart</Label>
                <div className="text-xs text-muted-foreground">
                  Show individual kit components during checkout
                </div>
              </div>
              <Switch
                id="kit-expansion"
                checked={settings.enableKitExpansionInCart}
                onCheckedChange={(value) => updateSetting('enableKitExpansionInCart', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="show-components">Show Kit Components in Orders</Label>
                <div className="text-xs text-muted-foreground">
                  Display component details in order summaries
                </div>
              </div>
              <Switch
                id="show-components"
                checked={settings.showKitComponentsInOrders}
                onCheckedChange={(value) => updateSetting('showKitComponentsInOrders', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="price-calculation">Enable Kit Price Calculation</Label>
                <div className="text-xs text-muted-foreground">
                  Calculate kit price from component prices
                </div>
              </div>
              <Switch
                id="price-calculation"
                checked={settings.enableKitPriceCalculation}
                onCheckedChange={(value) => updateSetting('enableKitPriceCalculation', value)}
              />
            </div>
          </div>

          <Separator />

          {/* Sync Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Synchronization Settings</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-sync">Auto-sync Kits on Inventory Update</Label>
                <div className="text-xs text-muted-foreground">
                  Automatically sync kit components when inventory is updated
                </div>
              </div>
              <Switch
                id="auto-sync"
                checked={settings.autoSyncKitsOnInventoryUpdate}
                onCheckedChange={(value) => updateSetting('autoSyncKitsOnInventoryUpdate', value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-size">Sync Batch Size</Label>
                <Input
                  id="batch-size"
                  type="number"
                  min="1"
                  max="50"
                  value={settings.kitSyncBatchSize}
                  onChange={(e) => updateSetting('kitSyncBatchSize', parseInt(e.target.value) || 10)}
                />
                <div className="text-xs text-muted-foreground">
                  Number of kits to sync simultaneously
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cache-expiration">Cache Expiration (hours)</Label>
                <Input
                  id="cache-expiration"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.kitCacheExpirationHours}
                  onChange={(e) => updateSetting('kitCacheExpirationHours', parseInt(e.target.value) || 24)}
                />
                <div className="text-xs text-muted-foreground">
                  How long to cache kit component data
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kit Synchronization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Kit Synchronization
          </CardTitle>
          <CardDescription>
            Sync kit components from Keystone API and manage kit data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Single Kit Sync */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Sync Individual Kit</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Enter kit VCPN..."
                value={vcpnInput}
                onChange={(e) => setVcpnInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && syncSingleKit(vcpnInput)}
                className="flex-1"
              />
              <Button
                onClick={() => syncSingleKit(vcpnInput)}
                disabled={isSyncing || !vcpnInput.trim()}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Sync Kit
              </Button>
            </div>
          </div>

          <Separator />

          {/* Bulk Operations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Bulk Operations</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={loadAllKits}
                  disabled={isLoadingKits}
                  size="sm"
                >
                  {isLoadingKits ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
                <Button
                  onClick={syncAllKits}
                  disabled={isSyncing || allKits.length === 0}
                  size="sm"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Sync All Kits ({allKits.length})
                </Button>
              </div>
            </div>

            {/* Sync Results */}
            {syncResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div>Sync completed: {syncResult.success} successful, {syncResult.failed} failed</div>
                    {syncResult.errors.length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer">View errors ({syncResult.errors.length})</summary>
                        <div className="mt-2 space-y-1">
                          {syncResult.errors.map((error, index) => (
                            <div key={index} className="text-red-600">{error}</div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Kit Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Kit Management
          </CardTitle>
          <CardDescription>
            View and manage stored kit components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search kits..."
                value={kitSearchTerm}
                onChange={(e) => setKitSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {filteredKits.length} kits
            </Badge>
          </div>

          {/* Kit List */}
          <ScrollArea className="h-[400px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kit VCPN</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {isLoadingKits ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading kits...
                        </div>
                      ) : allKits.length === 0 ? (
                        "No kits found. Sync some kits to get started."
                      ) : (
                        "No kits match your search."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKits.map((kit) => (
                    <TableRow key={kit}>
                      <TableCell className="font-medium">{kit}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Loading...
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        Recently
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedKit(kit)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Kit Components: {kit}</DialogTitle>
                              </DialogHeader>
                              <div className="mt-4">
                                {selectedKit === kit && (
                                  <KitComponentsDisplay 
                                    kitVcpn={kit}
                                    showTitle={false}
                                    expandByDefault={true}
                                  />
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => syncSingleKit(kit)}
                            disabled={isSyncing}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteKit(kit)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Kit Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Kit Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{allKits.length}</div>
              <div className="text-sm text-muted-foreground">Total Kits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {settings.enableKitExpansionInCart ? 'ON' : 'OFF'}
              </div>
              <div className="text-sm text-muted-foreground">Cart Expansion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{settings.kitSyncBatchSize}</div>
              <div className="text-sm text-muted-foreground">Batch Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{settings.kitCacheExpirationHours}h</div>
              <div className="text-sm text-muted-foreground">Cache Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KitManagement;

