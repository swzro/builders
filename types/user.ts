import { Database } from './supabase';

export type User = Database['public']['Tables']['users']['Row'];
export type NewUser = Database['public']['Tables']['users']['Insert'];
export type UpdateUser = Database['public']['Tables']['users']['Update'];

export type EducationItem = {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
};

export type LanguageItem = {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'native';
};

export type SkillCategory = {
  category: string;
  items: string[];
};

export type ProfileFormValues = {
  username: string;
  name: string;
  bio: string;
  education: EducationItem[];
  language: LanguageItem[];
  etc: string;
  skills: SkillCategory[];
}; 