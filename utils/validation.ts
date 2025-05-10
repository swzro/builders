import { z } from 'zod';
import { isValidUsername } from '@/lib/utils';

// 로그인 폼 검증 스키마
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
});

// 회원가입 폼 검증 스키마
export const signupSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

// 교육 항목 스키마
const educationItemSchema = z.object({
  institution: z.string().min(1, '기관명을 입력해주세요'),
  degree: z.string().min(1, '학위를 입력해주세요'),
  field: z.string().optional(),
  start_date: z.string().min(1, '시작일을 입력해주세요'),
  end_date: z.string().optional(),
  is_current: z.boolean().optional(),
});

// 언어 항목 스키마
const languageItemSchema = z.object({
  name: z.string().min(1, '언어명을 입력해주세요'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'native'], {
    errorMap: () => ({ message: '레벨을 선택해주세요' }),
  }),
});

// 스킬 카테고리 스키마
const skillCategorySchema = z.object({
  category: z.string().min(1, '카테고리명을 입력해주세요'),
  items: z.array(z.string()).min(1, '최소 1개 이상의 스킬을 입력해주세요'),
});

// 프로필 폼 검증 스키마
export const profileSchema = z.object({
  username: z
    .string()
    .min(3, '사용자명은 최소 3자 이상이어야 합니다')
    .max(20, '사용자명은 최대 20자까지 가능합니다')
    .refine(isValidUsername, {
      message: '사용자명은 영문, 숫자, 밑줄(_), 대시(-)만 포함할 수 있습니다',
    }),
  name: z.string().min(1, '이름을 입력해주세요'),
  bio: z.string().max(160, '자기소개는 최대 160자까지 가능합니다').optional(),
  education: z.array(educationItemSchema).optional(),
  language: z.array(languageItemSchema).optional(),
  etc: z.string().max(300, '기타 정보는 최대 300자까지 가능합니다').optional(),
  skills: z.array(skillCategorySchema).optional(),
});

// 커리어 폼 검증 스키마
export const buildSchema = z.object({
  title: z.string().min(1, '활동명을 입력해주세요'),
  description: z.string().min(1, '활동 내용을 입력해주세요'),
  duration_start: z.string().min(1, '시작일을 입력해주세요'),
  duration_end: z.string().optional(),
  category: z.string().min(1, '분류를 선택해주세요'),
  tags: z.array(z.string()).max(5, '태그는 최대 5개까지 추가할 수 있습니다'),
  image_url: z.string().optional(),
  is_public: z.boolean().default(true),
  source_url: z.string().url('유효한 URL을 입력해주세요').optional(),
  role: z.string().optional(),
  lesson: z.string().optional(),
  outcomes: z.string().optional(),
  ai_generated: z.boolean().optional(),
}); 