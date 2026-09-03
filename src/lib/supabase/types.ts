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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
