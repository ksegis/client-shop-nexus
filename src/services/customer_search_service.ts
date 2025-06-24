import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_TOKEN;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: 'customer' | 'staff' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface CustomerSearchResult {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  display_name: string;
}

export interface CreateCustomerData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class CustomerSearchService {
  /**
   * Search for customers by email or name
   */
  static async searchCustomers(query: string): Promise<CustomerSearchResult[]> {
    try {
      console.log('🔍 Searching customers with query:', query);
      
      if (!query.trim()) {
        return [];
      }

      // Search by email (exact match) or name (partial match)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone')
        .eq('role', 'customer')
        .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error searching customers:', error);
        throw error;
      }

      // Transform results to include display name
      const results: CustomerSearchResult[] = (data || []).map(customer => ({
        ...customer,
        display_name: this.getDisplayName(customer.first_name, customer.last_name, customer.email)
      }));

      console.log('✅ Found customers:', results.length);
      return results;
    } catch (error) {
      console.error('❌ Customer search failed:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(id: string): Promise<Customer | null> {
    try {
      console.log('🔍 Fetching customer by ID:', id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'customer')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('❌ Error fetching customer:', error);
        throw error;
      }

      console.log('✅ Customer found:', data?.email);
      return data as Customer;
    } catch (error) {
      console.error('❌ Failed to fetch customer:', error);
      throw error;
    }
  }

  /**
   * Get customer by email
   */
  static async getCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      console.log('🔍 Fetching customer by email:', email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('role', 'customer')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('❌ Error fetching customer by email:', error);
        throw error;
      }

      console.log('✅ Customer found by email:', data?.email);
      return data as Customer;
    } catch (error) {
      console.error('❌ Failed to fetch customer by email:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(customerData: CreateCustomerData): Promise<Customer> {
    try {
      console.log('🆕 Creating new customer:', customerData.email);
      
      // Check if customer already exists
      const existingCustomer = await this.getCustomerByEmail(customerData.email);
      if (existingCustomer) {
        console.log('⚠️ Customer already exists:', customerData.email);
        return existingCustomer;
      }

      // Create new customer
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          email: customerData.email.toLowerCase(),
          first_name: customerData.first_name,
          last_name: customerData.last_name,
          phone: customerData.phone || null,
          role: 'customer'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating customer:', error);
        throw error;
      }

      console.log('✅ Customer created successfully:', data?.email);
      return data as Customer;
    } catch (error) {
      console.error('❌ Failed to create customer:', error);
      throw error;
    }
  }

  /**
   * Update customer information
   */
  static async updateCustomer(id: string, updates: Partial<CreateCustomerData>): Promise<Customer> {
    try {
      console.log('📝 Updating customer:', id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          email: updates.email?.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('role', 'customer')
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating customer:', error);
        throw error;
      }

      console.log('✅ Customer updated successfully:', data?.email);
      return data as Customer;
    } catch (error) {
      console.error('❌ Failed to update customer:', error);
      throw error;
    }
  }

  /**
   * Generate display name for customer
   */
  private static getDisplayName(firstName: string | null, lastName: string | null, email: string): string {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return email;
    }
  }

  /**
   * Get customer's full name
   */
  static getCustomerFullName(customer: Customer | CustomerSearchResult): string {
    return this.getDisplayName(customer.first_name, customer.last_name, customer.email);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format phone number (basic formatting)
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for 10-digit US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    // Return original if not a standard format
    return phone;
  }

  /**
   * Create customer from order data
   */
  static async createCustomerFromOrder(
    email: string,
    firstName: string,
    lastName: string,
    phone?: string
  ): Promise<Customer> {
    try {
      console.log('🛒 Creating customer from order data:', email);
      
      const customerData: CreateCustomerData = {
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        phone: phone
      };

      return await this.createCustomer(customerData);
    } catch (error) {
      console.error('❌ Failed to create customer from order:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const customerSearchService = new CustomerSearchService();

