import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Grid, List, Plus, Eye, X, ChevronDown, ShoppingCart, Minus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://pqmjfwmbitodwtpedlle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbWpmd21iaXRvZHd0cGVkbGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNDI0NzEsImV4cCI6MjA0ODkxODQ3MX0.nJYJcjmSAOVR7VKUB_J2lqKIGGUvj-WXahIDWOM6gQI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Enhanced interfaces
interface InventoryPart {
  id: string;
  name: string;
  sku: string;
  description?: string;
  LongDescription?: string;
  keystone_vcpn?: string;
  manufacturer_part_no?: string;
  compatibility?: string;
  brand?: string;
  category?: string;
  location?: string;
  in_stock: boolean;
  quantity_on_hand: number;
  cost: number;
  list_price: number;
  stockStatus: 'In Stock' | 'Out of Stock';
  vehicleCategory: string;
  partCategory: string;
  modelYear: string;
  vehicleModel: string;
  isKit?: boolean;
  pricingSource?: string;
}

interface CategorySummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
  models: string[];
  keywords: string[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  category?: string;
  image?: string;
  inStock: boolean;
  maxQuantity: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Vehicle categories mapping
const VEHICLE_CATEGORIES = [
  {
    id: 'ford',
    name: 'Ford',
    keywords: ['FORD', 'F150', 'F250', 'F350', 'F450', 'F550', 'RANGER', 'BRONCO', 'EXPEDITION', 'EXPLORER'],
    models: ['F150', 'F250', 'F350', 'F450', 'F550', 'RANGER', 'BRONCO', 'EXPEDITION', 'EXPLORER'],
    description: 'Ford truck and SUV parts including F-Series, Ranger, Bronco, and more',
    icon: '🚛',
    color: 'bg-blue-500'
  },
  {
    id: 'chevrolet',
    name: 'Chevrolet',
    keywords: ['CHEVROLET', 'CHEVY', 'SILVERADO', 'COLORADO', 'TAHOE', 'SUBURBAN', 'AVALANCHE'],
    models: ['SILVERADO', 'COLORADO', 'TAHOE', 'SUBURBAN', 'AVALANCHE'],
    description: 'Chevrolet truck and SUV parts including Silverado, Colorado, Tahoe, and more',
    icon: '🚚',
    color: 'bg-red-500'
  },
  {
    id: 'ram',
    name: 'RAM',
    keywords: ['RAM', 'DODGE', '1500', '2500', '3500', '4500', '5500'],
    models: ['1500', '2500', '3500', '4500', '5500'],
    description: 'RAM truck parts including 1500, 2500, 3500 series and heavy duty models',
    icon: '🐏',
    color: 'bg-gray-700'
  },
  {
    id: 'gmc',
    name: 'GMC',
    keywords: ['GMC', 'SIERRA', 'CANYON', 'YUKON', 'ACADIA'],
    models: ['SIERRA', 'CANYON', 'YUKON', 'ACADIA'],
    description: 'GMC truck and SUV parts including Sierra, Canyon, Yukon, and more',
    icon: '🔧',
    color: 'bg-yellow-600'
  },
  {
    id: 'toyota',
    name: 'Toyota',
    keywords: ['TOYOTA', 'TUNDRA', 'TACOMA', '4RUNNER', 'SEQUOIA', 'HIGHLANDER'],
    models: ['TUNDRA', 'TACOMA', '4RUNNER', 'SEQUOIA', 'HIGHLANDER'],
    description: 'Toyota truck and SUV parts including Tundra, Tacoma, 4Runner, and more',
    icon: '🏔️',
    color: 'bg-green-600'
  },
  {
    id: 'jeep',
    name: 'Jeep',
    keywords: ['JEEP', 'WRANGLER', 'GLADIATOR', 'CHEROKEE', 'GRAND CHEROKEE', 'COMPASS'],
    models: ['WRANGLER', 'GLADIATOR', 'CHEROKEE', 'GRAND CHEROKEE', 'COMPASS'],
    description: 'Jeep parts including Wrangler, Gladiator, Cherokee, and more',
    icon: '🏕️',
    color: 'bg-green-700'
  },
  {
    id: 'nissan',
    name: 'Nissan',
    keywords: ['NISSAN', 'FRONTIER', 'TITAN', 'ARMADA', 'PATHFINDER'],
    models: ['FRONTIER', 'TITAN', 'ARMADA', 'PATHFINDER'],
    description: 'Nissan truck and SUV parts including Frontier, Titan, Armada, and more',
    icon: '🌊',
    color: 'bg-blue-600'
  },
  {
    id: 'honda',
    name: 'Honda',
    keywords: ['HONDA', 'RIDGELINE', 'PILOT', 'PASSPORT'],
    models: ['RIDGELINE', 'PILOT', 'PASSPORT'],
    description: 'Honda truck and SUV parts including Ridgeline, Pilot, Passport, and more',
    icon: '🏁',
    color: 'bg-red-600'
  },
  {
    id: 'universal',
    name: 'Universal/Other',
    keywords: [],
    models: [],
    description: 'Universal parts and accessories compatible with multiple vehicle brands',
    icon: '🔧',
    color: 'bg-gray-500'
  }
];

// Part categories mapping
const PART_CATEGORIES = {
  'BRAKE': 'Brakes',
  'BRAKES': 'Brakes',
  'BRAKE PAD': 'Brakes',
  'BRAKE DISC': 'Brakes',
  'BRAKE ROTOR': 'Brakes',
  'BRAKE KIT': 'Brakes',
  'BRAKE HOSE': 'Brakes',
  'BRAKE FLUID': 'Brakes',
  'LIGHT': 'Lighting',
  'LIGHTING': 'Lighting',
  'LED': 'Lighting',
  'HEADLIGHT': 'Lighting',
  'TAIL LIGHT': 'Lighting',
  'FOG LIGHT': 'Lighting',
  'TURN SIGNAL': 'Lighting',
  'BULB': 'Lighting',
  'LAMP': 'Lighting',
  'FILTER': 'Filters',
  'AIR FILTER': 'Filters',
  'OIL FILTER': 'Filters',
  'FUEL FILTER': 'Filters',
  'CABIN FILTER': 'Filters',
  'ENGINE': 'Engine Components',
  'MOTOR': 'Engine Components',
  'PISTON': 'Engine Components',
  'GASKET': 'Engine Components',
  'BELT': 'Engine Components',
  'HOSE': 'Engine Components',
  'PUMP': 'Engine Components',
  'SUSPENSION': 'Suspension',
  'SHOCK': 'Suspension',
  'STRUT': 'Suspension',
  'SPRING': 'Suspension',
  'COIL': 'Suspension',
  'BUSHING': 'Suspension',
  'SWAY BAR': 'Suspension',
  'CONTROL ARM': 'Suspension',
  'EXHAUST': 'Exhaust',
  'MUFFLER': 'Exhaust',
  'CATALYTIC': 'Exhaust',
  'PIPE': 'Exhaust',
  'INTAKE': 'Air Intake',
  'AIR INTAKE': 'Air Intake',
  'THROTTLE': 'Air Intake',
  'SEAT': 'Interior Accessories',
  'FLOOR MAT': 'Interior Accessories',
  'COVER': 'Interior Accessories',
  'CONSOLE': 'Interior Accessories',
  'MIRROR': 'Interior Accessories',
  'BUMPER': 'Exterior Accessories',
  'GRILLE': 'Exterior Accessories',
  'FENDER': 'Exterior Accessories',
  'HOOD': 'Exterior Accessories',
  'DOOR': 'Exterior Accessories',
  'WINDOW': 'Exterior Accessories',
  'TIRE': 'Wheels & Tires',
  'WHEEL': 'Wheels & Tires',
  'RIM': 'Wheels & Tires',
  'HUB': 'Wheels & Tires',
  'BEARING': 'Wheels & Tires',
  'BATTERY': 'Electrical',
  'ALTERNATOR': 'Electrical',
  'STARTER': 'Electrical',
  'IGNITION': 'Electrical',
  'SPARK PLUG': 'Electrical',
  'WIRE': 'Electrical',
  'FUSE': 'Electrical',
  'RELAY': 'Electrical',
  'SENSOR': 'Electrical',
  'SWITCH': 'Electrical',
  'TOOL': 'Tools & Equipment',
  'WRENCH': 'Tools & Equipment',
  'SOCKET': 'Tools & Equipment',
  'JACK': 'Tools & Equipment',
  'LIFT': 'Tools & Equipment',
  'KIT': 'Kits & Sets',
  'SET': 'Kits & Sets',
  'PACKAGE': 'Kits & Sets',
  'BUNDLE': 'Kits & Sets'
};

// Utility functions
const safeString = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

const categorizeVehicle = (longDescription: string): string => {
  const desc = safeString(longDescription).toUpperCase();
  
  for (const category of VEHICLE_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (desc.includes(keyword)) {
        return category.name;
      }
    }
  }
  
  return 'Universal/Other';
};

