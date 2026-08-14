import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import type { Student } from '@/mocks/alumnos';
import type { Salon } from '@/mocks/salones';
import { getProfesorDelAlumno, getSalonDelAlumno } from '@/pages/alumnos/helpers/alumnoSalon';

interface ExpedienteTabProps {
  student: Student;
  classrooms?: Salon[];
}

export default function ExpedienteTab({ student, classrooms = [] }: ExpedienteTabProps) {
  const profesor = getProfesorDelAlumno(student.level, student.grade, student.group, student.branchName, classrooms);
  const salon = getSalonDelAlumno(student.level, student.grade, student.group, student.branchName, classrooms);

  const infoGroups = [
    {
      title: 'Información Personal',
      icon: 'ri-user-line',
      fields: [
        { label: 'Nombre Completo', value: student.fullName },
        { label: 'Matrícula', value: student.enrollment },
        { label: 'Género', value: student.gender === 'M' ? 'Masculino' : 'Femenino' },
        { label: 'Fecha de Nacimiento', value: student.birthDate },
        { label: 'Edad', value: `${student.age} años` },
        { label: 'Tipo de Sangre', value: student.bloodType },
      ],
    },
    {
      title: 'Información Académica',
      icon: 'ri-graduation-cap-line',
      fields: [
        { label: 'Nivel', value: student.level },
        { label: 'Grado', value: `${student.grade}°` },
        { label: 'Grupo', value: student.group },
        { label: 'Salón', value: salon ? `${salon.nombre} (${salon.tipo})` : 'Sin asignar' },
        { label: 'Profesor', value: profesor },
        { label: 'Sucursal', value: student.branchName },
        { label: 'Fecha de Inscripción', value: student.enrollmentDate },
        { label: 'Estado', value: '', badge: student.status },
        { label: 'Beca', value: student.scholarship > 0 ? `${student.scholarship}%` : 'Sin beca' },
      ],
    },
    {
      title: 'Información de Contacto',
      icon: 'ri-mail-line',
      fields: [
        { label: 'Email', value: student.email },
        { label: 'Teléfono', value: student.phone },
        { label: 'Dirección', value: student.address },
      ],
    },
    {
      title: 'Información Médica',
      icon: 'ri-heart-pulse-line',
      fields: [
        { label: 'Alergias', value: student.allergies.length > 0 ? student.allergies.join(', ') : 'Ninguna' },
        { label: 'Notas Médicas', value: student.medicalNotes || 'Ninguna' },
      ],
    },
  ];

  const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' | 'accent' }> = {
    active: { label: 'Activo', variant: 'success' },
    inactive: { label: 'Inactivo', variant: 'default' },
    graduated: { label: 'Graduado', variant: 'primary' },
    suspended: { label: 'Suspendido', variant: 'danger' },
    pending: { label: 'Pendiente', variant: 'warning' },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {infoGroups.map((group) => (
        <Card key={group.title} padding="md">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-secondary-100 flex items-center justify-center">
              <i className={`${group.icon} text-sm text-secondary-600`} />
            </div>
            <h3 className="text-sm font-semibold text-foreground-800">{group.title}</h3>
          </div>
          <div className="space-y-3">
            {group.fields.map((field) => (
              <div key={field.label} className="flex items-start justify-between gap-4">
                <span className="text-xs text-foreground-500 flex-shrink-0">{field.label}</span>
                <span className="text-xs text-foreground-800 text-right font-medium">
                  {field.badge ? (
                    <Badge variant={statusConfig[field.badge]?.variant || 'default'} size="sm">
                      {statusConfig[field.badge]?.label || field.badge}
                    </Badge>
                  ) : (
                    field.value
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}