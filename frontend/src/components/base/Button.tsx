import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: string;
  iconRight?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-400 active:bg-primary-700',
  secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200 focus:ring-secondary-300 active:bg-secondary-300',
  accent: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400 active:bg-accent-700',
  ghost: 'bg-transparent text-foreground-600 hover:bg-background-100 hover:text-foreground-900 focus:ring-background-300',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 active:bg-red-700',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400 active:bg-emerald-700',
  outline: 'bg-transparent border border-secondary-300 text-foreground-700 hover:bg-background-100 hover:border-secondary-400 focus:ring-secondary-300',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-2xs gap-1',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

const iconOnlySize: Record<ButtonSize, string> = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, children, className = '', disabled, ...props }, ref) => {
    const isIconOnly = (icon || loading) && !children;
    const base = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const cls = [
      base,
      variantClasses[variant],
      isIconOnly ? iconOnlySize[size] : sizeClasses[size],
      className,
    ].join(' ');

    return (
      <button ref={ref} className={cls} disabled={disabled || loading} {...props}>
        {loading ? (
          <i className="ri-loader-4-line animate-spin" />
        ) : icon ? (
          <i className={icon} />
        ) : null}
        {children}
        {iconRight && !loading && <i className={iconRight} />}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;