const categorizePart = (longDescription: string): string => {
  const desc = safeString(longDescription).toUpperCase();
  
  for (const [keyword, category] of Object.entries(PART_CATEGORIES)) {
    if (desc.includes(keyword)) {
      return category;
    }
  }
  
  return 'Uncategorized';
};

const extractModelYear = (longDescription: string): string => {
  const currentYear = new Date().getFullYear();
  const maxYear = Math.min(currentYear, 2024);
  
  const yearMatch = safeString(longDescription).match(/\b(19[9]\d|20[0-2]\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 1990 && year <= maxYear) {
      return yearMatch[1];
    }
  }
  return "";
};

const extractVehicleModel = (longDescription: string, vehicleCategory: string): string => {
  const desc = safeString(longDescription).toUpperCase();
  const category = VEHICLE_CATEGORIES.find(cat => cat.name === vehicleCategory);
  
  if (category) {
    for (const model of category.models) {
      if (desc.includes(model)) {
        return model;
      }
    }
  }
  
  return "";
};

const getStockStatus = (inStock: boolean): 'In Stock' | 'Out of Stock' => {
  return inStock ? 'In Stock' : 'Out of Stock';
};

const checkIfKit = (id: string): boolean => {
  return id.toLowerCase().includes('kit') || id.toLowerCase().includes('set');
};

