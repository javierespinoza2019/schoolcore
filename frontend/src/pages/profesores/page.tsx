import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import Badge from '@/components/base/Badge';
import DataTable from '@/components/base/DataTable';
import type { Column } from '@/components/base/DataTable';
import Pagination from '@/components/base/Pagination';
import Modal from '@/components/base/Modal';
import ProfesorFormModal from '@/pages/profesores/components/ProfesorFormModal';
import type { ProfesorFormData } from '@/pages/profesores/components/ProfesorFormModal';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import EmptyState from '@/components/base/EmptyState';
import { useToast } from '@/components/base/Toast';
import { Profesor } from '@/mocks/profesores';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import { salonesData, Salon, SalonGrupo } from '@/mocks/salones';
import { students, Student } from '@/mocks/alumnos';
import { useSchoolContext } from '@/context/SchoolContext';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as teachersApi from '@/api/teachersApi';
import { isGuid } from '@/api/helpers';

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

function getTipoPagoBadge(tipo: string) {
  return tipo === 'Nómina' ? <Badge variant="primary" size="sm">{tipo}</Badge> : <Badge variant="accent" size="sm">{tipo}</Badge>;
}

interface GrupoDetalle {
  salon: Salon;
  grupoEspecifico: SalonGrupo;
  alumnos: Student[];
}

function getGruposDelProfesor(nombreProfesor: string): GrupoDetalle[] {
  const resultados: GrupoDetalle[] = [];
  for (const salon of salonesData) {
    if (salon.gruposAsignados && salon.gruposAsignados.length > 0) {
      const gruposDelProfe = salon.gruposAsignados.filter((g) => g.profesor === nombreProfesor);
      for (const grupo of gruposDelProfe) {
        const alumnosDelGrupo = students.filter(
          (alumno) =>
            alumno.level === grupo.nivel &&
            alumno.group === grupo.grupo &&
            alumno.branchName === salon.sucursal &&
            alumno.status === 'active'
        );
        resultados.push({ salon, grupoEspecifico: grupo, alumnos: alumnosDelGrupo });
      }
    } else if (salon.profesorAsignado === nombreProfesor) {
      const alumnosDelGrupo = students.filter(
        (alumno) =>
          alumno.level === salon.nivel &&
          alumno.group === salon.grupo &&
          alumno.branchName === salon.sucursal &&
          alumno.status === 'active'
      );
      resultados.push({
        salon,
        grupoEspecifico: {
          grupo: salon.grupo,
          grado: salon.grado,
          nivel: salon.nivel,
          horario: salon.horarioClase,
          profesor: salon.profesorAsignado,
          ocupados: salon.ocupados,
        },
        alumnos: alumnosDelGrupo,
      });
    }
  }
  return resultados;
}

