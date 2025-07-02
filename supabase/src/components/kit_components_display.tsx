import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, 
  ChevronDown, 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Box,
  Hash,
  DollarSign
} from "lucide-react";
import { kitComponentService, KitComponent, KitComponentsResponse } from '@/services/kit_component_service';
import { useToast } from "@/hooks/use-toast";

// Kit Badge Component
export const KitBadge = ({ className = "" }: { className?: string }) => (
  <Badge variant="outline" className={`text-xs bg-blue-50 text-blue-700 border-blue-200 ${className}`}>
    <Package className="h-3 w-3 mr-1" />
    KIT
  </Badge>
);

// Kit Component Item Display
interface KitComponentItemProps {
  component: KitComponent;
  showPricing?: boolean;
}

const KitComponentItem: React.FC<KitComponentItemProps> = ({ 
  component, 
  showPricing = false 
}) => (
  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
    <div className="flex-1">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-blue-600">
          {component.quantity}×
        </span>
        <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
          {component.component_vcpn}
        </span>
        <span className="text-gray-700">
          {component.description || 'No description'}
        </span>
      </div>
    </div>
    
    {showPricing && (component.list_price || component.core_charge) && (
      <div className="text-right text-xs text-gray-600">
        {component.list_price && (
          <div>${component.list_price.toFixed(2)}</div>
        )}
        {component.core_charge && (
          <div className="text-orange-600">Core: ${component.core_charge.toFixed(2)}</div>
        )}
      </div>
    )}
  </div>
);

// Main Kit Components Display
interface KitComponentsDisplayProps {
  kitVcpn: string;
  showPricing?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  onComponentsLoaded?: (components: KitComponent[]) => void;
}

export const KitComponentsDisplay: React.FC<KitComponentsDisplayProps> = ({
  kitVcpn,
  showPricing = false,
  defaultExpanded = false,
  className = "",
  onComponentsLoaded
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [components, setComponents] = useState<KitComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { toast } = useToast();

  // Load components when expanded for the first time
  const loadComponents = async (forceRefresh = false) => {
    if (hasLoaded && !forceRefresh) return;

    setIsLoading(true);
    setError(null);

    try {
      const response: KitComponentsResponse = await kitComponentService.getKitComponentsWithCache(
        kitVcpn, 
        forceRefresh
      );

      if (response.success) {
        setComponents(response.components);
        setHasLoaded(true);
        onComponentsLoaded?.(response.components);
        
        if (forceRefresh) {
          toast({
            title: "Kit Components Refreshed",
            description: `Updated ${response.components.length} components for kit ${kitVcpn}`
          });
        }
      } else {
        setError(response.error || 'Failed to load kit components');
        toast({
          title: "Error Loading Kit Components",
          description: response.error || 'Failed to load kit components',
          variant: "destructive"
        });
      }
    } catch (err) {
      const errorMessage = err.message || 'Unexpected error loading kit components';
      setError(errorMessage);
      toast({
        title: "Error Loading Kit Components",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load components when opened
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      loadComponents();
    }
  }, [isOpen, hasLoaded]);

  // Calculate totals
  const totals = React.useMemo(() => {
    const totalQuantity = components.reduce((sum, comp) => sum + comp.quantity, 0);
    const totalListPrice = components.reduce((sum, comp) => 
      sum + (comp.list_price || 0) * comp.quantity, 0
    );
    const totalCoreCharge = components.reduce((sum, comp) => 
      sum + (comp.core_charge || 0) * comp.quantity, 0
    );

    return { totalQuantity, totalListPrice, totalCoreCharge };
  }, [components]);

  return (
    <div className={`border rounded-lg ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-4 h-auto hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Kit Components</span>
              {hasLoaded && (
                <Badge variant="secondary" className="text-xs">
                  {components.length} items
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4">
            <Separator className="mb-4" />
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading kit components...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-2"
                    onClick={() => loadComponents(true)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Components List */}
            {!isLoading && !error && components.length > 0 && (
              <div className="space-y-3">
                {/* Header with refresh button */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    This kit contains {components.length} component{components.length !== 1 ? 's' : ''}:
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => loadComponents(true)}
                    className="h-6 px-2"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>

                {/* Components */}
                <div className="space-y-2">
                  {components.map((component, index) => (
                    <KitComponentItem 
                      key={`${component.component_vcpn}-${index}`}
                      component={component}
                      showPricing={showPricing}
                    />
                  ))}
                </div>

                {/* Totals */}
                {showPricing && (totals.totalListPrice > 0 || totals.totalCoreCharge > 0) && (
                  <>
                    <Separator />
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="text-sm font-medium text-blue-900 mb-2">Kit Totals:</div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-600">Total Items:</span>
                          <span className="ml-2 font-medium">{totals.totalQuantity}</span>
                        </div>
                        {totals.totalListPrice > 0 && (
                          <div>
                            <span className="text-gray-600">List Price:</span>
                            <span className="ml-2 font-medium">${totals.totalListPrice.toFixed(2)}</span>
                          </div>
                        )}
                        {totals.totalCoreCharge > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Total Core Charges:</span>
                            <span className="ml-2 font-medium text-orange-600">
                              ${totals.totalCoreCharge.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Kit Info */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    <span>Kit VCPN: {kitVcpn}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && components.length === 0 && hasLoaded && (
              <div className="text-center py-6 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm">No components found for this kit</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => loadComponents(true)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Compact Kit Components Display for cards
interface CompactKitDisplayProps {
  kitVcpn: string;
  componentCount?: number;
  className?: string;
}

export const CompactKitDisplay: React.FC<CompactKitDisplayProps> = ({
  kitVcpn,
  componentCount,
  className = ""
}) => {
  const [components, setComponents] = useState<KitComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadComponents = async () => {
      setIsLoading(true);
      try {
        const response = await kitComponentService.getStoredKitComponents(kitVcpn);
        setComponents(response);
      } catch (error) {
        console.error('Error loading kit components:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComponents();
  }, [kitVcpn]);

  const displayCount = componentCount || components.length;

  return (
    <div className={`text-xs text-gray-600 ${className}`}>
      <div className="flex items-center gap-1">
        <Package className="h-3 w-3" />
        <span>
          {isLoading ? (
            'Loading...'
          ) : (
            `${displayCount} component${displayCount !== 1 ? 's' : ''}`
          )}
        </span>
      </div>
    </div>
  );
};

// Hook for checking if a part is a kit
export const useKitCheck = (vcpn: string) => {
  const [isKit, setIsKit] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!vcpn) return;

    const checkKit = async () => {
      setIsLoading(true);
      try {
        const result = await kitComponentService.isKit(vcpn);
        setIsKit(result);
      } catch (error) {
        console.error('Error checking if part is kit:', error);
        setIsKit(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkKit();
  }, [vcpn]);

  return { isKit, isLoading };
};

export default KitComponentsDisplay;

