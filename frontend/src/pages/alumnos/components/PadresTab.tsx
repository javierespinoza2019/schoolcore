import { useNavigate } from 'react-router-dom';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import type { Student, StudentParent } from '@/mocks/alumnos';
import { isGuid } from '@/api/helpers';

interface PadresTabProps {
  student: Student;
  onVincularTutor?: () => void;
  onUnlinkTutor?: (parent: StudentParent) => void;
  unlinkingParentId?: string | null;
}

export default function PadresTab({
  student,
  onVincularTutor,
  onUnlinkTutor,
  unlinkingParentId = null,
}: PadresTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-600">
          {student.parents.length}{' '}
          {student.parents.length === 1 ? 'tutor registrado' : 'tutores registrados'}
        </p>
        {onVincularTutor && (
          <Button variant="outline" size="sm" icon="ri-user-add-line" onClick={onVincularTutor}>
            Vincular Tutor
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {student.parents.map((parent: StudentParent) => (
          <Card key={parent.id} padding="md" hover>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-600">
                  {parent.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground-800">{parent.name}</h4>
                  <Badge variant="primary" size="sm">
                    {parent.relationship}
                  </Badge>
                </div>
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center gap-2 text-xs text-foreground-600">
                    <i className="ri-mail-line text-foreground-400" />
                    <span>{parent.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground-600">
                    <i className="ri-phone-line text-foreground-400" />
                    <span>{parent.phone || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground-600">
                    <i className="ri-briefcase-line text-foreground-400" />
                    <span>{parent.occupation || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isGuid(parent.id)) navigate(`/padres/${parent.id}`);
                    }}
                    disabled={!isGuid(parent.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-700 hover:bg-secondary-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Editar tutor"
                  >
                    <i className="ri-pencil-line text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onUnlinkTutor?.(parent)}
                    disabled={!onUnlinkTutor || unlinkingParentId === parent.id}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Desvincular tutor"
                  >
                    <i className="ri-link-unlink text-sm" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {student.parents.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-10 text-foreground-400">
            <i className="ri-user-heart-line text-2xl mb-2" />
            <p className="text-sm">Sin tutores vinculados</p>
            {onVincularTutor && (
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                icon="ri-user-add-line"
                onClick={onVincularTutor}
              >
                Vincular Tutor
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
