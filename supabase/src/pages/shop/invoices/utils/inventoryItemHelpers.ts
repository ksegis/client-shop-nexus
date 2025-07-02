
import { InventoryItem } from '@/pages/shop/inventory/types';
import { InvoiceLineItem } from '../types';

export const extractInventoryItemData = (inventoryItem: InventoryItem) => {
  // Extract values with proper type safety and detailed logging
  const partNumber = inventoryItem.sku || '';
  const itemDescription = inventoryItem.name || '';
  const price = typeof inventoryItem.price === 'number' ? inventoryItem.price : 0;
  const vendor = inventoryItem.supplier || '';
  
  console.log("Extracted inventory item data:", {
    partNumber,
    itemDescription,
    price,
    vendor
  });
  
  return { partNumber, itemDescription, price, vendor };
};

export const updateLineItemFromInventoryItem = (
  lineItem: InvoiceLineItem, 
  inventoryItem: InventoryItem
): InvoiceLineItem => {
  const { partNumber, itemDescription, price, vendor } = extractInventoryItemData(inventoryItem);
  
  return {
    ...lineItem,
    part_number: partNumber,
    description: itemDescription,
    price: price,
    vendor: vendor || lineItem.vendor,
  };
};
