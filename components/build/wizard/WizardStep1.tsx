import { useState, useRef } from 'react';
import { UploadedFile } from '@/types/build';
import { cn } from '@/lib/utils';

interface WizardStep1Props {
  sourceUrls: string[];
  setSourceUrls: (urls: string[]) => void;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (files: UploadedFile[]) => void;
  onNext: () => void;
  isLoading: boolean;
}

export default function WizardStep1({
  sourceUrls,
  setSourceUrls,
  uploadedFiles,
  setUploadedFiles,
  onNext,
  isLoading,
}: WizardStep1Props) {
  const [error, setError] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 링크 타입 감지
  const detectLinkType = (url: string) => {
    if (!url) return '';
    if (url.includes('github.com')) return 'github';
    if (url.includes('figma.com')) return 'figma';
    if (url.includes('notion.so')) return 'notion';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    return 'website';
  };
  
  // 링크 아이콘 선택
  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'github':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        );
      case 'figma':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M15.852 8.981h-4.588v-4.588h4.588c1.25 0 2.271 1.021 2.271 2.294 0 1.272-1.021 2.294-2.271 2.294z"/>
            <path d="M11.264 0v8.981h-4.588c-1.272 0-2.294-1.021-2.294-2.294 0-1.273 1.021-2.294 2.294-2.294h4.588v-4.393z"/>
            <path d="M11.264 15.265v4.393c0 1.272-1.022 2.294-2.295 2.294-1.272 0-2.294-1.021-2.294-2.294 0-1.274 1.021-2.296 2.294-2.296h2.295z"/>
            <path d="M11.264 8.981v6.283h-2.295c-1.272 0-2.294-1.021-2.294-2.294s1.021-2.294 2.294-2.294h2.295z"/>
            <path d="M15.852 8.981h-4.588v6.283h4.588c1.25 0 2.271-1.021 2.271-2.294 0-1.273-1.021-2.294-2.271-2.294z"/>
          </svg>
        );
      case 'notion':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zM5.068 8.918v-.793c0-.466.187-.652.8-.652.653 0 1.307.42 1.307.652v.793c0 .466-.607.7-.927.56l-.933-.326c-.14-.093-.187-.28-.187-.28zM5.951 14.955l14.755-1.073c.839-.092.839-.699.839-.932v-9.298c0-.466-.14-.839-.7-.839-.326 0-.92.373-1.326.653l-13.381.746c-.792.093-1.167.44-1.167 1.026v8.225c0 .7.187 1.027.974.979zM7.124 23.637l10.92-.28c1.026-.093 1.306-.373 1.679-.932l6.857-10.032c.467-.7.096-1.165-.374-1.165h-3.108c-.28 0-.746.093-1.167.56l-11.054 8.692c-.28.187-.652.653-.652.84 0 .279.374.651.792.651z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2v5h5v10H6V4h7z"/>
          </svg>
        );
    }
  };
  
  // 총 업로드 항목 수 계산
  const getTotalItems = () => sourceUrls.length + uploadedFiles.length;
  
  // 최대 항목 수 초과 확인
  const isMaxItemsReached = getTotalItems() >= 3;
  
  // 링크 추가
  const handleAddUrl = () => {
    if (!newUrl.trim()) return;
    
    if (isMaxItemsReached) {
      setError('링크와 파일을 합해 최대 3개까지 추가할 수 있습니다.');
      return;
    }
    
    // URL 유효성 검사
    try {
      new URL(newUrl);
      setSourceUrls([...sourceUrls, newUrl]);
      setNewUrl('');
      setError(null);
    } catch (e) {
      setError('유효한 URL을 입력해주세요.');
    }
  };
  
  // 링크 삭제
  const handleRemoveUrl = (index: number) => {
    setSourceUrls(sourceUrls.filter((_, i) => i !== index));
  };
  
  // 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // 최대 3개까지 파일 업로드 가능
    const maxFiles = 3 - getTotalItems();
    const remainingSlots = Math.max(0, maxFiles);
    
    if (remainingSlots <= 0) {
      setError('링크와 파일을 합해 최대 3개까지 추가할 수 있습니다.');
      return;
    }
    
    const fileList = Array.from(files).slice(0, remainingSlots);
    
    // 텍스트 파일만 허용 (txt, md, csv 등)
    const acceptedTypes = [
      'text/plain', 'text/markdown', 'text/csv', 
      '.txt', '.md', '.markdown', '.csv'
    ];
    
    const newFiles: UploadedFile[] = [];
    
    fileList.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (acceptedTypes.includes(file.type) || 
          extension && (acceptedTypes.includes(`.${extension}`))) {
        newFiles.push({ file });
      } else {
        setError('텍스트 파일(txt, md, csv 등)만 업로드할 수 있습니다.');
      }
    });
    
    if (newFiles.length > 0) {
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      setError(null);
    }
    
    // 파일 선택 창에서 동일한 파일 재선택 가능하도록 값 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 업로드된 파일 삭제
  const handleRemoveFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };
  
  // 다음 단계로 진행 가능한지 검증
  const canProceed = sourceUrls.length > 0 || uploadedFiles.length > 0;
  
  return (
    <div className="space-y-6">
      <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-brand-text mb-4">새로운 Build 만들기</h2>
        <p className="text-sm text-brand-textSecondary mb-6">
          링크를 입력하거나 텍스트 파일을 업로드하면 AI가 Build 정보를 자동으로 분석하고 생성합니다.
          링크와 파일을 합해 최대 3개까지 추가할 수 있습니다.
        </p>
        
        {error && (
          <div className="bg-brand-error/10 p-4 rounded-md text-sm text-brand-error border border-brand-error/20 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="border-b border-brand-border pb-6">
            <h3 className="text-sm font-medium text-brand-textSecondary mb-3">링크로 분석하기</h3>
            
            {/* 추가된 링크 목록 */}
            {sourceUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {sourceUrls.map((url, index) => (
                  <div key={index} className="flex items-center bg-brand-highlight rounded-md px-3 py-1.5">
                    <div className="mr-2">
                      {getLinkIcon(detectLinkType(url))}
                    </div>
                    <span className="text-sm text-brand-text mr-2 truncate max-w-[200px]">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUrl(index)}
                      className="text-brand-textSecondary hover:text-brand-error transition-colors"
                      disabled={isLoading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* 새 링크 추가 */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  {getLinkIcon(detectLinkType(newUrl))}
                </div>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="GitHub, Figma, Notion, YouTube, 웹사이트 URL 등"
                  className="w-full pl-10 pr-3 py-2 bg-brand-base border border-brand-border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70 text-brand-text"
                  disabled={isLoading || isMaxItemsReached}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleAddUrl}
                disabled={isLoading || isMaxItemsReached || !newUrl.trim()}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium bg-brand-primary text-brand-text",
                  "hover:bg-brand-primaryHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
                  (isLoading || isMaxItemsReached || !newUrl.trim()) && "opacity-70 cursor-not-allowed"
                )}
              >
                추가
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-brand-textSecondary mb-3">파일로 분석하기</h3>
            <div className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.md,.markdown,.csv,text/plain,text/markdown,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isLoading || isMaxItemsReached}
                />
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploadedFiles.map((fileItem, index) => (
                    <div key={index} className="flex items-center bg-brand-highlight rounded-md px-3 py-1.5">
                      <span className="text-sm text-brand-text mr-2">{fileItem.file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-brand-textSecondary hover:text-brand-error transition-colors"
                        disabled={isLoading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isMaxItemsReached}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium text-brand-textSecondary bg-brand-surface border border-brand-border",
                      "hover:bg-brand-surfaceHover hover:border-brand-borderHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
                      (isLoading || isMaxItemsReached) && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {uploadedFiles.length > 0 ? "파일 추가" : "파일 선택"}
                  </button>
                </div>
                <p className="text-xs text-brand-textTertiary mt-2">
                  txt, md, csv 등 텍스트 파일만 지원합니다. 파일당 최대 3,000자까지 분석됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading || !canProceed}
          className={cn(
            "px-6 py-2 rounded-md text-sm font-medium text-brand-text bg-brand-primary",
            "hover:bg-brand-primaryHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
            (!canProceed || isLoading) && "opacity-70 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              처리 중...
            </div>
          ) : (
            "다음"
          )}
        </button>
      </div>
    </div>
  );
} 