
import { useState } from 'react';
import { WorkOrderLineItem } from '../../types';
import { useInventorySearch } from '../../hooks/useInventorySearch';
import { LineItemsTable } from './LineItemsTable';
import { LineItemTotals } from './LineItemTotals';

interface LineItemsProps {
  items: WorkOrderLineItem[];
  onChange: (items: WorkOrderLineItem[]) => void;
  readOnly?: boolean;
}

export const LineItems = ({ items, onChange, readOnly = false }: LineItemsProps) => {
  const [newItem, setNewItem] = useState<Partial<WorkOrderLineItem>>({
    description: '',
    quantity: 1,
    price: 0,
    part_number: '',
  });
  
  const { searchResults, searchInventory } = useInventorySearch();
  const [activeSearchField, setActiveSearchField] = useState<{
    type: 'part_number' | 'description',
    index: number | null
  } | null>(null);

  const handleAddItem = () => {
    if (!newItem.description) return;
    
    const tempId = `temp-${Date.now()}`;
    const itemToAdd = {
      ...newItem,
      id: tempId,
      work_order_id: '',
      description: newItem.description || '',
      quantity: newItem.quantity || 1,
      price: newItem.price || 0,
    } as WorkOrderLineItem;
    
    onChange([...items, itemToAdd]);
    
    setNewItem({
      description: '',
      quantity: 1,
      price: 0,
      part_number: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleItemChange = (index: number, field: keyof WorkOrderLineItem, value: any) => {
    const newItems = [...items];
    
    if (field === 'quantity' || field === 'price') {
      newItems[index][field] = parseFloat(value) || 0;
    } else {
      (newItems[index] as any)[field] = value;
    }
    
    onChange(newItems);
  };

  const handleNewItemChange = (field: keyof WorkOrderLineItem, value: any) => {
    setNewItem({
      ...newItem,
      [field]: value,
    });
  };

  const handleInventoryItemSelect = (inventoryItem: any, index: number | null) => {
    if (index === null) {
      // For new item row
      setNewItem({
        ...newItem,
        part_number: inventoryItem.sku || '',
        description: inventoryItem.name || '',
        price: inventoryItem.price || 0,
      });
    } else {
      // For existing item
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        part_number: inventoryItem.sku || '',
        description: inventoryItem.name || '',
        price: inventoryItem.price || 0,
      };
      onChange(newItems);
    }
    setActiveSearchField(null);
  };

  const handleSearchClick = (type: 'part_number' | 'description', index: number | null, searchTerm: string) => {
    if (index === -1) {
      // Special case for closing the popover
      setActiveSearchField(null);
      return;
    }
    
    searchInventory(searchTerm);
    setActiveSearchField({ type, index });
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  return (
    <div className="space-y-4">
      <LineItemsTable
        items={items}
        newItem={newItem}
        readOnly={readOnly}
        onItemChange={handleItemChange}
        onRemoveItem={handleRemoveItem}
        onNewItemChange={handleNewItemChange}
        onAddItem={handleAddItem}
        onSearchClick={handleSearchClick}
        onInventoryItemSelect={handleInventoryItemSelect}
        activeSearchField={activeSearchField}
        searchResults={searchResults}
      />
      
      <LineItemTotals subtotal={calculateSubtotal()} />
    </div>
  );
};
