import Card from '@/components/base/Card';

export interface ActivityItem {
  id: string;
  text: string;
  user: string;
  time: string;
  icon: string;
  color: string;
  amount?: string;
}

const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-600',
  primary: 'bg-primary-100 text-primary-600',
  amber: 'bg-amber-100 text-amber-600',
  accent: 'bg-accent-100 text-accent-600',
  secondary: 'bg-secondary-100 text-secondary-600',
};

interface RecentActivityProps {
  items?: ActivityItem[];
}

export default function RecentActivity({ items = [] }: RecentActivityProps) {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground-800">Actividad Reciente</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-foreground-400 py-8 text-center">Sin actividad reciente</p>
      ) : (
        <div className="space-y-0">
          {items.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 py-2.5 border-b border-secondary-100/70 last:border-0"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorMap[item.color] || colorMap.primary}`}
              >
                <i className={`${item.icon} text-sm`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground-800">{item.text}</p>
                <p className="text-2xs text-foreground-500 mt-0.5">{item.user}</p>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                {item.amount && (
                  <span className="text-xs font-semibold text-foreground-800 whitespace-nowrap">
                    {item.amount}
                  </span>
                )}
                <span className="text-3xs text-foreground-400 whitespace-nowrap">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
