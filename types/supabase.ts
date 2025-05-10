export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          name: string | null
          bio: string | null
          education: Json[] | null
          language: Json[] | null
          etc: string | null
          skills: Json | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          name?: string | null
          bio?: string | null
          education?: Json[] | null
          language?: Json[] | null
          etc?: string | null
          skills?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          name?: string | null
          bio?: string | null
          education?: Json[] | null
          language?: Json[] | null
          etc?: string | null
          skills?: Json | null
          created_at?: string
        }
      }
      builds: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          duration_start: string | null
          duration_end: string | null
          category: string | null
          tags: string[] | null
          image_url: string | null
          is_public: boolean
          created_at: string
          source_urls: string[] | null
          role: string | null
          lesson: string | null
          outcomes: string | null
          ai_generated: boolean | null
          status: string | null
          step: number | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          duration_start?: string | null
          duration_end?: string | null
          category?: string | null
          tags?: string[] | null
          image_url?: string | null
          is_public?: boolean
          created_at?: string
          source_urls?: string[] | null
          role?: string | null
          lesson?: string | null
          outcomes?: string | null
          ai_generated?: boolean | null
          status?: string | null
          step?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          duration_start?: string | null
          duration_end?: string | null
          category?: string | null
          tags?: string[] | null
          image_url?: string | null
          is_public?: boolean
          created_at?: string
          source_urls?: string[] | null
          role?: string | null
          lesson?: string | null
          outcomes?: string | null
          ai_generated?: boolean | null
          status?: string | null
          step?: number | null
        }
      }
      build_files: {
        Row: {
          id: string
          build_id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          file_path: string
          content_preview: string | null
          created_at: string
        }
        Insert: {
          id?: string
          build_id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          file_path: string
          content_preview?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          build_id?: string
          user_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          file_path?: string
          content_preview?: string | null
          created_at?: string
        }
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
  }
} 