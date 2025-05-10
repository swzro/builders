import { useState } from 'react';
import { BuildFormValues, UploadedFile } from '@/types/build';
import { cn } from '@/lib/utils';
import { getClient } from '@/lib/supabase';

interface WizardStep4Props {
  buildData: BuildFormValues;
  uploadedFiles: UploadedFile[];
  userId: string;
  onPrevious: () => void;
  onComplete: () => void;
}

export default function WizardStep4({
  buildData,
  uploadedFiles,
  userId,
  onPrevious,
  onComplete,
}: WizardStep4Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  
  // 빌드 데이터 저장
  const handleSave = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setProgressPercent(0);
    setProgressStatus('준비 중...');
    
    try {
      const supabase = getClient();
      
      // 1. 먼저 build 데이터 저장 (10%)
      setProgressPercent(10);
      setProgressStatus('Build 정보 저장 중...');
      
      // builds 테이블에 데이터 저장
      const saveData = {
        user_id: userId,
        ...buildData,
        // 빈 문자열은 null로 변환
        duration_start: buildData.duration_start || null,
        duration_end: buildData.duration_end || null,
        status: 'published',
        ai_generated: true
      };
      
      const { data: buildRecord, error: buildError } = await supabase
        .from('builds')
        .insert(saveData)
        .select('id')
        .single();
      
      if (buildError) {
        throw new Error(`Build 정보 저장 실패: ${buildError.message}`);
      }
      
      if (!buildRecord) {
        throw new Error('Build 정보 저장 실패: 응답 데이터 없음');
      }
      
      const buildId = buildRecord.id;
      
      // 2. 파일이 있으면 Storage에 업로드 (30-80%)
      if (uploadedFiles.length > 0) {
        setProgressPercent(30);
        setProgressStatus('파일 업로드 중...');
        
        // 각 파일 업로드 및 DB에 기록
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const fileName = file.file.name;
          const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'txt';
          const uniqueFileName = `${buildId}-${Date.now()}-${i}.${fileExtension}`;
          const filePath = `builds/${userId}/${buildId}/${uniqueFileName}`;
          
          // 2.1 Supabase Storage에 파일 업로드
          const { error: uploadError } = await supabase.storage
            .from('build-files')
            .upload(filePath, file.file);
          
          if (uploadError) {
            throw new Error(`파일 업로드 실패: ${uploadError.message}`);
          }
          
          // 2.2 파일 미리보기 콘텐츠 생성 (최대 500자)
          let contentPreview = '';
          try {
            const reader = new FileReader();
            const previewContent = await new Promise<string>((resolve) => {
              reader.onload = (e) => resolve(e.target?.result as string || '');
              reader.readAsText(file.file);
            });
            contentPreview = previewContent.substring(0, 500);
          } catch (e) {
            console.error('파일 미리보기 생성 실패:', e);
            contentPreview = '(미리보기 생성 실패)';
          }
          
          // 2.3 build_files 테이블에 파일 정보 저장
          const { error: fileDbError } = await supabase
            .from('build_files')
            .insert({
              build_id: buildId,
              user_id: userId,
              file_name: fileName,
              file_type: file.file.type || `text/${fileExtension}`,
              file_size: file.file.size,
              file_path: filePath,
              content_preview: contentPreview
            });
          
          if (fileDbError) {
            throw new Error(`파일 정보 저장 실패: ${fileDbError.message}`);
          }
          
          // 진행률 업데이트 (30% + 각 파일당 최대 50%씩 분배)
          const fileProgress = 50 / uploadedFiles.length;
          setProgressPercent(30 + (i + 1) * fileProgress);
          setProgressStatus(`파일 ${i + 1}/${uploadedFiles.length} 업로드 완료`);
        }
      }
      
      // 3. 작업 완료 (100%)
      setProgressPercent(100);
      setProgressStatus('저장 완료!');
      
      // 잠시 후 완료 콜백 호출
      setTimeout(() => {
        setIsLoading(false);
        onComplete();
      }, 1000);
      
    } catch (err: any) {
      console.error('저장 오류:', err);
      setError(err.message || 'Build 저장 중 오류가 발생했습니다.');
      setIsLoading(false);
      setProgressStatus('실패');
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-brand-text mb-4">최종 확인</h2>
        <p className="text-sm text-brand-textSecondary mb-6">
          입력한 정보를 확인하고 저장합니다. 저장 후에도 언제든지 수정할 수 있습니다.
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
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-full max-w-md mb-4">
                <div className="relative h-3 bg-brand-surface border border-brand-border rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-brand-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-brand-textTertiary">
                  <span>{progressPercent}%</span>
                  <span>{progressStatus}</span>
                </div>
              </div>
              <p className="text-sm text-brand-textSecondary text-center max-w-md">
                Build를 저장하고 있습니다. 잠시만 기다려주세요...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4 divide-y divide-brand-border">
              <div className="pb-4">
                <h3 className="text-sm font-medium text-brand-textSecondary mb-2">기본 정보</h3>
                <div className="bg-brand-highlight rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-brand-textTertiary">제목</h4>
                    <p className="text-sm font-medium text-brand-text">{buildData.title}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-brand-textTertiary">카테고리</h4>
                    <p className="text-sm text-brand-text">{buildData.category}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-brand-textTertiary">기간</h4>
                    <p className="text-sm text-brand-text">
                      {buildData.duration_start} 
                      {buildData.duration_end ? ` ~ ${buildData.duration_end}` : ' ~ 현재'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-brand-textTertiary">설명</h4>
                    <p className="text-sm text-brand-text whitespace-pre-line">{buildData.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="py-4">
                <h3 className="text-sm font-medium text-brand-textSecondary mb-2">추가 정보</h3>
                <div className="bg-brand-highlight rounded-lg p-4 space-y-3">
                  {buildData.role && (
                    <div>
                      <h4 className="text-xs font-medium text-brand-textTertiary">역할</h4>
                      <p className="text-sm text-brand-text">{buildData.role}</p>
                    </div>
                  )}
                  
                  {buildData.lesson && (
                    <div>
                      <h4 className="text-xs font-medium text-brand-textTertiary">배운 점</h4>
                      <p className="text-sm text-brand-text whitespace-pre-line">{buildData.lesson}</p>
                    </div>
                  )}
                  
                  {buildData.outcomes && (
                    <div>
                      <h4 className="text-xs font-medium text-brand-textTertiary">성과</h4>
                      <p className="text-sm text-brand-text whitespace-pre-line">{buildData.outcomes}</p>
                    </div>
                  )}
                  
                  {buildData.tags && buildData.tags.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-brand-textTertiary">태그</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {buildData.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-flex px-2 py-0.5 text-xs rounded-full bg-brand-primary/10 text-brand-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-xs font-medium text-brand-textTertiary">공개 여부</h4>
                    <p className="text-sm text-brand-text">
                      {buildData.is_public ? '공개' : '비공개'}
                    </p>
                  </div>
                  
                  {buildData.source_urls && buildData.source_urls.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-brand-textTertiary">소스 URL</h4>
                      <div className="mt-1 space-y-1">
                        {buildData.source_urls.map((url, index) => (
                          <div key={index} className="text-sm text-brand-text break-all">
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-brand-primary hover:underline"
                            >
                              {url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-sm font-medium text-brand-textSecondary mb-2">업로드된 파일</h3>
                  <div className="bg-brand-highlight rounded-lg p-4">
                    <ul className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-4 h-4 text-brand-textSecondary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-sm text-brand-text">{file.file.name}</span>
                          <span className="text-xs text-brand-textTertiary ml-2">
                            ({(file.file.size / 1024).toFixed(1)} KB)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
          onClick={handleSave}
          disabled={isLoading}
          className={cn(
            "px-6 py-2 rounded-md text-sm font-medium text-brand-text bg-brand-primary",
            "hover:bg-brand-primaryHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
            isLoading && "opacity-70 cursor-not-allowed",
            "flex items-center"
          )}
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          )}
          저장하기
        </button>
      </div>
    </div>
  );
} 