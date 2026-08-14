import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import Tabs from '@/components/base/Tabs';
import ProfesorFormModal from '@/pages/profesores/components/ProfesorFormModal';
import type { ProfesorFormData } from '@/pages/profesores/components/ProfesorFormModal';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useToast } from '@/components/base/Toast';
import type { Profesor } from '@/mocks/profesores';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import * as teachersApi from '@/api/teachersApi';
import { isGuid } from '@/api/helpers';
import { queryKeys } from '@/api/queryKeys';
import type { Salon } from '@/mocks/salones';
import type { Student } from '@/mocks/alumnos';
import * as classroomsApi from '@/api/classroomsApi';
import * as studentsApi from '@/api/studentsApi';
import { useApiResource } from '@/hooks/useApiResource';

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString('es-MX')} MXN`;
}

function getEstadoBadge(estado: string) {
  switch (estado) {
    case 'Activo': return <Badge variant="success" size="sm">{estado}</Badge>;
    case 'Suspendido': return <Badge variant="warning" size="sm">{estado}</Badge>;
    case 'Inactivo': return <Badge variant="default" size="sm">{estado}</Badge>;
    default: return <Badge variant="default" size="sm">{estado}</Badge>;
  }
}

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <i
          key={i}
          className={`text-sm ${i < Math.floor(value) ? 'ri-star-fill text-amber-400' : i < value ? 'ri-star-half-fill text-amber-400' : 'ri-star-line text-amber-300'}`}
        />
      ))}
      <span className="text-sm font-semibold text-foreground-800 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

interface GrupoConAlumnos {
  salon: Salon;
  alumnos: Student[];
}

function getGruposYAlumnos(
  nombreProfesor: string,
  classrooms: Salon[],
  studentsList: Student[]
): GrupoConAlumnos[] {
  const salonesDelProfe = classrooms.filter((s) => s.profesorAsignado === nombreProfesor);
  return salonesDelProfe.map((salon) => {
    const alumnosDelGrupo = studentsList.filter(
      (alumno) =>
        alumno.level === salon.nivel &&
        alumno.group === salon.grupo &&
        (alumno.branchName === salon.sucursal ||
          (salon.branchId && alumno.branchId === salon.branchId)) &&
        alumno.status === 'active'
    );
    return { salon, alumnos: alumnosDelGrupo };
  });
}

function splitNombre(nombreCompleto: string): { firstName: string; lastName: string } {
  const trimmed = nombreCompleto.trim();
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace === -1) return { firstName: trimmed, lastName: '' };
  return {
    firstName: trimmed.substring(0, lastSpace),
    lastName: trimmed.substring(lastSpace + 1),
  };
}

export default function ProfesorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const teacherQ = useQuery({
    queryKey: queryKeys.teachers.detail(id || ''),
    queryFn: async () => {
      const res = await teachersApi.getTeacher(id!);
      if (!res.success || !res.data) throw new Error(res.message || 'Profesor no encontrado');
      return res.data;
    },
    enabled: Boolean(id),
  });
  const profesor = teacherQ.data ?? null;

  const classroomsQ = useApiResource({
    queryKey: queryKeys.classrooms.list({ for: 'profesor-detail' }),
    queryFn: () => classroomsApi.listClassrooms({ pageSize: 200 }),
  });
  const studentsQ = useApiResource({
    queryKey: queryKeys.students.list({ for: 'profesor-detail' }),
    queryFn: () => studentsApi.listStudents({ pageSize: 500 }),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const gruposConAlumnos = useMemo(() => {
    if (!profesor) return [];
    return getGruposYAlumnos(profesor.nombre, classroomsQ.data ?? [], studentsQ.data ?? []);
  }, [profesor, classroomsQ.data, studentsQ.data]);

  const totalAlumnos = useMemo(
    () => gruposConAlumnos.reduce((acc, g) => acc + g.alumnos.length, 0),
    [gruposConAlumnos]
  );

  if (teacherQ.isPending) {
    return (
      <MainLayout>
        <div className="max-w-[1440px] mx-auto flex flex-col items-center justify-center py-20 text-sm text-foreground-500">
          Cargando profesor…
        </div>
      </MainLayout>
    );
  }

  if (!profesor) {
    return (
      <MainLayout>
        <div className="max-w-[1440px] mx-auto flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-secondary-100 mb-4">
            <i className="ri-user-voice-line text-2xl text-secondary-400" />
          </div>
          <h2 className="text-base font-semibold text-foreground-800 mb-1">Profesor no encontrado</h2>
          <p className="text-sm text-foreground-500 mb-4">El profesor que buscas no existe o fue eliminado.</p>
          <Button variant="primary" size="sm" icon="ri-arrow-left-line" onClick={() => navigate('/profesores')}>
            Volver a Profesores
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleEditSave = async (formData: ProfesorFormData) => {
    if (!isGuid(formData.sucursal)) {
      showToast('Selecciona una sucursal válida', 'error');
      return;
    }
    const nombreCompleto = `${formData.firstName} ${formData.lastName}`.trim();
    setSaving(true);
    const payload = {
      branchId: formData.sucursal,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      nombre: nombreCompleto,
      email: formData.email.trim(),
      telefono: formData.telefono.trim(),
      especialidad: formData.especialidad.trim(),
      materias: formData.materias.split(',').map((m) => m.trim()).filter(Boolean),
      tipoPago: formData.tipoPago,
      salarioMensual: Number(formData.salarioMensual) || 0,
      nivel: formData.nivel,
      horario: formData.horario.trim(),
      estado: formData.estado,
      fechaIngreso: profesor.fechaIngreso,
      fotoUrl: formData.photoRemoved ? '' : profesor.fotoUrl || '',
    };
    const res = await teachersApi.updateTeacher(profesor.id, payload);
    if (!res.success) {
      setSaving(false);
      showToast(res.message || 'No se pudo actualizar el profesor', 'error');
      return;
    }
    if (formData.photoFile) {
      const up = await teachersApi.uploadTeacherPhoto(String(profesor.id), formData.photoFile);
      if (!up.success || !up.data) {
        setSaving(false);
        showToast(up.message || 'Profesor actualizado, pero la foto no se pudo subir', 'error');
        void queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
        setFormOpen(false);
        return;
      }
      const withPhoto = await teachersApi.updateTeacher(profesor.id, { ...payload, fotoUrl: up.data });
      if (!withPhoto.success) {
        setSaving(false);
        showToast(withPhoto.message || 'La foto se subió pero no se vinculó', 'error');
        void queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
        return;
      }
    }
    setSaving(false);
    showToast('Profesor actualizado', 'success');
    setFormOpen(false);
    void queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await teachersApi.deleteTeacher(profesor.id);
    setIsDeleting(false);
    if (!res.success) {
      showToast(res.message || 'No se pudo eliminar el profesor', 'error');
      return;
    }
    showToast(`Profesor "${profesor.nombre}" eliminado`, 'success');
    setDeleteOpen(false);
    void queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
    navigate('/profesores');
  };

  const handleSendMessage = () => {
    showToast('Para enviar mensajes necesitas configurar el servicio de email.', 'info');
  };

  const handleGenerateReport = () => {
    showToast('Reporte de ' + profesor.nombre + ' generado. Próximamente disponible para descarga.', 'success');
  };

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-5">
          <button onClick={() => navigate('/profesores')} className="text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer">
            Profesores
          </button>
          <i className="ri-arrow-right-s-line text-foreground-400 text-sm" />
          <span className="text-foreground-900 font-medium">{profesor.nombre}</span>
        </nav>

        {/* Header del perfil */}
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <TeacherAvatar
              src={profesor.fotoUrl}
              alt={profesor.nombre}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-2 border-secondary-200 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-lg font-bold text-foreground-900">{profesor.nombre}</h1>
                <div className="flex items-center gap-2">
                  {getEstadoBadge(profesor.estado)}
                  <Badge variant={profesor.tipoPago === 'Nómina' ? 'primary' : 'accent'} size="sm">{profesor.tipoPago}</Badge>
                </div>
              </div>
              <p className="text-sm text-foreground-500 mb-3">{profesor.especialidad} — {profesor.nivel} — {profesor.sucursal}</p>
              <RatingStars value={profesor.evaluacion} />
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <Button variant="outline" size="sm" icon="ri-edit-line" onClick={() => setFormOpen(true)}>Editar Perfil</Button>
                <Button variant="secondary" size="sm" icon="ri-mail-line" onClick={handleSendMessage}>Enviar Mensaje</Button>
                <Button variant="ghost" size="sm" icon="ri-file-list-3-line" onClick={handleGenerateReport}>Generar Reporte</Button>
                <Button variant="danger" size="sm" icon="ri-delete-bin-line" onClick={() => setDeleteOpen(true)}>Eliminar</Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="text-center p-3 bg-secondary-50/70 rounded-lg">
                <p className="text-2xs text-foreground-500 uppercase tracking-wider">Salario Mensual</p>
                <p className="text-base font-bold text-foreground-900">{formatCurrency(profesor.salarioMensual)}</p>
              </div>
              <div className="text-center p-3 bg-secondary-50/70 rounded-lg">
                <p className="text-2xs text-foreground-500 uppercase tracking-wider">Antigüedad</p>
                <p className="text-sm font-semibold text-foreground-800">Desde {new Date(profesor.fechaIngreso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}</p>
              </div>
              <div className="text-center p-3 bg-secondary-50/70 rounded-lg">
                <p className="text-2xs text-foreground-500 uppercase tracking-wider">Grupos · Alumnos</p>
                <p className="text-sm font-semibold text-foreground-800">
                  {gruposConAlumnos.length} grupos · {totalAlumnos} alumnos
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs
          tabs={[
            {
              id: 'info',
              label: 'Información',
              icon: 'ri-information-line',
              content: (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
                      <i className="ri-user-settings-line text-base" />
                      Datos Personales
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-500">Email</span>
                        <span className="text-foreground-800 font-medium">{profesor.email}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-500">Teléfono</span>
                        <span className="text-foreground-800 font-medium">{profesor.telefono}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-500">Fecha de Ingreso</span>
                        <span className="text-foreground-800 font-medium">{new Date(profesor.fechaIngreso).toLocaleDateString('es-MX', { dateStyle: 'long' })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-500">Sucursal</span>
                        <span className="text-foreground-800 font-medium">{profesor.sucursal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-500">Nivel</span>
                        <span className="text-foreground-800 font-medium">{profesor.nivel}</span>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
                      <i className="ri-bank-card-line text-base" />
                      Datos Laborales
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-500">Tipo de Pago</span>
                        <span className="text-foreground-800 font-medium">{profesor.tipoPago}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-500">Salario Mensual</span>
                        <span className="text-foreground-800 font-medium">{formatCurrency(profesor.salarioMensual)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-500">Horario</span>
                        <span className="text-foreground-800 font-medium">{profesor.horario}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground-500">Evaluación</span>
                        <RatingStars value={profesor.evaluacion} />
                      </div>
                    </div>
                  </Card>
                  <Card className="lg:col-span-2">
                    <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
                      <i className="ri-award-line text-base" />
                      Certificaciones
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profesor.certificaciones.map((c) => (
                        <span key={c} className="text-sm px-3 py-1.5 bg-accent-100 text-accent-700 rounded-md font-medium">{c}</span>
                      ))}
                    </div>
                  </Card>
                </div>
              ),
            },
            {
              id: 'materias',
              label: 'Materias',
              icon: 'ri-book-open-line',
              count: profesor.materias.length,
              content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {profesor.materias.map((m, idx) => (
                    <Card key={idx} padding="md" hover>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-100 text-primary-600 flex-shrink-0">
                          <i className="ri-book-marked-line text-lg" />
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-foreground-800">{m}</h5>
                          <p className="text-xs text-foreground-500 mt-0.5">Nivel: {profesor.nivel}</p>
                          <p className="text-xs text-foreground-500">Sucursal: {profesor.sucursal}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ),
            },
            {
              id: 'grupos',
              label: 'Grupos y Alumnos',
              icon: 'ri-group-line',
              count: gruposConAlumnos.length,
              content: (
                <div className="space-y-4">
                  {gruposConAlumnos.length === 0 && (
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <i className="ri-information-line text-amber-500 text-sm" />
                      <p className="text-xs text-amber-700">Este profesor no tiene grupos asignados actualmente.</p>
                    </div>
                  )}
                  {gruposConAlumnos.map((g) => {
                    const ocupacionPct = Math.round((g.alumnos.length / g.salon.capacidad) * 100);
                    return (
                      <Card key={g.salon.id} padding="md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-accent-100 text-accent-600 flex-shrink-0">
                              <span className="text-sm font-bold">{g.salon.nombre}</span>
                            </div>
                            <div>
                              <h5 className="text-sm font-semibold text-foreground-800">
                                {g.salon.nivel} · {g.salon.grado}° Grupo &quot;{g.salon.grupo}&quot;
                              </h5>
                              <p className="text-xs text-foreground-500">
                                {g.salon.tipo} · {g.salon.edificio} P{g.salon.piso} · {g.salon.horarioClase}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-foreground-800">
                                {g.alumnos.length}<span className="text-xs text-foreground-500 font-normal">/{g.salon.capacidad} alumnos</span>
                              </p>
                              <div className="w-24 h-1.5 bg-background-200 rounded-full mt-0.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    ocupacionPct >= 90 ? 'bg-red-500' : ocupacionPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(ocupacionPct, 100)}%` }}
                                />
                              </div>
                            </div>
                            <Badge
                              variant={g.salon.estado === 'Disponible' ? 'success' : g.salon.estado === 'Lleno' ? 'warning' : 'danger'}
                              size="sm"
                            >
                              {g.salon.estado}
                            </Badge>
                          </div>
                        </div>

                        {g.alumnos.length > 0 && (
                          <div className="border-t border-background-200/70 pt-3">
                            <p className="text-2xs text-foreground-500 uppercase tracking-wider mb-2">
                              Alumnos activos ({g.alumnos.length})
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                              {g.alumnos.map((alumno) => (
                                <div
                                  key={alumno.id}
                                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-background-100/70 transition-colors cursor-pointer"
                                  onClick={() => navigate(`/alumnos/${alumno.id}`)}
                                  title="Ver perfil del alumno"
                                >
                                  <img
                                    src={alumno.photo}
                                    alt={alumno.fullName}
                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-secondary-200"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-foreground-800 truncate">{alumno.fullName}</p>
                                    <p className="text-2xs text-foreground-500">{alumno.enrollment}</p>
                                  </div>
                                  {alumno.balance > 0 && (
                                    <Badge variant="warning" size="sm">${alumno.balance.toLocaleString()}</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {g.alumnos.length === 0 && (
                          <div className="border-t border-background-200/70 pt-3">
                            <p className="text-xs text-foreground-400 italic">Sin alumnos activos en este grupo.</p>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ),
            },
            {
              id: 'horario',
              label: 'Horario',
              icon: 'ri-calendar-check-line',
              content: (
                <div className="space-y-4">
                  <Card>
                    <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
                      <i className="ri-time-line text-base" />
                      Horario General
                    </h4>
                    <p className="text-sm text-foreground-700 bg-secondary-50/70 rounded-lg p-3">{profesor.horario}</p>
                  </Card>
                  <Card>
                    <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
                      <i className="ri-door-open-line text-base" />
                      Resumen de Asignación
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-background-100 rounded-lg">
                        <p className="text-lg font-bold text-foreground-900">{gruposConAlumnos.length}</p>
                        <p className="text-2xs text-foreground-500 mt-0.5">Grupos</p>
                      </div>
                      <div className="text-center p-3 bg-background-100 rounded-lg">
                        <p className="text-lg font-bold text-foreground-900">{totalAlumnos}</p>
                        <p className="text-2xs text-foreground-500 mt-0.5">Alumnos</p>
                      </div>
                      <div className="text-center p-3 bg-background-100 rounded-lg">
                        <p className="text-lg font-bold text-foreground-900">{profesor.materias.length}</p>
                        <p className="text-2xs text-foreground-500 mt-0.5">Materias</p>
                      </div>
                      <div className="text-center p-3 bg-background-100 rounded-lg">
                        <p className="text-lg font-bold text-foreground-900">
                          {gruposConAlumnos.reduce((acc, g) => acc + g.salon.capacidad, 0)}
                        </p>
                        <p className="text-2xs text-foreground-500 mt-0.5">Cap. Total</p>
                      </div>
                    </div>
                  </Card>
                </div>
              ),
            },
            {
              id: 'estadisticas',
              label: 'Estadísticas',
              icon: 'ri-bar-chart-2-line',
              content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card padding="md">
                    <div className="text-2xs text-foreground-500 uppercase tracking-wider mb-1">Evaluación</div>
                    <RatingStars value={profesor.evaluacion} />
                    <div className="mt-2 h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(profesor.evaluacion / 5) * 100}%` }} />
                    </div>
                  </Card>
                  <Card padding="md">
                    <div className="text-2xs text-foreground-500 uppercase tracking-wider mb-1">Materias Impartidas</div>
                    <div className="text-2xl font-bold text-foreground-900">{profesor.materias.length}</div>
                  </Card>
                  <Card padding="md">
                    <div className="text-2xs text-foreground-500 uppercase tracking-wider mb-1">Grupos Asignados</div>
                    <div className="text-2xl font-bold text-foreground-900">{gruposConAlumnos.length}</div>
                  </Card>
                  <Card padding="md">
                    <div className="text-2xs text-foreground-500 uppercase tracking-wider mb-1">Total Alumnos</div>
                    <div className="text-2xl font-bold text-foreground-900">{totalAlumnos}</div>
                  </Card>
                </div>
              ),
            },
          ]}
        />

        <ProfesorFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={handleEditSave}
          profesor={profesor}
          saving={saving}
        />

        <DeleteConfirmModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Eliminar Profesor"
          message="¿Estás seguro de que deseas eliminar a este profesor? Esta acción no se puede deshacer y los grupos asignados quedarán sin docente."
          itemName={profesor.nombre}
          loading={isDeleting}
        />
      </div>
    </MainLayout>
  );
}