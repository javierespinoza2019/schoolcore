import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-secondary-100 text-secondary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
  primary: 'bg-primary-100 text-primary-700',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-3xs',
  md: 'px-2 py-0.5 text-2xs',
};

export default function Badge({ children, variant = 'default', size = 'md', icon, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {icon && <i className={`${icon} text-[10px]`} />}
      {children}
    </span>
  );
}
