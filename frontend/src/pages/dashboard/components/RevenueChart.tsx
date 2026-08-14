import Card from '@/components/base/Card';
import { revenueData } from '@/mocks/dashboard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueChart() {
  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground-800">Ingresos vs Egresos</h3>
          <p className="text-2xs text-foreground-500 mt-0.5">Acumulado mensual 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-400" />
            <span className="text-2xs text-foreground-500">Ingresos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-400" />
            <span className="text-2xs text-foreground-500">Egresos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-emerald-400 bg-transparent" />
            <span className="text-2xs text-foreground-500">Meta</span>
          </div>
        </div>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(var(--primary-400))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="oklch(var(--primary-400))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(var(--secondary-400))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="oklch(var(--secondary-400))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--secondary-200))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'oklch(var(--foreground-400))' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: 'oklch(var(--foreground-400))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(var(--background-50))',
                border: '1px solid oklch(var(--secondary-200))',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'Inter, sans-serif',
              }}
              formatter={(value: number, name: string) => {
                const formatted = `$${value.toLocaleString('es-MX')}`;
                return [formatted, name === 'ingresos' ? 'Ingresos' : name === 'egresos' ? 'Egresos' : 'Meta'];
              }}
            />
            <Area type="monotone" dataKey="meta" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" fill="none" />
            <Area type="monotone" dataKey="egresos" stroke="oklch(var(--secondary-400))" strokeWidth={2} fill="url(#colorEgresos)" />
            <Area type="monotone" dataKey="ingresos" stroke="oklch(var(--primary-500))" strokeWidth={2} fill="url(#colorIngresos)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}