function exportToCSV(data: Profesor[]) {
  const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Especialidad', 'Materias', 'Tipo Pago', 'Salario', 'Sucursal', 'Nivel', 'Horario', 'Estado', 'Fecha Ingreso', 'Evaluación'];
  const rows = data.map((p) => [
    String(p.id),
    p.nombre,
    p.email,
    p.telefono,
    p.especialidad,
    p.materias.join('; '),
    p.tipoPago,
    String(p.salarioMensual),
    p.sucursal,
    p.nivel,
    p.horario,
    p.estado,
    p.fechaIngreso,
    p.evaluacion.toFixed(1),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `profesores-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Profesores() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { branch, branchOptions } = useSchoolContext();

  const [data, setData] = useState<Profesor[]>([]);
  const teachersQ = useApiResource({
    queryKey: queryKeys.teachers.list({}),
    queryFn: () => teachersApi.listTeachers({ pageSize: 200 }),
    errorToast: 'Error al cargar profesores',
  });
  useEffect(() => {
    if (!teachersQ.data) return;
    const names = new Map(branchOptions.map((b) => [b.id, b.name]));
    setData(
      teachersQ.data.map((p) => ({
        ...p,
        sucursal: p.sucursal || names.get(p.branchId || '') || branch?.name || '',
      }))
    );
  }, [teachersQ.data, branchOptions, branch?.name]);

  const [search, setSearch] = useState('');
  const [sucursalFilter, setSucursalFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoPagoFilter, setTipoPagoFilter] = useState('');
  const [sortKey, setSortKey] = useState('nombre');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [quickViewProf, setQuickViewProf] = useState<Profesor | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Profesor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profesor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const sucursales = useMemo(() => [...new Set(data.map((p) => p.sucursal))], [data]);
  const niveles = useMemo(() => [...new Set(data.map((p) => p.nivel))], [data]);

  const filtered = useMemo(() => {
    let filteredData = [...data];
    if (search) {
      const s = search.toLowerCase();
      filteredData = filteredData.filter(
        (p) =>
          p.nombre.toLowerCase().includes(s) ||
          p.email.toLowerCase().includes(s) ||
          p.especialidad.toLowerCase().includes(s)
      );
    }
    if (sucursalFilter) filteredData = filteredData.filter((p) => p.sucursal === sucursalFilter);
    if (nivelFilter) filteredData = filteredData.filter((p) => p.nivel === nivelFilter);
    if (estadoFilter) filteredData = filteredData.filter((p) => p.estado === estadoFilter);
    if (tipoPagoFilter) filteredData = filteredData.filter((p) => p.tipoPago === tipoPagoFilter);
    return filteredData;
  }, [data, search, sucursalFilter, nivelFilter, estadoFilter, tipoPagoFilter]);

  const sorted = useMemo(() => {
    const sortedData = [...filtered];
    sortedData.sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortKey] ?? '');
      const bVal = String((b as unknown as Record<string, unknown>)[sortKey] ?? '');
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return sortedData;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const quickViewGrupos = useMemo(() => {
    if (!quickViewProf) return [];
    return getGruposDelProfesor(quickViewProf.nombre);
  }, [quickViewProf]);

  const allIdsOnPage = useMemo(() => new Set(paginated.map((p) => String(p.id))), [paginated]);
  const allPageSelected = paginated.length > 0 && paginated.every((p) => selectedIds.has(String(p.id)));
  const selectedCount = selectedIds.size;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        allIdsOnPage.forEach((id) => next.delete(id));
      } else {
        allIdsOnPage.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string | number) => {
    const strId = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(strId)) next.delete(strId);
      else next.add(strId);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkStatusChange = async (estado: string) => {
    const selected = data.filter((p) => selectedIds.has(String(p.id)));
    const results = await Promise.all(
      selected.map((p) => teachersApi.updateTeacher(p.id, { ...p, estado }))
    );
    const failed = results.filter((r) => !r.success).length;
    if (failed) showToast(`${failed} profesor(es) no se pudieron actualizar`, 'error');
    else showToast(`${selected.length} profesores actualizados a ${estado}`, 'success');
    clearSelection();
    invalidateTeachers();
  };

  const invalidateTeachers = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.teachers.all });
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    const ids = [...selectedIds];
    const results = await Promise.all(ids.map((id) => teachersApi.deleteTeacher(id)));
    setIsBulkDeleting(false);
    const failed = results.filter((r) => !r.success).length;
    if (failed) {
      showToast(`${failed} profesor(es) no se pudieron eliminar`, 'error');
    } else {
      showToast(`${ids.length} profesores eliminados`, 'success');
    }
    clearSelection();
    invalidateTeachers();
  };

  const kpis = useMemo(() => ({
    total: data.length,
    activos: data.filter((p) => p.estado === 'Activo').length,
    nomina: data.filter((p) => p.tipoPago === 'Nómina').length,
    honorarios: data.filter((p) => p.tipoPago === 'Honorarios').length,
    nominaTotal: data.filter((p) => p.tipoPago === 'Nómina').reduce((acc, p) => acc + p.salarioMensual, 0),
    honorariosTotal: data.filter((p) => p.tipoPago === 'Honorarios').reduce((acc, p) => acc + p.salarioMensual, 0),
  }), [data]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSucursalFilter('');
    setNivelFilter('');
    setEstadoFilter('');
    setTipoPagoFilter('');
    setPage(1);
  };

  const hasFilters = search || sucursalFilter || nivelFilter || estadoFilter || tipoPagoFilter;

  const handleAdd = () => {
    setEditingProf(null);
    setFormOpen(true);
  };

  const handleEdit = (prof: Profesor) => {
    setEditingProf(prof);
    setFormOpen(true);
  };

  const handleDelete = (prof: Profesor) => {
    setDeleteTarget(prof);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await teachersApi.deleteTeacher(deleteTarget.id);
    setIsDeleting(false);
    if (!res.success) {
      showToast(res.message || 'No se pudo eliminar el profesor', 'error');
      return;
    }
    showToast(`Profesor "${deleteTarget.nombre}" eliminado`, 'success');
    setDeleteTarget(null);
    invalidateTeachers();
  };

  const handleSave = async (formData: ProfesorFormData) => {
    if (!isGuid(formData.sucursal)) {
      showToast('Selecciona una sucursal válida', 'error');
      return;
    }
    const nombreCompleto = `${formData.firstName} ${formData.lastName}`.trim();
    setSaving(true);
    const payload: Partial<Profesor> & { branchId: string; firstName: string; lastName: string } = {
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
      fechaIngreso: editingProf?.fechaIngreso || new Date().toISOString().slice(0, 10),
      fotoUrl: formData.photoRemoved ? '' : editingProf?.fotoUrl || '',
    };
    const res = editingProf
      ? await teachersApi.updateTeacher(editingProf.id, payload)
      : await teachersApi.createTeacher(payload);
    if (!res.success || !res.data) {
      setSaving(false);
      showToast(res.message || 'No se pudo guardar el profesor', 'error');
      return;
    }
    if (formData.photoFile) {
      const up = await teachersApi.uploadTeacherPhoto(String(res.data.id), formData.photoFile);
      if (!up.success || !up.data) {
        setSaving(false);
        showToast(up.message || 'Profesor guardado, pero la foto no se pudo subir', 'error');
        invalidateTeachers();
        setFormOpen(false);
        setEditingProf(null);
        return;
      }
      const withPhoto = await teachersApi.updateTeacher(res.data.id, { ...payload, fotoUrl: up.data });
      if (!withPhoto.success) {
        setSaving(false);
        showToast(withPhoto.message || 'La foto se subió pero no se vinculó al profesor', 'error');
        invalidateTeachers();
        return;
      }
    }
    setSaving(false);
    showToast(
      editingProf ? `Profesor "${nombreCompleto}" actualizado` : `Profesor "${nombreCompleto}" registrado`,
      'success'
    );
    setFormOpen(false);
    setEditingProf(null);
    invalidateTeachers();
  };

  const columns: Column<Profesor>[] = [
    {
      key: 'select',
      header: (
        <label className="flex items-center justify-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            allPageSelected ? 'bg-primary-500 border-primary-500' : 'border-secondary-300 hover:border-secondary-400'
          }`}>
            {allPageSelected && <i className="ri-check-line text-white text-3xs" />}
          </div>
        </label>
      ),
      width: '44px',
      align: 'center',
      sortable: false,
      render: (row) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div
            onClick={() => toggleSelectOne(row.id)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
              selectedIds.has(String(row.id)) ? 'bg-primary-500 border-primary-500' : 'border-secondary-300 hover:border-secondary-400'
            }`}
          >
            {selectedIds.has(String(row.id)) && <i className="ri-check-line text-white text-3xs" />}
          </div>
        </div>
      ),
    },
    {
      key: 'nombre',
      header: 'Profesor',
      sortable: true,
      width: '280px',
      render: (row) => (
        <div className="flex items-center gap-3">
          <TeacherAvatar
            src={row.fotoUrl}
            alt={row.nombre}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-secondary-200"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground-900 truncate">{row.nombre}</p>
            <p className="text-xs text-foreground-500 truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'especialidad',
      header: 'Especialidad',
      sortable: true,
      width: '140px',
      render: (row) => <span className="text-sm text-foreground-700">{row.especialidad}</span>,
    },
    {
      key: 'grupos',
      header: 'Grupos',
      sortable: false,
      width: '100px',
      align: 'center',
      render: (row) => {
        const grupos = getGruposDelProfesor(row.nombre);
        const totalAlumnos = grupos.reduce((acc, g) => acc + g.alumnos.length, 0);
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-semibold text-foreground-800">{grupos.length}</span>
            <span className="text-2xs text-foreground-500">
              {totalAlumnos} alum{totalAlumnos === 1 ? 'no' : 'nos'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'nivel',
      header: 'Nivel',
      sortable: true,
      width: '120px',
      render: (row) => <span className="text-sm text-foreground-700">{row.nivel}</span>,
    },
    {
      key: 'sucursal',
      header: 'Sucursal',
      sortable: true,
      width: '140px',
      render: (row) => <span className="text-sm text-foreground-700">{row.sucursal}</span>,
    },
    {
      key: 'tipoPago',
      header: 'Tipo Pago',
      sortable: true,
      width: '110px',
      render: (row) => getTipoPagoBadge(row.tipoPago),
    },
    {
      key: 'salarioMensual',
      header: 'Salario',
      sortable: true,
      align: 'right',
      width: '120px',
      render: (row) => (
        <span className="text-sm font-medium text-foreground-800">{formatCurrency(row.salarioMensual)}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      width: '110px',
      render: (row) => getEstadoBadge(row.estado),
    },
    {
      key: 'acciones',
      header: '',
      width: '130px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setQuickViewProf(row); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-600 hover:bg-secondary-100 transition-colors cursor-pointer"
            title="Vista rápida"
          >
            <i className="ri-eye-line text-sm" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-700 hover:bg-secondary-100 transition-colors cursor-pointer"
            title="Editar"
          >
            <i className="ri-pencil-line text-sm" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Eliminar"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/profesores/${row.id}`); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
            title="Ver perfil"
          >
            <i className="ri-arrow-right-line text-sm" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Profesores</h1>
            <p className="text-sm text-foreground-500 mt-0.5">Gestión de planta docente, grupos asignados y carga académica</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon="ri-download-line" onClick={() => exportToCSV(filtered)}>
              Exportar
            </Button>
            <Button variant="primary" size="sm" icon="ri-add-line" onClick={handleAdd}>
              Nuevo Profesor
            </Button>
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-sm font-medium text-primary-800">
              {selectedCount} profesor{selectedCount !== 1 ? 'es' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={clearSelection}>Cancelar</Button>
              <Button variant="outline" size="sm" icon="ri-check-line" onClick={() => handleBulkStatusChange('Activo')}>
                Activar
              </Button>
              <Button variant="outline" size="sm" icon="ri-close-line" onClick={() => handleBulkStatusChange('Suspendido')}>
                Suspender
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon="ri-delete-bin-line"
                onClick={handleBulkDelete}
                loading={isBulkDeleting}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Total</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{kpis.total}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Activos</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">{kpis.activos}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Nómina</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{kpis.nomina}</div>
            <div className="text-2xs text-foreground-500 mt-0.5">{formatCurrency(kpis.nominaTotal)}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Honorarios</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{kpis.honorarios}</div>
            <div className="text-2xs text-foreground-500 mt-0.5">{formatCurrency(kpis.honorariosTotal)}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Evaluación Prom.</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-lg font-bold text-foreground-900">4.6</span>
              <i className="ri-star-fill text-amber-400 text-sm" />
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Sucursales</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{sucursales.length}</div>
          </Card>
        </div>

        <Card padding="sm" className="mb-4">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <Input
                icon="ri-search-line"
                placeholder="Buscar profesor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full"
              />
              <Select
                options={[
                  { value: '', label: 'Todas las sucursales' },
                  ...sucursales.map((s) => ({ value: s, label: s })),
                ]}
                value={sucursalFilter}
                onChange={(e) => { setSucursalFilter(e.target.value); setPage(1); }}
                className="w-full"
              />
              <Select
                options={[{ value: '', label: 'Todos los niveles' }, ...niveles.map((n) => ({ value: n, label: n }))]}
                value={nivelFilter}
                onChange={(e) => { setNivelFilter(e.target.value); setPage(1); }}
                className="w-full"
              />
              <Select
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'Activo', label: 'Activo' },
                  { value: 'Suspendido', label: 'Suspendido' },
                  { value: 'Inactivo', label: 'Inactivo' },
                ]}
                value={estadoFilter}
                onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
                className="w-full"
              />
              <Select
                options={[
                  { value: '', label: 'Tipo de pago' },
                  { value: 'Nómina', label: 'Nómina' },
                  { value: 'Honorarios', label: 'Honorarios' },
                ]}
                value={tipoPagoFilter}
                onChange={(e) => { setTipoPagoFilter(e.target.value); setPage(1); }}
                className="w-full"
              />
            </div>
            {hasFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" icon="ri-close-line" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </Card>

        {filtered.length === 0 && hasFilters ? (
          <EmptyState
            icon="ri-user-search-line"
            title="Sin resultados"
            description="No se encontraron profesores con los filtros actuales."
            action={
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar todos los filtros
              </Button>
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginated}
              rowKey={(row) => row.id}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              onRowClick={(row) => navigate(`/profesores/${row.id}`)}
            />

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={sorted.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              className="mt-4"
            />
          </>
        )}

        <Modal
          open={!!quickViewProf}
          onClose={() => setQuickViewProf(null)}
          title={quickViewProf?.nombre}
          subtitle={quickViewProf?.especialidad}
          size="lg"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setQuickViewProf(null)}>Cerrar</Button>
              <Button variant="primary" size="sm" icon="ri-arrow-right-line" onClick={() => { if (quickViewProf) navigate(`/profesores/${quickViewProf.id}`); setQuickViewProf(null); }}>
                Ver Perfil Completo
              </Button>
            </>
          }
        >
          {quickViewProf && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <TeacherAvatar
                  src={quickViewProf.fotoUrl}
                  alt={quickViewProf.nombre}
                  className="w-20 h-20 rounded-full object-cover border-2 border-secondary-200 flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getEstadoBadge(quickViewProf.estado)}
                    {getTipoPagoBadge(quickViewProf.tipoPago)}
                  </div>
                  <p className="text-sm text-foreground-600 mt-1">{quickViewProf.email}</p>
                  <p className="text-sm text-foreground-600">{quickViewProf.telefono}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Sucursal</p>
                  <p className="text-sm font-medium text-foreground-800">{quickViewProf.sucursal}</p>
                </div>
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Nivel</p>
                  <p className="text-sm font-medium text-foreground-800">{quickViewProf.nivel}</p>
                </div>
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Horario</p>
                  <p className="text-sm font-medium text-foreground-800">{quickViewProf.horario}</p>
                </div>
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Salario</p>
                  <p className="text-sm font-medium text-foreground-800">{formatCurrency(quickViewProf.salarioMensual)}</p>
                </div>
              </div>
              <div>
                <p className="text-2xs text-foreground-500 uppercase tracking-wider mb-1">Materias</p>
                <div className="flex flex-wrap gap-1">
                  {quickViewProf.materias.map((m) => (
                    <span key={m} className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full">{m}</span>
                  ))}
                </div>
              </div>

              {quickViewGrupos.length > 0 && (
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="ri-group-line text-sm" />
                    Grupos Asignados ({quickViewGrupos.length})
                  </p>
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {quickViewGrupos.map((g, idx) => {
                      const capacidadParaGrupo = g.grupoEspecifico.ocupados !== undefined && g.grupoEspecifico.ocupados > 0
                        ? Math.max(g.grupoEspecifico.ocupados, g.alumnos.length)
                        : g.salon.capacidad;
                      const ocupacionPct = Math.round((g.alumnos.length / capacidadParaGrupo) * 100);
                      const colorSalon =
                        g.salon.tipo === 'Laboratorio' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                        g.salon.tipo === 'Taller' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        g.salon.tipo === 'Auditorio' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                        g.salon.tipo === 'Deportivo' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        'bg-secondary-100 text-secondary-700 border-secondary-200';
                      return (
                        <div
                          key={`${g.salon.id}-${g.grupoEspecifico.grupo}-${idx}`}
                          className="p-3 rounded-lg bg-background-100 border border-background-200/70"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-2xs font-bold px-1.5 py-0.5 rounded border ${colorSalon}`}>
                                {g.salon.nombre}
                              </span>
                              <span className="text-xs text-foreground-600">{g.salon.tipo}</span>
                            </div>
                            <i
                              className={`ri-checkbox-circle-fill text-sm ${
                                g.salon.estado === 'Disponible' ? 'text-emerald-500' : g.salon.estado === 'Lleno' ? 'text-amber-500' : 'text-red-500'
                              }`}
                              title={g.salon.estado}
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                              <span className="text-sm font-bold">{g.grupoEspecifico.grupo}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground-800">
                                {g.grupoEspecifico.nivel} · {g.grupoEspecifico.grado}° &quot;{g.grupoEspecifico.grupo}&quot;
                              </p>
                              <p className="text-xs text-foreground-500 flex items-center gap-1 mt-0.5">
                                <i className="ri-time-line text-xs" />
                                {g.grupoEspecifico.horario}
                              </p>
                              <p className="text-xs text-foreground-500 flex items-center gap-1 mt-0.5">
                                <i className="ri-map-pin-line text-xs" />
                                {g.salon.edificio} P{g.salon.piso} · {g.salon.sucursal}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold text-foreground-800">
                                {g.alumnos.length}<span className="text-xs text-foreground-500 font-normal">/{capacidadParaGrupo}</span>
                              </p>
                              <div className="w-16 h-1.5 bg-background-200 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    ocupacionPct >= 90 ? 'bg-red-500' : ocupacionPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(ocupacionPct, 100)}%` }}
                                />
                              </div>
                              <p className="text-2xs text-foreground-500 mt-0.5">{ocupacionPct}% ocupado</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {quickViewGrupos.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <i className="ri-information-line text-amber-500 text-sm" />
                  <p className="text-xs text-amber-700">Este profesor no tiene grupos asignados actualmente.</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        <ProfesorFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingProf(null); }}
          onSave={handleSave}
          saving={saving}
          profesor={editingProf}
        />

        <DeleteConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Eliminar Profesor"
          message="¿Estás seguro de que deseas eliminar a este profesor? Esta acción no se puede deshacer."
          itemName={deleteTarget?.nombre}
          loading={isDeleting}
        />
      </div>
    </MainLayout>
  );
}