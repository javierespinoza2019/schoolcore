import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import ModuleContextGate from '@/components/feature/ModuleContextGate';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import Badge from '@/components/base/Badge';
import DataTable from '@/components/base/DataTable';
import type { Column } from '@/components/base/DataTable';
import Pagination from '@/components/base/Pagination';
import Modal from '@/components/base/Modal';
import EmptyState from '@/components/base/EmptyState';
import SalonFormModal from '@/pages/salones/components/SalonFormModal';
import type { SalonFormData } from '@/pages/salones/components/SalonFormModal';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useToast } from '@/components/base/Toast';
import { Salon, SalonGrupo } from '@/mocks/salones';
import type { Profesor } from '@/mocks/profesores';
import type { Student } from '@/mocks/alumnos';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import { useSchoolContext } from '@/context/SchoolContext';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as classroomsApi from '@/api/classroomsApi';
import * as studentsApi from '@/api/studentsApi';
import * as teachersApi from '@/api/teachersApi';
import { isGuid } from '@/api/helpers';

function getEstadoBadge(estado: string) {
  switch (estado) {
    case 'Disponible': return <Badge variant="success" size="sm">{estado}</Badge>;
    case 'Lleno': return <Badge variant="warning" size="sm">{estado}</Badge>;
    case 'Mantenimiento': return <Badge variant="danger" size="sm">{estado}</Badge>;
    default: return <Badge variant="default" size="sm">{estado}</Badge>;
  }
}

function getTipoIcon(tipo: string) {
  switch (tipo) {
    case 'Laboratorio': return 'ri-flask-line';
    case 'Taller': return 'ri-tools-line';
    case 'Auditorio': return 'ri-movie-line';
    case 'Deportivo': return 'ri-basketball-line';
    default: return 'ri-door-open-line';
  }
}

function getOcupacionBar(ocupados: number, capacidad: number) {
  const pct = Math.round((ocupados / capacidad) * 100);
  let color = 'bg-emerald-400';
  if (pct > 90) color = 'bg-red-400';
  else if (pct > 75) color = 'bg-amber-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-secondary-100 rounded-full overflow-hidden flex-shrink-0">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-foreground-600">{pct}%</span>
    </div>
  );
}

/** Titular = primer vínculo (DEF-015) o columnas planas legacy. */
function getTitularRef(salon: Salon): string {
  const fromLink = salon.gruposAsignados?.find((g) => g.profesor && g.profesor !== 'Sin asignar')?.profesor;
  if (fromLink) return fromLink;
  if (isGuid(salon.teacherId)) return salon.teacherId!;
  if (salon.profesorAsignado && salon.profesorAsignado !== 'Sin asignar') return salon.profesorAsignado;
  return '';
}

function countDistinctTeachers(salon: Salon): number {
  const set = new Set<string>();
  for (const g of salon.gruposAsignados ?? []) {
    if (g.profesor && g.profesor !== 'Sin asignar') set.add(g.profesor);
  }
  const flat = getTitularRef(salon);
  if (flat) set.add(flat);
  return set.size;
}

function resolveTeacher(ref: string, teachers: Profesor[]): Profesor | undefined {
  if (!ref || ref === 'Sin asignar') return undefined;
  if (isGuid(ref)) return teachers.find((t) => String(t.id) === ref);
  return teachers.find((t) => t.nombre === ref);
}

function teacherDisplayName(ref: string | undefined, teachers: Profesor[]): string {
  if (!ref || ref === 'Sin asignar') return 'Sin asignar';
  const t = resolveTeacher(ref, teachers);
  if (t?.nombre) return t.nombre;
  if (isGuid(ref)) return `Profesor (${ref.slice(0, 8)}…)`;
  return ref;
}

function matchBranch(alumno: Student, salon: Salon): boolean {
  if (salon.branchId && alumno.branchId) return alumno.branchId === salon.branchId;
  if (salon.sucursal) return alumno.branchName === salon.sucursal;
  return true;
}

