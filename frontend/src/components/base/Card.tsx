import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4 md:p-5',
  lg: 'p-5 md:p-6',
};

export default function Card({ children, className = '', padding = 'md', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-background-50 border border-secondary-200/70 rounded-lg',
        paddingClasses[padding],
        hover ? 'transition-all duration-200 hover:border-secondary-300 hover:bg-background-50 cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}