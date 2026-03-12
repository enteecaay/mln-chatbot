export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      access_logs: {
        Row: {
          created_at: string;
          id: string;
          path: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          path: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          path?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      chat_sessions: {
        Row: {
          created_at: string;
          id: string;
          message_count: number;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message_count?: number;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message_count?: number;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      email_otps: {
        Row: {
          consumed_at: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          otp_code: string;
          purpose: "signup" | "change_email";
          user_id: string;
        };
        Insert: {
          consumed_at?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          otp_code: string;
          purpose?: "signup" | "change_email";
          user_id: string;
        };
        Update: {
          consumed_at?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          otp_code?: string;
          purpose?: "signup" | "change_email";
          user_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          role: "user" | "assistant";
          session_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          role: "user" | "assistant";
          session_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          role?: "user" | "assistant";
          session_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          ban_expires_at: string | null;
          ban_reason: string | null;
          created_at: string;
          id: string;
          is_banned: boolean;
          message_count: number;
          name: string;
          role: "user" | "admin";
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          ban_expires_at?: string | null;
          ban_reason?: string | null;
          created_at?: string;
          id: string;
          is_banned?: boolean;
          message_count?: number;
          name: string;
          role?: "user" | "admin";
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          ban_expires_at?: string | null;
          ban_reason?: string | null;
          created_at?: string;
          id?: string;
          is_banned?: boolean;
          message_count?: number;
          name?: string;
          role?: "user" | "admin";
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      message_role: "user" | "assistant";
      otp_purpose: "signup" | "change_email";
      user_role: "user" | "admin";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ChatSessionRow = Database["public"]["Tables"]["chat_sessions"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];