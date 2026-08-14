import Card from '@/components/base/Card';

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

const colorMap: Record<string, { bg: string; icon: string }> = {
  primary: { bg: 'bg-primary-50', icon: 'text-primary-500' },
  success: { bg: 'bg-emerald-50', icon: 'text-emerald-500' },
  warning: { bg: 'bg-amber-50', icon: 'text-amber-500' },
  accent: { bg: 'bg-accent-50', icon: 'text-accent-500' },
  secondary: { bg: 'bg-secondary-100', icon: 'text-secondary-500' },
};

export default function KPICard({ label, value, sub, trend, icon, color }: KPICardProps) {
  const colors = colorMap[color] || colorMap.primary;

  return (
    <Card padding="md" hover>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-2xs text-foreground-500 font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-xl font-bold text-foreground-900 tracking-tight">{value}</p>
          {sub && (
            <p className="text-3xs text-foreground-500 mt-0.5 line-clamp-1">{sub}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 relative`}>
          <i className={`${icon} ${colors.icon} text-lg`} />
          {trend && trend !== 'neutral' && (
            <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
              trend === 'up' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'
            }`}>
              <i className={`${trend === 'up' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-xs`} />
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}