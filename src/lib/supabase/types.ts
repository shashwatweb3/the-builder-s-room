export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          long_description: string | null;
          event_date: string;
          end_date: string | null;
          location: string;
          is_online: boolean;
          meeting_url: string | null;
          registration_url: string | null;
          image_url: string | null;
          featured: boolean;
          status: "draft" | "published" | "cancelled" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          long_description?: string | null;
          event_date: string;
          end_date?: string | null;
          location: string;
          is_online?: boolean;
          meeting_url?: string | null;
          registration_url?: string | null;
          image_url?: string | null;
          featured?: boolean;
          status?: "draft" | "published" | "cancelled" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          long_description?: string | null;
          event_date?: string;
          end_date?: string | null;
          location?: string;
          is_online?: boolean;
          meeting_url?: string | null;
          registration_url?: string | null;
          image_url?: string | null;
          featured?: boolean;
          status?: "draft" | "published" | "cancelled" | "completed";
          updated_at?: string;
        };
      };
      opportunities: {
        Row: {
          id: string;
          title: string;
          slug: string;
          type: "job" | "hackathon" | "grant" | "residency" | "ambassador";
          organization: string;
          description: string;
          long_description: string | null;
          location: string;
          remote: boolean;
          compensation: string | null;
          deadline: string | null;
          application_url: string | null;
          image_url: string | null;
          tags: string[];
          featured: boolean;
          status: "draft" | "published" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          type: "job" | "hackathon" | "grant" | "residency" | "ambassador";
          organization: string;
          description: string;
          long_description?: string | null;
          location: string;
          remote?: boolean;
          compensation?: string | null;
          deadline?: string | null;
          application_url?: string | null;
          image_url?: string | null;
          tags?: string[];
          featured?: boolean;
          status?: "draft" | "published" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          type?: "job" | "hackathon" | "grant" | "residency" | "ambassador";
          organization?: string;
          description?: string;
          long_description?: string | null;
          location?: string;
          remote?: boolean;
          compensation?: string | null;
          deadline?: string | null;
          application_url?: string | null;
          image_url?: string | null;
          tags?: string[];
          featured?: boolean;
          status?: "draft" | "published" | "closed";
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: "admin";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "admin";
        };
      };
      krew_profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          member_type: string | null;
          x_handle: string | null;
          telegram_handle: string | null;
          website_url: string | null;
          best_work_title: string | null;
          best_work_url: string | null;
          status: "pending" | "approved" | "revoked";
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          member_type?: string | null;
          x_handle?: string | null;
          telegram_handle?: string | null;
          website_url?: string | null;
          best_work_title?: string | null;
          best_work_url?: string | null;
          status?: "pending" | "approved" | "revoked";
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          member_type?: string | null;
          x_handle?: string | null;
          telegram_handle?: string | null;
          website_url?: string | null;
          best_work_title?: string | null;
          best_work_url?: string | null;
          status?: "pending" | "approved" | "revoked";
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "krew_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      krew_profiles_public: {
        Row: {
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          member_type: string | null;
          x_handle: string | null;
          telegram_handle: string | null;
          website_url: string | null;
          best_work_title: string | null;
          best_work_url: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      /** Returns the caller's own row, or no rows. SECURITY DEFINER. */
      my_krew_profile: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Tables"]["krew_profiles"]["Row"][];
      };
      /** True when the handle is already reserved by any profile. */
      krew_username_taken: {
        Args: { p_username: string };
        Returns: boolean;
      };
      /** Every profile for admins. Returns nothing for anyone else. */
      admin_krew_profiles: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Tables"]["krew_profiles"]["Row"][];
      };
    };
    Enums: Record<string, never>;
  };
}