// Enhanced error logging function
const logError = (context: string, error: any) => {
  console.error(`❌ ${context}:`, {
    message: error?.message || 'Unknown error',
    details: error?.details || 'No details',
    hint: error?.hint || 'No hint',
    code: error?.code || 'No code',
    fullError: error
  });
};

// Process raw inventory item into InventoryPart
const processInventoryItem = (item: any): InventoryPart => {
  console.log('🔍 Processing item:', item.name || item.sku, 'Fields:', Object.keys(item));
  
  // Try multiple field names for list price
  let listPrice = 0;
  let cost = 0;
  let pricingSource = 'none';
  
  // Check for list_price field
  if (item.list_price !== null && item.list_price !== undefined) {
    listPrice = Number(item.list_price) || 0;
    pricingSource = 'list_price_field';
    console.log('💰 Found list_price field:', listPrice);
  }
  // Check for price field
  else if (item.price !== null && item.price !== undefined) {
    listPrice = Number(item.price) || 0;
    pricingSource = 'price_field';
    console.log('💰 Found price field:', listPrice);
  }
  // Check for selling_price field
  else if (item.selling_price !== null && item.selling_price !== undefined) {
    listPrice = Number(item.selling_price) || 0;
    pricingSource = 'selling_price_field';
    console.log('💰 Found selling_price field:', listPrice);
  }
  // Check for retail_price field
  else if (item.retail_price !== null && item.retail_price !== undefined) {
    listPrice = Number(item.retail_price) || 0;
    pricingSource = 'retail_price_field';
    console.log('💰 Found retail_price field:', listPrice);
  }
  // Check for unit_price field
  else if (item.unit_price !== null && item.unit_price !== undefined) {
    listPrice = Number(item.unit_price) || 0;
    pricingSource = 'unit_price_field';
    console.log('💰 Found unit_price field:', listPrice);
  } else {
    console.log('💰 No price field found, using 0');
  }
  
  // Try multiple field names for cost
  if (item.cost !== null && item.cost !== undefined) {
    cost = Number(item.cost) || 0;
  } else if (item.unit_cost !== null && item.unit_cost !== undefined) {
    cost = Number(item.unit_cost) || 0;
  } else if (item.purchase_price !== null && item.purchase_price !== undefined) {
    cost = Number(item.purchase_price) || 0;
  }

  console.log('💰 FINAL PRICING:');
  console.log('💰 List Price:', listPrice);
  console.log('💰 Cost:', cost);
  console.log('💰 Source:', pricingSource);

  return {
    id: item.id || item.sku || `part-${Math.random()}`,
    name: safeString(item.name || item.description || 'Unknown Part'),
    sku: safeString(item.sku || ''),
    description: safeString(item.description || ''),
    LongDescription: safeString(item.LongDescription || ''),
    keystone_vcpn: safeString(item.keystone_vcpn || ''),
    manufacturer_part_no: safeString(item.manufacturer_part_no || ''),
    compatibility: safeString(item.compatibility || ''),
    brand: safeString(item.brand || 'Unknown'),
    category: safeString(item.category || ''),
    location: safeString(item.location || ''),
    in_stock: Boolean(item.in_stock),
    quantity_on_hand: Number(item.quantity_on_hand) || 0,
    cost: cost,
    list_price: listPrice,
    stockStatus: getStockStatus(Boolean(item.in_stock)),
    vehicleCategory: categorizeVehicle(item.LongDescription || ''),
    partCategory: categorizePart(item.LongDescription || ''),
    modelYear: extractModelYear(item.LongDescription || ''),
    vehicleModel: extractVehicleModel(item.LongDescription || '', categorizeVehicle(item.LongDescription || '')),
    isKit: checkIfKit(item.id || item.sku || ''),
    pricingSource: pricingSource
  };
};

