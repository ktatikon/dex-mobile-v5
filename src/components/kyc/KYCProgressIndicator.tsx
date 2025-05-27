import React from 'react';
import { useKYC } from '@/contexts/KYCContext';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface KYCProgressIndicatorProps {
  className?: string;
}

const KYCProgressIndicator: React.FC<KYCProgressIndicatorProps> = ({ className }) => {
  const { progress } = useKYC();
  
  // Calculate percentage
  const percentage = Math.round((progress.currentStep / progress.totalSteps) * 100);
  
  const steps = [
    { name: 'Personal Info', completed: progress.stepsCompleted.personalInfo },
    { name: 'Documents', completed: progress.stepsCompleted.documents },
    { name: 'Selfie', completed: progress.stepsCompleted.selfie },
    { name: 'Review', completed: progress.stepsCompleted.review },
  ];

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-white font-medium">Progress</span>
        <span className="text-sm text-white font-medium">{percentage}%</span>
      </div>
      
      <Progress 
        value={percentage} 
        className="h-2 bg-dex-dark/50 border border-dex-secondary/20"
      />
      
      <div className="flex justify-between mt-2">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={cn(
              "flex flex-col items-center",
              progress.currentStep === index + 1 ? "text-dex-primary" : 
              progress.currentStep > index + 1 ? "text-white" : "text-gray-500"
            )}
          >
            <div 
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs mb-1",
                progress.currentStep === index + 1 ? "bg-dex-primary text-white" : 
                progress.currentStep > index + 1 ? "bg-dex-secondary/20 text-white" : "bg-dex-dark/50 text-gray-500",
                "border",
                progress.currentStep === index + 1 ? "border-dex-primary" : 
                progress.currentStep > index + 1 ? "border-dex-secondary/30" : "border-dex-secondary/10"
              )}
            >
              {index + 1}
            </div>
            <span className="text-[10px] text-center">{step.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KYCProgressIndicator;
