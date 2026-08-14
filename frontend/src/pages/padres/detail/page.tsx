import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import ParentFormModal from '@/pages/padres/components/ParentFormModal';
import type { ParentFormData } from '@/pages/padres/components/ParentFormModal';
import VincularAlumnoModal from '@/pages/padres/components/VincularAlumnoModal';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import { useToast } from '@/components/base/Toast';
import type { Parent } from '@/mocks/padres';
import type { Student } from '@/mocks/alumnos';
import * as parentsApi from '@/api/parentsApi';
import { isGuid } from '@/api/helpers';
import { queryKeys } from '@/api/queryKeys';

export default function PadreDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [vincularOpen, setVincularOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const parentQ = useQuery({
    queryKey: queryKeys.parents.detail(id || ''),
    queryFn: async () => {
      const res = await parentsApi.getParent(id!);
      if (!res.success || !res.data) throw new Error(res.message || 'Tutor no encontrado');
      return res.data;
    },
    enabled: Boolean(id) && isGuid(id!),
  });

  const studentsQ = useQuery({
    queryKey: [...queryKeys.parents.detail(id || ''), 'students'],
    queryFn: async () => {
      const res = await parentsApi.listParentStudents(id!);
      if (!res.success || !res.data) throw new Error(res.message || 'No se pudieron cargar alumnos');
      return res.data;
    },
    enabled: Boolean(id) && isGuid(id!) && parentQ.isSuccess,
  });

  const parent: Parent | null = parentQ.data ?? null;
  const linkedStudents: Student[] = studentsQ.data ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.parents.all });
    if (id) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.parents.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    }
  };

  const statusConfig: Record<
    string,
    { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' | 'accent' }
  > = {
    active: { label: 'Activo', variant: 'success' },
    inactive: { label: 'Inactivo', variant: 'warning' },
    graduated: { label: 'Graduado', variant: 'primary' },
    suspended: { label: 'Suspendido', variant: 'danger' },
    pending: { label: 'Pendiente', variant: 'warning' },
  };

  if (!id || !isGuid(id)) {
    return (
      <MainLayout>
        <div className="max-w-[1440px] mx-auto flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-secondary-100 flex items-center justify-center mb-4">
            <i className="ri-user-search-line text-3xl text-secondary-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground-900 mb-1">Tutor no encontrado</h2>
          <p className="text-sm text-foreground-500 mb-4">El identificador del tutor no es válido.</p>
          <Button variant="primary" icon="ri-arrow-left-line" onClick={() => navigate('/padres')}>
            Volver al listado
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (parentQ.isPending) {
    return (
      <MainLayout>
        <div className="max-w-[1440px] mx-auto flex flex-col items-center justify-center py-20 text-sm text-foreground-500">
          Cargando tutor…
        </div>
      </MainLayout>
    );
  }

  if (!parent) {
    return (
      <MainLayout>
        <div className="max-w-[1440px] mx-auto flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-secondary-100 flex items-center justify-center mb-4">
            <i className="ri-user-search-line text-3xl text-secondary-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground-900 mb-1">Tutor no encontrado</h2>
          <p className="text-sm text-foreground-500 mb-4">El tutor que buscas no existe o fue eliminado.</p>
          <Button variant="primary" icon="ri-arrow-left-line" onClick={() => navigate('/padres')}>
            Volver al listado
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleEditSave = async (formData: ParentFormData) => {
    setSaving(true);
    try {
      const res = await parentsApi.updateParent(parent.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        occupation: formData.occupation.trim(),
        address: formData.address.trim(),
        status: formData.status as Parent['status'],
      });
      if (!res.success) {
        showToast(res.message || 'No se pudo actualizar', 'error');
        return;
      }

      const currentIds = new Set(linkedStudents.map((s) => s.id));
      const nextIds = new Set(formData.linkedStudentIds.filter(isGuid));
      for (const studentId of nextIds) {
        if (!currentIds.has(studentId)) {
          await parentsApi.linkStudent(parent.id, studentId);
        }
      }
      for (const studentId of currentIds) {
        if (!nextIds.has(studentId)) {
          await parentsApi.unlinkStudent(parent.id, studentId);
        }
      }

      showToast('Tutor actualizado correctamente', 'success');
      setFormOpen(false);
      invalidate();
    } catch {
      showToast('Error de red al actualizar tutor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await parentsApi.deleteParent(parent.id);
      if (!res.success) {
        showToast(res.message || 'No se pudo eliminar', 'error');
        return;
      }
      showToast(`Tutor "${parent.fullName}" eliminado correctamente`, 'success');
      setDeleteOpen(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.parents.all });
      navigate('/padres');
    } catch {
      showToast('Error de red al eliminar', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVincularAlumno = async (alumnoId: string) => {
    if (!isGuid(alumnoId)) {
      showToast('Alumno inválido', 'error');
      return;
    }
    const res = await parentsApi.linkStudent(parent.id, alumnoId);
    if (!res.success) {
      showToast(res.message || 'No se pudo vincular el alumno', 'error');
      return;
    }
    showToast('Alumno vinculado correctamente', 'success');
    setVincularOpen(false);
    invalidate();
  };

  const handleDesvincular = async (alumnoId: string) => {
    const alumno = linkedStudents.find((s) => s.id === alumnoId);
    setUnlinkingId(alumnoId);
    try {
      const res = await parentsApi.unlinkStudent(parent.id, alumnoId);
      if (!res.success) {
        showToast(res.message || 'No se pudo desvincular', 'error');
        return;
      }
      showToast(
        alumno ? `Alumno "${alumno.fullName}" desvinculado del tutor` : 'Alumno desvinculado',
        'success'
      );
      invalidate();
    } catch {
      showToast('Error de red al desvincular', 'error');
    } finally {
      setUnlinkingId(null);
    }
  };

  const parentForForm: Parent = {
    ...parent,
    childrenIds: linkedStudents.map((s) => s.id),
    childrenNames: linkedStudents.map((s) => s.fullName),
    childrenCount: linkedStudents.length,
  };

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigate('/padres')}
            className="flex items-center gap-1 text-xs text-foreground-500 hover:text-foreground-800 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line" />
            Padres / Tutores
          </button>
          <i className="ri-arrow-right-s-line text-xs text-foreground-300" />
          <span className="text-xs text-foreground-700 font-medium truncate">{parent.fullName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card padding="lg">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-primary-600">
                    {parent.firstName[0]}
                    {parent.lastName[0]}
                  </span>
                </div>
                <h1 className="text-base font-bold text-foreground-900">{parent.fullName}</h1>
                <Badge variant={parent.status === 'active' ? 'success' : 'default'} size="sm" className="mt-1">
                  {parent.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <i className="ri-mail-line text-sm text-foreground-400 mt-0.5" />
                  <div>
                    <p className="text-3xs text-foreground-500 uppercase tracking-wider">Email</p>
                    <p className="text-sm text-foreground-800">{parent.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <i className="ri-phone-line text-sm text-foreground-400 mt-0.5" />
                  <div>
                    <p className="text-3xs text-foreground-500 uppercase tracking-wider">Teléfono</p>
                    <p className="text-sm text-foreground-800">{parent.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <i className="ri-briefcase-line text-sm text-foreground-400 mt-0.5" />
                  <div>
                    <p className="text-3xs text-foreground-500 uppercase tracking-wider">Ocupación</p>
                    <p className="text-sm text-foreground-800">{parent.occupation || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <i className="ri-map-pin-line text-sm text-foreground-400 mt-0.5" />
                  <div>
                    <p className="text-3xs text-foreground-500 uppercase tracking-wider">Dirección</p>
                    <p className="text-sm text-foreground-800">{parent.address || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <i className="ri-calendar-line text-sm text-foreground-400 mt-0.5" />
                  <div>
                    <p className="text-3xs text-foreground-500 uppercase tracking-wider">Registrado desde</p>
                    <p className="text-sm text-foreground-800">{parent.createdAt || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <i className="ri-user-star-line text-sm text-foreground-400 mt-0.5" />
                  <div>
                    <p className="text-3xs text-foreground-500 uppercase tracking-wider">Hijos vinculados</p>
                    <p className="text-sm text-foreground-800">{parent.childrenCount ?? linkedStudents.length}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-secondary-200/70 flex flex-col gap-2">
                <Button variant="outline" size="sm" icon="ri-edit-line" className="w-full" onClick={() => setFormOpen(true)}>
                  Editar Tutor
                </Button>
                <Button variant="danger" size="sm" icon="ri-delete-bin-line" className="w-full" onClick={() => setDeleteOpen(true)}>
                  Eliminar Tutor
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card padding="lg">
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-primary-100 flex items-center justify-center">
                    <i className="ri-user-star-line text-sm text-primary-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground-800">
                    Alumnos Vinculados ({studentsQ.isPending ? '…' : linkedStudents.length})
                  </h3>
                </div>
                <Button variant="primary" size="sm" icon="ri-link" onClick={() => setVincularOpen(true)}>
                  Vincular Alumno
                </Button>
              </div>

              {studentsQ.isPending ? (
                <p className="text-sm text-foreground-500 py-8 text-center">Cargando alumnos…</p>
              ) : linkedStudents.length > 0 ? (
                <div className="space-y-3">
                  {linkedStudents.map((student) => {
                    const sCfg = statusConfig[student.status] || statusConfig.inactive;
                    return (
                      <div
                        key={student.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-secondary-200/70 hover:border-secondary-300 hover:bg-secondary-50/30 transition-all group"
                      >
                        <div
                          onClick={() => navigate(`/alumnos/${student.id}`)}
                          className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-secondary-100">
                            <TeacherAvatar
                              src={student.photo}
                              alt={student.fullName}
                              filenameHint="student-photo"
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground-800">{student.fullName}</p>
                            <p className="text-2xs text-foreground-500">
                              {student.level} {student.grade}° {student.group} · {student.branchName || '—'}
                            </p>
                          </div>
                          <Badge variant={sCfg.variant} size="sm">
                            {sCfg.label}
                          </Badge>
                          <i className="ri-arrow-right-s-line text-foreground-300" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDesvincular(student.id);
                          }}
                          disabled={unlinkingId === student.id}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-300 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Desvincular alumno"
                        >
                          <i className="ri-link-unlink text-sm" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-foreground-400 border-2 border-dashed border-secondary-200 rounded-lg">
                  <i className="ri-user-search-line text-2xl mb-2" />
                  <p className="text-sm font-medium text-foreground-500">Sin alumnos vinculados</p>
                  <p className="text-xs text-foreground-400 mt-1 mb-3">
                    Vincula un alumno para relacionarlo con este tutor
                  </p>
                  <Button variant="outline" size="sm" icon="ri-link" onClick={() => setVincularOpen(true)}>
                    Vincular Alumno
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        <ParentFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={(data) => void handleEditSave(data)}
          parent={parentForForm}
          saving={saving}
        />

        <VincularAlumnoModal
          open={vincularOpen}
          onClose={() => setVincularOpen(false)}
          onVincular={(alumnoId) => void handleVincularAlumno(alumnoId)}
          parentName={parent.fullName}
          alreadyLinkedIds={linkedStudents.map((s) => s.id)}
        />

        <DeleteConfirmModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => void handleDelete()}
          title="Eliminar Tutor"
          message="¿Estás seguro de que deseas eliminar a este tutor? Esta acción no se puede deshacer y los alumnos vinculados quedarán sin tutor asociado."
          itemName={parent.fullName}
          loading={isDeleting}
        />
      </div>
    </MainLayout>
  );
}
