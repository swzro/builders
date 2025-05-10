import { Database } from './supabase';

export type Build = Database['public']['Tables']['builds']['Row'];
export type NewBuild = Database['public']['Tables']['builds']['Insert'];
export type UpdateBuild = Database['public']['Tables']['builds']['Update'];
export type BuildFile = Database['public']['Tables']['build_files']['Row'];
export type NewBuildFile = Database['public']['Tables']['build_files']['Insert'];
export type UpdateBuildFile = Database['public']['Tables']['build_files']['Update'];

export type BuildFormValues = {
  title: string;
  description: string;
  duration_start: string;
  duration_end: string;
  category: string;
  tags: string[];
  image_url?: string;
  is_public: boolean;
  source_urls?: string[];
  role?: string;
  lesson?: string;
  outcomes?: string;
  ai_generated?: boolean;
  status?: string;
  step?: number;
};

export type UploadedFile = {
  id?: string;
  file: File;
  preview?: string;
  content?: string;
  isUploaded?: boolean;
  path?: string;
}; 