import { Database } from './supabase';

export type Build = Database['public']['Tables']['builds']['Row'];
export type NewBuild = Database['public']['Tables']['builds']['Insert'];
export type UpdateBuild = Database['public']['Tables']['builds']['Update'];

export type BuildFormValues = {
  title: string;
  description: string;
  duration_start: string;
  duration_end: string;
  category: string;
  tags: string[];
  image_url?: string;
  is_public: boolean;
  source_url?: string;
  role?: string;
  lesson?: string;
  outcomes?: string;
  ai_generated?: boolean;
}; 