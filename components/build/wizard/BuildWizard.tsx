import { useState } from 'react';
import { BuildFormValues, UploadedFile } from '@/types/build';
import WizardStep1 from './WizardStep1';
import WizardStep2 from './WizardStep2';
import WizardStep3 from './WizardStep3';
import WizardStep4 from './WizardStep4';

interface BuildWizardProps {
  userId: string;
  onComplete: () => void;
}

export default function BuildWizard({ userId, onComplete }: BuildWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buildData, setBuildData] = useState<BuildFormValues | null>(null);
  
  // 마법사 단계 이동
  const goToStep = (step: number) => {
    setCurrentStep(step);
  };
  
  // 다음 단계로 이동
  const handleNext = () => {
    goToStep(currentStep + 1);
  };
  
  // 이전 단계로 이동
  const handlePrevious = () => {
    goToStep(currentStep - 1);
  };
  
  // Step 2에서 분석 완료 후 데이터 설정
  const handleAnalysisComplete = (data: BuildFormValues) => {
    setBuildData(data);
    handleNext();
  };
  
  // Step 3에서 데이터 수정 완료
  const handleFormComplete = (data: BuildFormValues) => {
    setBuildData(data);
    handleNext();
  };
  
  return (
    <div>
      {/* 단계 인디케이터 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step}
              className="flex items-center"
            >
              <div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${step < currentStep 
                    ? 'bg-brand-primary text-white' 
                    : step === currentStep 
                      ? 'bg-brand-primary/20 text-brand-primary border-2 border-brand-primary' 
                      : 'bg-brand-highlight text-brand-textSecondary'
                  }
                `}
              >
                {step < currentStep ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  step
                )}
              </div>
              
              {step < 4 && (
                <div 
                  className={`
                    w-full h-1 mx-2
                    ${step < currentStep ? 'bg-brand-primary' : 'bg-brand-highlight'}
                  `}
                  style={{ width: '100%' }}
                ></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-2">
          <div className="text-xs text-brand-textSecondary">콘텐츠 선택</div>
          <div className="text-xs text-brand-textSecondary">분석</div>
          <div className="text-xs text-brand-textSecondary">정보 수정</div>
          <div className="text-xs text-brand-textSecondary">저장</div>
        </div>
      </div>
      
      {/* 단계별 컨텐츠 */}
      {currentStep === 1 && (
        <WizardStep1
          sourceUrls={sourceUrls}
          setSourceUrls={setSourceUrls}
          uploadedFiles={uploadedFiles}
          setUploadedFiles={setUploadedFiles}
          onNext={handleNext}
          isLoading={isLoading}
        />
      )}
      
      {currentStep === 2 && (
        <WizardStep2
          sourceUrls={sourceUrls}
          uploadedFiles={uploadedFiles}
          onPrevious={handlePrevious}
          onNext={handleAnalysisComplete}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}
      
      {currentStep === 3 && buildData && (
        <WizardStep3
          buildData={buildData}
          uploadedFiles={uploadedFiles}
          onPrevious={handlePrevious}
          onNext={handleFormComplete}
          isLoading={isLoading}
        />
      )}
      
      {currentStep === 4 && buildData && (
        <WizardStep4
          buildData={buildData}
          uploadedFiles={uploadedFiles}
          userId={userId}
          onPrevious={handlePrevious}
          onComplete={onComplete}
        />
      )}
    </div>
  );
} 