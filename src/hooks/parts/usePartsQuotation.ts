
import { useState } from 'react';
import { PartOrderItem } from '@/types/parts';

export interface QuotationItem extends PartOrderItem {
  id?: string;
  name?: string;
  sku?: string;
}

export function usePartsQuotation() {
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  
  const addToQuotation = (item: PartOrderItem) => {
    console.log('Adding item to quotation:', item);
    
    // Check if item already exists in quotation
    const existingItemIndex = quotationItems.findIndex(
      existing => existing.part_id === item.part_id
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      setQuotationItems(prev => 
        prev.map((existing, index) => 
          index === existingItemIndex 
            ? { ...existing, quantity: existing.quantity + item.quantity }
            : existing
        )
      );
    } else {
      // Add new item
      setQuotationItems(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
    }
  };
  
  const removeFromQuotation = (partId: string) => {
    console.log('Removing item from quotation:', partId);
    setQuotationItems(prev => prev.filter(item => item.part_id !== partId));
  };
  
  const updateQuantity = (partId: string, quantity: number) => {
    console.log('Updating quantity for part:', partId, 'to:', quantity);
    if (quantity <= 0) {
      removeFromQuotation(partId);
      return;
    }
    
    setQuotationItems(prev =>
      prev.map(item =>
        item.part_id === partId ? { ...item, quantity } : item
      )
    );
  };
  
  const clearQuotation = () => {
    console.log('Clearing quotation');
    setQuotationItems([]);
  };
  
  const getQuotationTotal = () => {
    return quotationItems.reduce((total, item) => {
      const itemTotal = (item.price * item.quantity) + (item.core_charge || 0);
      return total + itemTotal;
    }, 0);
  };
  
  return {
    quotationItems,
    addToQuotation,
    removeFromQuotation,
    updateQuantity,
    clearQuotation,
    getQuotationTotal
  };
}
