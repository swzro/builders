import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { profileSchema } from '@/utils/validation';
import { cn } from '@/lib/utils';
import { getClient } from '@/lib/supabase';
import { EducationItem, LanguageItem, SkillCategory } from '@/types/user';

type FormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userId: string;
  defaultValues?: Partial<FormValues>;
  onComplete?: () => void;
}

const LANGUAGE_LEVELS = [
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
  { value: 'native', label: '원어민' },
];

export default function ProfileForm({
  userId,
  defaultValues = {
    username: '',
    name: '',
    bio: '',
    education: [],
    language: [],
    etc: '',
    skills: [],
  },
  onComplete,
}: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  // useFieldArray 설정
  const educationFields = useFieldArray({
    control,
    name: 'education',
  });

  const languageFields = useFieldArray({
    control,
    name: 'language',
  });

  const skillFields = useFieldArray({
    control,
    name: 'skills',
  });

  // 사용자명 중복 체크
  const checkUsername = async (username: string) => {
    if (!username) return false;
    
    const supabase = getClient();
    const { data, error } = await supabase
      .from('users')
      .select('username, id')
      .eq('username', username)
      .maybeSingle();
    
    if (error) {
      console.error('사용자명 체크 오류:', error);
      return false;
    }
    
    // 이미 존재하는 사용자명이고, 현재 사용자의 사용자명이 아닌 경우
    return data && data.username === username && data.id !== userId;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      console.log('폼 제출 시작:', values);
      setLoading(true);
      setError(null);
      setUsernameError(null);
      
      // 사용자명 중복 확인
      const isDuplicate = await checkUsername(values.username);
      console.log('사용자명 중복 체크 결과:', isDuplicate);
      
      if (isDuplicate) {
        setUsernameError('이미 사용 중인 사용자명입니다.');
        setLoading(false);
        return;
      }
      
      const supabase = getClient();
      console.log('Supabase 클라이언트 초기화 완료, 데이터 저장 시도');
      
      // 사용자 프로필 업데이트 또는 생성
      const { error, data } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: '', // 이 필드는 실제로는 auth 테이블에서 가져와야 함
          username: values.username,
          name: values.name,
          bio: values.bio || null,
          education: values.education || null,
          language: values.language || null,
          etc: values.etc || null,
          skills: values.skills || null,
        })
        .select();
      
      console.log('Supabase 응답:', { error, data });
      
      if (error) {
        console.error('저장 오류:', error);
        setError(error.message);
        return;
      }
      
      console.log('프로필 저장 성공, 리다이렉트 또는 onComplete 호출');
      // 성공적으로 완료됨
      if (onComplete) {
        console.log('onComplete 함수 호출');
        onComplete();
      } else {
        console.log('dashboard로 리다이렉트');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('프로필 저장 중 예외 발생:', err);
      setError('프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-brand-error/10 p-4 rounded-md text-sm text-brand-error border border-brand-error/20">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {/* 전역 validation 에러 메시지 */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-brand-error/10 p-3 rounded-md text-sm text-brand-error border border-brand-error/20 mb-2">
            필수 입력값을 모두 올바르게 입력해 주세요.
          </div>
        )}
        
        {/* 사용자명 필드 */}
        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-brand-textSecondary"
          >
            사용자명 (URL)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-textSecondary">
              bldrs.me/
            </span>
            <input
              id="username"
              type="text"
              {...register('username')}
              className={cn(
                "w-full pl-20 pr-3 py-2 bg-brand-surface border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70",
                (errors.username || usernameError) 
                  ? "border-brand-error text-brand-error" 
                  : "border-brand-border text-brand-text hover:border-brand-borderHover"
              )}
              disabled={loading}
              placeholder="your-username"
            />
          </div>
          {errors.username && (
            <p className="text-xs text-brand-error mt-1">{errors.username.message}</p>
          )}
          {usernameError && (
            <p className="text-xs text-brand-error mt-1">{usernameError}</p>
          )}
        </div>
        
        {/* 이름 필드 */}
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-brand-textSecondary"
          >
            이름
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className={cn(
              "w-full px-3 py-2 bg-brand-surface border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70",
              errors.name 
                ? "border-brand-error text-brand-error" 
                : "border-brand-border text-brand-text hover:border-brand-borderHover"
            )}
            disabled={loading}
            placeholder="홍길동"
          />
          {errors.name && (
            <p className="text-xs text-brand-error mt-1">{errors.name.message}</p>
          )}
        </div>
        
        {/* 자기소개 필드 */}
        <div className="space-y-1.5">
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-brand-textSecondary"
          >
            자기소개
          </label>
          <textarea
            id="bio"
            {...register('bio')}
            rows={4}
            className={cn(
              "w-full px-3 py-2 bg-brand-surface border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70",
              errors.bio 
                ? "border-brand-error text-brand-error" 
                : "border-brand-border text-brand-text hover:border-brand-borderHover"
            )}
            disabled={loading}
            placeholder="간단한 자기소개를 작성해주세요 (최대 160자)"
          />
          {errors.bio && (
            <p className="text-xs text-brand-error mt-1">{errors.bio.message}</p>
          )}
        </div>
        
        {/* 학력 섹션 */}
        <div className="space-y-4 bg-brand-surface/70 p-4 rounded-md border border-brand-border">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-brand-textSecondary">
              학력
            </label>
            <button
              type="button"
              onClick={() => 
                educationFields.append({
                  institution: '',
                  degree: '',
                  field: '',
                  start_date: '',
                  end_date: '',
                  is_current: false,
                })
              }
              className="text-xs px-2 py-1 rounded text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 transition-all"
            >
              + 학력 추가
            </button>
          </div>
          
          {educationFields.fields.length === 0 && (
            <p className="text-sm text-brand-textTertiary">등록된 학력 정보가 없습니다.</p>
          )}
          
          {educationFields.fields.map((field, index) => (
            <div key={field.id} className="space-y-3 bg-brand-surface p-3 rounded-md border border-brand-border">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">학력 #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => educationFields.remove(index)}
                  className="text-xs text-brand-error hover:text-brand-error/70"
                >
                  삭제
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-brand-textSecondary mb-1">
                    기관명
                  </label>
                  <input
                    type="text"
                    {...register(`education.${index}.institution` as const)}
                    className={cn(
                      "w-full px-3 py-1.5 bg-brand-surface border rounded-md text-sm",
                      errors.education?.[index]?.institution
                        ? "border-brand-error text-brand-error"
                        : "border-brand-border text-brand-text"
                    )}
                    placeholder="OO대학교"
                  />
                  {errors.education?.[index]?.institution && (
                    <p className="text-xs text-brand-error mt-1">
                      {errors.education[index]?.institution?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs text-brand-textSecondary mb-1">
                    학위
                  </label>
                  <input
                    type="text"
                    {...register(`education.${index}.degree` as const)}
                    className={cn(
                      "w-full px-3 py-1.5 bg-brand-surface border rounded-md text-sm",
                      errors.education?.[index]?.degree
                        ? "border-brand-error text-brand-error"
                        : "border-brand-border text-brand-text"
                    )}
                    placeholder="학사/석사/박사"
                  />
                  {errors.education?.[index]?.degree && (
                    <p className="text-xs text-brand-error mt-1">
                      {errors.education[index]?.degree?.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs text-brand-textSecondary mb-1">
                    전공
                  </label>
                  <input
                    type="text"
                    {...register(`education.${index}.field` as const)}
                    className="w-full px-3 py-1.5 bg-brand-surface border border-brand-border rounded-md text-sm"
                    placeholder="컴퓨터공학과"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`is_current_${index}`}
                    {...register(`education.${index}.is_current` as const)}
                    className="rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                  />
                  <label htmlFor={`is_current_${index}`} className="text-xs text-brand-textSecondary">
                    현재 재학/재직 중
                  </label>
                </div>
                
                <div>
                  <label className="block text-xs text-brand-textSecondary mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    {...register(`education.${index}.start_date` as const)}
                    className={cn(
                      "w-full px-3 py-1.5 bg-brand-surface border rounded-md text-sm",
                      errors.education?.[index]?.start_date
                        ? "border-brand-error text-brand-error"
                        : "border-brand-border text-brand-text"
                    )}
                  />
                  {errors.education?.[index]?.start_date && (
                    <p className="text-xs text-brand-error mt-1">
                      {errors.education[index]?.start_date?.message}
                    </p>
                  )}
                </div>
                
                {!watch(`education.${index}.is_current`) && (
                  <div>
                    <label className="block text-xs text-brand-textSecondary mb-1">
                      종료일
                    </label>
                    <input
                      type="date"
                      {...register(`education.${index}.end_date` as const)}
                      className="w-full px-3 py-1.5 bg-brand-surface border border-brand-border rounded-md text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* 외국어 섹션 */}
        <div className="space-y-4 bg-brand-surface/70 p-4 rounded-md border border-brand-border">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-brand-textSecondary">
              외국어
            </label>
            <button
              type="button"
              onClick={() => 
                languageFields.append({
                  name: '',
                  level: 'intermediate',
                })
              }
              className="text-xs px-2 py-1 rounded text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 transition-all"
            >
              + 언어 추가
            </button>
          </div>
          
          {languageFields.fields.length === 0 && (
            <p className="text-sm text-brand-textTertiary">등록된 외국어가 없습니다.</p>
          )}
          
          <div className="space-y-2">
            {languageFields.fields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2 bg-brand-surface p-2 rounded-md border border-brand-border">
                <div className="flex-1">
                  <input
                    type="text"
                    {...register(`language.${index}.name` as const)}
                    className={cn(
                      "w-full px-3 py-1.5 bg-brand-surface border rounded-md text-sm",
                      errors.language?.[index]?.name
                        ? "border-brand-error text-brand-error"
                        : "border-brand-border text-brand-text"
                    )}
                    placeholder="영어, 일본어 등"
                  />
                  {errors.language?.[index]?.name && (
                    <p className="text-xs text-brand-error mt-1">
                      {errors.language[index]?.name?.message}
                    </p>
                  )}
                </div>
                
                <div className="flex-1">
                  <select
                    {...register(`language.${index}.level` as const)}
                    className={cn(
                      "w-full px-3 py-1.5 bg-brand-surface border rounded-md text-sm",
                      errors.language?.[index]?.level
                        ? "border-brand-error text-brand-error"
                        : "border-brand-border text-brand-text"
                    )}
                  >
                    {LANGUAGE_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="button"
                  onClick={() => languageFields.remove(index)}
                  className="text-brand-error hover:text-brand-error/70 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* 기타 정보 필드 */}
        <div className="space-y-1.5">
          <label
            htmlFor="etc"
            className="block text-sm font-medium text-brand-textSecondary"
          >
            기타 정보
          </label>
          <textarea
            id="etc"
            {...register('etc')}
            rows={3}
            className={cn(
              "w-full px-3 py-2 bg-brand-surface border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70",
              errors.etc 
                ? "border-brand-error text-brand-error" 
                : "border-brand-border text-brand-text hover:border-brand-borderHover"
            )}
            disabled={loading}
            placeholder="기타 프로필에 추가하고 싶은 정보가 있다면 작성해주세요 (최대 300자)"
          />
          {errors.etc && (
            <p className="text-xs text-brand-error mt-1">{errors.etc.message}</p>
          )}
        </div>
        
        {/* 스킬 섹션 */}
        <div className="space-y-4 bg-brand-surface/70 p-4 rounded-md border border-brand-border">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-brand-textSecondary">
              스킬
            </label>
            <button
              type="button"
              onClick={() => 
                skillFields.append({
                  category: '',
                  items: [''],
                })
              }
              className="text-xs px-2 py-1 rounded text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 transition-all"
            >
              + 카테고리 추가
            </button>
          </div>
          
          {skillFields.fields.length === 0 && (
            <p className="text-sm text-brand-textTertiary">등록된 스킬이 없습니다.</p>
          )}
          
          {skillFields.fields.map((field, index) => (
            <div key={field.id} className="space-y-3 bg-brand-surface p-3 rounded-md border border-brand-border">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <label className="block text-xs text-brand-textSecondary mb-1">
                    카테고리
                  </label>
                  <input
                    type="text"
                    {...register(`skills.${index}.category` as const)}
                    className={cn(
                      "w-full px-3 py-1.5 bg-brand-surface border rounded-md text-sm",
                      errors.skills?.[index]?.category
                        ? "border-brand-error text-brand-error"
                        : "border-brand-border text-brand-text"
                    )}
                    placeholder="디자인, 프론트엔드 등"
                  />
                  {errors.skills?.[index]?.category && (
                    <p className="text-xs text-brand-error mt-1">
                      {errors.skills[index]?.category?.message}
                    </p>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => skillFields.remove(index)}
                  className="text-xs text-brand-error hover:text-brand-error/70 ml-2 mt-4"
                >
                  카테고리 삭제
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-brand-textSecondary">스킬 목록</label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentItems = watch(`skills.${index}.items`) || [];
                      const newItems = [...currentItems, ''];
                      
                      // useFieldArray에서 중첩 배열을 직접 조작하기 위한 방법
                      skillFields.update(index, {
                        ...watch(`skills.${index}`),
                        items: newItems,
                      });
                    }}
                    className="text-xs text-brand-primary hover:text-brand-primary/70"
                  >
                    + 스킬 추가
                  </button>
                </div>
                
                {watch(`skills.${index}.items`)?.map((_, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-2">
                    <input
                      type="text"
                      {...register(`skills.${index}.items.${itemIndex}` as const)}
                      className={cn(
                        "flex-1 px-3 py-1.5 bg-brand-surface border rounded-md text-sm",
                        errors.skills?.[index]?.items?.[itemIndex]
                          ? "border-brand-error text-brand-error"
                          : "border-brand-border text-brand-text"
                      )}
                      placeholder="React, Figma 등"
                    />
                    
                    <button
                      type="button"
                      onClick={() => {
                        const currentItems = watch(`skills.${index}.items`) || [];
                        const newItems = currentItems.filter((_, i) => i !== itemIndex);
                        
                        skillFields.update(index, {
                          ...watch(`skills.${index}`),
                          items: newItems.length > 0 ? newItems : [''], // 최소 1개는 유지
                        });
                      }}
                      className="text-brand-error hover:text-brand-error/70 p-1"
                      disabled={watch(`skills.${index}.items`)?.length <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-3 pt-5 border-t border-brand-border mt-8">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 border border-brand-border rounded-md text-sm font-medium text-brand-textSecondary bg-brand-surface hover:bg-brand-surfaceHover hover:border-brand-borderHover transition-all"
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium text-brand-text bg-brand-primary",
              "hover:bg-brand-primaryHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                저장 중...
              </div>
            ) : (
              "저장하기"
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 