function getAlumnosDelSalon(salon: Salon, studentsList: Student[]): Student[] {
  if (salon.gruposAsignados && salon.gruposAsignados.length > 0) {
    const combos = salon.gruposAsignados.filter((g) => g.grupo !== 'Todos');
    return studentsList.filter(
      (alumno) =>
        matchBranch(alumno, salon) &&
        alumno.status === 'active' &&
        combos.some(
          (c) =>
            alumno.level === c.nivel &&
            alumno.group === c.grupo &&
            (alumno.grade === c.grado || c.grado === 'Todos')
        )
    );
  }
  return studentsList.filter(
    (alumno) =>
      alumno.level === salon.nivel &&
      alumno.group === salon.grupo &&
      matchBranch(alumno, salon) &&
      alumno.status === 'active'
  );
}

function countAlumnosGrupo(salon: Salon, grupo: string, grado: string, nivel: string, studentsList: Student[]): number {
  return studentsList.filter(
    (alumno) =>
      matchBranch(alumno, salon) &&
      alumno.status === 'active' &&
      alumno.level === nivel &&
      alumno.group === grupo &&
      (alumno.grade === grado || grado === 'Todos')
  ).length;
}

function exportToCSV(dataToExport: Salon[]) {
  const headers = [
    'Nombre', 'Tipo', 'Profesor', 'Nivel', 'Grado', 'Grupo',
    'Ocupados', 'Capacidad', 'Sucursal', 'Edificio', 'Piso',
    'Horario', 'Equipamiento', 'Estado',
  ];
  const rows = dataToExport.map((s) => [
    s.nombre,
    s.tipo,
    s.profesorAsignado,
    s.nivel,
    s.grado,
    s.grupo,
    String(s.ocupados),
    String(s.capacidad),
    s.sucursal,
    s.edificio,
    String(s.piso),
    s.horarioClase,
    s.equipamiento.join('; '),
    s.estado,
  ]);
  const csvContent = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `salones_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Salones() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { branch, branchOptions } = useSchoolContext();

  const [data, setData] = useState<Salon[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [teachersList, setTeachersList] = useState<Profesor[]>([]);
  const classroomsQ = useApiResource({
    queryKey: queryKeys.classrooms.list({}),
    queryFn: () => classroomsApi.listClassrooms({ pageSize: 200 }),
    errorToast: 'Error al cargar salones',
  });
  const studentsQ = useApiResource({
    queryKey: queryKeys.students.list({ for: 'salones' }),
    queryFn: () => studentsApi.listStudents({ pageSize: 500 }),
    errorToast: 'Error al cargar alumnos para ocupación',
  });
  const teachersQ = useApiResource({
    queryKey: queryKeys.teachers.list({ for: 'salones' }),
    queryFn: () => teachersApi.listTeachers({ pageSize: 200 }),
    errorToast: 'Error al cargar profesores',
  });
  useEffect(() => {
    if (!classroomsQ.data) return;
    const names = new Map(branchOptions.map((b) => [b.id, b.name]));
    setData(
      classroomsQ.data.map((s) => ({
        ...s,
        sucursal: s.sucursal || names.get(s.branchId || '') || branch?.name || '',
      }))
    );
  }, [classroomsQ.data, branchOptions, branch?.name]);
  useEffect(() => {
    if (studentsQ.data) setStudentsList(studentsQ.data);
  }, [studentsQ.data]);
  useEffect(() => {
    if (teachersQ.data) setTeachersList(teachersQ.data);
  }, [teachersQ.data]);

  const [search, setSearch] = useState('');
  const [sucursalFilter, setSucursalFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [sortKey, setSortKey] = useState('nombre');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [quickView, setQuickView] = useState<Salon | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Salon | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');

  const sucursales = useMemo(() => [...new Set(data.map((s) => s.sucursal))], [data]);
  const niveles = useMemo(() => [...new Set(data.map((s) => s.nivel))], [data]);
  const tipos = useMemo(() => [...new Set(data.map((s) => s.tipo))], [data]);

  const filtered = useMemo(() => {
    let filteredData = [...data];
    if (search) {
      const s = search.toLowerCase();
      filteredData = filteredData.filter(
        (r) =>
          r.nombre.toLowerCase().includes(s) ||
          r.profesorAsignado.toLowerCase().includes(s) ||
          teacherDisplayName(getTitularRef(r), teachersList).toLowerCase().includes(s)
      );
    }
    if (sucursalFilter) filteredData = filteredData.filter((r) => r.sucursal === sucursalFilter);
    if (nivelFilter) filteredData = filteredData.filter((r) => r.nivel === nivelFilter);
    if (tipoFilter) filteredData = filteredData.filter((r) => r.tipo === tipoFilter);
    if (estadoFilter) filteredData = filteredData.filter((r) => r.estado === estadoFilter);
    return filteredData;
  }, [data, search, sucursalFilter, nivelFilter, tipoFilter, estadoFilter, teachersList]);

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

  const quickViewAlumnos = useMemo(() => {
    if (!quickView) return [];
    return getAlumnosDelSalon(quickView, studentsList);
  }, [quickView, studentsList]);

  const ocupadosMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((salon) => {
      map.set(salon.id, getAlumnosDelSalon(salon, studentsList).length);
    });
    return map;
  }, [data, studentsList]);

  const quickViewProfesor = useMemo(() => {
    if (!quickView) return null;
    const ref = getTitularRef(quickView);
    if (!ref) return null;
    return resolveTeacher(ref, teachersList) ?? null;
  }, [quickView, teachersList]);

  const quickViewTitularLabel = useMemo(() => {
    if (!quickView) return '';
    const ref = getTitularRef(quickView);
    return teacherDisplayName(ref, teachersList);
  }, [quickView, teachersList]);

  const quickViewTeacherCount = useMemo(
    () => (quickView ? countDistinctTeachers(quickView) : 0),
    [quickView]
  );

  const kpis = useMemo(() => {
    const ocupadosMapData = new Map<string, number>();
    data.forEach((salon) => {
      ocupadosMapData.set(salon.id, getAlumnosDelSalon(salon, studentsList).length);
    });
    const ocupadosTotal = Array.from(ocupadosMapData.values()).reduce((a, b) => a + b, 0);
    return {
      total: data.length,
      disponibles: data.filter((s) => s.estado === 'Disponible').length,
      llenos: data.filter((s) => s.estado === 'Lleno').length,
      mantenimiento: data.filter((s) => s.estado === 'Mantenimiento').length,
      capacidadTotal: data.reduce((acc, s) => acc + s.capacidad, 0),
      ocupadosTotal,
    };
  }, [data, studentsList]);

  const selectedCount = selectedIds.size;

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((s) => s.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkAction('');
  };

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    setDeleteLoading(true);
    const ids = new Set(selectedIds);
    setTimeout(() => {
      setData((prev) => prev.filter((s) => !ids.has(s.id)));
      showToast(`${ids.size} salón(es) eliminado(s) correctamente`, 'success');
      setDeleteLoading(false);
      clearSelection();
    }, 500);
  };

  const handleBulkStatusChange = (estado: Salon['estado']) => {
    if (selectedCount === 0) return;
    setData((prev) =>
      prev.map((s) => (selectedIds.has(s.id) ? { ...s, estado } : s))
    );
    const labels: Record<string, string> = { Disponible: 'disponible(s)', Lleno: 'lleno(s)', Mantenimiento: 'en mantenimiento' };
    showToast(`${selectedCount} salón(es) marcado(s) como ${labels[estado] || estado}`, 'success');
    clearSelection();
  };

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
    setTipoFilter('');
    setEstadoFilter('');
    setPage(1);
    setSelectedIds(new Set());
  };

  const hasFilters = search || sucursalFilter || nivelFilter || tipoFilter || estadoFilter;

  const handleAdd = () => {
    setEditingSalon(null);
    setFormOpen(true);
  };

  const handleEdit = (salon: Salon) => {
    setEditingSalon(salon);
    setFormOpen(true);
  };

  const handleDelete = (salon: Salon) => {
    setDeleteTarget(salon);
  };

  const invalidateClassrooms = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.all });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await classroomsApi.deleteClassroom(deleteTarget.id);
    setDeleteLoading(false);
    if (!res.success) {
      showToast(res.message || 'No se pudo eliminar el salón', 'error');
      return;
    }
    showToast(`Salón "${deleteTarget.nombre}" eliminado`, 'success');
    setDeleteTarget(null);
    invalidateClassrooms();
  };

  const handleSave = async (formData: SalonFormData) => {
    if (!isGuid(formData.sucursal)) {
      showToast('Selecciona una sucursal válida', 'error');
      return;
    }
    setSaving(true);
    // Wizard option B: single POST/PUT. First group link fills flat columns; all links → AssignedGroupsJson.
    const firstLink = formData.gruposAsignados[0];
    const teacherRaw = (firstLink?.profesor || formData.profesorAsignado || '').trim();
    const payload: Partial<Salon> & { branchId: string } = {
      branchId: formData.sucursal,
      educationLevelId: isGuid(formData.nivel) ? formData.nivel : undefined,
      nombre: formData.nombre.trim(),
      nivel: firstLink?.nivel ?? formData.nivel,
      grado: firstLink?.grado ?? formData.grado,
      grupo: firstLink?.grupo ?? formData.grupo,
      capacidad: Number(formData.capacidad) || 0,
      sucursal: branch?.name || '',
      tipo: formData.tipo as Salon['tipo'],
      edificio: formData.edificio.trim(),
      piso: Number(formData.piso) || 0,
      equipamiento: formData.equipamiento
        ? formData.equipamiento.split(',').map((e) => e.trim()).filter(Boolean)
        : [],
      teacherId: isGuid(teacherRaw) ? teacherRaw : undefined,
      profesorAsignado: teacherRaw || 'Sin asignar',
      horarioClase: firstLink?.horario ?? formData.horarioClase,
      estado: formData.estado as Salon['estado'],
      gruposAsignados: formData.gruposAsignados,
    };
    const res = editingSalon
      ? await classroomsApi.updateClassroom(editingSalon.id, payload)
      : await classroomsApi.createClassroom(payload);
    setSaving(false);
    if (!res.success) {
      showToast(res.message || 'No se pudo guardar el salón', 'error');
      return;
    }
    showToast(
      editingSalon ? `Salón "${formData.nombre}" actualizado` : `Salón "${formData.nombre}" registrado`,
      'success'
    );
    setFormOpen(false);
    setEditingSalon(null);
    invalidateClassrooms();
  };

  const columns: Column<Salon>[] = [
    {
      key: 'checkbox',
      header: '',
      width: '40px',
      align: 'center',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelectOne(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-400 cursor-pointer"
        />
      ),
    },
    {
      key: 'nombre',
      header: 'Salón',
      sortable: true,
      width: '140px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center rounded-md bg-secondary-100 text-secondary-600 flex-shrink-0">
            <i className={getTipoIcon(row.tipo)} />
          </div>
          <span className="text-sm font-semibold text-foreground-900">{row.nombre}</span>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      sortable: true,
      width: '110px',
      render: (row) => <Badge variant="secondary" size="sm" icon={getTipoIcon(row.tipo)}>{row.tipo}</Badge>,
    },
    {
      key: 'profesorAsignado',
      header: 'Titular',
      sortable: true,
      width: '180px',
      render: (row) => {
        const ref = getTitularRef(row);
        if (!ref) {
          return <span className="text-sm text-foreground-400 italic">Sin asignar</span>;
        }
        const profe = resolveTeacher(ref, teachersList);
        const label = teacherDisplayName(ref, teachersList);
        const extra = countDistinctTeachers(row);
        return (
          <div className="flex items-center gap-2 min-w-0">
            <TeacherAvatar
              src={profe?.fotoUrl}
              alt={label}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-secondary-200"
            />
            <div className="min-w-0">
              <span className="text-sm text-foreground-700 truncate block">{label}</span>
              {extra > 1 && (
                <span className="text-2xs text-foreground-400">+{extra - 1} más en vínculos</span>
              )}
            </div>
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
      key: 'grado',
      header: 'Grado',
      sortable: true,
      width: '90px',
      render: (row) => <span className="text-sm text-foreground-700">{row.grado}</span>,
    },
    {
      key: 'grupo',
      header: 'Grupo',
      sortable: true,
      width: '120px',
      render: (row) => {
        const todosGrupos = row.gruposAsignados && row.gruposAsignados.length > 0
          ? row.gruposAsignados.map((g) => g.grupo)
          : [row.grupo];
        return (
          <div className="flex flex-wrap gap-1">
            {todosGrupos.map((g, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 bg-secondary-100 text-secondary-700 rounded font-medium">
                {g}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'ocupados',
      header: 'Ocupación',
      sortable: true,
      width: '150px',
      render: (row) => {
        const computedOcupados = ocupadosMap.get(row.id) ?? 0;
        return (
        <div>
          <div className="flex items-center gap-1 text-sm">
            <span className={`font-semibold ${computedOcupados >= row.capacidad ? 'text-red-600' : 'text-foreground-800'}`}>{computedOcupados}</span>
            <span className="text-foreground-400">/ {row.capacidad}</span>
          </div>
          {getOcupacionBar(computedOcupados, row.capacidad)}
        </div>
      );
      },
    },
    {
      key: 'sucursal',
      header: 'Sucursal',
      sortable: true,
      width: '130px',
      render: (row) => <span className="text-sm text-foreground-700">{row.sucursal}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      sortable: true,
      width: '130px',
      render: (row) => getEstadoBadge(row.estado),
    },
    {
      key: 'acciones',
      header: '',
      width: '110px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setQuickView(row); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-600 hover:bg-secondary-100 transition-colors cursor-pointer"
            title="Ver detalle"
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
        </div>
      ),
    },
  ];

  const paginatedColumns: Column<Salon>[] = [
    {
      key: 'checkbox',
      header: (
        <input
          type="checkbox"
          checked={paginated.length > 0 && selectedIds.size === paginated.length}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-400 cursor-pointer"
        />
      ),
      width: '40px',
      align: 'center',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelectOne(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-400 cursor-pointer"
        />
      ),
    },
    ...columns.slice(1),
  ];

  return (
    <ModuleContextGate requireCycle={false}>
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Salones</h1>
            <p className="text-sm text-foreground-500 mt-0.5">Gestión de espacios físicos, aulas y asignación docente</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm" icon="ri-download-line"
              onClick={() => { exportToCSV(filtered); showToast(`${filtered.length} salones exportados a CSV`, 'success'); }}
            >
              Exportar
            </Button>
            <Button variant="primary" size="sm" icon="ri-add-line" onClick={handleAdd}>Nuevo Salón</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Total Salones</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{kpis.total}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Disponibles</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">{kpis.disponibles}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Llenos</div>
            <div className="text-lg font-bold text-amber-600 mt-0.5">{kpis.llenos}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Mantenimiento</div>
            <div className="text-lg font-bold text-red-500 mt-0.5">{kpis.mantenimiento}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Cap. Total</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{kpis.capacidadTotal}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Alumnos Ocupando</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{kpis.ocupadosTotal}</div>
          </Card>
        </div>

        <Card padding="sm" className="mb-4">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <Input
                icon="ri-search-line"
                placeholder="Buscar salón o profesor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full"
              />
              <Select
                options={[{ value: '', label: 'Todas las sucursales' }, ...sucursales.map((s) => ({ value: s, label: s }))]}
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
                options={[{ value: '', label: 'Todos los tipos' }, ...tipos.map((t) => ({ value: t, label: t }))]}
                value={tipoFilter}
                onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
                className="w-full"
              />
              <Select
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'Disponible', label: 'Disponible' },
                  { value: 'Lleno', label: 'Lleno' },
                  { value: 'Mantenimiento', label: 'Mantenimiento' },
                ]}
                value={estadoFilter}
                onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
                className="w-full"
              />
            </div>
            {hasFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" icon="ri-close-line" onClick={clearFilters}>Limpiar filtros</Button>
              </div>
            )}
          </div>
        </Card>

        {selectedCount > 0 && (
          <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-primary-50 border border-primary-200 animate-in">
            <span className="text-sm font-medium text-primary-700 whitespace-nowrap">
              {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('Disponible')}>
                <i className="ri-checkbox-circle-line text-sm mr-1" /> Disponible
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('Mantenimiento')}>
                <i className="ri-tools-line text-sm mr-1" /> Mantenimiento
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={handleBulkDelete}
                loading={deleteLoading}
              >
                <i className="ri-delete-bin-line text-sm mr-1" /> Eliminar
              </Button>
              <button
                onClick={clearSelection}
                className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-600 hover:bg-secondary-100 transition-colors cursor-pointer ml-1"
                title="Cancelar selección"
              >
                <i className="ri-close-line text-sm" />
              </button>
            </div>
          </div>
        )}

        <DataTable
          columns={selectedCount > 0 ? paginatedColumns : columns}
          data={paginated}
          rowKey={(row) => row.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={(row) => setQuickView(row)}
          emptyMessage="No se encontraron salones con los filtros aplicados."
        />

        {sorted.length === 0 && hasFilters && (
          <div className="mt-2">
            <EmptyState
              icon="ri-store-2-line"
              title="Sin resultados"
              description="No hay salones que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda."
              action={
                <Button variant="outline" size="sm" icon="ri-close-line" onClick={clearFilters}>
                  Limpiar todos los filtros
                </Button>
              }
            />
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={sorted.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          className="mt-4"
        />

        <Modal
          open={!!quickView}
          onClose={() => setQuickView(null)}
          title={`Salón ${quickView?.nombre}`}
          subtitle={quickView?.tipo}
          size="lg"
          footer={
            <div className="flex items-center gap-2">
              {quickView && (
                <Button variant="outline" size="sm" icon="ri-pencil-line" onClick={() => { handleEdit(quickView); setQuickView(null); }}>
                  Editar
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setQuickView(null)}>Cerrar</Button>
            </div>
          }
        >
          {quickView && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-accent-100 text-accent-600">
                  <i className={`${getTipoIcon(quickView.tipo)} text-xl`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground-800">{quickView.nombre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getEstadoBadge(quickView.estado)}
                    <Badge variant="secondary" size="sm">{quickView.tipo}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Sucursal</p>
                  <p className="text-sm font-medium text-foreground-800">{quickView.sucursal}</p>
                </div>
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Edificio / Piso</p>
                  <p className="text-sm font-medium text-foreground-800">{quickView.edificio} / Piso {quickView.piso}</p>
                </div>
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Capacidad del salón</p>
                  <p className="text-sm font-medium text-foreground-800">
                    {quickViewAlumnos.length} / {quickView.capacidad} alumnos
                  </p>
                  {(quickView.gruposAsignados?.length ?? 0) > 1 && (
                    <p className="text-2xs text-foreground-400 mt-0.5">Compartida entre los grupos vinculados</p>
                  )}
                </div>
                {(!quickView.gruposAsignados || quickView.gruposAsignados.length === 0) && (
                  <>
                    <div>
                      <p className="text-2xs text-foreground-500 uppercase tracking-wider">Nivel / Grado / Grupo</p>
                      <p className="text-sm font-medium text-foreground-800">
                        {quickView.nivel || '—'} · {quickView.grado || '—'} · {quickView.grupo || '—'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-2xs text-foreground-500 uppercase tracking-wider">Horario</p>
                      <p className="text-sm font-medium text-foreground-800">{quickView.horarioClase || '—'}</p>
                    </div>
                  </>
                )}
              </div>

              {quickView.gruposAsignados && quickView.gruposAsignados.length > 0 && (
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="ri-group-line text-sm" />
                    Grupos vinculados ({quickView.gruposAsignados.length})
                  </p>
                  <p className="text-2xs text-foreground-400 mb-2">
                    Cada fila muestra alumnos del grupo. La capacidad ({quickView.capacidad}) es del espacio físico, no un cupo exclusivo por grupo.
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {quickView.gruposAsignados.map((g: SalonGrupo, i: number) => {
                      const ocupadosGrupo = countAlumnosGrupo(
                        quickView,
                        g.grupo,
                        g.grado,
                        g.nivel,
                        studentsList
                      );
                      const pctShared =
                        quickView.capacidad > 0
                          ? Math.round((ocupadosGrupo / quickView.capacidad) * 100)
                          : 0;
                      const profeLabel = teacherDisplayName(g.profesor, teachersList);
                      return (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-background-100 border border-background-200/70">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md bg-secondary-100 text-secondary-700 text-xs font-bold">
                              {g.grupo}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground-800 truncate">
                                {g.grado} · {g.grupo} · {g.nivel}
                              </p>
                              <p className="text-xs text-foreground-500 truncate">
                                {g.horario || 'Sin horario'}
                                {` · ${profeLabel}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <span className="text-sm font-semibold text-foreground-800">{ocupadosGrupo}</span>
                            <span className="text-xs text-foreground-400">alumnos</span>
                            <div
                              className="w-12 h-1.5 bg-background-200 rounded-full overflow-hidden"
                              title={`Participación vs capacidad del salón (${quickView.capacidad})`}
                            >
                              <div
                                className={`h-full rounded-full ${pctShared >= 90 ? 'bg-red-500' : pctShared >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(pctShared, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!quickView.gruposAsignados || quickView.gruposAsignados.length === 0) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary-50 border border-secondary-200">
                  <i className="ri-information-line text-foreground-400 text-sm" />
                  <p className="text-xs text-foreground-500">
                    Este salón no tiene grupos vinculados. Puedes asignarlos al editar (paso Grupos).
                  </p>
                </div>
              )}

              <div>
                <p className="text-2xs text-foreground-500 uppercase tracking-wider mb-1.5">Equipamiento</p>
                <div className="flex flex-wrap gap-1.5">
                  {quickView.equipamiento.map((eq) => (
                    <span key={eq} className="text-xs px-2 py-1 bg-secondary-100 text-secondary-700 rounded-md">{eq}</span>
                  ))}
                </div>
              </div>

              {(quickViewProfesor || (quickViewTitularLabel && quickViewTitularLabel !== 'Sin asignar')) && (
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="ri-user-star-line text-sm" />
                    Titular del salón
                    {quickViewTeacherCount > 1 ? ' (primer vínculo)' : ''}
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background-100 border border-background-200/70">
                    <TeacherAvatar
                      src={quickViewProfesor?.fotoUrl}
                      alt={quickViewTitularLabel}
                      className="w-10 h-10 rounded-full object-cover border border-secondary-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground-800">{quickViewTitularLabel}</p>
                      {quickViewProfesor && (
                        <p className="text-xs text-foreground-500 truncate">
                          {quickViewProfesor.especialidad} · {quickViewProfesor.email}
                        </p>
                      )}
                      {quickViewTeacherCount > 1 && (
                        <p className="text-2xs text-foreground-400 mt-0.5">
                          Hay {quickViewTeacherCount} docentes en los vínculos; el listado muestra el titular.
                        </p>
                      )}
                    </div>
                    {quickViewProfesor && (
                      <Badge
                        variant={
                          quickViewProfesor.estado === 'Activo'
                            ? 'success'
                            : quickViewProfesor.estado === 'Suspendido'
                              ? 'warning'
                              : 'default'
                        }
                        size="sm"
                      >
                        {quickViewProfesor.estado}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {!getTitularRef(quickView) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <i className="ri-user-voice-line text-amber-500 text-sm" />
                  <p className="text-xs text-amber-700">Sin titular: ningún vínculo tiene profesor asignado.</p>
                </div>
              )}

              {quickViewAlumnos.length > 0 && (
                <div>
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="ri-group-line text-sm" />
                    Alumnos activos coincidentes ({quickViewAlumnos.length})
                  </p>
                  <p className="text-2xs text-foreground-400 mb-2">
                    Coincidencia por nivel/grado/grupo y sucursal (no por asignación automática al salón).
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {quickViewAlumnos.map((alumno) => (
                      <div key={alumno.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-background-100/70 transition-colors">
                        <img
                          src={alumno.photo}
                          alt={alumno.fullName}
                          className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-secondary-200"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground-800 truncate">{alumno.fullName}</p>
                          <p className="text-2xs text-foreground-500">{alumno.enrollment}</p>
                        </div>
                        {alumno.balance > 0 && (
                          <Badge variant="warning" size="sm">Adeudo</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {quickViewAlumnos.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary-50 border border-secondary-200">
                  <i className="ri-information-line text-foreground-400 text-sm" />
                  <p className="text-xs text-foreground-500">No hay alumnos activos que coincidan con los grupos de este salón.</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        <SalonFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingSalon(null); }}
          onSave={handleSave}
          salon={editingSalon}
          saving={saving}
        />

        <DeleteConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Eliminar Salón"
          message="¿Estás seguro de que deseas eliminar este salón? Esta acción no se puede deshacer."
          itemName={deleteTarget?.nombre}
          loading={deleteLoading}
        />
      </div>
    </MainLayout>
    </ModuleContextGate>
  );
}