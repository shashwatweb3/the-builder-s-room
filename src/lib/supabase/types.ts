export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type KrewProfileStatus = "pending" | "approved" | "revoked";

/**
 * The public profile projection, plus approval state.
 *
 * Returned by krew_managed_profile / krew_update_by_token (020) and by
 * my_krew_profile / admin_krew_profiles (019). Deliberately has no user_id,
 * manage_token_hash or manage_token_created_at.
 */
export interface ManagedKrewProfile {
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
  status: KrewProfileStatus;
  is_public: boolean;
}

/** krew_claim_id returns the raw management token exactly once. */
export interface KrewClaimResult {
  profile_id: string;
  username: string;
  manage_token: string;
}

/** krew_avatar_upload_ticket reserves one storage path for 20 minutes. */
export interface KrewAvatarTicket {
  path: string;
  expires_at: string;
}

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
          /**
           * Nullable as of 020_krew_public_claim.sql: a profile claimed at
           * /krew-id has no auth account, so user_id is null until somebody with
           * a session claims ownership.
           */
          user_id: string | null;
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
          status: KrewProfileStatus;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
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
          status?: KrewProfileStatus;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
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
          status?: KrewProfileStatus;
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

      // ---- 020_krew_public_claim.sql: public, no-auth claim flow ----

      /**
       * Create a pending + private profile and return the raw manage token.
       * The token is the only credential the claimant ever sees; the database
       * keeps only its SHA-256 hash. `p_avatar_path` must be a live, unbound
       * ticket path from krew_avatar_upload_ticket when present.
       */
      krew_claim_id: {
        Args: {
          p_profile: Json;
          p_hp?: string | null;
          p_avatar_path?: string | null;
        };
        Returns: KrewClaimResult[];
      };
      /** Read the token-owned profile. Empty array when the token is unknown. */
      krew_managed_profile: {
        Args: { p_token: string };
        Returns: ManagedKrewProfile[];
      };
      /**
       * Update the token-owned profile. p_token is the first argument and
       * p_avatar_path is only needed when replacing the photo. status /
       * is_public / user_id are not writable here.
       */
      krew_update_by_token: {
        Args: {
          p_token: string;
          p_profile: Json;
          p_avatar_path?: string | null;
        };
        Returns: ManagedKrewProfile[];
      };
      /** Reserve one `claim/<hex>.<ext>` upload path for 20 minutes. */
      krew_avatar_upload_ticket: {
        Args: { p_ext: string };
        Returns: KrewAvatarTicket[];
      };
      /** True while a reserved path is still unbound and unexpired. */
      krew_avatar_upload_allowed: {
        Args: { p_name: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
