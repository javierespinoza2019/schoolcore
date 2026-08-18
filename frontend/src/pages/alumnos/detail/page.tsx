import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Tabs from '@/components/base/Tabs';
import { SkeletonTable } from '@/components/base/Skeleton';
import ExpedienteTab from '@/pages/alumnos/components/ExpedienteTab';
import TimelineTab from '@/pages/alumnos/components/TimelineTab';
import PagosTab from '@/pages/alumnos/components/PagosTab';
import DocumentosTab from '@/pages/alumnos/components/DocumentosTab';
import PadresTab from '@/pages/alumnos/components/PadresTab';
import RegistrarPagoModal from '@/pages/alumnos/components/RegistrarPagoModal';
import StudentFormModal from '@/pages/alumnos/components/StudentFormModal';
import type { StudentFormData } from '@/pages/alumnos/components/StudentFormModal';
import UploadDocumentModal from '@/pages/alumnos/components/UploadDocumentModal';
import VincularTutorModal from '@/pages/alumnos/components/VincularTutorModal';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import type { Student, StudentParent } from '@/mocks/alumnos';
import { getProfesorDelAlumno, getSalonDelAlumno } from '@/pages/alumnos/helpers/alumnoSalon';
import { useToast } from '@/components/base/Toast';
import * as studentsApi from '@/api/studentsApi';
import * as classroomsApi from '@/api/classroomsApi';
import { listCharges } from '@/api/financeApi';
import { queryKeys } from '@/api/queryKeys';
import { isGuid } from '@/api/helpers';
import { useApiResource } from '@/hooks/useApiResource';
import TeacherAvatar from '@/components/feature/TeacherAvatar';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount);
};

const statusConfig: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' | 'accent' }
> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'default' },
  graduated: { label: 'Graduado', variant: 'primary' },
  suspended: { label: 'Suspendido', variant: 'danger' },
  pending: { label: 'Pendiente', variant: 'warning' },
};

