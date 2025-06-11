// =====================================================
// PHASE 1 - WEEK 3: KEYSTONE SOAP CLIENT BASE
// Base SOAP client for Keystone API integration
// =====================================================

import { XMLParser } from 'fast-xml-parser';
import CryptoJS from 'crypto-js';

export interface KeystoneConfig {
  accountNumber: string;
  securityKey: string;
  environment: 'development' | 'production';
  apiEndpoint: string;
  wsdlUrl: string;
  approvedIPs: string[];
}

export interface KeystoneResponse {
  success: boolean;
  data?: any;
  statusCode?: string;
  statusMessage?: string;
  error?: string;
  responseTime?: number;
}

export interface SOAPCallOptions {
  method: string;
  parameters: Record<string, any>;
  timeout?: number;
}

/**
 * Base SOAP client for Keystone API integration
 * Handles authentication, request formatting, and response parsing
 */
export class KeystoneSoapClient {
  private config: KeystoneConfig | null = null;
  private xmlParser: XMLParser;

  constructor() {
    // Initialize XML parser with Keystone-specific options
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true
    });
  }

  /**
   * Load configuration from database or environment
   */
  async loadConfig(): Promise<void> {
    try {
      // In production, this would load from Supabase keystone_config table
      // For now, we'll use environment variables as fallback
      this.config = {
        accountNumber: process.env.KEYSTONE_ACCOUNT_NUMBER || '',
        securityKey: process.env.KEYSTONE_SECURITY_KEY || '',
        environment: (process.env.KEYSTONE_ENVIRONMENT as 'development' | 'production') || 'development',
        apiEndpoint: process.env.KEYSTONE_API_ENDPOINT || 'https://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx',
        wsdlUrl: process.env.KEYSTONE_WSDL_URL || 'https://legacy.ekeystone.com/SDK/api/ekeystoneapi.asmx?WSDL',
        approvedIPs: process.env.KEYSTONE_APPROVED_IPS?.split(',') || []
      };

      if (!this.config.accountNumber || !this.config.securityKey) {
        throw new Error('Keystone configuration is incomplete. Please check account number and security key.');
      }

      console.log('Keystone configuration loaded successfully');
    } catch (error) {
      console.error('Failed to load Keystone configuration:', error);
      throw error;
    }
  }

  /**
   * Generate authentication hash for Keystone API calls
   */
  private generateAuthHash(method: string, parameters: Record<string, any>): string {
    if (!this.config) {
      throw new Error('Keystone configuration not loaded');
    }

    // Create parameter string for hash generation
    const paramString = Object.keys(parameters)
      .sort()
      .map(key => `${key}=${parameters[key]}`)
      .join('&');

    // Generate hash according to Keystone specification
    const hashInput = `${this.config.accountNumber}${method}${paramString}${this.config.securityKey}`;
    const hash = CryptoJS.SHA256(hashInput).toString(CryptoJS.enc.Hex);

    return hash.toUpperCase();
  }

  /**
   * Create SOAP envelope for Keystone API call
   */
  private createSOAPEnvelope(method: string, parameters: Record<string, any>): string {
    if (!this.config) {
      throw new Error('Keystone configuration not loaded');
    }

    // Generate authentication hash
    const authHash = this.generateAuthHash(method, parameters);

    // Add authentication parameters
    const authParams = {
      AccountNumber: this.config.accountNumber,
      SecurityKey: authHash,
      ...parameters
    };

    // Build parameter XML
    const paramXML = Object.keys(authParams)
      .map(key => `<${key}>${this.escapeXML(authParams[key])}</${key}>`)
      .join('');

    // Create SOAP envelope
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
               xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="https://legacy.ekeystone.com/SDK/api/">
      ${paramXML}
    </${method}>
  </soap:Body>
</soap:Envelope>`;

    return soapEnvelope;
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Parse CSV table format returned by Keystone
   */
  parseCSVTable(csvData: string): Array<{ name: string; rows: any[] }> {
    const tables: Array<{ name: string; rows: any[] }> = [];
    
    if (!csvData || csvData.trim() === '') {
      return tables;
    }

    // Split by table separators (Keystone uses specific format)
    const sections = csvData.split(/\n\s*\n/);
    
    for (const section of sections) {
      const lines = section.trim().split('\n');
      if (lines.length < 2) continue;

      // First line might be table name, second line is headers
      let tableName = 'UnknownTable';
      let headerIndex = 0;

      // Check if first line looks like a table name
      if (lines[0] && !lines[0].includes(',') && lines[1] && lines[1].includes(',')) {
        tableName = lines[0].trim();
        headerIndex = 1;
      }

      const headers = lines[headerIndex].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows: any[] = [];

      // Parse data rows
      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = this.parseCSVLine(line);
        if (values.length === headers.length) {
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          rows.push(row);
        }
      }

      if (rows.length > 0) {
        tables.push({ name: tableName, rows });
      }
    }

    return tables;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add final field
    values.push(current.trim());

    return values;
  }

  /**
   * Make SOAP API call to Keystone
   */
  async makeSOAPCall(method: string, parameters: Record<string, any> = {}): Promise<KeystoneResponse> {
    const startTime = Date.now();

    try {
      if (!this.config) {
        await this.loadConfig();
      }

      console.log(`Making Keystone API call: ${method}`);

      // Create SOAP envelope
      const soapEnvelope = this.createSOAPEnvelope(method, parameters);

      // Make HTTP request
      const response = await fetch(this.config!.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `https://legacy.ekeystone.com/SDK/api/${method}`,
          'User-Agent': 'Custom Truck Connections Portal/1.0'
        },
        body: soapEnvelope
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response
      const responseText = await response.text();
      const parsedResponse = this.xmlParser.parse(responseText);

      // Extract result from SOAP response
      const soapBody = parsedResponse['soap:Envelope']?.['soap:Body'];
      const methodResponse = soapBody?.[`${method}Response`];
      const result = methodResponse?.[`${method}Result`];

      if (!result) {
        throw new Error('Invalid SOAP response structure');
      }

      // Check for Keystone-specific error codes
      if (result.StatusCode && result.StatusCode !== 'Success') {
        return {
          success: false,
          statusCode: result.StatusCode,
          statusMessage: result.StatusMessage || 'Unknown error',
          responseTime
        };
      }

      return {
        success: true,
        data: result.Data || result,
        statusCode: result.StatusCode || 'Success',
        statusMessage: result.StatusMessage || 'Success',
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Keystone API call failed: ${method}`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      };
    }
  }

  /**
   * Test connection to Keystone API
   */
  async testConnection(): Promise<KeystoneResponse> {
    try {
      return await this.makeSOAPCall('UtilityReportMyIP');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): KeystoneConfig | null {
    return this.config;
  }

  /**
   * Check if client is configured and ready
   */
  isConfigured(): boolean {
    return this.config !== null && 
           this.config.accountNumber !== '' && 
           this.config.securityKey !== '';
  }
}

// Export singleton instance
export const keystoneSoapClient = new KeystoneSoapClient();

