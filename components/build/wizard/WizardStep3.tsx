import { useState } from 'react';
import { BuildFormValues, UploadedFile } from '@/types/build';
import { cn } from '@/lib/utils';

interface WizardStep3Props {
  buildData: BuildFormValues;
  uploadedFiles: UploadedFile[];
  onPrevious: () => void;
  onNext: (buildData: BuildFormValues) => void;
  isLoading: boolean;
}

export default function WizardStep3({
  buildData,
  uploadedFiles,
  onPrevious,
  onNext,
  isLoading,
}: WizardStep3Props) {
  const [formData, setFormData] = useState<BuildFormValues>(buildData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 입력 필드 변경 처리
  const handleChange = (field: keyof BuildFormValues, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 필드 입력 시 해당 필드의 오류 메시지 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // 태그 관련 처리
  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
      .slice(0, 5);
    
    handleChange('tags', tags);
  };
  
  // 폼 제출 및 유효성 검사
  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    // 필수 필드 검사
    if (!formData.title) newErrors.title = '제목을 입력해주세요';
    if (!formData.description) newErrors.description = '설명을 입력해주세요';
    if (!formData.category) newErrors.category = '카테고리를 선택해주세요';
    if (!formData.duration_start) newErrors.duration_start = '시작일을 입력해주세요';
    
    // 날짜 형식 검사
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (formData.duration_start && !dateRegex.test(formData.duration_start)) {
      newErrors.duration_start = '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)';
    }
    if (formData.duration_end && !dateRegex.test(formData.duration_end)) {
      newErrors.duration_end = '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)';
    }
    
    setErrors(newErrors);
    
    // 오류가 없으면 다음 단계로 진행
    if (Object.keys(newErrors).length === 0) {
      onNext(formData);
    }
  };
  
  // 텍스트 필드 렌더링
  const renderTextField = (
    label: string,
    field: keyof BuildFormValues,
    value: string,
    placeholder: string,
    isMultiline = false,
    isRequired = false
  ) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-brand-textSecondary">
          {label}
          {isRequired && <span className="text-brand-error ml-1">*</span>}
        </label>
        {isMultiline ? (
          <textarea
            value={value as string}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={cn(
              "w-full px-3 py-2 bg-brand-base border border-brand-border rounded-md",
              "focus:outline-none focus:ring-1 focus:ring-brand-primary/70 text-brand-text",
              errors[field] && "border-brand-error focus:ring-brand-error/70"
            )}
            disabled={isLoading}
          />
        ) : (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full px-3 py-2 bg-brand-base border border-brand-border rounded-md",
              "focus:outline-none focus:ring-1 focus:ring-brand-primary/70 text-brand-text",
              errors[field] && "border-brand-error focus:ring-brand-error/70"
            )}
            disabled={isLoading}
          />
        )}
        {errors[field] && (
          <p className="text-xs text-brand-error">{errors[field]}</p>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-brand-text mb-4">Build 정보 수정</h2>
        <p className="text-sm text-brand-textSecondary mb-6">
          AI가 분석한 정보를 검토하고 필요한 부분을 수정해주세요.
        </p>
        
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-brand-text border-b border-brand-border pb-2">기본 정보</h3>
            
            {renderTextField('제목', 'title', formData.title, '프로젝트/활동 제목을 입력하세요', false, true)}
            
            {renderTextField('설명', 'description', formData.description, '프로젝트/활동에 대한 상세 설명을 입력하세요', true, true)}
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-brand-textSecondary">
                카테고리<span className="text-brand-error ml-1">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={cn(
                  "w-full px-3 py-2 bg-brand-base border border-brand-border rounded-md",
                  "focus:outline-none focus:ring-1 focus:ring-brand-primary/70 text-brand-text",
                  errors.category && "border-brand-error focus:ring-brand-error/70"
                )}
                disabled={isLoading}
              >
                <option value="" disabled>카테고리를 선택하세요</option>
                <option value="프로젝트">프로젝트</option>
                <option value="대외활동">대외활동</option>
                <option value="인턴">인턴</option>
                <option value="수상">수상</option>
                <option value="동아리">동아리</option>
                <option value="자격증">자격증</option>
                <option value="교육">교육</option>
                <option value="기타">기타</option>
              </select>
              {errors.category && (
                <p className="text-xs text-brand-error">{errors.category}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-brand-textSecondary">
                  시작일<span className="text-brand-error ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={formData.duration_start}
                  onChange={(e) => handleChange('duration_start', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 bg-brand-base border border-brand-border rounded-md",
                    "focus:outline-none focus:ring-1 focus:ring-brand-primary/70 text-brand-text",
                    errors.duration_start && "border-brand-error focus:ring-brand-error/70"
                  )}
                  disabled={isLoading}
                />
                {errors.duration_start && (
                  <p className="text-xs text-brand-error">{errors.duration_start}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-brand-textSecondary">
                  종료일 (진행 중이면 비워두세요)
                </label>
                <input
                  type="date"
                  value={formData.duration_end || ''}
                  onChange={(e) => handleChange('duration_end', e.target.value || null)}
                  className={cn(
                    "w-full px-3 py-2 bg-brand-base border border-brand-border rounded-md",
                    "focus:outline-none focus:ring-1 focus:ring-brand-primary/70 text-brand-text",
                    errors.duration_end && "border-brand-error focus:ring-brand-error/70"
                  )}
                  disabled={isLoading}
                />
                {errors.duration_end && (
                  <p className="text-xs text-brand-error">{errors.duration_end}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* 추가 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-brand-text border-b border-brand-border pb-2">추가 정보</h3>
            
            {renderTextField('역할', 'role', formData.role || '', '이 프로젝트에서의 역할을 입력하세요')}
            
            {renderTextField('배운 점', 'lesson', formData.lesson || '', '이 활동을 통해 배운 점을 입력하세요', true)}
            
            {renderTextField('성과', 'outcomes', formData.outcomes || '', '이 활동의 성과를 입력하세요', true)}
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-brand-textSecondary">
                태그 (쉼표로 구분, 최대 5개)
              </label>
              <input
                type="text"
                value={(formData.tags || []).join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="예: React, Web, AI, 디자인"
                className="w-full px-3 py-2 bg-brand-base border border-brand-border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70 text-brand-text"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-brand-textSecondary">
                공개 여부
              </label>
              <div className="flex items-center mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="text-brand-primary focus:ring-brand-primary"
                    checked={formData.is_public}
                    onChange={() => handleChange('is_public', true)}
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-brand-text">공개</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="text-brand-primary focus:ring-brand-primary"
                    checked={!formData.is_public}
                    onChange={() => handleChange('is_public', false)}
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-brand-text">비공개</span>
                </label>
              </div>
              <p className="text-xs text-brand-textTertiary mt-1">
                {formData.is_public 
                  ? '포트폴리오에 공개됩니다' 
                  : '비공개 상태로 저장됩니다'}
              </p>
            </div>
          </div>
          
          {/* 업로드된 파일 */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-brand-text border-b border-brand-border pb-2">업로드된 파일</h3>
              <div className="bg-brand-highlight rounded-lg p-4">
                <ul className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-brand-textSecondary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                      </svg>
                      <span className="text-sm text-brand-text">{file.file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isLoading}
          className={cn(
            "px-6 py-2 rounded-md text-sm font-medium text-brand-textSecondary bg-brand-surface border border-brand-border",
            "hover:bg-brand-surfaceHover hover:border-brand-borderHover focus:outline-none transition-all",
            isLoading && "opacity-70 cursor-not-allowed"
          )}
        >
          이전
        </button>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={cn(
            "px-6 py-2 rounded-md text-sm font-medium text-brand-text bg-brand-primary",
            "hover:bg-brand-primaryHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
            isLoading && "opacity-70 cursor-not-allowed"
          )}
        >
          다음
        </button>
      </div>
    </div>
  );
} 