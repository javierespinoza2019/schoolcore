import { ReactNode } from 'react';

export interface Step {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export default function Stepper({ steps, currentStep, onStepClick, orientation = 'horizontal', className = '' }: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <div className={`flex flex-col ${className}`}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div key={step.id} className="relative flex items-start gap-3">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStepClick?.(index)}
                  disabled={isPending}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={step.label}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200 flex-shrink-0 ${
                    isCompleted
                      ? 'bg-primary-500 border-primary-500 text-white cursor-pointer'
                      : isCurrent
                      ? 'bg-primary-50 border-primary-500 text-primary-700 cursor-default'
                      : 'bg-background-50 border-secondary-200 text-secondary-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <i className="ri-check-line text-sm" /> : index + 1}
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[24px] my-1 ${
                    index < currentStep ? 'bg-primary-300' : 'bg-secondary-200'
                  }`} />
                )}
              </div>
              <div className={`pb-6 ${isPending ? 'opacity-50' : ''}`}>
                <p className={`text-sm font-medium ${isCurrent ? 'text-primary-700' : 'text-foreground-800'}`}>
                  {step.label}
                </p>
                {step.subtitle && (
                  <p className="text-xs text-foreground-500 mt-0.5">{step.subtitle}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onStepClick?.(index)}
                  disabled={isPending}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={step.label}
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200 ${
                    isCompleted
                      ? 'bg-primary-500 border-primary-500 text-white cursor-pointer hover:bg-primary-600'
                      : isCurrent
                      ? 'bg-primary-50 border-primary-500 text-primary-700 cursor-default ring-4 ring-primary-100'
                      : 'bg-background-50 border-secondary-200 text-secondary-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <i className="ri-check-line" /> : step.icon ? <i className={step.icon} /> : index + 1}
                </button>
                <div className="mt-2 text-center">
                  <p className={`text-xs font-medium whitespace-nowrap ${isCurrent ? 'text-primary-700' : isCompleted ? 'text-foreground-700' : 'text-foreground-400'}`}>
                    {step.label}
                  </p>
                  {step.subtitle && (
                    <p className="text-3xs text-foreground-400 mt-0.5 whitespace-nowrap">{step.subtitle}</p>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-3 mt-[-20px]">
                  <div className={`h-full rounded-full transition-all duration-300 ${
                    index < currentStep ? 'bg-primary-400' : 'bg-secondary-200'
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}