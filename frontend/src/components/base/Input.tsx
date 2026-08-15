import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string;
  iconRight?: string;
  iconRightAriaLabel?: string;
  onIconClick?: () => void;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, iconRightAriaLabel, onIconClick, className = '', id, required, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-foreground-700 mb-1.5">
            {label}
            {required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400" aria-hidden="true">
              <i className={`${icon} text-sm`} />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-required={required || undefined}
            aria-describedby={
              error && inputId
                ? `${inputId}-error`
                : hint && inputId
                  ? `${inputId}-hint`
                  : undefined
            }
            className={[
              'w-full rounded-md border bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300',
              'transition-all duration-150 outline-none',
              icon ? 'pl-9' : 'pl-3',
              iconRight ? 'pr-9' : 'pr-3',
              'py-2',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-secondary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-100',
              className,
            ].join(' ')}
            {...props}
          />
          {iconRight && (
            <button
              type="button"
              onClick={onIconClick}
              aria-label={iconRightAriaLabel || 'Acción del campo'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-foreground-400 hover:text-foreground-600 rounded"
            >
              <i className={`${iconRight} text-sm`} aria-hidden="true" />
            </button>
          )}
        </div>
        {error && (
          <p id={inputId ? `${inputId}-error` : undefined} className="mt-1 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={inputId ? `${inputId}-hint` : undefined} className="mt-1 text-xs text-foreground-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;