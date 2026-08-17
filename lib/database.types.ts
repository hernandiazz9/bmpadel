/**
 * Hand-written schema type for the Supabase client, mirroring `schema.sql`.
 *
 * Written by hand rather than generated so it stays readable and versioned next
 * to the SQL — the schema is one of the two things that survives the POC
 * (ADR-001). Its only job is to keep `data` off `any` at every call site
 * (CONTEXT.md rule 4); without it `createClient` types every result as `any`.
 */

import type {
  AppUser,
  Booking,
  ClassSession,
  ClassType,
  Comment,
  Like,
  MediaType,
  Post,
  Role,
} from "@/lib/types";

type UserInsert = {
  id: string;
  name: string;
  avatar_url?: string | null;
  role?: Role;
  level?: number | null;
  created_at?: string;
};

type ClassSessionInsert = {
  id?: string;
  coach_id: string;
  title: string;
  type: ClassType;
  level_min: number;
  level_max: number;
  starts_at: string;
  duration_min: number;
  court: string;
  capacity: number;
  price: number;
  notes?: string | null;
  created_at?: string;
};

type BookingInsert = {
  id?: string;
  session_id: string;
  user_id: string;
  created_at?: string;
};

type PostInsert = {
  id?: string;
  author_id: string;
  body: string;
  media_url?: string | null;
  media_type?: MediaType | null;
  created_at?: string;
};

type CommentInsert = {
  id?: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      user: {
        Row: AppUser;
        Insert: UserInsert;
        Update: Partial<UserInsert>;
        Relationships: [];
      };
      class_session: {
        Row: ClassSession;
        Insert: ClassSessionInsert;
        Update: Partial<ClassSessionInsert>;
        Relationships: [];
      };
      booking: {
        Row: Booking;
        Insert: BookingInsert;
        Update: Partial<BookingInsert>;
        Relationships: [];
      };
      post: {
        Row: Post;
        Insert: PostInsert;
        Update: Partial<PostInsert>;
        Relationships: [];
      };
      like: {
        Row: Like;
        Insert: Like;
        Update: Partial<Like>;
        Relationships: [];
      };
      comment: {
        Row: Comment;
        Insert: CommentInsert;
        Update: Partial<CommentInsert>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
