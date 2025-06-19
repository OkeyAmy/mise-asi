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
      chat_sessions: {
        Row: {
          created_at: string
          messages: Json
          thought_steps: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          messages?: Json
          thought_steps?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          messages?: Json
          thought_steps?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          sentiment: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sentiment?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sentiment?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          id: string
          plan_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_swaps: {
        Row: {
          created_at: string
          id: string
          meal_type: string
          original_meal_id: string
          rating: number | null
          swap_reason: string | null
          swapped_meal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_type: string
          original_meal_id: string
          rating?: number | null
          swap_reason?: string | null
          swapped_meal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_type?: string
          original_meal_id?: string
          rating?: number | null
          swap_reason?: string | null
          swapped_meal_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_lists: {
        Row: {
          created_at: string
          id: string
          items: Json | null
          meal_plan_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json | null
          meal_plan_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json | null
          meal_plan_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          category: string
          created_at: string
          expiry_date: string | null
          id: string
          item_name: string
          location: string | null
          notes: string | null
          quantity: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_name: string
          location?: string | null
          notes?: string | null
          quantity?: number
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_name?: string
          location?: string | null
          notes?: string | null
          quantity?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_leftovers: {
        Row: {
          created_at: string
          date_created: string
          id: string
          meal_name: string
          notes: string | null
          servings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_created?: string
          id?: string
          meal_name: string
          notes?: string | null
          servings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_created?: string
          id?: string
          meal_name?: string
          notes?: string | null
          servings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          cultural_heritage: string | null
          family_size: number | null
          goals: string[] | null
          habits: string[] | null
          id: string
          inventory: string[] | null
          key_info: Json | null
          meal_ratings: Json | null
          notes: string | null
          restrictions: string[] | null
          swap_preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cultural_heritage?: string | null
          family_size?: number | null
          goals?: string[] | null
          habits?: string[] | null
          id?: string
          inventory?: string[] | null
          key_info?: Json | null
          meal_ratings?: Json | null
          notes?: string | null
          restrictions?: string[] | null
          swap_preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cultural_heritage?: string | null
          family_size?: number | null
          goals?: string[] | null
          habits?: string[] | null
          id?: string
          inventory?: string[] | null
          key_info?: Json | null
          meal_ratings?: Json | null
          notes?: string | null
          restrictions?: string[] | null
          swap_preferences?: Json | null
          updated_at?: string
          user_id?: string
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
