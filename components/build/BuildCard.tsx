import { Build } from '@/types/build';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BuildCardProps {
  build: Build;
  isEditable?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTogglePublic?: (id: string, isPublic: boolean) => void;
}

export default function BuildCard({
  build,
  isEditable = false,
  onEdit,
  onDelete,
  onTogglePublic,
}: BuildCardProps) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(build.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      if (window.confirm('이 Builds 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        onDelete(build.id);
      }
    }
  };

  const handleTogglePublic = () => {
    if (onTogglePublic) {
      onTogglePublic(build.id, !build.is_public);
    }
  };

  const formattedDuration = () => {
    if (!build.duration_start) return '';
    return formatDuration(
      build.duration_start, 
      build.duration_end || undefined
    );
  };

  return (
    <div className={cn(
      "bg-brand-surface border border-brand-border rounded-lg overflow-hidden shadow-dark transition-all",
      "hover:border-brand-borderHover",
      !build.is_public && isEditable && "border-dashed border-brand-border/50 bg-brand-surface/50"
    )}>
      {build.image_url && (
        <div className="h-48 overflow-hidden relative">
          <Image
            src={build.image_url}
            alt={build.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-brand-text">{build.title}</h3>
            <p className="text-sm text-brand-textSecondary mt-1">
              {formattedDuration()}
            </p>
          </div>
          
          {isEditable && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleTogglePublic}
                className="p-1.5 rounded-md text-brand-textSecondary hover:text-brand-text hover:bg-brand-surfaceHover transition-all"
                title={build.is_public ? '비공개로 전환' : '공개로 전환'}
              >
                {build.is_public ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-md text-brand-textSecondary hover:text-brand-text hover:bg-brand-surfaceHover transition-all"
                title="수정"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-md text-brand-textSecondary hover:text-brand-error hover:bg-brand-error/10 transition-all"
                title="삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {build.category && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">
              {build.category}
            </span>
          </div>
        )}
        
        <div className="mt-4 mb-4">
          <div className="text-sm text-brand-textSecondary mb-2">
            <span>{build.duration_start || ''}</span>
            {build.duration_end && <span> - {build.duration_end}</span>}
            {!build.duration_end && <span> - 현재</span>}
          </div>
          
          {build.description && (
            <p className="text-sm text-brand-text whitespace-pre-line">
              {build.description}
            </p>
          )}
        </div>
        
        {/* 역할 정보 표시 */}
        {build.role && (
          <div className="mb-4 bg-brand-highlight rounded-md p-3 border border-brand-primary/10">
            <div className="text-xs font-medium text-brand-textSecondary mb-1">역할</div>
            <p className="text-sm text-brand-text">{build.role}</p>
          </div>
        )}
        
        {/* 배운 점 또는 성과 정보 표시 */}
        {(build.lesson || build.outcomes) && (
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {build.lesson && (
              <div className="bg-brand-surface rounded-md p-3 border border-brand-border">
                <div className="text-xs font-medium text-brand-textSecondary mb-1">배운 점</div>
                <p className="text-sm text-brand-text">{build.lesson}</p>
              </div>
            )}
            {build.outcomes && (
              <div className="bg-brand-surface rounded-md p-3 border border-brand-border">
                <div className="text-xs font-medium text-brand-textSecondary mb-1">성과</div>
                <p className="text-sm text-brand-text">{build.outcomes}</p>
              </div>
            )}
          </div>
        )}
        
        {/* 소스 링크 표시 */}
        {build.source_url && (
          <div className="mb-4">
            <a 
              href={build.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-brand-primary hover:text-brand-primaryHover transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {getLinkLabel(build.source_url)}
            </a>
          </div>
        )}
        
        {build.tags && build.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {build.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-brand-surface border border-brand-border text-brand-textSecondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {!build.is_public && isEditable && (
          <div className="mt-3 text-xs text-brand-textTertiary italic flex items-center">
            <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            비공개 Build (본인만 볼 수 있음)
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 링크 레이블 생성 (도메인 추출)
 */
function getLinkLabel(url: string): string {
  try {
    const domain = new URL(url).hostname
      .replace(/^www\./, '')
      .split('.')
      .slice(0, -1)
      .join('.');
      
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return '소스 링크';
  }
} 