import { useState, useEffect, useRef } from 'react';
import Card from '@/components/base/Card';

interface KPIOverviewProps {
  cards: {
    label: string;
    value: string;
    change: string;
    positive: boolean;
    icon: string;
    iconColor: string;
    sparklineData: number[];
    sparklineColor: string;
    onClick?: () => void;
  }[];
}

function Sparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimating(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const padding = 2;
  const chartW = width - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartW;
    const y = height - padding - ((d - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartW;
    const y = height - padding - ((d - min) / range) * (height - padding * 2);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaD = `${pathD} L ${padding + chartW},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-20 h-8 overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d={areaD}
        fill={`url(#spark-fill-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
        opacity={animating ? 1 : 0}
        style={{ transition: 'opacity 0.5s ease' }}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={animating ? '1000' : '0'}
        strokeDashoffset={animating ? '0' : '1000'}
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
    </svg>
  );
}

export default function KPIOverview({ cards }: KPIOverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((kpi, i) => (
        <Card key={i} padding="md" className="group cursor-pointer hover:shadow-sm transition-shadow duration-200" onClick={kpi.onClick}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground-500 mb-1">{kpi.label}</p>
              <p className="text-lg font-bold text-foreground-900">{kpi.value}</p>
              <p className={`text-3xs mt-1 font-medium ${kpi.positive ? 'text-emerald-600' : 'text-red-500'}`}>
                <i className={`${kpi.positive ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-2xs mr-0.5`} />
                {kpi.change}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <div className={`w-9 h-9 flex items-center justify-center rounded-lg bg-background-100 ${kpi.iconColor}`}>
                <i className={kpi.icon} />
              </div>
              <Sparkline data={kpi.sparklineData} color={kpi.sparklineColor} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}