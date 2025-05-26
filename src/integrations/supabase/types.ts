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
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          name: string
          service: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          name?: string
          service?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          performed_by: string
          target_user_email: string | null
          target_user_id: string | null
          timestamp: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          performed_by: string
          target_user_email?: string | null
          target_user_id?: string | null
          timestamp?: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string
          target_user_email?: string | null
          target_user_id?: string | null
          timestamp?: string
        }
        Relationships: []
      }
      auth_flow_logs: {
        Row: {
          access_granted: boolean | null
          client_timestamp: string
          details: Json | null
          email: string | null
          event_type: string
          id: string
          portal_type: string | null
          required_roles: string[] | null
          route_path: string | null
          server_timestamp: string
          session_id: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          access_granted?: boolean | null
          client_timestamp: string
          details?: Json | null
          email?: string | null
          event_type: string
          id?: string
          portal_type?: string | null
          required_roles?: string[] | null
          route_path?: string | null
          server_timestamp?: string
          session_id?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          access_granted?: boolean | null
          client_timestamp?: string
          details?: Json | null
          email?: string | null
          event_type?: string
          id?: string
          portal_type?: string | null
          required_roles?: string[] | null
          route_path?: string | null
          server_timestamp?: string
          session_id?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      bugs: {
        Row: {
          actual_result: string | null
          assigned_to: string | null
          attachments: string[] | null
          created_at: string
          description: string
          expected_result: string | null
          feature_area: string
          id: string
          reported_by: string
          severity: string
          status: string
          steps_to_reproduce: string | null
          test_result_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_result?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          created_at?: string
          description: string
          expected_result?: string | null
          feature_area: string
          id?: string
          reported_by: string
          severity: string
          status: string
          steps_to_reproduce?: string | null
          test_result_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_result?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          created_at?: string
          description?: string
          expected_result?: string | null
          feature_area?: string
          id?: string
          reported_by?: string
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          test_result_id?: string | null
          title?: string
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
          core_charge: number | null
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
          core_charge?: number | null
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
          core_charge?: number | null
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
      message_threads: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_closed: boolean
          last_message_at: string
          subject: string
          unread_count: number
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_closed?: boolean
          last_message_at?: string
          subject: string
          unread_count?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_closed?: boolean
          last_message_at?: string
          subject?: string
          unread_count?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_type: string
          thread_id: string
          timestamp: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_type: string
          thread_id: string
          timestamp?: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_type?: string
          thread_id?: string
          timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_attempts: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          successful: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          successful?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          successful?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          created_at: string
          email: string
          facebook_url: string | null
          first_name: string | null
          force_password_change: boolean | null
          id: string
          instagram_url: string | null
          invite_token: string | null
          invited_by: string | null
          last_login: string | null
          last_name: string | null
          linkedin_url: string | null
          mfa_enabled: boolean | null
          mfa_secret: string | null
          phone: string | null
          recovery_codes: string[] | null
          role: Database["public"]["Enums"]["user_role"]
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email: string
          facebook_url?: string | null
          first_name?: string | null
          force_password_change?: boolean | null
          id: string
          instagram_url?: string | null
          invite_token?: string | null
          invited_by?: string | null
          last_login?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          phone?: string | null
          recovery_codes?: string[] | null
          role?: Database["public"]["Enums"]["user_role"]
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          facebook_url?: string | null
          first_name?: string | null
          force_password_change?: boolean | null
          id?: string
          instagram_url?: string | null
          invite_token?: string | null
          invited_by?: string | null
          last_login?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mfa_enabled?: boolean | null
          mfa_secret?: string | null
          phone?: string | null
          recovery_codes?: string[] | null
          role?: Database["public"]["Enums"]["user_role"]
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          expires_at: string
          key: string
          updated_at: string
        }
        Insert: {
          count?: number
          expires_at: string
          key: string
          updated_at?: string
        }
        Update: {
          count?: number
          expires_at?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          resolved_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          customer_id: string
          description: string | null
          id: string
          service_type: string
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          service_type: string
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          service_type?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_history: {
        Row: {
          created_at: string
          customer_id: string
          description: string
          id: string
          labor_hours: number
          parts_used: string[] | null
          service_date: string
          service_type: string
          technician_notes: string | null
          total_cost: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description: string
          id?: string
          labor_hours?: number
          parts_used?: string[] | null
          service_date: string
          service_type: string
          technician_notes?: string | null
          total_cost?: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          labor_hours?: number
          parts_used?: string[] | null
          service_date?: string
          service_type?: string
          technician_notes?: string | null
          total_cost?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_updates: {
        Row: {
          content: string
          created_at: string
          id: string
          images: string[] | null
          milestone: string | null
          milestone_completed: boolean | null
          updated_at: string
          work_order_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          milestone?: string | null
          milestone_completed?: boolean | null
          updated_at?: string
          work_order_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          milestone?: string | null
          milestone_completed?: boolean | null
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_updates_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_invites: {
        Row: {
          created_at: string
          email: string
          email_id: string | null
          error_message: string | null
          expires_at: string
          id: string
          invited_by: string
          last_attempt_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          sent_at: string | null
          status: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          email_id?: string | null
          error_message?: string | null
          expires_at?: string
          id?: string
          invited_by: string
          last_attempt_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          sent_at?: string | null
          status?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          email_id?: string | null
          error_message?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          last_attempt_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          sent_at?: string | null
          status?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      test_results: {
        Row: {
          created_at: string
          description: string
          environment: string
          feature_area: string
          id: string
          priority: string
          status: string
          steps_to_reproduce: string | null
          test_name: string
          tester_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          environment: string
          feature_area: string
          id?: string
          priority: string
          status: string
          steps_to_reproduce?: string | null
          test_name: string
          tester_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          environment?: string
          feature_area?: string
          id?: string
          priority?: string
          status?: string
          steps_to_reproduce?: string | null
          test_name?: string
          tester_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_authenticators: {
        Row: {
          created_at: string | null
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_hash: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_active: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_hash: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_hash?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active?: string
          user_agent?: string | null
          user_id?: string | null
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
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at: string
          id?: string
          type: string
          user_id: string
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      rls_status: {
        Row: {
          row_security_active: boolean | null
          table_name: unknown | null
          table_schema: unknown | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_public_read_policy: {
        Args: { target_table: string }
        Returns: undefined
      }
      add_standard_policies: {
        Args: { target_table: string }
        Returns: undefined
      }
      check_session_anomalies: {
        Args: { user_id: string }
        Returns: {
          simultaneous_sessions: number
          new_device: boolean
          suspicious_location: boolean
        }[]
      }
      clean_old_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_webauthn_challenges: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      disable_all_rls: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_invite_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_staff_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_target_user_id: string
          p_description?: string
          p_metadata?: Json
        }
        Returns: string
      }
      store_webauthn_challenge: {
        Args: {
          p_user_id: string
          p_challenge: string
          p_type: string
          p_expires_at: string
        }
        Returns: undefined
      }
      update_password_change_flag: {
        Args: { user_id: string; force_change: boolean }
        Returns: undefined
      }
      update_user_profile_with_password_change: {
        Args: {
          user_id: string
          first_name_val: string
          last_name_val: string
          force_change: boolean
        }
        Returns: undefined
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
