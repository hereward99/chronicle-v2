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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      boons: {
        Row: {
          chronicle_id: string
          created_at: string
          creditor_id: string
          debtor_id: string
          description: string
          id: string
          notes: string | null
          plot_id: string | null
          session_id: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chronicle_id: string
          created_at?: string
          creditor_id: string
          debtor_id: string
          description: string
          id?: string
          notes?: string | null
          plot_id?: string | null
          session_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chronicle_id?: string
          created_at?: string
          creditor_id?: string
          debtor_id?: string
          description?: string
          id?: string
          notes?: string | null
          plot_id?: string | null
          session_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boons_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boons_creditor_id_fkey"
            columns: ["creditor_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boons_debtor_id_fkey"
            columns: ["debtor_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boons_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boons_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      character_factions: {
        Row: {
          character_id: string
          created_at: string
          faction_id: string
          id: string
          role: string | null
        }
        Insert: {
          character_id: string
          created_at?: string
          faction_id: string
          id?: string
          role?: string | null
        }
        Update: {
          character_id?: string
          created_at?: string
          faction_id?: string
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      characters: {
        Row: {
          advantages: Json | null
          ambition: string | null
          appearance: string | null
          attachments: Json | null
          avatar_url: string | null
          blood_potency: number | null
          charisma: number | null
          chronicle_id: string
          chronicle_tenets: string[] | null
          clan: string
          composure: number | null
          concept: string | null
          convictions: string[] | null
          coterie: string | null
          created_at: string
          desire: string | null
          dexterity: number | null
          dice_pools: Json | null
          disciplines: Json | null
          distinguishing_features: string | null
          experience_spent: number | null
          experience_total: number | null
          flaws: Json | null
          generation: number | null
          health_aggravated: number | null
          health_max: number | null
          health_superficial: number | null
          history: string | null
          humanity: number | null
          hunger: number | null
          id: string
          intelligence: number | null
          loresheets: Json | null
          manipulation: number | null
          name: string
          notes: string | null
          powers: Json | null
          predator_type: string | null
          resolve: number | null
          resonance: string | null
          sire: string | null
          skills: Json | null
          skip_attributes: boolean | null
          stamina: number | null
          status: string
          strength: number | null
          touchstones: Json | null
          type: string
          updated_at: string
          use_dice_pools: boolean | null
          user_id: string
          willpower_aggravated: number | null
          willpower_max: number | null
          willpower_superficial: number | null
          wits: number | null
        }
        Insert: {
          advantages?: Json | null
          ambition?: string | null
          appearance?: string | null
          attachments?: Json | null
          avatar_url?: string | null
          blood_potency?: number | null
          charisma?: number | null
          chronicle_id: string
          chronicle_tenets?: string[] | null
          clan: string
          composure?: number | null
          concept?: string | null
          convictions?: string[] | null
          coterie?: string | null
          created_at?: string
          desire?: string | null
          dexterity?: number | null
          dice_pools?: Json | null
          disciplines?: Json | null
          distinguishing_features?: string | null
          experience_spent?: number | null
          experience_total?: number | null
          flaws?: Json | null
          generation?: number | null
          health_aggravated?: number | null
          health_max?: number | null
          health_superficial?: number | null
          history?: string | null
          humanity?: number | null
          hunger?: number | null
          id?: string
          intelligence?: number | null
          loresheets?: Json | null
          manipulation?: number | null
          name: string
          notes?: string | null
          powers?: Json | null
          predator_type?: string | null
          resolve?: number | null
          resonance?: string | null
          sire?: string | null
          skills?: Json | null
          skip_attributes?: boolean | null
          stamina?: number | null
          status?: string
          strength?: number | null
          touchstones?: Json | null
          type?: string
          updated_at?: string
          use_dice_pools?: boolean | null
          user_id: string
          willpower_aggravated?: number | null
          willpower_max?: number | null
          willpower_superficial?: number | null
          wits?: number | null
        }
        Update: {
          advantages?: Json | null
          ambition?: string | null
          appearance?: string | null
          attachments?: Json | null
          avatar_url?: string | null
          blood_potency?: number | null
          charisma?: number | null
          chronicle_id?: string
          chronicle_tenets?: string[] | null
          clan?: string
          composure?: number | null
          concept?: string | null
          convictions?: string[] | null
          coterie?: string | null
          created_at?: string
          desire?: string | null
          dexterity?: number | null
          dice_pools?: Json | null
          disciplines?: Json | null
          distinguishing_features?: string | null
          experience_spent?: number | null
          experience_total?: number | null
          flaws?: Json | null
          generation?: number | null
          health_aggravated?: number | null
          health_max?: number | null
          health_superficial?: number | null
          history?: string | null
          humanity?: number | null
          hunger?: number | null
          id?: string
          intelligence?: number | null
          loresheets?: Json | null
          manipulation?: number | null
          name?: string
          notes?: string | null
          powers?: Json | null
          predator_type?: string | null
          resolve?: number | null
          resonance?: string | null
          sire?: string | null
          skills?: Json | null
          skip_attributes?: boolean | null
          stamina?: number | null
          status?: string
          strength?: number | null
          touchstones?: Json | null
          type?: string
          updated_at?: string
          use_dice_pools?: boolean | null
          user_id?: string
          willpower_aggravated?: number | null
          willpower_max?: number | null
          willpower_superficial?: number | null
          wits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          is_completed: boolean
          sort_order: number
          text: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          is_completed?: boolean
          sort_order?: number
          text: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          sort_order?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "session_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      chronicles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          setting: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          setting?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          setting?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coterie_members: {
        Row: {
          character_id: string
          coterie_id: string
          created_at: string
          id: string
          role: string | null
        }
        Insert: {
          character_id: string
          coterie_id: string
          created_at?: string
          id?: string
          role?: string | null
        }
        Update: {
          character_id?: string
          coterie_id?: string
          created_at?: string
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      coteries: {
        Row: {
          attachments: Json | null
          chasse: number
          chronicle_id: string
          chronicle_tenets: string | null
          city: string | null
          coterie_advantages_and_flaws: string | null
          coterie_boons_and_debts: string | null
          coterie_goals: string | null
          coterie_type: string | null
          created_at: string
          description: string | null
          domain: string | null
          domain_merits: string | null
          domain_resonance: string | null
          haven_location: string | null
          haven_merits_and_flaws: string | null
          id: string
          is_primary: boolean
          lien: number
          name: string
          portillon: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          chasse?: number
          chronicle_id: string
          chronicle_tenets?: string | null
          city?: string | null
          coterie_advantages_and_flaws?: string | null
          coterie_boons_and_debts?: string | null
          coterie_goals?: string | null
          coterie_type?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          domain_merits?: string | null
          domain_resonance?: string | null
          haven_location?: string | null
          haven_merits_and_flaws?: string | null
          id?: string
          is_primary?: boolean
          lien?: number
          name: string
          portillon?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          chasse?: number
          chronicle_id?: string
          chronicle_tenets?: string | null
          city?: string | null
          coterie_advantages_and_flaws?: string | null
          coterie_boons_and_debts?: string | null
          coterie_goals?: string | null
          coterie_type?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          domain_merits?: string | null
          domain_resonance?: string | null
          haven_location?: string | null
          haven_merits_and_flaws?: string | null
          id?: string
          is_primary?: boolean
          lien?: number
          name?: string
          portillon?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coteries_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_notes: {
        Row: {
          category: string
          created_at: string
          done: boolean
          id: string
          text: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          done?: boolean
          id?: string
          text: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          done?: boolean
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      factions: {
        Row: {
          chronicle_id: string
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chronicle_id: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chronicle_id?: string
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "factions_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          attachments: Json | null
          chronicle_id: string
          city_region: string | null
          coordinates: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          chronicle_id: string
          city_region?: string | null
          coordinates?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          chronicle_id?: string
          city_region?: string | null
          coordinates?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string | null
          chronicle_id: string
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          chronicle_id: string
          content?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          chronicle_id?: string
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
      plot_characters: {
        Row: {
          character_id: string
          created_at: string
          id: string
          plot_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          plot_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          plot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plot_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plot_characters_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          attachments: Json | null
          chronicle_id: string
          created_at: string
          description: string | null
          id: string
          in_game_date_end: string | null
          in_game_date_start: string | null
          priority: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          chronicle_id: string
          created_at?: string
          description?: string | null
          id?: string
          in_game_date_end?: string | null
          in_game_date_start?: string | null
          priority?: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          chronicle_id?: string
          created_at?: string
          description?: string | null
          id?: string
          in_game_date_end?: string | null
          in_game_date_start?: string | null
          priority?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plots_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          character_id: string
          created_at: string
          description: string | null
          id: string
          intensity: number
          is_mutual: boolean | null
          notes: string | null
          related_character_id: string
          relationship_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          description?: string | null
          id?: string
          intensity?: number
          is_mutual?: boolean | null
          notes?: string | null
          related_character_id: string
          relationship_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          description?: string | null
          id?: string
          intensity?: number
          is_mutual?: boolean | null
          notes?: string | null
          related_character_id?: string
          relationship_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_beats: {
        Row: {
          body: string
          chronicle_id: string
          created_at: string
          id: string
          kind: string
          order_index: number
          session_id: string
          user_id: string
        }
        Insert: {
          body: string
          chronicle_id: string
          created_at?: string
          id?: string
          kind?: string
          order_index?: number
          session_id: string
          user_id: string
        }
        Update: {
          body?: string
          chronicle_id?: string
          created_at?: string
          id?: string
          kind?: string
          order_index?: number
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      session_characters: {
        Row: {
          character_id: string
          created_at: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_characters_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_checklists: {
        Row: {
          chronicle_id: string
          created_at: string
          id: string
          notes: string | null
          plot_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chronicle_id: string
          created_at?: string
          id?: string
          notes?: string | null
          plot_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chronicle_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          plot_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_checklists_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_checklists_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          attachments: Json | null
          chronicle_id: string
          created_at: string
          date_played: string
          experience_awarded: number | null
          id: string
          in_game_date_end: string | null
          in_game_date_start: string | null
          plot_id: string | null
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          chronicle_id: string
          created_at?: string
          date_played?: string
          experience_awarded?: number | null
          id?: string
          in_game_date_end?: string | null
          in_game_date_start?: string | null
          plot_id?: string | null
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          chronicle_id?: string
          created_at?: string
          date_played?: string
          experience_awarded?: number | null
          id?: string
          in_game_date_end?: string | null
          in_game_date_start?: string | null
          plot_id?: string | null
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_chronicle_id_fkey"
            columns: ["chronicle_id"]
            isOneToOne: false
            referencedRelation: "chronicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
