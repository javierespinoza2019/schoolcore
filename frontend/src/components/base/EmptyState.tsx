import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="w-16 h-16 flex items-center justify-center rounded-full bg-secondary-100 mb-4">
        <i className={`${icon} text-2xl text-secondary-400`} />
      </div>
      <h3 className="text-sm font-semibold text-foreground-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-foreground-500 mb-4 text-center max-w-xs">{description}</p>}
      {action}
    </div>
  );
}