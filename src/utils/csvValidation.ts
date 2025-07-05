import { CSVInventoryRecord } from '@/pages/shop/inventory/types';

export interface ValidationResult {
  isValid: boolean;
  corrected: boolean;
  notes: string[];
  errors: string[];
}

export interface ProcessedCSVRecord {
  original: CSVInventoryRecord;
  processed: any;
  validation: ValidationResult;
  rowNumber: number;
}

/**
 * Normalize SKU by removing Excel formatting
 * Converts ="10406" to 10406
 */
export function normalizeSKU(sku: string): string {
  if (!sku) return '';
  
  // Remove Excel formula formatting: ="value" -> value
  let normalized = sku.toString().trim();
  
  // Remove leading = and surrounding quotes
  if (normalized.startsWith('=')) {
    normalized = normalized.substring(1);
  }
  
  // Remove surrounding quotes
  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1);
  }
  
  return normalized.trim();
}

/**
 * Generate VCPN from vendor code and SKU
 */
export function generateVCPN(vendorCode: string, sku: string): string {
  if (!vendorCode || !sku) return '';
  return `${vendorCode}${sku}`;
}

/**
 * Calculate total quantity from warehouse quantities
 */
export function calculateTotalQuantity(record: CSVInventoryRecord): number {
  const quantities = [
    parseInt(record.EastQty) || 0,
    parseInt(record.MidwestQty) || 0,
    parseInt(record.CaliforniaQty) || 0,
    parseInt(record.SoutheastQty) || 0,
    parseInt(record.PacificNWQty) || 0,
    parseInt(record.TexasQty) || 0,
    parseInt(record.GreatLakesQty) || 0,
    parseInt(record.FloridaQty) || 0,
  ];
  
  return quantities.reduce((sum, qty) => sum + qty, 0);
}

/**
 * Convert string to boolean
 */