export default function AlumnoDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [studentState, setStudentState] = useState<Student | null>(null);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [unlinkTutorTarget, setUnlinkTutorTarget] = useState<StudentParent | null>(null);
  const [unlinkingParentId, setUnlinkingParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const studentQuery = useQuery({
    queryKey: queryKeys.students.detail(id),
    queryFn: () => studentsApi.getStudent(id),
    enabled: Boolean(id) && isGuid(id),
  });

  const guardiansQuery = useQuery({
    queryKey: [...queryKeys.students.detail(id), 'guardians'],
    queryFn: () => studentsApi.listStudentGuardians(id),
    enabled: Boolean(id) && isGuid(id),
  });

  const chargesQuery = useQuery({
    queryKey: [...queryKeys.students.detail(id), 'charges'],
    queryFn: () => listCharges({ studentId: id, pageSize: 100 }),
    enabled: Boolean(id) && isGuid(id),
  });

  const documentsQuery = useQuery({
    queryKey: [...queryKeys.students.detail(id), 'documents'],
    queryFn: () =>
      studentsApi.listStudentDocuments(id, {
        excludeDocumentIds: studentQuery.data?.data?.photo
          ? [studentQuery.data.data.photo]
          : undefined,
      }),
    enabled: Boolean(id) && isGuid(id),
  });

  const timelineQuery = useQuery({
    queryKey: [...queryKeys.students.detail(id), 'timeline'],
    queryFn: () => studentsApi.listStudentTimeline(id),
    enabled: Boolean(id) && isGuid(id),
  });

  const classroomsQ = useApiResource({
    queryKey: queryKeys.classrooms.list({ for: 'alumno-detail' }),
    queryFn: () => classroomsApi.listClassrooms({ pageSize: 100 }),
  });
  const classrooms = classroomsQ.data ?? [];

  useEffect(() => {
    if (!studentQuery.data?.data) return;
    const base = studentQuery.data.data;
    const parents = guardiansQuery.isError
      ? (studentState?.parents ?? base.parents ?? [])
      : (guardiansQuery.data?.data ?? base.parents ?? []);
    const payments = chargesQuery.isError
      ? (studentState?.payments ?? base.payments ?? [])
      : chargesQuery.data?.data
        ? studentsApi.chargesToStudentPayments(chargesQuery.data.data)
        : base.payments ?? [];
    const documents = documentsQuery.isError
      ? (studentState?.documents ?? base.documents ?? [])
      : (documentsQuery.data?.data ?? base.documents ?? []);
    const timeline = timelineQuery.isError
      ? (studentState?.timeline ?? base.timeline ?? [])
      : (timelineQuery.data?.data ?? base.timeline ?? []);
    const pendingBalance = payments
      .filter((p) => p.status !== 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const lastPaid = payments
      .filter((p) => p.status === 'paid')
      .map((p) => p.date)
      .filter(Boolean)
      .sort()
      .at(-1);
    setStudentState({
      ...base,
      parents,
      payments,
      documents,
      timeline,
      balance: pendingBalance,
      lastPayment: lastPaid || base.lastPayment || '',
    });
    // studentState omitted from deps on purpose: only hydrate from queries
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    studentQuery.data,
    guardiansQuery.data,
    guardiansQuery.isError,
    chargesQuery.data,
    chargesQuery.isError,
    documentsQuery.data,
    documentsQuery.isError,
    timelineQuery.data,
    timelineQuery.isError,
  ]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(id) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    void queryClient.invalidateQueries({ queryKey: [...queryKeys.students.detail(id), 'guardians'] });
    void queryClient.invalidateQueries({ queryKey: [...queryKeys.students.detail(id), 'charges'] });
    void queryClient.invalidateQueries({ queryKey: [...queryKeys.students.detail(id), 'documents'] });
    void queryClient.invalidateQueries({ queryKey: [...queryKeys.students.detail(id), 'timeline'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.parents.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.finance.all });
  }, [queryClient, id]);

  if (!isGuid(id)) {
    return (
      <MainLayout>
        <div className="max-w-[1440px] mx-auto flex flex-col items-center justify-center py-20">
          <h2 className="text-lg font-bold text-foreground-900 mb-1">Identificador inválido</h2>
          <p className="text-sm text-foreground-500 mb-4">El enlace del alumno no es válido.</p>
          <Button variant="primary" icon="ri-arrow-left-line" onClick={() => navigate('/alumnos')}>
            Volver al listado
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (
    studentQuery.isLoading ||
    (studentQuery.isSuccess && studentQuery.data?.data && !studentState)
  ) {
    return (
      <MainLayout>
        <div className="max-w-[1440px] mx-auto">
          <Card padding="md">
            <SkeletonTable rows={6} />
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (
    studentQuery.isError ||
    (studentQuery.isSuccess && !studentQuery.data?.data) ||
    !studentState
  ) {
    return (
      <MainLayout>
        <div className="max-w-[1440px] mx-auto flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-secondary-100 flex items-center justify-center mb-4">
            <i className="ri-user-search-line text-3xl text-secondary-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground-900 mb-1">Alumno no encontrado</h2>
          <p className="text-sm text-foreground-500 mb-4">
            El alumno que buscas no existe o fue eliminado.
          </p>
          <Button variant="primary" icon="ri-arrow-left-line" onClick={() => navigate('/alumnos')}>
            Volver al listado
          </Button>
        </div>
      </MainLayout>
    );
  }

  const student = studentState;
  const statusCfg = statusConfig[student.status] || statusConfig.inactive;
  const profesor = getProfesorDelAlumno(
    student.level,
    student.grade,
    student.group,
    student.branchName,
    classrooms
  );
  const salon = getSalonDelAlumno(student.level, student.grade, student.group, student.branchName, classrooms);

  const handlePaymentRegistered = (_updatedStudent: Student) => {
    invalidate();
  };

  const handleEditSave = async (formData: StudentFormData) => {
    if (!isGuid(formData.branchId)) {
      showToast('Selecciona una sucursal válida', 'error');
      return;
    }
    setSaving(true);
    const payload: Partial<Student> = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      birthDate: formData.birthDate,
      gender: formData.gender as 'M' | 'F',
      bloodType: formData.bloodType,
      address: formData.address.trim(),
      level: formData.level,
      grade: formData.grade,
      group: formData.group,
      branchId: formData.branchId,
      branchName: formData.branchName,
      photo: formData.photoRemoved ? '' : student.photo,
      allergies: formData.allergies
        ? formData.allergies.split(',').map((a) => a.trim()).filter(Boolean)
        : [],
      medicalNotes: formData.medicalNotes,
      status: formData.status as Student['status'],
      enrollment: student.enrollment,
      enrollmentDate: student.enrollmentDate,
      schoolCycleId: student.schoolCycleId,
      classroomId: student.classroomId,
      scholarship: student.scholarship,
    };
    try {
      const res = await studentsApi.updateStudent(student.id, payload);
      if (!res.success) {
        const details = (res.errors ?? []).filter(Boolean).join('. ');
        showToast(details || res.message || 'No se pudo actualizar', 'error');
        return;
      }
      if (formData.photoFile) {
        const up = await studentsApi.uploadStudentPhoto(String(student.id), formData.photoFile);
        if (!up.success || !up.data) {
          showToast(up.message || 'Alumno actualizado, pero la foto no se pudo subir', 'error');
          invalidate();
          setEditModalOpen(false);
          return;
        }
        const withPhoto = await studentsApi.updateStudent(student.id, { ...payload, photo: up.data });
        if (!withPhoto.success) {
          showToast(withPhoto.message || 'La foto se subió pero no se vinculó al alumno', 'error');
          invalidate();
          return;
        }
      }
      for (const lp of formData.linkedParents.filter((x) => isGuid(x.parentId))) {
        await studentsApi.linkParent(student.id, lp.parentId, lp.relationship);
      }
      showToast(`Alumno "${formData.firstName} ${formData.lastName}" actualizado`, 'success');
      setEditModalOpen(false);
      invalidate();
    } catch {
      showToast('Error de red al actualizar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUploaded = (_updatedStudent: Student) => {
    invalidate();
  };

  const handleTutorVinculado = (updatedStudent: Student) => {
    setStudentState(updatedStudent);
    invalidate();
    showToast('Tutor vinculado correctamente', 'success');
  };

  const confirmUnlinkTutor = async () => {
    if (!unlinkTutorTarget || !studentState) return;
    setUnlinkingParentId(unlinkTutorTarget.id);
    try {
      const res = await studentsApi.unlinkParent(studentState.id, unlinkTutorTarget.id);
      if (!res.success) {
        showToast(res.message || 'No se pudo desvincular el tutor', 'error');
        return;
      }
      showToast(`Tutor "${unlinkTutorTarget.name}" desvinculado`, 'success');
      setUnlinkTutorTarget(null);
      invalidate();
    } catch {
      showToast('Error de red al desvincular', 'error');
    } finally {
      setUnlinkingParentId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await studentsApi.deleteStudent(deleteTarget.id);
    if (!res.success) {
      showToast(res.message || 'No se pudo eliminar', 'error');
      return;
    }
    showToast(`Alumno "${deleteTarget.fullName}" eliminado`, 'success');
    void queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    navigate('/alumnos');
  };

  const headerStats = [
    {
      label: 'Saldo',
      value: student.balance > 0 ? formatCurrency(student.balance) : 'Sin adeudos',
      color: student.balance > 0 ? 'text-red-600' : 'text-emerald-600',
      icon: 'ri-money-dollar-circle-line',
    },
    {
      label: 'Pagos',
      value: `${student.payments.filter((p) => p.status === 'paid').length} realizados`,
      color: 'text-foreground-700',
      icon: 'ri-bank-card-line',
    },
    {
      label: 'Documentos',
      value: `${student.documents.filter((d) => d.status === 'verified').length}/${student.documents.length} verificados`,
      color:
        student.documents.filter((d) => d.status !== 'verified').length > 0
          ? 'text-amber-600'
          : 'text-emerald-600',
      icon: 'ri-file-check-line',
    },
    {
      label: 'Tutores',
      value: `${student.parents.length} vinculados`,
      color: 'text-foreground-700',
      icon: 'ri-user-heart-line',
    },
    {
      label: 'Salón',
      value: salon ? `${salon.nombre}` : 'Sin asignar',
      color: 'text-foreground-700',
      icon: 'ri-door-open-line',
    },
    {
      label: 'Profesor',
      value: profesor === 'Sin asignar' ? 'Sin asignar' : profesor,
      color: 'text-foreground-700',
      icon: 'ri-user-star-line',
    },
  ];

  const subResourceError = (label: string, onRetry: () => void) => (
    <div className="flex flex-col items-center justify-center py-10 text-red-500 border-2 border-dashed border-red-200 rounded-lg">
      <i className="ri-error-warning-line text-2xl mb-2" />
      <p className="text-sm font-medium">No se pudieron cargar {label}</p>
      <Button variant="outline" size="sm" icon="ri-refresh-line" className="mt-3" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );

  const tabs = [
    {
      id: 'expediente',
      label: 'Expediente',
      icon: 'ri-profile-line',
      content: <ExpedienteTab student={student} classrooms={classrooms} />,
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: 'ri-history-line',
      count: timelineQuery.isError ? undefined : student.timeline.length,
      content: timelineQuery.isError ? (
        subResourceError('el timeline', () => void timelineQuery.refetch())
      ) : (
        <TimelineTab student={student} />
      ),
    },
    {
      id: 'pagos',
      label: 'Pagos',
      icon: 'ri-money-dollar-circle-line',
      count: chargesQuery.isError ? undefined : student.payments.length,
      content: chargesQuery.isError ? (
        subResourceError('los pagos', () => void chargesQuery.refetch())
      ) : (
        <PagosTab student={student} onRegistrarPago={() => setPagoModalOpen(true)} />
      ),
    },
    {
      id: 'documentos',
      label: 'Documentos',
      icon: 'ri-file-list-3-line',
      count: documentsQuery.isError ? undefined : student.documents.length,
      content: documentsQuery.isError ? (
        subResourceError('los documentos', () => void documentsQuery.refetch())
      ) : (
        <DocumentosTab student={student} onUploadDocumento={() => setDocModalOpen(true)} />
      ),
    },
    {
      id: 'padres',
      label: 'Padres',
      icon: 'ri-user-heart-line',
      count: guardiansQuery.isError ? undefined : student.parents.length,
      content: guardiansQuery.isError ? (
        subResourceError('los tutores', () => void guardiansQuery.refetch())
      ) : (
        <PadresTab
          student={student}
          onVincularTutor={() => setTutorModalOpen(true)}
          onUnlinkTutor={(parent) => setUnlinkTutorTarget(parent)}
          unlinkingParentId={unlinkingParentId}
        />
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigate('/alumnos')}
            className="flex items-center gap-1 text-xs text-foreground-500 hover:text-foreground-800 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line" />
            Alumnos
          </button>
          <i className="ri-arrow-right-s-line text-xs text-foreground-300" />
          <span className="text-xs text-foreground-700 font-medium truncate">{student.fullName}</span>
        </div>

        <Card padding="lg" className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-secondary-100 relative group cursor-pointer"
                onClick={() => setEditModalOpen(true)}
                title="Editar alumno"
              >
                <TeacherAvatar
                  src={student.photo}
                  alt={student.fullName}
                  filenameHint="student-photo"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <i className="ri-pencil-line text-white opacity-0 group-hover:opacity-100 transition-opacity text-lg" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-lg font-bold text-foreground-900">{student.fullName}</h1>
                  <Badge variant={statusCfg.variant} size="md">
                    {statusCfg.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-sm text-foreground-500">{student.enrollment}</span>
                  <span className="text-foreground-300">·</span>
                  <span className="text-sm text-foreground-500">
                    {student.level} {student.grade} {student.group}
                  </span>
                  <span className="text-foreground-300">·</span>
                  <span className="text-sm text-foreground-500">{student.branchName || '—'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                icon="ri-delete-bin-line"
                onClick={() => setDeleteTarget(student)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              >
                Eliminar
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon="ri-pencil-line"
                onClick={() => setEditModalOpen(true)}
              >
                Editar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-secondary-100">
            {headerStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
                  <i className={`${stat.icon} text-sm text-secondary-600`} />
                </div>
                <div className="min-w-0">
                  <p className="text-3xs text-foreground-500 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-xs font-semibold truncate ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Tabs tabs={tabs} defaultTab="expediente" />

        <RegistrarPagoModal
          open={pagoModalOpen}
          onClose={() => setPagoModalOpen(false)}
          student={student}
          onPaymentRegistered={handlePaymentRegistered}
        />

        <StudentFormModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleEditSave}
          student={student}
          saving={saving}
          classrooms={classrooms}
        />

        <UploadDocumentModal
          open={docModalOpen}
          onClose={() => setDocModalOpen(false)}
          student={student}
          onDocumentUploaded={handleDocumentUploaded}
        />

        <VincularTutorModal
          open={tutorModalOpen}
          onClose={() => setTutorModalOpen(false)}
          student={student}
          onTutorVinculado={handleTutorVinculado}
        />

        <DeleteConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
          title="Eliminar Alumno"
          message="¿Estás seguro de que deseas eliminar a este alumno? Esta acción no se puede deshacer."
          itemName={deleteTarget?.fullName}
        />

        <DeleteConfirmModal
          open={!!unlinkTutorTarget}
          onClose={() => setUnlinkTutorTarget(null)}
          onConfirm={() => void confirmUnlinkTutor()}
          title="Desvincular Tutor"
          message="¿Deseas desvincular este tutor del alumno? El tutor no se eliminará del sistema."
          itemName={unlinkTutorTarget?.name}
          loading={Boolean(unlinkingParentId)}
        />
      </div>
    </MainLayout>
  );
}
