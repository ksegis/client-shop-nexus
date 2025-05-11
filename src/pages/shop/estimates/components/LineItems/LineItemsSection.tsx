
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash } from "lucide-react";
import { LineItemValues } from "../../schemas/estimateSchema";

interface LineItemsSectionProps {
  lineItems: LineItemValues[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItemValues[]>>;
  vendors: { name: string }[];
  itemSearchTerm: string;
  setItemSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  inventoryItems: any[];
  showItemResults: boolean;
  setShowItemResults: React.Dispatch<React.SetStateAction<boolean>>;
  selectedItemIndex: number | null;
  setSelectedItemIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export function LineItemsSection({
  lineItems,
  setLineItems,
  vendors,
  itemSearchTerm,
  setItemSearchTerm,
  inventoryItems,
  showItemResults,
  setShowItemResults,
  selectedItemIndex,
  setSelectedItemIndex,
}: LineItemsSectionProps) {
  const handleItemSearch = (value: string, index: number) => {
    setItemSearchTerm(value);
    setSelectedItemIndex(index);
    setShowItemResults(true);
  };

  const handleSelectInventoryItem = (item: any) => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...lineItems];
      updatedItems[selectedItemIndex] = {
        ...updatedItems[selectedItemIndex],
        part_number: item.sku || "",
        description: item.name,
        price: item.price || 0,
        vendor: item.supplier || "",
      };
      setLineItems(updatedItems);
      setShowItemResults(false);
      setItemSearchTerm("");
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, price: 0, part_number: "", vendor: "" },
    ]);
  };

  const removeLineItem = (index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
  };

  const updateLineItem = (index: number, field: keyof LineItemValues, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setLineItems(updatedItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Line Items</h3>
        <Button type="button" onClick={addLineItem} size="sm" className="h-8">
          <Plus className="mr-1 h-4 w-4" /> Add Item
        </Button>
      </div>

      {lineItems.length > 0 ? (
        <div className="border rounded-md">
          <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm">
            <div className="col-span-2">Part #</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Vendor</div>
            <div className="col-span-1"></div>
          </div>

          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 p-3 border-t">
              {/* Part Number */}
              <div className="col-span-2">
                <Input
                  value={item.part_number || ""}
                  onChange={(e) => updateLineItem(index, "part_number", e.target.value)}
                  placeholder="Part #"
                />
              </div>

              {/* Description with search */}
              <div className="col-span-4 relative">
                <Popover open={showItemResults && selectedItemIndex === index}>
                  <PopoverTrigger asChild>
                    <div>
                      <Input
                        value={item.description}
                        onChange={(e) => {
                          updateLineItem(index, "description", e.target.value);
                          handleItemSearch(e.target.value, index);
                        }}
                        placeholder="Description"
                        className="w-full"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0 max-h-[200px] overflow-y-auto">
                    {inventoryItems.length > 0 ? (
                      <div className="py-2">
                        {inventoryItems.map((invItem) => (
                          <div
                            key={invItem.id}
                            className="px-4 py-2 hover:bg-accent cursor-pointer"
                            onClick={() => handleSelectInventoryItem(invItem)}
                          >
                            <div className="font-medium">{invItem.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {invItem.sku && `SKU: ${invItem.sku}`}
                              {invItem.supplier && ` • Vendor: ${invItem.supplier}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No matching items found
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quantity */}
              <div className="col-span-1">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, "quantity", Number(e.target.value))}
                />
              </div>

              {/* Price */}
              <div className="col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.price}
                  onChange={(e) => updateLineItem(index, "price", Number(e.target.value))}
                />
              </div>

              {/* Vendor */}
              <div className="col-span-2">
                <Select
                  value={item.vendor || ""}
                  onValueChange={(value) => updateLineItem(index, "vendor", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor, i) => (
                      <SelectItem key={i} value={vendor.name || ""}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Remove button */}
              <div className="col-span-1 flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeLineItem(index)}
                  type="button"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          No items added. Click "Add Item" to add items to this estimate.
        </div>
      )}
    </div>
  );
}
