import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { getClient } from '@/lib/supabase';
import { Build, BuildFormValues } from '@/types/build';

interface SmartBuildFormProps {
  userId: string;
  build?: Build;
  onComplete: () => void;
}

export default function SmartBuildForm({
  userId,
  build,
  onComplete,
}: SmartBuildFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 링크 분석 결과와 파일 분석 결과를 각각 저장하는 상태
  const [linkAnalysisResult, setLinkAnalysisResult] = useState<any>(null);
  const [fileAnalysisResult, setFileAnalysisResult] = useState<any>(null);
  
  const [buildData, setBuildData] = useState<BuildFormValues | null>(
    build ? {
      title: build.title || '',
      description: build.description || '',
      duration_start: build.duration_start ? build.duration_start.split('T')[0] : '',
      duration_end: build.duration_end ? build.duration_end.split('T')[0] : '',
      category: build.category || '',
      tags: build.tags || [],
      image_url: build.image_url || '',
      is_public: build.is_public !== undefined ? build.is_public : true,
      source_urls: build.source_urls || [],
      role: build.role || '',
      lesson: build.lesson || '',
      outcomes: build.outcomes || '',
      ai_generated: build.ai_generated || false,
    } : null
  );
  
  // 파일 업로드 관련 상태
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
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

  // 링크 분석 처리
  const handleAnalyzeLink = async () => {
    if (!sourceUrl.trim()) {
      setError('링크를 입력해주세요');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // 로컬 스토리지에서 액세스 토큰 가져오기
      const accessToken = localStorage.getItem('access_token');
      
      // API 호출하여 링크 분석
      const response = await fetch('/api/builds/analyze-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({ urls: [sourceUrl] }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '링크 분석 중 오류가 발생했습니다');
      }
      
      // 링크 분석 결과 저장
      setLinkAnalysisResult(result.data);
      
      // 파일 분석 결과가 있으면 함께 통합하여 BUILD 데이터 생성
      if (fileAnalysisResult) {
        // 두 데이터를 GPT를 통해 통합
        await combineAnalysisResults(result.data, fileAnalysisResult);
      } else {
        // 링크 분석 결과만 있는 경우 그대로 사용
        setBuildData(result.data);
      }
      
      // API에서 전달한 메시지가 있으면 표시 (예: OpenAI API 오류 시)
      if (result.message) {
        setError(result.message);
      }
      
    } catch (err: any) {
      console.error('링크 분석 오류:', err);
      setError(err.message || '링크 분석 중 오류가 발생했습니다');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // 최대 3개까지 파일 업로드 가능
    const fileList = Array.from(files).slice(0, 3);
    
    // 텍스트 파일만 허용 (txt, md, csv 등)
    const textFiles = fileList.filter(file => {
      const acceptedTypes = [
        'text/plain', 'text/markdown', 'text/csv', 
        '.txt', '.md', '.markdown', '.csv'
      ];
      const extension = file.name.split('.').pop()?.toLowerCase();
      return acceptedTypes.includes(file.type) || 
             acceptedTypes.includes(`.${extension}`);
    });
    
    if (textFiles.length !== fileList.length) {
      setError('텍스트 파일(txt, md, csv 등)만 업로드할 수 있습니다.');
      return;
    }
    
    setUploadedFiles(textFiles);
    setError(null);
  };
  
  // 파일 분석 처리
  const handleAnalyzeFiles = async () => {
    if (uploadedFiles.length === 0) {
      setError('분석할 파일을 선택해주세요');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // 파일 내용 읽기
      const fileContents = await Promise.all(
        uploadedFiles.map(async (file) => {
          return new Promise<{name: string, content: string, type: string}>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                name: file.name,
                content: e.target?.result as string || '',
                type: file.type
              });
            };
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
          });
        })
      );
      
      // 로컬 스토리지에서 액세스 토큰 가져오기
      const accessToken = localStorage.getItem('access_token');
      
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
      
      // 파일 분석 결과 저장
      setFileAnalysisResult(result.data);
      
      // 링크 분석 결과가 있으면 함께 통합하여 BUILD 데이터 생성
      if (linkAnalysisResult) {
        // 두 데이터를 GPT를 통해 통합
        await combineAnalysisResults(linkAnalysisResult, result.data);
      } else {
        // 파일 분석 결과만 있는 경우 그대로 사용
        setBuildData(result.data);
      }
      
      // API에서 전달한 메시지가 있으면 표시 (예: OpenAI API 오류 시)
      if (result.message) {
        setError(result.message);
      }
      
    } catch (err: any) {
      console.error('파일 분석 오류:', err);
      setError(err.message || '파일 분석 중 오류가 발생했습니다');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 업로드된 파일 삭제
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // GPT를 통해 링크 분석과 파일 분석 결과를 통합
  const combineAnalysisResults = async (linkData: any, fileData: any) => {
    try {
      setIsAnalyzing(true);
      
      // 액세스 토큰 가져오기
      const accessToken = localStorage.getItem('access_token');
      
      // 통합 API 호출
      const response = await fetch('/api/builds/combine-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({ 
          linkAnalysis: linkData,
          fileAnalysis: fileData
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '분석 결과 통합 중 오류가 발생했습니다');
      }
      
      // 통합된 결과 설정
      setBuildData(result.data);
      
      if (result.message) {
        setError(result.message);
      }
      
    } catch (err: any) {
      console.error('분석 결과 통합 오류:', err);
      // 통합에 실패한 경우 기본 통합 로직 사용
      generateFallbackBuildData(linkData, fileData);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 통합 API 호출 실패시 사용할 기본 통합 로직
  const generateFallbackBuildData = (linkData: any, fileData: any) => {
    // 기본값 설정
    const currentDate = new Date().toISOString().split('T')[0];
    
    // 태그 통합 (중복 제거, 최대 5개)
    const linkTags = Array.isArray(linkData.tags) ? linkData.tags : [];
    const fileTags = Array.isArray(fileData.tags) ? fileData.tags : [];
    const combinedTags = Array.from(new Set([...linkTags, ...fileTags])).slice(0, 5);
    
    const combinedData: BuildFormValues = {
      title: linkData.title || fileData.title || 'Untitled Build',
      description: linkData.description || fileData.description || '',
      duration_start: linkData.duration_start || fileData.duration_start || currentDate,
      duration_end: linkData.duration_end || fileData.duration_end || '',
      category: linkData.category || fileData.category || '기타',
      tags: combinedTags,
      image_url: linkData.image_url || fileData.image_url || '',
      is_public: true,
      source_urls: linkData.source_urls || [],
      role: linkData.role || fileData.role || '',
      lesson: linkData.lesson || fileData.lesson || '',
      outcomes: linkData.outcomes || fileData.outcomes || '',
      ai_generated: true
    };
    
    setBuildData(combinedData);
  };
  
  // 블록 수정 처리 - 인라인 편집 기능
  const handleEditBlock = (field: keyof BuildFormValues, value: any) => {
    if (!buildData) return;
    setBuildData({
      ...buildData,
      [field]: value
    });
  };
  
  // 빌드 저장 처리
  const handleSave = async () => {
    if (!buildData) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const supabase = getClient();
      
      // 날짜 형식 검증 및 빈 문자열 처리
      const isValidDateFormat = (dateStr: string) => {
        if (!dateStr) return true; // 빈 문자열은 true로 허용 (나중에 null로 변환)
        // YYYY-MM-DD 형식 검증
        return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
      };
      
      // 날짜 형식 검증
      if (buildData.duration_start && !isValidDateFormat(buildData.duration_start)) {
        throw new Error('시작일은 YYYY-MM-DD 형식으로 입력해주세요');
      }
      
      if (buildData.duration_end && !isValidDateFormat(buildData.duration_end)) {
        throw new Error('종료일은 YYYY-MM-DD 형식으로 입력해주세요');
      }
      
      const saveData = {
        user_id: userId,
        ...buildData,
        // 빈 문자열은 null로 변환
        duration_start: buildData.duration_start || null,
        duration_end: buildData.duration_end || null
      };
      
      let result;
      
      if (build) {
        // 수정
        result = await supabase
          .from('builds')
          .update(saveData)
          .eq('id', build.id);
      } else {
        // 새로 작성
        result = await supabase
          .from('builds')
          .insert(saveData);
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // 성공적으로 완료됨
      onComplete();
      
    } catch (err: any) {
      console.error('저장 오류:', err);
      setError(err.message || 'Builds 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 블록 렌더링 - 텍스트 블록 (제목, 설명 등 일반 텍스트)
  const renderTextBlock = (
    label: string, 
    field: keyof BuildFormValues, 
    value: string, 
    isMultiline: boolean = false,
    isRequired: boolean = false
  ) => {
    return (
      <div className="border border-brand-border rounded-lg p-4 bg-brand-surface hover:border-brand-borderHover transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-brand-textSecondary">
              {label}
              {isRequired && <span className="text-brand-error ml-1">*</span>}
            </h3>
            {buildData?.ai_generated && (
              <span className="ml-2 text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full flex items-center">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.928 11.607c-.202-.488-.635-.605-.928-.633V8c0-1.103-.897-2-2-2h-6V4.61c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5c-1.103 0-2 .897-2 2v2.997l-.082.006A1 1 0 0 0 1.99 12v2a1 1 0 0 0 1 1H3v5c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2v-5a1 1 0 0 0 1-1v-2a1.02 1.02 0 0 0-.072-.393zM5 20V8h14l.001 3.996L19 12v2l.001.005.001 5.995H5z"></path>
                  <ellipse cx="8.5" cy="12" rx="1.5" ry="2"></ellipse>
                  <ellipse cx="15.5" cy="12" rx="1.5" ry="2"></ellipse>
                  <path d="M12 18a4 4 0 0 0 4-4h-8a4 4 0 0 0 4 4z"></path>
                </svg>
                AI 생성
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const newValue = isMultiline
                ? prompt(label, value || '')
                : prompt(label, value || '');
              if (newValue !== null) {
                handleEditBlock(field, newValue);
              }
            }}
            className="text-xs text-brand-primary hover:text-brand-primaryHover"
          >
            수정
          </button>
        </div>
        {isMultiline ? (
          <div className="whitespace-pre-line text-brand-text">
            {value || <span className="text-brand-textTertiary">내용을 입력해주세요</span>}
          </div>
        ) : (
          <div className="text-brand-text font-medium">
            {value || <span className="text-brand-textTertiary">내용을 입력해주세요</span>}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="p-6">
      <div className="space-y-6">
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
        
        {/* 링크 입력 섹션 */}
        <div className="bg-brand-surface border border-brand-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-brand-text mb-4">Smart Build</h2>
          <p className="text-sm text-brand-textSecondary mb-6">
            링크를 입력하거나 텍스트 파일을 업로드하면 AI가 Build 정보를 자동으로 분석하고 생성합니다.
          </p>
          
          <div className="space-y-6">
            <div className="border-b border-brand-border pb-6">
              <h3 className="text-sm font-medium text-brand-textSecondary mb-3">링크로 분석하기</h3>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    {getLinkIcon(detectLinkType(sourceUrl))}
                  </div>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="GitHub, Figma, Notion, YouTube, 웹사이트 URL 등"
                    className="w-full pl-10 pr-3 py-2 bg-brand-base border border-brand-border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary/70 text-brand-text"
                    disabled={isAnalyzing || loading}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeLink}
                  disabled={isAnalyzing || !sourceUrl}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium text-brand-text bg-brand-primary",
                    "hover:bg-brand-primaryHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
                    (isAnalyzing || !sourceUrl) && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isAnalyzing ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      분석 중...
                    </div>
                  ) : (
                    "분석하기"
                  )}
                </button>
              </div>
              {linkAnalysisResult && (
                <div className="mt-3 text-xs text-brand-success flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  링크 분석이 완료되었습니다
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-brand-textSecondary mb-3">파일로 분석하기 (최대 3개)</h3>
              <div className="space-y-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.markdown,.csv,text/plain,text/markdown,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isAnalyzing || loading}
                  />
                  <div className="flex flex-wrap gap-2 mb-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center bg-brand-highlight rounded-md px-3 py-1.5">
                        <span className="text-sm text-brand-text mr-2">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-brand-textSecondary hover:text-brand-error transition-colors"
                          disabled={isAnalyzing}
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
                      disabled={isAnalyzing || loading || uploadedFiles.length >= 3}
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium text-brand-textSecondary bg-brand-surface border border-brand-border",
                        "hover:bg-brand-surfaceHover hover:border-brand-borderHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
                        (isAnalyzing || loading || uploadedFiles.length >= 3) && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {uploadedFiles.length > 0 ? "파일 추가" : "파일 선택"}
                    </button>
                    <button
                      type="button"
                      onClick={handleAnalyzeFiles}
                      disabled={isAnalyzing || uploadedFiles.length === 0}
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium text-brand-text bg-brand-primary",
                        "hover:bg-brand-primaryHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
                        (isAnalyzing || uploadedFiles.length === 0) && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {isAnalyzing ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          분석 중...
                        </div>
                      ) : (
                        "파일 분석하기"
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-brand-textTertiary mt-2">
                    txt, md, csv 등 텍스트 파일만 지원합니다. 파일당 최대 3,000자까지 분석됩니다.
                  </p>
                  {fileAnalysisResult && (
                    <div className="mt-3 text-xs text-brand-success flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      파일 분석이 완료되었습니다
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary mx-auto mb-4"></div>
                <p className="text-brand-textSecondary text-sm">Build 정보를 분석하는 중...</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 블록 에디터 UI - buildData가 있을 때만 표시 */}
        {buildData && !isAnalyzing && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-brand-text">Build 정보</h2>
            <p className="text-sm text-brand-textSecondary mb-4">
              각 항목을 클릭하여 수정할 수 있습니다.
            </p>
            
            {/* 제목 블록 */}
            {renderTextBlock('제목', 'title', buildData.title || '', false, true)}
            
            {/* 설명 블록 */}
            {renderTextBlock('설명', 'description', buildData.description || '', true, true)}
            
            {/* 역할 블록 */}
            {renderTextBlock('역할', 'role', buildData.role || '', true)}
            
            {/* 날짜 블록 */}
            <div className="border border-brand-border rounded-lg p-4 bg-brand-surface hover:border-brand-borderHover transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-brand-textSecondary">기간<span className="text-brand-error ml-1">*</span></h3>
                <button
                  type="button"
                  onClick={() => {
                    const startDate = prompt('시작일 (YYYY-MM-DD 형식, 예: 2023-01-01)', buildData.duration_start || '');
                    if (startDate !== null) {
                      handleEditBlock('duration_start', startDate);
                    }
                    const endDate = prompt('종료일 (YYYY-MM-DD 형식, 예: 2023-12-31) - 진행중이면 비워두세요', buildData.duration_end || '');
                    if (endDate !== null) {
                      handleEditBlock('duration_end', endDate);
                    }
                  }}
                  className="text-xs text-brand-primary hover:text-brand-primaryHover"
                >
                  수정
                </button>
              </div>
              <div className="text-brand-text">
                {buildData.duration_start || '날짜를 입력해주세요'} 
                {buildData.duration_end ? ` ~ ${buildData.duration_end}` : ' ~ 현재'}
              </div>
            </div>
            
            {/* 카테고리 블록 */}
            <div className="border border-brand-border rounded-lg p-4 bg-brand-surface hover:border-brand-borderHover transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-brand-textSecondary">카테고리<span className="text-brand-error ml-1">*</span></h3>
                <button
                  type="button"
                  onClick={() => {
                    const categories = ['대외활동', '인턴', '수상', '프로젝트', '동아리', '자격증', '교육', '기타'];
                    const selectedCategory = prompt(
                      `카테고리를 선택해주세요:\n${categories.join(', ')}`,
                      buildData.category || ''
                    );
                    if (selectedCategory !== null) {
                      handleEditBlock('category', selectedCategory);
                    }
                  }}
                  className="text-xs text-brand-primary hover:text-brand-primaryHover"
                >
                  수정
                </button>
              </div>
              <div className="text-brand-text">
                {buildData.category || <span className="text-brand-textTertiary">카테고리를 선택해주세요</span>}
              </div>
            </div>
            
            {/* 배운 점 블록 */}
            {renderTextBlock('배운 점', 'lesson', buildData.lesson || '', true)}
            
            {/* 성과 블록 */}
            {renderTextBlock('성과', 'outcomes', buildData.outcomes || '', true)}
            
            {/* 태그 블록 */}
            <div className="border border-brand-border rounded-lg p-4 bg-brand-surface hover:border-brand-borderHover transition-all">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-brand-textSecondary">태그</h3>
                <button
                  type="button"
                  onClick={() => {
                    const currentTags = (buildData.tags || []).join(', ');
                    const tagsInput = prompt('태그 (쉼표로 구분, 최대 5개)', currentTags);
                    if (tagsInput !== null) {
                      const newTags = tagsInput.split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag)
                        .slice(0, 5);
                      handleEditBlock('tags', newTags);
                    }
                  }}
                  className="text-xs text-brand-primary hover:text-brand-primaryHover"
                >
                  수정
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {buildData.tags && buildData.tags.length > 0 ? (
                  buildData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-primary/10 text-brand-primary"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-brand-textTertiary text-sm">태그를 추가해주세요</span>
                )}
              </div>
            </div>
            
            {/* 공개 설정 블록 */}
            <div className="border border-brand-border rounded-lg p-4 bg-brand-surface hover:border-brand-borderHover transition-all">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-brand-textSecondary">공개 설정</h3>
                <button
                  type="button"
                  onClick={() => handleEditBlock('is_public', !buildData.is_public)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full"
                >
                  <span
                    className={cn(
                      "absolute mx-auto rounded-full transition-colors",
                      buildData.is_public ? "bg-brand-primary" : "bg-brand-border"
                    )}
                    style={{ width: "36px", height: "20px" }}
                  />
                  <span
                    className={cn(
                      "absolute h-4 w-4 rounded-full bg-white transition-transform",
                      buildData.is_public ? "translate-x-5" : "translate-x-1" 
                    )}
                  />
                </button>
              </div>
              <div className="text-sm text-brand-textSecondary mt-1">
                {buildData.is_public 
                  ? '포트폴리오에 공개됩니다' 
                  : '비공개 상태로 저장됩니다'}
              </div>
            </div>
            
            {/* 저장 버튼 */}
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
                type="button"
                onClick={handleSave}
                disabled={loading || !buildData.title || !buildData.description || !buildData.duration_start || !buildData.category}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium text-brand-text bg-brand-primary",
                  "hover:bg-brand-primaryHover focus:outline-none focus:ring-2 focus:ring-brand-primaryFocus transition-all",
                  (loading || !buildData.title || !buildData.description || !buildData.duration_start || !buildData.category) && "opacity-70 cursor-not-allowed"
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
                  build ? '수정하기' : '저장하기'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 