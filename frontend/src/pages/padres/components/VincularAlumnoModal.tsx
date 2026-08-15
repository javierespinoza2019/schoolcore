import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/base/Modal';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Badge from '@/components/base/Badge';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import type { Student } from '@/mocks/alumnos';
import * as studentsApi from '@/api/studentsApi';
import { queryKeys } from '@/api/queryKeys';

interface VincularAlumnoModalProps {
  open: boolean;
  onClose: () => void;
  onVincular: (alumnoId: string) => void;
  parentName: string;
  alreadyLinkedIds: string[];
  linking?: boolean;
}

const statusConfig: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' | 'accent' }
> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'warning' },
  suspended: { label: 'Suspendido', variant: 'danger' },
  graduated: { label: 'Graduado', variant: 'primary' },
  pending: { label: 'Pendiente', variant: 'warning' },
};

export default function VincularAlumnoModal({
  open,
  onClose,
  onVincular,
  parentName,
  alreadyLinkedIds,
  linking = false,
}: VincularAlumnoModalProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');

  const studentsQ = useQuery({
    queryKey: queryKeys.students.list({ pageSize: 200, forVincular: true }),
    queryFn: async () => {
      const res = await studentsApi.listStudents({ pageSize: 200 });
      return res.data ?? [];
    },
    enabled: open,
  });

  const students: Student[] = studentsQ.data ?? [];

  useEffect(() => {
    setSearch('');
    setSelectedId('');
  }, [open]);

  const availableStudents = useMemo(
    () => students.filter((s) => !alreadyLinkedIds.includes(s.id)),
    [students, alreadyLinkedIds]
  );

  const filtered = useMemo(() => {
    if (!search) return availableStudents;
    const q = search.toLowerCase();
    return availableStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.enrollment.toLowerCase().includes(q)
    );
  }, [availableStudents, search]);

  const selectedStudent = filtered.find((s) => s.id === selectedId);

  const handleVincular = () => {
    if (!selectedId || linking) return;
    onVincular(selectedId);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vincular Alumno"
      subtitle={`Selecciona un alumno para vincular con ${parentName}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={linking}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon="ri-link"
            onClick={handleVincular}
            disabled={!selectedId || linking}
            loading={linking}
          >
            Vincular Alumno
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          icon="ri-search-line"
          placeholder="Buscar alumno por nombre, email o matrícula..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedId('');
          }}
        />

        {studentsQ.isPending ? (
          <div className="flex flex-col items-center justify-center py-8 text-foreground-400">
            <p className="text-sm">Cargando alumnos…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-foreground-400">
            <i className="ri-user-search-line text-2xl mb-2" />
            <p className="text-sm">No hay alumnos disponibles para vincular</p>
            {search && <p className="text-xs mt-1">Intenta con otros términos de búsqueda</p>}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[340px] overflow-y-auto">
            {filtered.map((student) => {
              const sCfg = statusConfig[student.status] || statusConfig.inactive;
              const isSelected = selectedId === student.id;
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedId(student.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary-400 bg-primary-50/50'
                      : 'border-secondary-200/70 hover:border-secondary-300 hover:bg-secondary-50/30'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'border-primary-500 bg-primary-500' : 'border-secondary-300'
                    }`}
                  >
                    {isSelected && <i className="ri-check-line text-white text-xs" />}
                  </div>
                  <TeacherAvatar
                    src={student.photo}
                    alt={student.fullName}
                    filenameHint="student-photo"
                    className="w-9 h-9 rounded-full object-cover object-top flex-shrink-0 border border-secondary-200 bg-secondary-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground-800 truncate">{student.fullName}</p>
                    <p className="text-2xs text-foreground-500">
                      {student.enrollment} · {student.level} {student.grade}° {student.group} ·{' '}
                      {student.branchName}
                    </p>
                  </div>
                  <Badge variant={sCfg.variant} size="sm">
                    {sCfg.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {selectedStudent && (
          <div className="p-3 rounded-lg bg-primary-50 border border-primary-200">
            <p className="text-xs text-primary-700 font-medium">Alumno seleccionado:</p>
            <div className="flex items-center gap-2 mt-1">
              <TeacherAvatar
                src={selectedStudent.photo}
                alt={selectedStudent.fullName}
                filenameHint="student-photo"
                className="w-7 h-7 rounded-full object-cover object-top border border-primary-200"
              />
              <div>
                <p className="text-sm font-semibold text-primary-800">{selectedStudent.fullName}</p>
                <p className="text-2xs text-primary-600">
                  {selectedStudent.level} {selectedStudent.grade}° {selectedStudent.group}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
