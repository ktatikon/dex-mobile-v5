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
      admin_users: {
        Row: {
          id: string
          user_id: string
          role: string
          permissions: Json
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          last_login: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_login?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          permissions?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_login?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_activity_logs: {
        Row: {
          id: string
          admin_user_id: string
          action: string
          target_type: string | null
          target_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          action: string
          target_type?: string | null
          target_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          action?: string
          target_type?: string | null
          target_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_login_history: {
        Row: {
          id: string
          user_id: string
          login_time: string
          ip_address: string | null
          user_agent: string | null
          device_info: Json | null
          location_info: Json | null
          success: boolean
        }
        Insert: {
          id?: string
          user_id: string
          login_time?: string
          ip_address?: string | null
          user_agent?: string | null
          device_info?: Json | null
          location_info?: Json | null
          success?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          login_time?: string
          ip_address?: string | null
          user_agent?: string | null
          device_info?: Json | null
          location_info?: Json | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_login_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_status_changes: {
        Row: {
          id: string
          user_id: string
          admin_user_id: string
          old_status: string | null
          new_status: string
          reason: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          admin_user_id: string
          old_status?: string | null
          new_status: string
          reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_user_id?: string
          old_status?: string | null
          new_status?: string
          reason?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_status_changes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_status_changes_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      wallet_balances: {
        Row: {
          id: string
          user_id: string
          wallet_id: string
          token_id: string
          balance: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_id: string
          token_id: string
          balance: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_id?: string
          token_id?: string
          balance?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          wallet_id: string
          transaction_type: string
          from_token_id: string | null
          to_token_id: string | null
          from_amount: string | null
          to_amount: string | null
          timestamp: string
          hash: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_id: string
          transaction_type: string
          from_token_id?: string | null
          to_token_id?: string | null
          from_amount?: string | null
          to_amount?: string | null
          timestamp?: string
          hash?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_id?: string
          transaction_type?: string
          from_token_id?: string | null
          to_token_id?: string | null
          from_amount?: string | null
          to_amount?: string | null
          timestamp?: string
          hash?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      liquidity_positions: {
        Row: {
          id: string
          user_id: string
          token_a_id: string
          token_b_id: string
          token_a_amount: string
          token_b_amount: string
          pool_share: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token_a_id: string
          token_b_id: string
          token_a_amount: string
          token_b_amount: string
          pool_share: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token_a_id?: string
          token_b_id?: string
          token_a_amount?: string
          token_b_amount?: string
          pool_share?: number
          created_at?: string
          updated_at?: string
        }
      }
      tokens: {
        Row: {
          id: string
          symbol: string
          name: string
          logo: string
          decimals: number
          price: number | null
          price_change_24h: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          symbol: string
          name: string
          logo: string
          decimals: number
          price?: number | null
          price_change_24h?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          name?: string
          logo?: string
          decimals?: number
          price?: number | null
          price_change_24h?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          wallet_name: string
          wallet_type: string
          wallet_address: string
          network: string
          provider: string
          source_table: string
          source_id: string
          addresses: Json
          encrypted_seed_phrase: string | null
          private_keys: Json
          public_keys: Json
          connection_method: string | null
          device_info: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_name: string
          wallet_type: string
          wallet_address: string
          network?: string
          provider: string
          source_table: string
          source_id: string
          addresses?: Json
          encrypted_seed_phrase?: string | null
          private_keys?: Json
          public_keys?: Json
          connection_method?: string | null
          device_info?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_name?: string
          wallet_type?: string
          wallet_address?: string
          network?: string
          provider?: string
          source_table?: string
          source_id?: string
          addresses?: Json
          encrypted_seed_phrase?: string | null
          private_keys?: Json
          public_keys?: Json
          connection_method?: string | null
          device_info?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notification_settings: {
        Row: {
          id: string
          user_id: string
          price_alerts: boolean
          trade_confirmations: boolean
          security_alerts: boolean
          market_updates: boolean
          promotional_emails: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          price_alerts?: boolean
          trade_confirmations?: boolean
          security_alerts?: boolean
          market_updates?: boolean
          promotional_emails?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          price_alerts?: boolean
          trade_confirmations?: boolean
          security_alerts?: boolean
          market_updates?: boolean
          promotional_emails?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      email_whitelist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      kyc: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          middle_name: string | null
          last_name: string | null
          date_of_birth: string | null
          address: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          phone: string | null
          email: string | null
          document_type: string | null
          government_id_url: string | null
          back_document_url: string | null
          selfie_url: string | null
          status: string
          submitted_at: string | null
          review_date: string | null
          reviewer_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          date_of_birth?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          email?: string | null
          document_type?: string | null
          government_id_url?: string | null
          back_document_url?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string | null
          review_date?: string | null
          reviewer_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          date_of_birth?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          email?: string | null
          document_type?: string | null
          government_id_url?: string | null
          back_document_url?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string | null
          review_date?: string | null
          reviewer_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      legacy_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          status: string | null
          token_type: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          status?: string | null
          token_type: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          status?: string | null
          token_type?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      },
      generated_wallets: {
        Row: {
          id: string
          user_id: string
          name: string
          encrypted_seed_phrase: string
          addresses: Json
          private_keys: Json
          public_keys: Json
          wallet_address: string | null
          network: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          encrypted_seed_phrase: string
          addresses?: Json
          private_keys?: Json
          public_keys?: Json
          wallet_address?: string | null
          network?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          encrypted_seed_phrase?: string
          addresses?: Json
          private_keys?: Json
          public_keys?: Json
          wallet_address?: string | null
          network?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string
          birthdate: string | null
          location: string | null
          bio: string | null
          website: string | null
          avatar_url: string | null
          status: string
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone: string
          birthdate?: string | null
          location?: string | null
          bio?: string | null
          website?: string | null
          avatar_url?: string | null
          status?: string
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          birthdate?: string | null
          location?: string | null
          bio?: string | null
          website?: string | null
          avatar_url?: string | null
          status?: string
        }
        Relationships: []
      }
      wallet_connections: {
        Row: {
          id: string
          user_id: string
          wallet_type: string
          wallet_address: string
          network: string
          provider: string
          connection_method: string
          device_info: Json
          is_active: boolean
          last_connected: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_type: string
          wallet_address: string
          network?: string
          provider: string
          connection_method: string
          device_info?: Json
          is_active?: boolean
          last_connected?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_type?: string
          wallet_address?: string
          network?: string
          provider?: string
          connection_method?: string
          device_info?: Json
          is_active?: boolean
          last_connected?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      wallet_preferences: {
        Row: {
          id: string
          user_id: string
          default_network: string
          preferred_currency: string
          auto_lock_timeout: number
          show_balances: boolean
          enable_notifications: boolean
          biometric_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_network?: string
          preferred_currency?: string
          auto_lock_timeout?: number
          show_balances?: boolean
          enable_notifications?: boolean
          biometric_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_network?: string
          preferred_currency?: string
          auto_lock_timeout?: number
          show_balances?: boolean
          enable_notifications?: boolean
          biometric_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      wallet_settings: {
        Row: {
          id: string
          user_id: string
          wallet_id: string
          custom_name: string | null
          is_hidden: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_id: string
          custom_name?: string | null
          is_hidden?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_id?: string
          custom_name?: string | null
          is_hidden?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_settings_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          }
        ]
      }
      transaction_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          is_system: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          is_system?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