// Fuzzy search function with safe string handling
const fuzzySearch = (searchTerm: string, parts: InventoryPart[]): InventoryPart[] => {
  if (!searchTerm || !searchTerm.trim()) {
    return parts;
  }
  
  const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
  
  if (searchWords.length === 0) {
    return parts;
  }
  
  const scoredParts = parts.map(part => {
    const fields = {
      name: { value: safeString(part.name).toLowerCase(), weight: 30 },
      sku: { value: safeString(part.sku).toLowerCase(), weight: 20 },
      description: { value: safeString(part.description).toLowerCase(), weight: 20 },
      LongDescription: { value: safeString(part.LongDescription).toLowerCase(), weight: 25 },
      manufacturer_part_no: { value: safeString(part.manufacturer_part_no).toLowerCase(), weight: 15 },
      compatibility: { value: safeString(part.compatibility).toLowerCase(), weight: 10 },
      brand: { value: safeString(part.brand).toLowerCase(), weight: 5 },
      vehicleCategory: { value: safeString(part.vehicleCategory).toLowerCase(), weight: 8 },
      partCategory: { value: safeString(part.partCategory).toLowerCase(), weight: 8 },
      modelYear: { value: safeString(part.modelYear).toLowerCase(), weight: 5 },
      vehicleModel: { value: safeString(part.vehicleModel).toLowerCase(), weight: 10 },
      keystone_vcpn: { value: safeString(part.keystone_vcpn).toLowerCase(), weight: 15 },
      category: { value: safeString(part.category).toLowerCase(), weight: 5 },
      location: { value: safeString(part.location).toLowerCase(), weight: 3 }
    };

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const [fieldName, fieldData] of Object.entries(fields)) {
      maxPossibleScore += fieldData.weight;
      
      for (const word of searchWords) {
        if (fieldData.value.includes(word)) {
          const exactMatch = fieldData.value === word;
          const startsWithMatch = fieldData.value.startsWith(word);
          
          if (exactMatch) {
            totalScore += fieldData.weight;
          } else if (startsWithMatch) {
            totalScore += fieldData.weight * 0.8;
          } else {
            totalScore += fieldData.weight * 0.5;
          }
        }
      }
    }

    const relevanceScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    return {
      part,
      score: relevanceScore
    };
  });

  const filteredParts = scoredParts
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.part);

  return filteredParts;
};

