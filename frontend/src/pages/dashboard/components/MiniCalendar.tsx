import { useMemo, useState } from 'react';
import Card from '@/components/base/Card';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Calendario sin eventos mock: el dominio de eventos no está en MVP (BR-85). */
export default function MiniCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const isToday = (d: number) =>
    d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground-800 capitalize">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center rounded text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
            aria-label="Mes anterior"
          >
            <i className="ri-arrow-left-s-line text-xs" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="w-6 h-6 flex items-center justify-center rounded text-3xs font-medium text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
            aria-label="Ir a hoy"
          >
            <i className="ri-calendar-2-line text-xs" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center rounded text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
            aria-label="Mes siguiente"
          >
            <i className="ri-arrow-right-s-line text-xs" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-3xs font-medium text-foreground-400 py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7" />
        ))}
        {days.map((d) => {
          const todayFlag = isToday(d);
          return (
            <div
              key={d}
              className={`h-7 flex items-center justify-center text-2xs rounded-full relative ${
                todayFlag
                  ? 'bg-primary-500 text-white font-semibold'
                  : 'text-foreground-600'
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>

      <div className="border-t border-secondary-100 pt-3 mt-1">
        <p className="text-2xs text-foreground-400 text-center py-2">
          Sin eventos · el calendario institucional llega en una fase posterior
        </p>
      </div>
    </Card>
  );
}
