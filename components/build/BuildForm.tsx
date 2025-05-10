import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { getClient } from '@/lib/supabase';
import { Build } from '@/types/build';

// 폼 전용 스키마 정의 (타입 오류 해결용)
const buildFormSchema = z.object({
  title: z.string().min(1, '활동명을 입력해주세요'),
  description: z.string().min(1, '활동 내용을 입력해주세요'),
  duration_start: z.string().min(1, '시작일을 입력해주세요'),
  duration_end: z.string().optional(),
  category: z.string().min(1, '분류를 선택해주세요'),
  tags: z.array(z.string()).max(5, '태그는 최대 5개까지 추가할 수 있습니다'),
  image_url: z.string().optional(),
  is_public: z.boolean(),
});

type BuildFormValues = z.infer<typeof buildFormSchema>;

interface BuildFormProps {
  userId: string;
  build?: Build;
  onComplete: () => void;
  isEdit?: boolean;
}

export default function BuildForm({
  userId,
  build,
  onComplete,
  isEdit,
}: BuildFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(build?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const isEditing = !!build;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BuildFormValues>({
    resolver: zodResolver(buildFormSchema),
    defaultValues: {
      title: build?.title || '',
      description: build?.description || '',
      duration_start: build?.duration_start ? build.duration_start.split('T')[0] : '',
      duration_end: build?.duration_end ? build.duration_end.split('T')[0] : '',
      category: build?.category || '',
      tags: build?.tags || [],
      image_url: build?.image_url || '',
      is_public: build?.is_public !== undefined ? build.is_public : true,
    },
  });

  // 태그 추가
  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    
    if (tags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    
    if (tags.length >= 5) {
      alert('태그는 최대 5개까지 추가할 수 있습니다.');
      return;
    }
    
    setTags([...tags, trimmed]);
    setValue('tags', [...tags, trimmed]);
    setTagInput('');
  };

  // 태그 삭제
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  // 폼 제출
  const onSubmit = async (values: BuildFormValues) => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = getClient();
      
      // 이미지 URL 처리 로직은 별도로 구현해야 함
      // (여기서는 문자열로 직접 입력받음)
      
      const buildData = {
        user_id: userId,
        title: values.title,
        description: values.description,
        duration_start: values.duration_start,
        duration_end: values.duration_end || null,
        category: values.category,
        tags: values.tags,
        image_url: values.image_url || null,
        is_public: values.is_public,
      };
      
      let result;
      
      if (isEditing && build) {
        // 수정
        result = await supabase
          .from('builds')
          .update(buildData)
          .eq('id', build.id);
      } else {
        // 새로 작성
        result = await supabase
          .from('builds')
          .insert(buildData);
      }
      
      if (result.error) {
        setError(result.error.message);
        return;
      }
      
      // 성공적으로 완료됨
      if (onComplete) {
        onComplete();
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Builds 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 키보드 이벤트 처리 (엔터 키로 태그 추가)
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
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
        
        <div className="space-y-1.5">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-brand-textSecondary"
          >
            활동명 *
          </label>
          <input
            id="title"
            type="text"
            {...register('title')}
            className={cn(
              "w-full px-3 py-2 bg-brand-surface border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70",
              errors.title 
                ? "border-brand-error text-brand-error" 
                : "border-brand-border text-brand-text hover:border-brand-borderHover"
            )}
            disabled={loading}
            placeholder="활동 이름을 입력하세요"
          />
          {errors.title && (
            <p className="text-xs text-brand-error mt-1">{errors.title.message}</p>
          )}
        </div>
        
        <div className="space-y-1.5">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-brand-textSecondary"
          >
            활동 내용 *
          </label>
          <textarea
            id="description"
            {...register('description')}
            rows={5}
            className={cn(
              "w-full px-3 py-2 bg-brand-surface border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70",
              errors.description 
                ? "border-brand-error text-brand-error" 
                : "border-brand-border text-brand-text hover:border-brand-borderHover"
            )}
            disabled={loading}
            placeholder="활동에 대한 자세한 내용을 작성하세요"
          />
          {errors.description && (
            <p className="text-xs text-brand-error mt-1">{errors.description.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="duration_start"
              className="block text-sm font-medium text-brand-textSecondary"
            >
              시작일 *
            </label>
            <input
              id="duration_start"
              type="date"
              {...register('duration_start')}
              className={cn(
                "w-full px-3 py-2 bg-brand-surface border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70",
                errors.duration_start 
                  ? "border-brand-error text-brand-error" 
                  : "border-brand-border text-brand-text hover:border-brand-borderHover"
              )}
              disabled={loading}
            />
            {errors.duration_start && (
              <p className="text-xs text-brand-error mt-1">{errors.duration_start.message}</p>
            )}
          </div>
          
          <div className="space-y-1.5">
            <label
              htmlFor="duration_end"
              className="block text-sm font-medium text-brand-textSecondary"
            >
              종료일 <span className="text-brand-textTertiary">(진행중인 경우 비워두세요)</span>
            </label>
            <input
              id="duration_end"
              type="date"
              {...register('duration_end')}
              className={cn(
                "w-full px-3 py-2 bg-brand-surface border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70",
                errors.duration_end 
                  ? "border-brand-error text-brand-error" 
                  : "border-brand-border text-brand-text hover:border-brand-borderHover"
              )}
              disabled={loading}
            />
            {errors.duration_end && (
              <p className="text-xs text-brand-error mt-1">{errors.duration_end.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-brand-textSecondary"
          >
            분류 *
          </label>
          <select
            id="category"
            {...register('category')}
            className={cn(
              "w-full px-3 py-2 bg-brand-surface border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70",
              errors.category 
                ? "border-brand-error text-brand-error" 
                : "border-brand-border text-brand-text hover:border-brand-borderHover"
            )}
            disabled={loading}
          >
            <option value="">분류 선택</option>
            <option value="대외활동">대외활동</option>
            <option value="인턴">인턴</option>
            <option value="수상">수상</option>
            <option value="프로젝트">프로젝트</option>
            <option value="동아리">동아리</option>
            <option value="자격증">자격증</option>
            <option value="교육">교육</option>
            <option value="기타">기타</option>
          </select>
          {errors.category && (
            <p className="text-xs text-brand-error mt-1">{errors.category.message}</p>
          )}
        </div>
        
        <div className="space-y-1.5">
          <label 
            htmlFor="tags" 
            className="block text-sm font-medium text-brand-textSecondary"
          >
            태그 <span className="text-brand-textTertiary">(최대 5개)</span>
          </label>
          <div className="flex items-center">
            <input
              id="tag-input"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className={cn(
                "flex-1 px-3 py-2 bg-brand-surface border rounded-l-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70",
                tags.length >= 5 
                  ? "border-brand-border text-brand-textTertiary" 
                  : "border-brand-border text-brand-text hover:border-brand-borderHover"
              )}
              disabled={loading || tags.length >= 5}
              placeholder={tags.length >= 5 ? "태그 최대 개수 도달" : "태그 입력 후 엔터"}
            />
            <button
              type="button"
              onClick={addTag}
              disabled={loading || !tagInput.trim() || tags.length >= 5}
              className={cn(
                "px-4 py-2 border border-l-0 rounded-r-md",
                "focus:outline-none transition-colors",
                tagInput.trim() && tags.length < 5
                  ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/20"
                  : "bg-brand-surface border-brand-border text-brand-textTertiary"
              )}
            >
              추가
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <div 
                  key={index} 
                  className="flex items-center bg-brand-primary/10 text-brand-primary rounded-full pl-3 pr-1 py-1"
                >
                  <span className="text-xs">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 p-1 rounded-full text-brand-primary hover:bg-brand-primary/20 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="space-y-1.5">
          <label
            htmlFor="image_url"
            className="block text-sm font-medium text-brand-textSecondary"
          >
            이미지 URL <span className="text-brand-textTertiary">(선택사항)</span>
          </label>
          <input
            id="image_url"
            type="text"
            {...register('image_url')}
            className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70 text-brand-text hover:border-brand-borderHover"
            disabled={loading}
            placeholder="이미지 URL을 입력하세요"
          />
        </div>
        
        <div className="pt-2">
          <label className="flex items-center">
            <input
              id="is_public"
              type="checkbox"
              {...register('is_public')}
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary/30 bg-brand-surface border-brand-border rounded"
            />
            <span className="ml-2 block text-sm text-brand-text">
              공개 
              <span className="text-brand-textSecondary ml-1">
                (체크하면 포트폴리오에 표시됩니다)
              </span>
            </span>
          </label>
        </div>
        
        <div className="flex justify-end space-x-3 pt-5 border-t border-brand-border mt-8">
          <button
            type="button"
            onClick={() => router.back()}
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
              isEditing ? '수정하기' : '등록하기'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 