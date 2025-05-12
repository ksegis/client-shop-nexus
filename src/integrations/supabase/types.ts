export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          id: string
          key: string
          name: string
          service: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name: string
          service: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name?: string
          service?: string
          updated_at?: string
        }
        Relationships: []
      }
      estimate_items: {
        Row: {
          created_at: string
          description: string
          estimate_id: string
          id: string
          part_number: string | null
          price: number
          quantity: number
          updated_at: string
          vendor: string | null
        }
        Insert: {
          created_at?: string
          description: string
          estimate_id: string
          id?: string
          part_number?: string | null
          price: number
          quantity?: number
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          estimate_id?: string
          id?: string
          part_number?: string | null
          price?: number
          quantity?: number
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          id: string
          staff_id: string | null
          status: Database["public"]["Enums"]["estimate_status"]
          title: string
          total_amount: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          title: string
          total_amount?: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          title?: string
          total_amount?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          quantity: number
          reorder_level: number | null
          sku: string | null
          supplier: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          quantity?: number
          reorder_level?: number | null
          sku?: string | null
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          quantity?: number
          reorder_level?: number | null
          sku?: string | null
          supplier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          part_number: string | null
          price: number
          quantity: number
          updated_at: string
          vendor: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          part_number?: string | null
          price: number
          quantity?: number
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          part_number?: string | null
          price?: number
          quantity?: number
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          estimate_id: string | null
          id: string
          staff_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          title: string
          total_amount: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          estimate_id?: string | null
          id?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          title: string
          total_amount?: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          estimate_id?: string | null
          id?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          title?: string
          total_amount?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          facebook_url: string | null
          first_name: string | null
          id: string
          instagram_url: string | null
          last_name: string | null
          linkedin_url: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          facebook_url?: string | null
          first_name?: string | null
          id: string
          instagram_url?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          facebook_url?: string | null
          first_name?: string | null
          id?: string
          instagram_url?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_history: {
        Row: {
          id: string
          records: number
          service: string
          status: string
          timestamp: string
        }
        Insert: {
          id?: string
          records?: number
          service: string
          status: string
          timestamp?: string
        }
        Update: {
          id?: string
          records?: number
          service?: string
          status?: string
          timestamp?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          id: string
          images: string[] | null
          license_plate: string | null
          make: string
          model: string
          owner_id: string
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          vin: string | null
          year: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          license_plate?: string | null
          make: string
          model: string
          owner_id: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          vin?: string | null
          year: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          license_plate?: string | null
          make?: string
          model?: string
          owner_id?: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          part_number: string | null
          price: number
          quantity: number
          updated_at: string
          vendor: string | null
          work_order_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          part_number?: string | null
          price?: number
          quantity?: number
          updated_at?: string
          vendor?: string | null
          work_order_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          part_number?: string | null
          price?: number
          quantity?: number
          updated_at?: string
          vendor?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_line_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_cost: number | null
          actual_hours: number | null
          assigned_to: string | null
          created_at: string
          customer_id: string
          description: string | null
          estimated_cost: number | null
          estimated_hours: number | null
          id: string
          priority: number | null
          status: string
          title: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          actual_cost?: number | null
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          priority?: number | null
          status?: string
          title: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          actual_cost?: number | null
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          priority?: number | null
          status?: string
          title?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      estimate_status: "pending" | "approved" | "declined" | "completed"
      invoice_status: "draft" | "pending" | "paid" | "overdue"
      user_role: "customer" | "staff" | "admin"
      vehicle_type: "car" | "truck" | "motorcycle" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estimate_status: ["pending", "approved", "declined", "completed"],
      invoice_status: ["draft", "pending", "paid", "overdue"],
      user_role: ["customer", "staff", "admin"],
      vehicle_type: ["car", "truck", "motorcycle", "other"],
    },
  },
} as const
