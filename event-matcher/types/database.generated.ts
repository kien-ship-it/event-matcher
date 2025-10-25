export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
        ]
      }
      availability: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          end_time: string
          id: string
          is_recurring: boolean | null
          recurrence_end_date: string | null
          start_time: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          is_recurring?: boolean | null
          recurrence_end_date?: string | null
          start_time: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          recurrence_end_date?: string | null
          start_time?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string | null
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string | null
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          id: string
          name: string
          subject: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          subject: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          subject?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_participants: {
        Row: {
          added_at: string | null
          event_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          event_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_requests: {
        Row: {
          created_at: string | null
          decline_reason: string | null
          description: string | null
          event_type: string
          id: string
          processed_at: string | null
          processed_by: string | null
          proposed_end_time: string
          proposed_start_time: string
          requested_participants: string[]
          requestor_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          decline_reason?: string | null
          description?: string | null
          event_type: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          proposed_end_time: string
          proposed_start_time: string
          requested_participants: string[]
          requestor_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          decline_reason?: string | null
          description?: string | null
          event_type?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          proposed_end_time?: string
          proposed_start_time?: string
          requested_participants?: string[]
          requestor_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "event_requests_requestor_id_fkey"
            columns: ["requestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_requests_requestor_id_fkey"
            columns: ["requestor_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          default_duration_minutes: number
          description: string | null
          event_type: string
          id: string
          last_used_at: string | null
          location: string | null
          name: string
          recurrence_pattern: Json | null
          subject: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_duration_minutes: number
          description?: string | null
          event_type: string
          id?: string
          last_used_at?: string | null
          location?: string | null
          name: string
          recurrence_pattern?: Json | null
          subject?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_duration_minutes?: number
          description?: string | null
          event_type?: string
          id?: string
          last_used_at?: string | null
          location?: string | null
          name?: string
          recurrence_pattern?: Json | null
          subject?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
        ]
      }
      events: {
        Row: {
          attachments: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          event_type: string
          id: string
          is_recurring: boolean | null
          location: string | null
          meeting_link: string | null
          parent_event_id: string | null
          recurrence_end_date: string | null
          recurrence_pattern: Json | null
          start_time: string
          subject: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          meeting_link?: string | null
          parent_event_id?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: Json | null
          start_time: string
          subject?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          meeting_link?: string | null
          parent_event_id?: string | null
          recurrence_end_date?: string | null
          recurrence_pattern?: Json | null
          start_time?: string
          subject?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_presets: {
        Row: {
          created_at: string | null
          filter_config: Json
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filter_config: Json
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filter_config?: Json
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filter_presets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filter_presets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
        ]
      }
      privileges: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          notification_preferences: Json | null
          role_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          notification_preferences?: Json | null
          role_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          notification_preferences?: Json | null
          role_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_privileges: {
        Row: {
          granted_at: string | null
          privilege_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string | null
          privilege_id: string
          role_id: string
        }
        Update: {
          granted_at?: string | null
          privilege_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_privileges_privilege_id_fkey"
            columns: ["privilege_id"]
            isOneToOne: false
            referencedRelation: "privileges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_privileges_privilege_id_fkey"
            columns: ["privilege_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["privilege_id"]
          },
          {
            foreignKeyName: "role_privileges_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          is_system_role?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
        }
        Relationships: []
      }
      user_privileges: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          privilege_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          privilege_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          privilege_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_privileges_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_privileges_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_privileges_privilege_id_fkey"
            columns: ["privilege_id"]
            isOneToOne: false
            referencedRelation: "privileges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_privileges_privilege_id_fkey"
            columns: ["privilege_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["privilege_id"]
          },
          {
            foreignKeyName: "user_privileges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_privileges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_all_privileges"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      user_all_privileges: {
        Row: {
          category: string | null
          privilege_id: string | null
          privilege_name: string | null
          source: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      user_has_privilege: {
        Args: { privilege_name: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

