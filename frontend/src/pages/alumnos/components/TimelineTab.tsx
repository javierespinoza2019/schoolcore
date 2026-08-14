import Card from '@/components/base/Card';
import Timeline from '@/components/base/Timeline';
import type { Student } from '@/mocks/alumnos';

interface TimelineTabProps {
  student: Student;
}

export default function TimelineTab({ student }: TimelineTabProps) {
  const events = student.timeline.map((e) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    description: e.description,
    icon: e.icon,
    iconBg: e.iconBg,
    iconColor: e.iconColor,
    badge: e.badge,
    badgeVariant: e.badgeVariant as 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | undefined,
  }));

  return (
    <Card padding="lg">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-md bg-primary-100 flex items-center justify-center">
          <i className="ri-history-line text-sm text-primary-600" />
        </div>
        <h3 className="text-sm font-semibold text-foreground-800">Línea de Tiempo del Alumno</h3>
      </div>
      {events.length > 0 ? (
        <Timeline events={events} />
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-foreground-400">
          <i className="ri-history-line text-2xl mb-2" />
          <p className="text-sm">Sin eventos registrados</p>
        </div>
      )}
    </Card>
  );
}