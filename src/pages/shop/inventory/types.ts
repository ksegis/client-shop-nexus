import { z } from 'zod';

// Preserve existing InventoryItem interface and extend it with FTP fields
export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  cost: number | null;
  category: string | null;
  supplier: string | null;
  reorder_level: number | null;
  core_charge: number | null;
  created_at: string;
  updated_at: string;
  
  // Extended FTP Inventory fields (all optional to maintain compatibility)
  vendor_name?: string | null;
  vcpn?: string | null;
  vendor_code?: string | null;
  manufacturer_part_no?: string | null;
  long_description?: string | null;
  jobber_price?: number | null;
  upsable?: boolean | null;
  case_qty?: number | null;
  is_non_returnable?: boolean | null;
  prop65_toxicity?: string | null;
  upc_code?: string | null;
  is_oversized?: boolean | null;
  weight?: number | null;
  height?: number | null;
  length?: number | null;
  width?: number | null;
  aaia_code?: string | null;
  is_hazmat?: boolean | null;
  is_chemical?: boolean | null;
  ups_ground_assessorial?: number | null;
  us_ltl?: number | null;
  east_qty?: number | null;
  midwest_qty?: number | null;
  california_qty?: number | null;
  southeast_qty?: number | null;
  pacific_nw_qty?: number | null;
  texas_qty?: number | null;
  great_lakes_qty?: number | null;
  florida_qty?: number | null;
  total_qty?: number | null;
  kit_components?: string | null;
  is_kit?: boolean | null;
  
  // Upload tracking fields
  ftp_upload_id?: string | null;
  ftp_uploaded_at?: string | null;
  ftp_filename?: string | null;
}

// Preserve existing form schema
export const inventoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  price: z.number().min(0, 'Price cannot be negative'),
  cost: z.number().min(0, 'Cost cannot be negative').optional().nullable(),
  category: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  reorder_level: z.number().min(0, 'Reorder level cannot be negative').optional().nullable(),
  core_charge: z.number().min(0, 'Core charge cannot be negative').optional().nullable(),
});

// Preserve existing form values type
export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

// Additional types for FTP functionality (new, doesn't affect existing code)
export interface FTPUploadLog {
  id: string;
  filename: string;
  upload_date: string;
  records_processed: number;
  records_successful: number;
  records_failed: number;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string | null;
  uploaded_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CSVInventoryRecord {
  VendorName: string;
  VCPN: string;
  VendorCode: string;
  PartNumber: string;
  ManufacturerPartNo: string;
  LongDescription: string;
  JobberPrice: string;
  Cost: string;
  UPSable: string;
  CoreCharge: string;
  CaseQty: string;
  IsNonReturnable: string;
  Prop65Toxicity: string;
  UPCCode: string;
  IsOversized: string;
  Weight: string;
  Height: string;
  Length: string;
  Width: string;
  AAIACode: string;
  IsHazmat: string;
  IsChemical: string;
  UPS_Ground_Assessorial: string;
  US_LTL: string;
  EastQty: string;
  MidwestQty: string;
  CaliforniaQty: string;
  SoutheastQty: string;
  PacificNWQty: string;
  TexasQty: string;
  GreatLakesQty: string;
  FloridaQty: string;
  TotalQty: string;
  KitComponents: string;
  IsKit: string;
}

// Extended form schema_for FTP fields (optional, for future use)
export const extendedInventoryFormSchema = inventoryFormSchema.extend({
  vendor_name: z.string().optional().nullable(),
  vcpn: z.string().optional().nullable(),
  vendor_code: z.string().optional().nullable(),
  manufacturer_part_no: z.string().optional().nullable(),
  long_description: z.string().optional().nullable(),
  jobber_price: z.number().min(0).optional().nullable(),
  upsable: z.boolean().optional().nullable(),
  case_qty: z.number().min(1).optional().nullable(),
  is_non_returnable: z.boolean().optional().nullable(),
  prop65_toxicity: z.string().optional().nullable(),
  upc_code: z.string().optional().nullable(),
  is_oversized: z.boolean().optional().nullable(),
  weight: z.number().min(0).optional().nullable(),
  height: z.number().min(0).optional().nullable(),
  length: z.number().min(0).optional().nullable(),
  width: z.number().min(0).optional().nullable(),
  aaia_code: z.string().optional().nullable(),
  is_hazmat: z.boolean().optional().nullable(),
  is_chemical: z.boolean().optional().nullable(),
  ups_ground_assessorial: z.number().min(0).optional().nullable(),
  us_ltl: z.number().min(0).optional().nullable(),
  east_qty: z.number().min(0).optional().nullable(),
  midwest_qty: z.number().min(0).optional().nullable(),
  california_qty: z.number().min(0).optional().nullable(),
  southeast_qty: z.number().min(0).optional().nullable(),
  pacific_nw_qty: z.number().min(0).optional().nullable(),
  texas_qty: z.number().min(0).optional().nullable(),
  great_lakes_qty: z.number().min(0).optional().nullable(),
  florida_qty: z.number().min(0).optional().nullable(),
  total_qty: z.number().min(0).optional().nullable(),
  kit_components: z.string().optional().nullable(),
  is_kit: z.boolean().optional().nullable(),
});

export type ExtendedInventoryFormValues = z.infer<typeof extendedInventoryFormSchema>;

