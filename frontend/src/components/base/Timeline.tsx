import { ReactNode } from 'react';

interface TimelineEvent {
  id: string | number;
  date: string;
  title: string;
  description?: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
  badgeVariant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const badgeColors: Record<string, string> = {
  default: 'bg-secondary-100 text-secondary-700',
  primary: 'bg-primary-100 text-primary-700',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
};

export default function Timeline({ events, className = '' }: TimelineProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-[19px] top-2 bottom-2 w-px bg-secondary-200" />
      <div className="space-y-5">
        {events.map((event) => (
          <div key={event.id} className="flex gap-4">
            <div
              className={`relative z-10 w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0 ${
                event.iconBg || 'bg-secondary-100'
              }`}
            >
              <i className={`${event.icon || 'ri-circle-fill'} ${event.iconColor || 'text-secondary-500'} text-sm`} />
            </div>
            <div className="flex-1 min-w-0 pt-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-foreground-800">{event.title}</p>
                {event.badge && (
                  <span className={`text-3xs px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${badgeColors[event.badgeVariant || 'default']}`}>
                    {event.badge}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="text-xs text-foreground-500 mt-0.5">{event.description}</p>
              )}
              <p className="text-3xs text-foreground-400 mt-1">{event.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}