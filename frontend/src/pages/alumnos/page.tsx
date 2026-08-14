import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import StudentFilters from '@/pages/alumnos/components/StudentFilters';
import StudentTable from '@/pages/alumnos/components/StudentTable';
import StudentFormModal from '@/pages/alumnos/components/StudentFormModal';
import type { StudentFormData } from '@/pages/alumnos/components/StudentFormModal';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import Modal from '@/components/base/Modal';
import { SkeletonTable } from '@/components/base/Skeleton';
import EmptyState from '@/components/base/EmptyState';
import { useToast } from '@/components/base/Toast';
import type { Student } from '@/mocks/alumnos';
import { getProfesorDelAlumno, getSalonDelAlumno } from '@/pages/alumnos/helpers/alumnoSalon';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '@/context/SchoolContext';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as studentsApi from '@/api/studentsApi';
import { usePermissions } from '@/permissions/PermissionContext';
import { ViewCodes } from '@/permissions/viewCodes';
import { isGuid } from '@/api/helpers';
import TeacherAvatar from '@/components/feature/TeacherAvatar';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
};

function exportToCSV(data: Student[]) {
  const headers = ['Nombre', 'Matrícula', 'Nivel', 'Grado', 'Grupo', 'Sucursal', 'Estado', 'Saldo', 'Último Pago', 'Email', 'Teléfono', 'Profesor', 'Salón', 'Beca'];
  const rows = data.map((s) => {
    const profesor = getProfesorDelAlumno(s.level, s.grade, s.group, s.branchName);
    const salon = getSalonDelAlumno(s.level, s.grade, s.group, s.branchName);
    return [
      s.fullName,
      s.enrollment,
      s.level,
      s.grade,
      s.group,
      s.branchName,
      s.status === 'active' ? 'Activo' : s.status === 'suspended' ? 'Suspendido' : s.status === 'graduated' ? 'Graduado' : s.status === 'pending' ? 'Pendiente' : 'Inactivo',
      s.balance > 0 ? `$${s.balance}` : '$0',
      s.lastPayment || '—',
      s.email,
      s.phone,
      profesor,
      salon ? salon.nombre : 'Sin asignar',
      s.scholarship > 0 ? `${s.scholarship}%` : '—',
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `alumnos_export_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Alumnos() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { cycleId } = useSchoolContext();
  const { can } = usePermissions();

  const [data, setData] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk'>('single');
  const [bulkStudentsToDelete, setBulkStudentsToDelete] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);

  const studentsQuery = useApiResource({
    queryKey: queryKeys.students.list({}),
    queryFn: () => studentsApi.listStudents({ pageSize: 200 }),
    errorToast: 'Error al cargar alumnos',
  });

  useEffect(() => {
    if (studentsQuery.data) setData(studentsQuery.data);
  }, [studentsQuery.data]);

  const invalidateStudents = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
  };

  const summaryStats = useMemo(() => ({
    total: data.length,
    active: data.filter((s) => s.status === 'active').length,
    pending: data.filter((s) => s.status === 'pending').length,
    suspended: data.filter((s) => s.status === 'suspended').length,
    graduated: data.filter((s) => s.status === 'graduated').length,
    inactive: data.filter((s) => s.status === 'inactive').length,
    withBalance: data.filter((s) => s.balance > 0).length,
    totalBalance: data.reduce((sum, s) => sum + s.balance, 0),
  }), [data]);

  const filtered = useMemo(() => {
    return data.filter((s) => {
      if (search && !s.fullName.toLowerCase().includes(search.toLowerCase()) && !s.enrollment.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (level && s.level !== level) return false;
      if (status && s.status !== status) return false;
      if (branch && s.branchName !== branch) return false;
      return true;
    });
  }, [data, search, level, status, branch]);

  const hasActiveFilters = search || level || status || branch;

  const handleViewStudent = (student: Student) => {
    navigate(`/alumnos/${student.id}`);
  };

  const handleQuickView = (student: Student) => {
    setSelectedStudent(student);
    setQuickViewOpen(true);
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setFormOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormOpen(true);
  };

  const handleDelete = (student: Student) => {
    setDeleteTarget(student);
    setDeleteMode('single');
  };

  const confirmDelete = async () => {
    if (deleteMode === 'single' && deleteTarget) {
      const res = await studentsApi.deleteStudent(deleteTarget.id);
      if (res.success) {
        setData((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        showToast(`Alumno "${deleteTarget.fullName}" eliminado correctamente`, 'success');
        invalidateStudents();
      } else {
        showToast(res.message || 'No se pudo eliminar el alumno', 'error');
      }
      setDeleteTarget(null);
    } else if (deleteMode === 'bulk' && bulkStudentsToDelete.length > 0) {
      await Promise.all(bulkStudentsToDelete.map((s) => studentsApi.deleteStudent(s.id)));
      const ids = new Set(bulkStudentsToDelete.map((s) => s.id));
      setData((prev) => prev.filter((s) => !ids.has(s.id)));
      showToast(`${bulkStudentsToDelete.length} alumnos eliminados correctamente`, 'success');
      setBulkStudentsToDelete([]);
      setDeleteTarget(null);
      invalidateStudents();
    }
  };

  const linkGuardians = async (studentId: string, linked: StudentFormData['linkedParents']) => {
    const guidLinks = linked.filter((lp) => isGuid(lp.parentId));
    if (guidLinks.length === 0) return;
    const results = await Promise.all(
      guidLinks.map((lp) => studentsApi.linkParent(studentId, lp.parentId, lp.relationship))
    );
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      showToast(
        `Alumno guardado, pero ${failed.length} vínculo(s) de tutor fallaron`,
        'info'
      );
    }
  };

  const handleSave = async (formData: StudentFormData) => {
    if (!isGuid(formData.branchId)) {
      showToast('Selecciona una sucursal válida antes de guardar', 'error');
      return;
    }

    setSaving(true);
    const todayStr = new Date().toISOString().split('T')[0];

    const payload: Partial<Student> = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
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
      photo: formData.photoRemoved ? '' : editingStudent?.photo || '',
      allergies: formData.allergies
        ? formData.allergies.split(',').map((a) => a.trim()).filter(Boolean)
        : [],
      medicalNotes: formData.medicalNotes,
      status: formData.status as Student['status'],
      enrollmentDate: editingStudent?.enrollmentDate || todayStr,
      scholarship: editingStudent?.scholarship ?? 0,
      enrollment: editingStudent?.enrollment,
      schoolCycleId: editingStudent?.schoolCycleId || (isGuid(cycleId) ? cycleId! : undefined),
      classroomId: editingStudent?.classroomId,
    };

    try {
      const res = editingStudent
        ? await studentsApi.updateStudent(editingStudent.id, payload)
        : await studentsApi.createStudent(payload);
      if (!res.success || !res.data) {
        showToast(res.message || (editingStudent ? 'No se pudo actualizar' : 'No se pudo crear el alumno'), 'error');
        return;
      }

      if (formData.photoFile) {
        const up = await studentsApi.uploadStudentPhoto(String(res.data.id), formData.photoFile);
        if (!up.success || !up.data) {
          showToast(up.message || 'Alumno guardado, pero la foto no se pudo subir', 'error');
          await linkGuardians(res.data.id, formData.linkedParents);
          invalidateStudents();
          setFormOpen(false);
          setEditingStudent(null);
          return;
        }
        const withPhoto = await studentsApi.updateStudent(res.data.id, { ...payload, photo: up.data });
        if (!withPhoto.success) {
          showToast(withPhoto.message || 'La foto se subió pero no se vinculó al alumno', 'error');
          await linkGuardians(res.data.id, formData.linkedParents);
          invalidateStudents();
          setFormOpen(false);
          setEditingStudent(null);
          return;
        }
      }

      await linkGuardians(res.data.id, formData.linkedParents);
      showToast(
        `Alumno "${formData.firstName} ${formData.lastName}" ${editingStudent ? 'actualizado' : 'creado'} correctamente`,
        'success'
      );
      invalidateStudents();
      setFormOpen(false);
      setEditingStudent(null);
    } catch {
      showToast('Error de red al guardar alumno', 'error');
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setLevel('');
    setStatus('');
    setBranch('');
  };

  const handleExport = () => {
    const exportData = filtered.length > 0 ? filtered : data;
    exportToCSV(exportData);
    showToast(`Exportación lista: ${exportData.length} alumnos exportados`, 'success');
  };

  const handleBulkAction = (action: string, students: Student[]) => {
    const ids = new Set(students.map((s) => s.id));
    const persistStatus = async (statusValue: Student['status'], label: string) => {
      const results = await Promise.all(
        students.map((s) => studentsApi.updateStudent(s.id, { ...s, status: statusValue }))
      );
      const failed = results.filter((r) => !r.success).length;
      if (failed) showToast(`${failed} alumno(s) no se pudieron actualizar`, 'error');
      else showToast(`${students.length} alumnos ${label}`, 'success');
      invalidateStudents();
    };
    switch (action) {
      case 'activate':
        void persistStatus('active', 'activados');
        break;
      case 'suspend':
        void persistStatus('suspended', 'suspendidos');
        break;
      case 'graduate':
        void persistStatus('graduated', 'graduados');
        break;
      case 'delete':
        setBulkStudentsToDelete(students);
        setDeleteMode('bulk');
        setDeleteTarget(students[0]); // Need at least one for the modal to show
        break;
    }
  };

  const summaryCards = [
    { label: 'Total', value: summaryStats.total, icon: 'ri-user-star-line', color: 'bg-primary-50 text-primary-500' },
    { label: 'Activos', value: summaryStats.active, icon: 'ri-user-smile-line', color: 'bg-emerald-50 text-emerald-500' },
    { label: 'Pendientes', value: summaryStats.pending, icon: 'ri-time-line', color: 'bg-amber-50 text-amber-500' },
    { label: 'Suspendidos', value: summaryStats.suspended, icon: 'ri-forbid-2-line', color: 'bg-red-50 text-red-500' },
    { label: 'Graduados', value: summaryStats.graduated, icon: 'ri-award-line', color: 'bg-accent-50 text-accent-500' },
    { label: 'Con Adeudo', value: `${summaryStats.withBalance} (${formatCurrency(summaryStats.totalBalance)})`, icon: 'ri-error-warning-line', color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Alumnos</h1>
            <p className="text-sm text-foreground-500 mt-0.5">Gestión completa de estudiantes y expedientes</p>
          </div>
          <div className="flex items-center gap-2">
            {can(ViewCodes.STUDENTS, 'export') && (
              <Button variant="outline" size="sm" icon="ri-download-line" onClick={handleExport}>
                Exportar
              </Button>
            )}
            {can(ViewCodes.STUDENTS, 'create') && (
              <Button variant="primary" size="sm" icon="ri-user-add-line" onClick={handleAdd}>
                Nuevo Alumno
              </Button>
            )}
          </div>
        </div>

        {studentsQuery.isLoading ? (
          <Card padding="md" className="mb-4">
            <SkeletonTable rows={8} />
          </Card>
        ) : !studentsQuery.isLoading && data.length === 0 ? (
          <Card padding="md" className="mb-4">
            <EmptyState
              icon="ri-user-star-line"
              title="Sin alumnos aún"
              description="Cuando registres el primer alumno de tu escuela, aparecerá aquí."
              action={
                can(ViewCodes.STUDENTS, 'create') ? (
                  <Button variant="primary" size="sm" icon="ri-user-add-line" onClick={handleAdd}>
                    Nuevo Alumno
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {summaryCards.map((card) => (
            <Card key={card.label} padding="sm" className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${card.color}`}>
                <i className={`${card.icon} text-base`} />
              </div>
              <div className="min-w-0">
                <p className="text-3xs text-foreground-500 font-medium uppercase tracking-wider">{card.label}</p>
                <p className="text-base font-bold text-foreground-900 truncate">{card.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <StudentFilters
          onSearch={setSearch}
          onLevelChange={setLevel}
          onStatusChange={setStatus}
          onBranchChange={setBranch}
          onClear={clearFilters}
          className="mb-4"
        />

        <StudentTable
          students={filtered}
          onViewStudent={handleViewStudent}
          onEditStudent={handleEdit}
          onDeleteStudent={handleDelete}
          onBulkAction={handleBulkAction}
          pageSize={10}
        />
          </>
        )}

        {hasActiveFilters && filtered.length === 0 && data.length > 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-foreground-400 mt-4">
            <i className="ri-filter-off-line text-xl mb-2" />
            <p className="text-sm mb-3">No se encontraron alumnos con los filtros actuales</p>
            <Button variant="outline" size="sm" icon="ri-close-line" onClick={clearFilters}>
              Limpiar todos los filtros
            </Button>
          </div>
        )}

        {/* Quick View Modal */}
        <Modal
          open={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
          title="Vista Rápida"
          size="md"
        >
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-secondary-100">
                  <TeacherAvatar
                    src={selectedStudent.photo}
                    alt={selectedStudent.fullName}
                    filenameHint="student-photo"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground-900">{selectedStudent.fullName}</h3>
                  <p className="text-sm text-foreground-500">{selectedStudent.enrollment}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="success" size="sm">{selectedStudent.level} {selectedStudent.grade}° {selectedStudent.group}</Badge>
                    <Badge variant={selectedStudent.status === 'active' ? 'success' : selectedStudent.status === 'suspended' ? 'danger' : 'warning'} size="sm">
                      {selectedStudent.status === 'active' ? 'Activo' : selectedStudent.status === 'suspended' ? 'Suspendido' : selectedStudent.status === 'graduated' ? 'Graduado' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-3xs text-foreground-500 uppercase tracking-wider">Email</p>
                  <p className="text-sm text-foreground-800">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-3xs text-foreground-500 uppercase tracking-wider">Teléfono</p>
                  <p className="text-sm text-foreground-800">{selectedStudent.phone}</p>
                </div>
                <div>
                  <p className="text-3xs text-foreground-500 uppercase tracking-wider">Sucursal</p>
                  <p className="text-sm text-foreground-800">{selectedStudent.branchName}</p>
                </div>
                <div>
                  <p className="text-3xs text-foreground-500 uppercase tracking-wider">Saldo</p>
                  <p className={`text-sm font-semibold ${selectedStudent.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {selectedStudent.balance > 0 ? formatCurrency(selectedStudent.balance) : 'Sin adeudos'}
                  </p>
                </div>
                <div>
                  <p className="text-3xs text-foreground-500 uppercase tracking-wider">Salón</p>
                  <p className="text-sm text-foreground-800">
                    {(() => {
                      const salon = getSalonDelAlumno(selectedStudent.level, selectedStudent.grade, selectedStudent.group, selectedStudent.branchName);
                      return salon ? `${salon.nombre} (${salon.tipo})` : 'Sin asignar';
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-3xs text-foreground-500 uppercase tracking-wider">Profesor</p>
                  <p className="text-sm text-foreground-800">
                    {(() => {
                      const profesor = getProfesorDelAlumno(selectedStudent.level, selectedStudent.grade, selectedStudent.group, selectedStudent.branchName);
                      return profesor === 'Sin asignar' ? <span className="text-foreground-400 italic">Sin asignar</span> : profesor;
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-secondary-100">
                <Button variant="ghost" size="sm" onClick={() => setQuickViewOpen(false)}>Cerrar</Button>
                <Button variant="primary" size="sm" icon="ri-eye-line" onClick={() => { setQuickViewOpen(false); handleViewStudent(selectedStudent); }}>
                  Ver Expediente Completo
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Form Modal */}
        <StudentFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingStudent(null); }}
          onSave={handleSave}
          student={editingStudent}
          saving={saving}
        />

        {/* Delete Confirm */}
        <DeleteConfirmModal
          open={!!deleteTarget}
          onClose={() => { setDeleteTarget(null); setBulkStudentsToDelete([]); }}
          onConfirm={confirmDelete}
          title={deleteMode === 'bulk' ? 'Eliminar Alumnos' : 'Eliminar Alumno'}
          message={
            deleteMode === 'bulk'
              ? `¿Estás seguro de que deseas eliminar a ${bulkStudentsToDelete.length} alumnos? Esta acción no se puede deshacer.`
              : '¿Estás seguro de que deseas eliminar a este alumno? Esta acción no se puede deshacer.'
          }
          itemName={deleteMode === 'bulk' ? `${bulkStudentsToDelete.length} alumnos seleccionados` : deleteTarget?.fullName}
        />
      </div>
    </MainLayout>
  );
}