export function parseBoolean(value: string): boolean {
  if (!value) return false;
  const normalized = value.toString().toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/**
 * Convert string to number with fallback
 */
export function parseNumber(value: string, fallback: number = 0): number {
  if (!value) return fallback;
  const parsed = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Convert string to integer with fallback
 */
export function parseInteger(value: string, fallback: number = 0): number {
  if (!value) return fallback;
  const parsed = parseInt(value.toString().replace(/[^0-9-]/g, ''));
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Validate and process a single CSV record
 */
export function validateCSVRecord(record: CSVInventoryRecord, rowNumber: number): ProcessedCSVRecord {
  const validation: ValidationResult = {
    isValid: true,
    corrected: false,
    notes: [],
    errors: []
  };

  // Step 1: Normalize SKU (PartNumber)
  const originalSKU = record.PartNumber;
  const normalizedSKU = normalizeSKU(originalSKU);
  
  if (originalSKU !== normalizedSKU) {
    validation.corrected = true;
    validation.notes.push(`SKU normalized from "${originalSKU}" to "${normalizedSKU}"`);
  }

  // Step 2: Validate required fields
  if (!record.VendorCode || record.VendorCode.trim() === '') {
    validation.isValid = false;
    validation.errors.push('VendorCode is required');
  }

  if (!normalizedSKU || normalizedSKU.trim() === '') {
    validation.isValid = false;
    validation.errors.push('PartNumber (SKU) is required');
  }

  // Step 3: VCPN validation and auto-correction
  let correctedVCPN = record.VCPN;
  if (record.VendorCode && normalizedSKU) {
    const expectedVCPN = generateVCPN(record.VendorCode, normalizedSKU);
    
    if (!record.VCPN || record.VCPN.trim() === '' || record.VCPN !== expectedVCPN) {
      correctedVCPN = expectedVCPN;
      validation.corrected = true;
      
      if (!record.VCPN || record.VCPN.trim() === '') {
        validation.notes.push(`VCPN auto-generated: "${expectedVCPN}"`);
      } else {
        validation.notes.push(`VCPN corrected from "${record.VCPN}" to "${expectedVCPN}"`);
      }
    }
  }

  // Step 4: Total quantity validation and correction
  const calculatedTotal = calculateTotalQuantity(record);
  const originalTotal = parseInteger(record.TotalQty);
  let correctedTotal = originalTotal;

  if (calculatedTotal !== originalTotal) {
    correctedTotal = calculatedTotal;
    validation.corrected = true;
    validation.notes.push(`TotalQty corrected from ${originalTotal} to ${calculatedTotal}`);
  }

  // Step 5: Process all fields with type conversion
  const processed = {
    // Basic identification
    vendor_name: record.VendorName || null,
    vcpn: correctedVCPN,
    vendor_code: record.VendorCode || null,
    part_number: normalizedSKU, // This maps to SKU in inventory table
    manufacturer_part_no: record.ManufacturerPartNo || null,
    long_description: record.LongDescription || null,
    
    // Pricing
    jobber_price: parseNumber(record.JobberPrice),
    cost: parseNumber(record.Cost),
    core_charge: parseNumber(record.CoreCharge),
    
    // Physical properties
    weight: parseNumber(record.Weight),
    height: parseNumber(record.Height),
    length: parseNumber(record.Length),
    width: parseNumber(record.Width),
    
    // Quantities
    east_qty: parseInteger(record.EastQty),
    midwest_qty: parseInteger(record.MidwestQty),
    california_qty: parseInteger(record.CaliforniaQty),
    southeast_qty: parseInteger(record.SoutheastQty),
    pacific_nw_qty: parseInteger(record.PacificNWQty),
    texas_qty: parseInteger(record.TexasQty),
    great_lakes_qty: parseInteger(record.GreatLakesQty),
    florida_qty: parseInteger(record.FloridaQty),
    total_qty: correctedTotal,
    calculated_total_qty: calculatedTotal,
    
    // Boolean flags
    upsable: parseBoolean(record.UPSable),
    is_non_returnable: parseBoolean(record.IsNonReturnable),
    is_oversized: parseBoolean(record.IsOversized),
    is_hazmat: parseBoolean(record.IsHazmat),
    is_chemical: parseBoolean(record.IsChemical),
    is_kit: parseBoolean(record.IsKit),
    
    // Other fields
    case_qty: parseInteger(record.CaseQty),
    prop65_toxicity: record.Prop65Toxicity || null,
    upc_code: record.UPCCode || null,
    aaia_code: record.AAIACode || null,
    ups_ground_assessorial: parseNumber(record.UPS_Ground_Assessorial),
    us_ltl: parseNumber(record.US_LTL),
    kit_components: record.KitComponents || null,
    
    // For inventory table compatibility
    name: record.LongDescription || record.PartNumber || 'Unknown Item',
    description: record.LongDescription || null,
    sku: normalizedSKU,
    quantity: correctedTotal, // Map total_qty to quantity for compatibility
    price: parseNumber(record.JobberPrice),
    category: null, // Not in CSV
    supplier: record.VendorName || null,
    reorder_level: null, // Not in CSV
  };

  return {
    original: record,
    processed,
    validation,
    rowNumber
  };
}

/**
 * Parse CSV content into records
 */
export function parseCSVContent(csvContent: string): CSVInventoryRecord[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
  
  // Validate required headers
  const requiredHeaders = ['VendorName', 'VCPN', 'VendorCode', 'PartNumber'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  // Parse data rows
  const records: CSVInventoryRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const record: any = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    // Only include records with essential data
    if (record.VendorName || record.PartNumber || record.LongDescription) {
      records.push(record as CSVInventoryRecord);
    }
  }

  return records;
}

/**
 * Process entire CSV file
 */
export function processCSVFile(csvContent: string): ProcessedCSVRecord[] {
  const records = parseCSVContent(csvContent);
  return records.map((record, index) => validateCSVRecord(record, index + 2)); // +2 for header and 1-based indexing
}

/**
 * Generate validation summary
 */
export function generateValidationSummary(processedRecords: ProcessedCSVRecord[]) {
  const summary = {
    total: processedRecords.length,
    valid: 0,
    invalid: 0,
    corrected: 0,
    errors: [] as string[],
    corrections: [] as string[]
  };

  processedRecords.forEach(record => {
    if (record.validation.isValid) {
      summary.valid++;
    } else {
      summary.invalid++;
      summary.errors.push(...record.validation.errors.map(err => `Row ${record.rowNumber}: ${err}`));
    }
    
    if (record.validation.corrected) {
      summary.corrected++;
      summary.corrections.push(...record.validation.notes.map(note => `Row ${record.rowNumber}: ${note}`));
    }
  });

  return summary;
}

