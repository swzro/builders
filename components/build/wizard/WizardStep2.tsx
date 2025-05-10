import { useState, useEffect } from 'react';
import { BuildFormValues, UploadedFile } from '@/types/build';
import { cn } from '@/lib/utils';

interface WizardStep2Props {
  sourceUrls: string[];
  uploadedFiles: UploadedFile[];
  onPrevious: () => void;
  onNext: (buildData: BuildFormValues) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function WizardStep2({
  sourceUrls,
  uploadedFiles,
  onPrevious,
  onNext,
  isLoading,
  setIsLoading,
}: WizardStep2Props) {
  const [error, setError] = useState<string | null>(null);
  const [buildData, setBuildData] = useState<BuildFormValues | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');

  // 분석 실행
  useEffect(() => {
    const analyzeContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 로컬 스토리지에서 액세스 토큰 가져오기
        const accessToken = localStorage.getItem('access_token');
        
        // 분석할 데이터 선택
        if (uploadedFiles.length > 0 && sourceUrls.length > 0) {
          // 파일과 링크 모두 있는 경우 - 병렬로 처리
          setProgressMessage('파일과 링크를 동시에 분석 중입니다');
          
          // 두 분석을 동시에 실행
          const [filesResult, linksResult] = await Promise.all([
            analyzeFiles(accessToken),
            analyzeLinks(accessToken)
          ]);
          
          // 두 결과가 모두 있는 경우에만 통합 API 호출
          if (filesResult && linksResult) {
            // combine-analysis API 호출하여 두 결과 통합
            await combineAnalysisResults(filesResult, linksResult, accessToken);
          } else {
            // 하나라도 분석에 실패한 경우 가능한 결과 사용
            const result = filesResult || linksResult;
            if (result) {
              setBuildData(result);
              setIsLoading(false);
            } else {
              throw new Error('모든 분석에 실패했습니다');
            }
          }
        } else if (uploadedFiles.length > 0) {
          // 파일만 있는 경우
          setProgressMessage('파일을 분석 중입니다');
          const fileResult = await analyzeFiles(accessToken);
          setBuildData(fileResult);
          setIsLoading(false);
        } else if (sourceUrls.length > 0) {
          // 링크만 있는 경우
          setProgressMessage('링크를 분석 중입니다');
          const linkResult = await analyzeLinks(accessToken);
          setBuildData(linkResult);
          setIsLoading(false);
        } else {
          throw new Error('분석할 내용이 없습니다');
        }
      } catch (err: any) {
        console.error('분석 오류:', err);
        setError(err.message || '분석 중 오류가 발생했습니다');
        setIsLoading(false);
      }
    };
    
    analyzeContent();
  }, []);
  
  // 링크 분석
  const analyzeLinks = async (accessToken: string | null) => {
    try {
      setProgressMessage(`${sourceUrls.length}개의 링크를 분석 중입니다`);
      
      // API 호출하여 링크 분석
      const response = await fetch('/api/builds/analyze-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({ urls: sourceUrls }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '링크 분석 중 오류가 발생했습니다');
      }
      
      // API에서 전달한 메시지가 있으면 표시 (예: OpenAI API 오류 시)
      if (result.message) {
        setError(result.message);
      }
      
      return result.data;
    } catch (err: any) {
      console.error('링크 분석 오류:', err);
      setError(err.message || '링크 분석 중 오류가 발생했습니다');
      throw err;
    }
  };
  
  // 파일 분석
  const analyzeFiles = async (accessToken: string | null) => {
    try {
      setProgressMessage(`${uploadedFiles.length}개의 파일을 분석 중입니다`);
      
      // 파일 내용 읽기
      const fileContents = await Promise.all(
        uploadedFiles.map(async (fileItem) => {
          return new Promise<{name: string, content: string, type: string}>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                name: fileItem.file.name,
                content: e.target?.result as string || '',
                type: fileItem.file.type
              });
            };
            reader.onerror = (e) => reject(e);
            reader.readAsText(fileItem.file);
          });
        })
      );
      
      // API 호출하여 파일 분석
      const response = await fetch('/api/builds/analyze-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({ files: fileContents }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '파일 분석 중 오류가 발생했습니다');
      }
      
      // API에서 전달한 메시지가 있으면 표시 (예: OpenAI API 오류 시)
      if (result.message) {
        setError(result.message);
      }
      
      return result.data;
    } catch (err: any) {
      console.error('파일 분석 오류:', err);
      setError(err.message || '파일 분석 중 오류가 발생했습니다');
      throw err;
    }
  };

  // 여러 분석 결과를 병합하는 함수
  const mergeAnalysisResults = (filesResult: BuildFormValues, linksResult: BuildFormValues): BuildFormValues => {
    // 기본 결과는 링크 분석 결과로 시작
    const mergedResult: BuildFormValues = { ...linksResult };
    
    // 제목과 카테고리는 링크 결과 우선
    // 설명은 두 결과를 합침
    if (filesResult.description) {
      mergedResult.description = mergedResult.description 
        ? `${mergedResult.description}\n\n${filesResult.description}`
        : filesResult.description;
    }
    
    // 태그는 중복 제거하여 합침
    if (filesResult.tags && filesResult.tags.length > 0) {
      const allTags = [...(mergedResult.tags || []), ...filesResult.tags];
      // 중복 제거 및 최대 5개로 제한
      mergedResult.tags = Array.from(new Set(allTags)).slice(0, 5);
    }
    
    // 역할, 배운 점, 성과 등 추가 정보 병합
    if (filesResult.role && !mergedResult.role) {
      mergedResult.role = filesResult.role;
    }
    
    if (filesResult.lesson) {
      mergedResult.lesson = mergedResult.lesson
        ? `${mergedResult.lesson}\n\n${filesResult.lesson}`
        : filesResult.lesson;
    }
    
    if (filesResult.outcomes) {
      mergedResult.outcomes = mergedResult.outcomes
        ? `${mergedResult.outcomes}\n\n${filesResult.outcomes}`
        : filesResult.outcomes;
    }
    
    // 링크 정보 병합 - 파일에 source_urls가 있다면 추가
    if (filesResult.source_urls && filesResult.source_urls.length > 0) {
      if (!mergedResult.source_urls) {
        mergedResult.source_urls = filesResult.source_urls;
      } else {
        mergedResult.source_urls = [...mergedResult.source_urls, ...filesResult.source_urls];
      }
    }
    
    return mergedResult;
  };
  
  // combine-analysis API 호출
  const combineAnalysisResults = async (fileAnalysis: BuildFormValues, linkAnalysis: BuildFormValues, accessToken: string | null) => {
    try {
      setProgressMessage('분석 결과를 통합하는 중입니다');
      
      // API 호출하여 두 분석 결과 통합
      const response = await fetch('/api/builds/combine-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({ 
          fileAnalysis: fileAnalysis,
          linkAnalysis: linkAnalysis 
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '결과 통합 중 오류가 발생했습니다');
      }
      
      // 통합 분석 결과 설정
      setBuildData(result.data);
      
      // API에서 전달한 메시지가 있으면 표시
      if (result.message) {
        setError(result.message);
      }
      
      setIsLoading(false);
      return result.data;
    } catch (err: any) {
      console.error('결과 통합 오류:', err);
      // 통합 실패시 수동으로 mergeAnalysisResults 함수 사용
      const mergedData = mergeAnalysisResults(fileAnalysis, linkAnalysis);
      setBuildData(mergedData);
      setError(err.message || '결과 통합 중 오류가 발생했습니다. 기본 통합을 적용합니다.');
      setIsLoading(false);
      return mergedData;
    }
  };
  
  // 다음 단계로 이동
  const handleNext = () => {
    if (buildData) {
      onNext(buildData);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-brand-text mb-4">콘텐츠 분석</h2>
        
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
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-24 h-24">
              <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-brand-primary/30 border-t-brand-primary animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-brand-text mt-6 mb-2">AI가 콘텐츠를 분석하고 있습니다</h3>
            <p className="text-sm text-brand-textSecondary text-center max-w-md">
              {progressMessage || "콘텐츠를 분석 중입니다. 이 작업은 콘텐츠 양에 따라 몇 분 정도 소요될 수 있습니다."}
            </p>
          </div>
        )}
        
        {!isLoading && buildData && (
          <div className="space-y-6 py-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary/10 mr-4">
                <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-brand-text">분석 완료</h3>
                <p className="text-sm text-brand-textSecondary">AI가 콘텐츠를 성공적으로 분석했습니다.</p>
              </div>
            </div>
            
            <div className="border-t border-brand-border pt-6">
              <h4 className="text-sm font-medium text-brand-textSecondary mb-2">분석 결과</h4>
              <div className="bg-brand-highlight rounded-lg p-4 space-y-3">
                <div>
                  <h5 className="text-xs font-medium text-brand-textTertiary">제목</h5>
                  <p className="text-sm font-medium text-brand-text">{buildData.title}</p>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-brand-textTertiary">카테고리</h5>
                  <p className="text-sm text-brand-text">{buildData.category}</p>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-brand-textTertiary">설명</h5>
                  <p className="text-sm text-brand-text line-clamp-3">{buildData.description}</p>
                </div>
                {buildData.tags && buildData.tags.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-brand-textTertiary">태그</h5>
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
              </div>
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
          onClick={handleNext}
          disabled={isLoading || !buildData}
          className={cn(
            "px-6 py-2 rounded-md text-sm font-medium text-brand-text bg-brand-primary",
            "hover:bg-brand-primaryHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
            (isLoading || !buildData) && "opacity-70 cursor-not-allowed"
          )}
        >
          다음
        </button>
      </div>
    </div>
  );
} 