export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      adjustment_history: {
        Row: {
          adjustment_date: string | null
          adjustment_reason: string | null
          created_at: string | null
          feedback_id: string | null
          id: string
          new_calories: number
          new_carbs: number
          new_fats: number
          new_protein: number
          previous_calories: number
          previous_carbs: number
          previous_fats: number
          previous_protein: number
          user_id: string
        }
        Insert: {
          adjustment_date?: string | null
          adjustment_reason?: string | null
          created_at?: string | null
          feedback_id?: string | null
          id?: string
          new_calories: number
          new_carbs: number
          new_fats: number
          new_protein: number
          previous_calories: number
          previous_carbs: number
          previous_fats: number
          previous_protein: number
          user_id: string
        }
        Update: {
          adjustment_date?: string | null
          adjustment_reason?: string | null
          created_at?: string | null
          feedback_id?: string | null
          id?: string
          new_calories?: number
          new_carbs?: number
          new_fats?: number
          new_protein?: number
          previous_calories?: number
          previous_carbs?: number
          previous_fats?: number
          previous_protein?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adjustment_history_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "weekly_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assignments: {
        Row: {
          active: boolean | null
          assigned_at: string | null
          client_id: string
          id: string
          notes: string | null
          nutritionist_id: string
          organization_id: string
        }
        Insert: {
          active?: boolean | null
          assigned_at?: string | null
          client_id: string
          id?: string
          notes?: string | null
          nutritionist_id: string
          organization_id: string
        }
        Update: {
          active?: boolean | null
          assigned_at?: string | null
          client_id?: string
          id?: string
          notes?: string | null
          nutritionist_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          amount: string
          calories: number
          carbs: number
          created_at: string | null
          fats: number
          id: string
          meal_id: string
          name: string
          protein: number
        }
        Insert: {
          amount: string
          calories: number
          carbs: number
          created_at?: string | null
          fats: number
          id?: string
          meal_id: string
          name: string
          protein: number
        }
        Update: {
          amount?: string
          calories?: number
          carbs?: number
          created_at?: string | null
          fats?: number
          id?: string
          meal_id?: string
          name?: string
          protein?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string | null
          id: string
          plan_date: string
          total_calories: number
          total_carbs: number
          total_fats: number
          total_protein: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_date: string
          total_calories: number
          total_carbs: number
          total_fats: number
          total_protein: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_date?: string
          total_calories?: number
          total_carbs?: number
          total_fats?: number
          total_protein?: number
          user_id?: string
        }
        Relationships: []
      }
      meal_suggestions: {
        Row: {
          created_at: string | null
          id: string
          macros: Json
          original_food: string | null
          suggested_meal: Json
          suggestion_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          macros: Json
          original_food?: string | null
          suggested_meal: Json
          suggestion_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          macros?: Json
          original_food?: string | null
          suggested_meal?: Json
          suggestion_type?: string
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          meal_order: number
          meal_plan_id: string
          name: string
          time: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          meal_order: number
          meal_plan_id: string
          name: string
          time: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          meal_order?: number
          meal_plan_id?: string
          name?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string | null
          organization_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          organization_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string
          age: number
          created_at: string | null
          diet_type: string | null
          gender: string
          goal: string
          height: number
          id: string
          name: string
          restrictions: Json | null
          target_calories: number
          target_carbs: number
          target_fats: number
          target_protein: number
          tdee: number
          updated_at: string | null
          user_id: string
          weight: number
          work_type: string
        }
        Insert: {
          activity_level: string
          age: number
          created_at?: string | null
          diet_type?: string | null
          gender: string
          goal: string
          height: number
          id?: string
          name: string
          restrictions?: Json | null
          target_calories: number
          target_carbs: number
          target_fats: number
          target_protein: number
          tdee: number
          updated_at?: string | null
          user_id: string
          weight: number
          work_type: string
        }
        Update: {
          activity_level?: string
          age?: number
          created_at?: string | null
          diet_type?: string | null
          gender?: string
          goal?: string
          height?: number
          id?: string
          name?: string
          restrictions?: Json | null
          target_calories?: number
          target_carbs?: number
          target_fats?: number
          target_protein?: number
          tdee?: number
          updated_at?: string | null
          user_id?: string
          weight?: number
          work_type?: string
        }
        Relationships: []
      }
      progress_tracking: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          notes?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      user_pantry: {
        Row: {
          added_at: string | null
          category: string | null
          food_name: string
          id: string
          quantity: number | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          category?: string | null
          food_name: string
          id?: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          category?: string | null
          food_name?: string
          id?: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_feedback: {
        Row: {
          adherence_level: number
          created_at: string | null
          current_weight: number
          energy_level: number
          hunger_satisfaction: number
          id: string
          notes: string | null
          user_id: string
          week_date: string
        }
        Insert: {
          adherence_level: number
          created_at?: string | null
          current_weight: number
          energy_level: number
          hunger_satisfaction: number
          id?: string
          notes?: string | null
          user_id: string
          week_date: string
        }
        Update: {
          adherence_level?: number
          created_at?: string | null
          current_weight?: number
          energy_level?: number
          hunger_satisfaction?: number
          id?: string
          notes?: string | null
          user_id?: string
          week_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organizations: {
        Args: { _user_id: string }
        Returns: {
          organization_id: string
          organization_name: string
          user_role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_org: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "nutricionista" | "usuario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "nutricionista", "usuario"],
    },
  },
} as const
