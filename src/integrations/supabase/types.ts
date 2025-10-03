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
      animals: {
        Row: {
          age_months: number | null
          age_years: number | null
          animal_type: Database["public"]["Enums"]["animal_type"]
          breed: string | null
          created_at: string
          id: string
          image_url: string | null
          medical_history: string | null
          name: string | null
          owner_id: string
          updated_at: string
          vaccination_records: string | null
          weight_kg: number | null
        }
        Insert: {
          age_months?: number | null
          age_years?: number | null
          animal_type: Database["public"]["Enums"]["animal_type"]
          breed?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          medical_history?: string | null
          name?: string | null
          owner_id: string
          updated_at?: string
          vaccination_records?: string | null
          weight_kg?: number | null
        }
        Update: {
          age_months?: number | null
          age_years?: number | null
          animal_type?: Database["public"]["Enums"]["animal_type"]
          breed?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          medical_history?: string | null
          name?: string | null
          owner_id?: string
          updated_at?: string
          vaccination_records?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      consultation_messages: {
        Row: {
          attachment_url: string | null
          consultation_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          consultation_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          consultation_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          animal_id: string
          completed_at: string | null
          created_at: string
          description: string
          diagnosis: string | null
          farmer_id: string
          follow_up_notes: string | null
          id: string
          image_urls: string[] | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["consultation_status"]
          subject: string
          symptoms: string | null
          treatment_plan: string | null
          updated_at: string
          urgency_level: string
          vet_id: string | null
        }
        Insert: {
          animal_id: string
          completed_at?: string | null
          created_at?: string
          description: string
          diagnosis?: string | null
          farmer_id: string
          follow_up_notes?: string | null
          id?: string
          image_urls?: string[] | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          subject: string
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string
          urgency_level: string
          vet_id?: string | null
        }
        Update: {
          animal_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          diagnosis?: string | null
          farmer_id?: string
          follow_up_notes?: string | null
          id?: string
          image_urls?: string[] | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["consultation_status"]
          subject?: string
          symptoms?: string | null
          treatment_plan?: string | null
          updated_at?: string
          urgency_level?: string
          vet_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string
          id: string
          license_number: string | null
          location: string | null
          phone_number: string | null
          profile_image_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          license_number?: string | null
          location?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          license_number?: string | null
          location?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialization?: string | null
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
      animal_type:
        | "poultry"
        | "cattle"
        | "goat"
        | "sheep"
        | "pig"
        | "dog"
        | "cat"
        | "other"
      consultation_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "farmer" | "pet_owner" | "veterinarian" | "admin"
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
      animal_type: [
        "poultry",
        "cattle",
        "goat",
        "sheep",
        "pig",
        "dog",
        "cat",
        "other",
      ],
      consultation_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["farmer", "pet_owner", "veterinarian", "admin"],
    },
  },
} as const
