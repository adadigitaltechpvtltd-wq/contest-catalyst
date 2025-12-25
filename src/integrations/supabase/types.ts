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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contests: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          featured_in_hero: boolean
          id: string
          judging_criteria: string[] | null
          max_participants: number | null
          min_participants: number
          prize_amount: number
          prize_currency: string
          rules: string[] | null
          start_date: string
          status: Database["public"]["Enums"]["contest_status"]
          theme: string | null
          title: string
          updated_at: string
          voting_end_date: string | null
          winner_id: string | null
          winning_submission_id: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          featured_in_hero?: boolean
          id?: string
          judging_criteria?: string[] | null
          max_participants?: number | null
          min_participants?: number
          prize_amount?: number
          prize_currency?: string
          rules?: string[] | null
          start_date: string
          status?: Database["public"]["Enums"]["contest_status"]
          theme?: string | null
          title: string
          updated_at?: string
          voting_end_date?: string | null
          winner_id?: string | null
          winning_submission_id?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          featured_in_hero?: boolean
          id?: string
          judging_criteria?: string[] | null
          max_participants?: number | null
          min_participants?: number
          prize_amount?: number
          prize_currency?: string
          rules?: string[] | null
          start_date?: string
          status?: Database["public"]["Enums"]["contest_status"]
          theme?: string | null
          title?: string
          updated_at?: string
          voting_end_date?: string | null
          winner_id?: string | null
          winning_submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_winning_submission"
            columns: ["winning_submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_details: {
        Row: {
          bank_account_number: string | null
          bank_ifsc: string | null
          created_at: string
          updated_at: string
          upi_id: string | null
          user_id: string
        }
        Insert: {
          bank_account_number?: string | null
          bank_ifsc?: string | null
          created_at?: string
          updated_at?: string
          upi_id?: string | null
          user_id: string
        }
        Update: {
          bank_account_number?: string | null
          bank_ifsc?: string | null
          created_at?: string
          updated_at?: string
          upi_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          banned_at: string | null
          banned_reason: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          is_adult: boolean | null
          is_banned: boolean | null
          kyc_verified: boolean | null
          phone: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_adult?: boolean | null
          is_banned?: boolean | null
          kyc_verified?: boolean | null
          phone?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_adult?: boolean | null
          is_banned?: boolean | null
          kyc_verified?: boolean | null
          phone?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          reason: string
          reported_user_id: string | null
          reporter_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          submission_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason: string
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          submission_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_contests: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_contests_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          admin_notes: string | null
          admin_score: number | null
          ai_detection_provider: string | null
          ai_detection_raw_response: Json | null
          ai_probability_score: number | null
          analysis_completed_at: string | null
          analysis_method: string | null
          blur_score: number | null
          combined_score: number | null
          contest_id: string
          contrast_score: number | null
          created_at: string
          description: string | null
          duplicate_similarity_score: number | null
          exif_anomaly_reasons: string[] | null
          exif_camera_make: string | null
          exif_camera_model: string | null
          exif_date_taken: string | null
          exif_gps_lat: number | null
          exif_gps_lng: number | null
          exif_has_anomalies: boolean | null
          exif_software: string | null
          exposure_score: number | null
          id: string
          image_quality_score: number | null
          image_url: string
          noise_score: number | null
          originality_confirmed: boolean
          perceptual_hash: string | null
          rejection_reason: string | null
          report_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_score: number | null
          sharpness_score: number | null
          status: Database["public"]["Enums"]["submission_status"]
          system_score: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          visual_anomaly_reasons: string[] | null
          visual_anomaly_score: number | null
        }
        Insert: {
          admin_notes?: string | null
          admin_score?: number | null
          ai_detection_provider?: string | null
          ai_detection_raw_response?: Json | null
          ai_probability_score?: number | null
          analysis_completed_at?: string | null
          analysis_method?: string | null
          blur_score?: number | null
          combined_score?: number | null
          contest_id: string
          contrast_score?: number | null
          created_at?: string
          description?: string | null
          duplicate_similarity_score?: number | null
          exif_anomaly_reasons?: string[] | null
          exif_camera_make?: string | null
          exif_camera_model?: string | null
          exif_date_taken?: string | null
          exif_gps_lat?: number | null
          exif_gps_lng?: number | null
          exif_has_anomalies?: boolean | null
          exif_software?: string | null
          exposure_score?: number | null
          id?: string
          image_quality_score?: number | null
          image_url: string
          noise_score?: number | null
          originality_confirmed?: boolean
          perceptual_hash?: string | null
          rejection_reason?: string | null
          report_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number | null
          sharpness_score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          system_score?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          visual_anomaly_reasons?: string[] | null
          visual_anomaly_score?: number | null
        }
        Update: {
          admin_notes?: string | null
          admin_score?: number | null
          ai_detection_provider?: string | null
          ai_detection_raw_response?: Json | null
          ai_probability_score?: number | null
          analysis_completed_at?: string | null
          analysis_method?: string | null
          blur_score?: number | null
          combined_score?: number | null
          contest_id?: string
          contrast_score?: number | null
          created_at?: string
          description?: string | null
          duplicate_similarity_score?: number | null
          exif_anomaly_reasons?: string[] | null
          exif_camera_make?: string | null
          exif_camera_model?: string | null
          exif_date_taken?: string | null
          exif_gps_lat?: number | null
          exif_gps_lng?: number | null
          exif_has_anomalies?: boolean | null
          exif_software?: string | null
          exposure_score?: number | null
          id?: string
          image_quality_score?: number | null
          image_url?: string
          noise_score?: number | null
          originality_confirmed?: boolean
          perceptual_hash?: string | null
          rejection_reason?: string | null
          report_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number | null
          sharpness_score?: number | null
          status?: Database["public"]["Enums"]["submission_status"]
          system_score?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visual_anomaly_reasons?: string[] | null
          visual_anomaly_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "submissions_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          id: string
        }
        Insert: {
          email: string
          id?: string
        }
        Update: {
          email?: string
          id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          contest_id: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          submission_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          contest_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          submission_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          contest_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          submission_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard_stats: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contests_entered: number | null
          full_name: string | null
          total_submissions: number | null
          user_id: string | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_wallet_balance: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      contest_status: "draft" | "active" | "voting" | "completed" | "cancelled"
      report_status: "pending" | "reviewed" | "resolved" | "dismissed"
      submission_status:
        | "pending"
        | "approved"
        | "rejected"
        | "winner"
        | "disqualified"
      transaction_status: "pending" | "completed" | "failed" | "cancelled"
      transaction_type: "prize" | "withdrawal" | "bonus"
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
      app_role: ["admin", "moderator", "user"],
      contest_status: ["draft", "active", "voting", "completed", "cancelled"],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
      submission_status: [
        "pending",
        "approved",
        "rejected",
        "winner",
        "disqualified",
      ],
      transaction_status: ["pending", "completed", "failed", "cancelled"],
      transaction_type: ["prize", "withdrawal", "bonus"],
    },
  },
} as const
