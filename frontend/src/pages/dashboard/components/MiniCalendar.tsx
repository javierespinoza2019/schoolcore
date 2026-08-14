import { useState, useMemo } from 'react';
import Card from '@/components/base/Card';
import { upcomingEvents } from '@/mocks/dashboard';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const WEEK_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function MiniCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const eventDates = useMemo(() => {
    const map = new Map<number, typeof upcomingEvents>();
    upcomingEvents.forEach((e) => {
      const d = new Date(e.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(e);
      }
    });
    return map;
  }, [currentMonth, currentYear]);

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

  const isToday = (d: number) => d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const monthEvents = upcomingEvents.filter((e) => {
    const ed = new Date(e.date);
    return ed.getMonth() === currentMonth && ed.getFullYear() === currentYear;
  });

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground-800 capitalize">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="w-6 h-6 flex items-center justify-center rounded text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
            aria-label="Mes anterior"
          >
            <i className="ri-arrow-left-s-line text-xs" />
          </button>
          <button
            onClick={goToToday}
            className="w-6 h-6 flex items-center justify-center rounded text-3xs font-medium text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
            aria-label="Ir a hoy"
          >
            <i className="ri-calendar-2-line text-xs" />
          </button>
          <button
            onClick={nextMonth}
            className="w-6 h-6 flex items-center justify-center rounded text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
            aria-label="Mes siguiente"
          >
            <i className="ri-arrow-right-s-line text-xs" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-3xs font-medium text-foreground-400 py-1">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7" />
        ))}
        {days.map((d) => {
          const todayFlag = isToday(d);
          const dayEvents = eventDates.get(d);
          const hasEvent = Boolean(dayEvents?.length);
          return (
            <div
              key={d}
              title={dayEvents?.map((e) => e.title).join(' · ')}
              className={`h-7 flex items-center justify-center text-2xs rounded-full relative cursor-pointer transition-colors ${
                todayFlag
                  ? 'bg-primary-500 text-white font-semibold'
                  : 'text-foreground-600 hover:bg-background-100'
              }`}
            >
              {d}
              {hasEvent && !todayFlag && (
                <span className="absolute bottom-0.5 flex items-center gap-0.5">
                  {dayEvents!.slice(0, 3).map((ev, i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full flex-shrink-0 ${
                        ev.type === 'meeting' ? 'bg-primary-400' :
                        ev.type === 'deadline' ? 'bg-red-400' :
                        'bg-accent-400'
                      }`}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {monthEvents.length > 0 && (
        <div className="border-t border-secondary-100 pt-3 mt-1">
          <p className="text-2xs font-semibold text-foreground-500 uppercase tracking-wider mb-2">Próximos en {MONTHS[currentMonth]}</p>
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
            {monthEvents.map((event) => (
              <div key={event.id} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  event.type === 'meeting' ? 'bg-primary-400' :
                  event.type === 'deadline' ? 'bg-red-400' :
                  'bg-accent-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-2xs text-foreground-700 truncate">{event.title}</p>
                  <p className="text-3xs text-foreground-400">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {monthEvents.length === 0 && (
        <div className="border-t border-secondary-100 pt-3 mt-1">
          <p className="text-2xs text-foreground-400 text-center py-2">Sin eventos este mes</p>
        </div>
      )}
    </Card>
  );
}