// Cart drawer component
const CartDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  cart: { [key: string]: number };
  parts: InventoryPart[];
  onUpdateQuantity: (partId: string, quantity: number) => void;
  onRemoveItem: (partId: string) => void;
  onClearCart: () => void;
}> = ({ isOpen, onClose, cart, parts, onUpdateQuantity, onRemoveItem, onClearCart }) => {
  const cartItems = Object.entries(cart).map(([partId, quantity]) => {
    const part = parts.find(p => p.id === partId);
    return part ? { part, quantity } : null;
  }).filter(Boolean);

  const subtotal = cartItems.reduce((sum, item) => {
    if (item) {
      return sum + (item.part.list_price * item.quantity);
    }
    return sum;
  }, 0);

  const tax = subtotal * 0.08;
  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + tax + shipping;

  const handleCheckout = () => {
    console.log('🛒 Proceeding to checkout with items:', cartItems);
    alert('Checkout functionality would be implemented here');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Shopping Cart</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length === 0 ? (
              <div className="text-center text-gray-500">
                <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
                <p>Your cart is empty</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  if (!item) return null;
                  return (
                    <div key={item.part.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-sm">{item.part.name}</h3>
                        <button
                          onClick={() => onRemoveItem(item.part.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">SKU: {item.part.sku}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onUpdateQuantity(item.part.id, Math.max(0, item.quantity - 1))}
                            className="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.part.id, item.quantity + 1)}
                            className="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(item.part.list_price * item.quantity).toFixed(2)}</p>
                          <p className="text-xs text-gray-600">${item.part.list_price.toFixed(2)} each</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Checkout
                </button>
                <button
                  onClick={onClearCart}
                  className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Pagination component
const Pagination: React.FC<{
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}> = ({ pagination, onPageChange }) => {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems.toLocaleString()}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                  page === currentPage
                    ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

// Main component
const PartsCatalog: React.FC = () => {
  console.log('🔄 PartsCatalog component rendering...');
  
  // State management
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryView, setShowCategoryView] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);
  const [showPartDetail, setShowPartDetail] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50
  });
  
  // Filter states
  const [selectedVehicleBrand, setSelectedVehicleBrand] = useState('');
  const [selectedVehicleModel, setSelectedVehicleModel] = useState('');
  const [selectedModelYear, setSelectedModelYear] = useState('');
  const [selectedPartType, setSelectedPartType] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  
  // Cart state
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [cartMessage, setCartMessage] = useState('');
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('partsCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('partsCart', JSON.stringify(cart));
  }, [cart]);

  // Clear cart message after 3 seconds
  useEffect(() => {
    if (cartMessage) {
      const timer = setTimeout(() => setCartMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [cartMessage]);

  // Load category statistics on mount
  useEffect(() => {
    const loadCategoryStats = async () => {
      try {
        setCategoriesLoading(true);
        console.log('📊 Loading category statistics...');

        // Simplified approach - get total count first
        const { count: totalCount, error: totalError } = await supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true });

        if (totalError) {
          logError('Error getting total count', totalError);
          throw totalError;
        }

        console.log('📊 Total inventory count:', totalCount);

        // For now, use estimated counts based on total
        // In production, you would create a materialized view or summary table
        const estimatedCounts = {
          ford: Math.floor((totalCount || 0) * 0.25),
          chevrolet: Math.floor((totalCount || 0) * 0.20),
          ram: Math.floor((totalCount || 0) * 0.15),
          gmc: Math.floor((totalCount || 0) * 0.10),
          toyota: Math.floor((totalCount || 0) * 0.08),
          jeep: Math.floor((totalCount || 0) * 0.07),
          nissan: Math.floor((totalCount || 0) * 0.05),
          honda: Math.floor((totalCount || 0) * 0.03),
          universal: Math.floor((totalCount || 0) * 0.07)
        };

        const categoryResults = VEHICLE_CATEGORIES.map(category => ({
          ...category,
          count: estimatedCounts[category.id as keyof typeof estimatedCounts] || 0
        }));

        setCategoryStats(categoryResults);
        console.log('✅ Category statistics loaded:', categoryResults);

      } catch (err) {
        logError('Error loading category statistics', err);
        // Fallback to showing categories with 0 counts
        setCategoryStats(VEHICLE_CATEGORIES.map(cat => ({ ...cat, count: 0 })));
        setError('Failed to load category statistics. Please try again.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategoryStats();
  }, []);

  // Load parts when category is selected
  useEffect(() => {
    if (!showCategoryView && selectedCategory) {
      loadCategoryParts();
    }
  }, [selectedCategory, showCategoryView, pagination.currentPage, searchTerm, selectedVehicleBrand, selectedVehicleModel, selectedModelYear, selectedPartType, selectedBrand, selectedStockStatus, priceRange]);

  const loadCategoryParts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Loading parts for category: ${selectedCategory}, page: ${pagination.currentPage}`);

      // Start with basic query
      let query = supabase.from('inventory').select('*', { count: 'exact' });

      // Apply category filter if not 'all'
      if (selectedCategory && selectedCategory !== 'all') {
        const category = VEHICLE_CATEGORIES.find(cat => cat.id === selectedCategory);
        if (category && category.keywords.length > 0) {
          // Use simple ILIKE for each keyword
          const keyword = category.keywords[0]; // Use first keyword for simplicity
          query = query.ilike('LongDescription', `%${keyword}%`);
          console.log(`🔍 Filtering by keyword: ${keyword}`);
        }
      }

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,LongDescription.ilike.%${searchTerm}%`);
        console.log(`🔍 Applying search filter: ${searchTerm}`);
      }

      // Apply stock status filter
      if (selectedStockStatus) {
        query = query.eq('in_stock', selectedStockStatus === 'In Stock');
        console.log(`🔍 Filtering by stock status: ${selectedStockStatus}`);
      }

      // Apply pagination
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage - 1;
      
      console.log(`📄 Applying pagination: ${startIndex} to ${endIndex}`);
      
      const { data, count, error } = await query.range(startIndex, endIndex);

      if (error) {
        logError('Error loading parts', error);
        throw error;
      }

      console.log(`✅ Loaded ${data?.length || 0} parts for page ${pagination.currentPage}`);
      console.log(`📊 Total count: ${count}`);

      // Process the parts
      const processedParts = (data || []).map(processInventoryItem);

      // Apply client-side filters that are hard to do in SQL
      let filteredParts = processedParts;

      if (selectedVehicleModel) {
        filteredParts = filteredParts.filter(part => part.vehicleModel === selectedVehicleModel);
        console.log(`🔍 Filtered by vehicle model: ${selectedVehicleModel}, remaining: ${filteredParts.length}`);
      }

      if (selectedModelYear) {
        filteredParts = filteredParts.filter(part => part.modelYear === selectedModelYear);
        console.log(`🔍 Filtered by model year: ${selectedModelYear}, remaining: ${filteredParts.length}`);
      }

      if (selectedPartType) {
        filteredParts = filteredParts.filter(part => part.partCategory === selectedPartType);
        console.log(`🔍 Filtered by part type: ${selectedPartType}, remaining: ${filteredParts.length}`);
      }

      if (selectedBrand) {
        filteredParts = filteredParts.filter(part => part.brand === selectedBrand);
        console.log(`🔍 Filtered by brand: ${selectedBrand}, remaining: ${filteredParts.length}`);
      }

      // Apply price range filter
      filteredParts = filteredParts.filter(part => 
        part.list_price >= priceRange[0] && part.list_price <= priceRange[1]
      );
      console.log(`🔍 Filtered by price range: $${priceRange[0]}-$${priceRange[1]}, remaining: ${filteredParts.length}`);

      // Apply fuzzy search if search term exists
      if (searchTerm.trim()) {
        filteredParts = fuzzySearch(searchTerm, filteredParts);
        console.log(`🔍 Applied fuzzy search, remaining: ${filteredParts.length}`);
      }

      setParts(filteredParts);
      
      // Update pagination info
      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
      
      setPagination(prev => ({
        ...prev,
        totalItems,
        totalPages
      }));

      console.log(`📊 Pagination updated: ${totalItems} total items, ${totalPages} total pages`);

    } catch (err) {
      logError('Error loading parts', err);
      setError(err instanceof Error ? err.message : 'Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  // Reset filters when navigating back to category view
  useEffect(() => {
    if (showCategoryView) {
      setSelectedVehicleBrand('');
      setSelectedVehicleModel('');
      setSelectedModelYear('');
      setSelectedPartType('');
      setSelectedBrand('');
      setSelectedStockStatus('');
      setSelectedRegion('');
      setPriceRange([0, 1000]);
      setSearchTerm('');
      setParts([]);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [showCategoryView]);

  // Reset vehicle model when vehicle brand changes
  useEffect(() => {
    setSelectedVehicleModel('');
  }, [selectedVehicleBrand]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchTerm, selectedVehicleBrand, selectedVehicleModel, selectedModelYear, selectedPartType, selectedBrand, selectedStockStatus, priceRange]);

  // Cart functions
  const addToCart = useCallback((part: InventoryPart) => {
    console.log('🛒 Adding to cart:', part.name, 'Price:', part.list_price);
    
    const partId = part.id;
    const currentQuantity = cart[partId] || 0;
    const newQuantity = currentQuantity + 1;

    setCart(prev => ({
      ...prev,
      [partId]: newQuantity
    }));
    
    setCartMessage(`✅ ${part.name} added to cart!`);
  }, [cart]);

  const updateCartQuantity = useCallback((partId: string, quantity: number) => {
    if (quantity <= 0) {
      const newCart = { ...cart };
      delete newCart[partId];
      setCart(newCart);
    } else {
      setCart(prev => ({
        ...prev,
        [partId]: quantity
      }));
    }
  }, [cart]);

  const removeFromCart = useCallback((partId: string) => {
    const newCart = { ...cart };
    delete newCart[partId];
    setCart(newCart);
    setCartMessage('Item removed from cart');
  }, [cart]);

  const clearCart = useCallback(() => {
    setCart({});
    setCartMessage('Cart cleared');
  }, []);

  // Computed values
  const cartItemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  // Get available options for filters (from currently loaded parts)
  const availableVehicleModels = useMemo(() => {
    if (!selectedVehicleBrand) return [];
    const category = VEHICLE_CATEGORIES.find(cat => cat.name === selectedVehicleBrand);
    return category ? category.models : [];
  }, [selectedVehicleBrand]);

  const availableModelYears = useMemo(() => {
    const years = [...new Set(parts.map(part => part.modelYear).filter(year => year))];
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [parts]);

  const availablePartTypes = useMemo(() => {
    return [...new Set(parts.map(part => part.partCategory).filter(category => category))].sort();
  }, [parts]);

  const availableBrands = useMemo(() => {
    return [...new Set(parts.map(part => part.brand).filter(brand => brand && brand !== 'Unknown'))].sort();
  }, [parts]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryView(false);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle global search
  const handleGlobalSearch = () => {
    if (globalSearchTerm.trim()) {
      setSearchTerm(globalSearchTerm);
      setSelectedCategory('all');
      setShowCategoryView(false);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedVehicleBrand('');
    setSelectedVehicleModel('');
    setSelectedModelYear('');
    setSelectedPartType('');
    setSelectedBrand('');
    setSelectedStockStatus('');
    setSelectedRegion('');
    setPriceRange([0, 1000]);
    setSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Parts Catalog</h1>
            <button
              onClick={() => setShowCartDrawer(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 relative"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Cart message */}
      {cartMessage && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-40">
          {cartMessage}
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCategoryView ? (
          // Category overview
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Truck Parts Catalog</h2>
              <p className="text-gray-600 mb-8">
                Browse our comprehensive selection of truck customization parts organized by category
              </p>
              
              {/* Global search */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search all parts by name, SKU, description, vehicle, part type..."
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGlobalSearch()}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {globalSearchTerm && (
                    <button
                      onClick={handleGlobalSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Search
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Category grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryStats.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center text-white text-2xl mr-4`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-gray-600">{category.count.toLocaleString()} parts</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  {category.models.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {category.models.slice(0, 4).map((model) => (
                        <span key={model} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {model}
                        </span>
                      ))}
                      {category.models.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{category.models.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Parts listing
          <div className="space-y-6">
            {/* Breadcrumb and header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowCategoryView(true)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ChevronDown className="h-4 w-4 mr-1 transform rotate-90" />
                  Back to Vehicle Categories
                </button>
                <span className="text-gray-400">|</span>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory === 'all' ? 'All Parts' : 
                   VEHICLE_CATEGORIES.find(cat => cat.id === selectedCategory)?.name + ' Parts'}
                </h2>
                <span className="text-gray-600">{pagination.totalItems.toLocaleString()} parts</span>
              </div>
              <button
                onClick={() => setShowCartDrawer(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 relative"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search and controls */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search parts by name, SKU, description, vehicle, model, year..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'grid' | 'list')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="grid">Category</option>
                  <option value="list">Name</option>
                </select>
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filters and content */}
            <div className="flex gap-6">
              {/* Filters sidebar */}
              <div className="w-64 space-y-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                    <button
                      onClick={resetFilters}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Vehicle Brand Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Brand</label>
                      <select
                        value={selectedVehicleBrand}
                        onChange={(e) => setSelectedVehicleBrand(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Vehicles</option>
                        {VEHICLE_CATEGORIES.filter(cat => cat.id !== 'universal').map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vehicle Model Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Model</label>
                      <select
                        value={selectedVehicleModel}
                        onChange={(e) => setSelectedVehicleModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        disabled={!selectedVehicleBrand}
                      >
                        <option value="">All Models</option>
                        {availableVehicleModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Model Year Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Model Year</label>
                      <select
                        value={selectedModelYear}
                        onChange={(e) => setSelectedModelYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Years</option>
                        {availableModelYears.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Part Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Part Type</label>
                      <select
                        value={selectedPartType}
                        onChange={(e) => setSelectedPartType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Part Types</option>
                        {availablePartTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Brand Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Brands</option>
                        {availableBrands.map((brand) => (
                          <option key={brand} value={brand}>
                            {brand}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stock Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
                      <select
                        value={selectedStockStatus}
                        onChange={(e) => setSelectedStockStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Stock Levels</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>

                    {/* Price Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Parts grid/list */}
              <div className="flex-1">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading parts...</p>
                  </div>
                ) : parts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Search className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or filters</p>
                    <button
                      onClick={resetFilters}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {parts.map((part) => (
                          <div key={part.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                            <div className="mb-4">
                              <h3 className="font-semibold text-gray-900 mb-1">{part.name}</h3>
                              <p className="text-sm text-gray-600">SKU: {part.sku}</p>
                              {part.pricingSource && (
                                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded mt-1">
                                  {part.pricingSource}
                                </span>
                              )}
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Brand:</span>
                                <span className="font-medium">{part.brand}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Price:</span>
                                <span className="font-bold text-green-600">${part.list_price.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Cost:</span>
                                <span>${part.cost.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Margin:</span>
                                <span className={part.list_price > part.cost ? 'text-blue-600' : 'text-red-600'}>
                                  {part.list_price > 0 ? (((part.list_price - part.cost) / part.list_price) * 100).toFixed(1) : 0}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Stock:</span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  part.stockStatus === 'In Stock' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {part.stockStatus} ({part.quantity_on_hand})
                                </span>
                              </div>
                            </div>

                            <div className="flex space-x-2 mb-4">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">East</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Midwest</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">West</span>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => addToCart(part)}
                                className="flex-1 bg-[#6B7FE8] hover:bg-[#5A6FD7] text-white px-4 py-2 rounded-lg flex items-center justify-center"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add to Cart
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPart(part);
                                  setShowPartDetail(true);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {parts.map((part) => (
                              <tr key={part.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{part.name}</div>
                                    <div className="text-sm text-gray-500">SKU: {part.sku}</div>
                                    {part.pricingSource && (
                                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded mt-1">
                                        {part.pricingSource}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.brand}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-bold text-green-600">${part.list_price.toFixed(2)}</div>
                                  <div className="text-sm text-gray-500">Cost: ${part.cost.toFixed(2)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    part.stockStatus === 'In Stock' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {part.stockStatus} ({part.quantity_on_hand})
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => addToCart(part)}
                                      className="bg-[#6B7FE8] hover:bg-[#5A6FD7] text-white px-3 py-1 rounded text-sm flex items-center"
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add to Cart
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedPart(part);
                                        setShowPartDetail(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    <Pagination
                      pagination={pagination}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Part detail dialog */}
      {showPartDetail && selectedPart && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowPartDetail(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{selectedPart.name}</h3>
                  <button
                    onClick={() => setShowPartDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">SKU:</span>
                      <p className="font-medium">{selectedPart.sku}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">VCPN:</span>
                      <p className="font-medium">{selectedPart.keystone_vcpn || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Brand:</span>
                      <p className="font-medium">{selectedPart.brand}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Category:</span>
                      <p className="font-medium">{selectedPart.partCategory}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Vehicle:</span>
                      <p className="font-medium">{selectedPart.vehicleCategory}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Model:</span>
                      <p className="font-medium">{selectedPart.vehicleModel || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Year:</span>
                      <p className="font-medium">{selectedPart.modelYear || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Stock:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedPart.stockStatus === 'In Stock' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedPart.stockStatus} ({selectedPart.quantity_on_hand})
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Price:</span>
                    <p className="text-2xl font-bold text-green-600">${selectedPart.list_price.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Cost:</span>
                    <p className="font-medium">${selectedPart.cost.toFixed(2)}</p>
                  </div>
                  
                  {selectedPart.description && (
                    <div>
                      <span className="text-sm text-gray-600">Description:</span>
                      <p className="text-sm">{selectedPart.description}</p>
                    </div>
                  )}
                  
                  {selectedPart.LongDescription && (
                    <div>
                      <span className="text-sm text-gray-600">Full Description:</span>
                      <p className="text-sm">{selectedPart.LongDescription}</p>
                    </div>
                  )}
                  
                  {selectedPart.pricingSource && (
                    <div>
                      <span className="text-sm text-gray-600">Pricing Source:</span>
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded ml-2">
                        {selectedPart.pricingSource}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    addToCart(selectedPart);
                    setShowPartDetail(false);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#6B7FE8] text-base font-medium text-white hover:bg-[#5A6FD7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </button>
                <button
                  onClick={() => setShowPartDetail(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      <CartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        cart={cart}
        parts={parts}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default PartsCatalog;

