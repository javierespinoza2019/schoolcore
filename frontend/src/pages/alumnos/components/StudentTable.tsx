import { useState, useMemo } from 'react';
import DataTable from '@/components/base/DataTable';
import type { Column } from '@/components/base/DataTable';
import Pagination from '@/components/base/Pagination';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import type { Student } from '@/mocks/alumnos';
import type { Salon } from '@/mocks/salones';
import { getProfesorDelAlumno } from '@/pages/alumnos/helpers/alumnoSalon';
import TeacherAvatar from '@/components/feature/TeacherAvatar';

interface StudentTableProps {
  students: Student[];
  classrooms?: Salon[];
  onViewStudent: (student: Student) => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (student: Student) => void;
  onBulkAction?: (action: string, students: Student[]) => void;
  pageSize?: number;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' | 'accent' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'default' },
  graduated: { label: 'Graduado', variant: 'primary' },
  suspended: { label: 'Suspendido', variant: 'danger' },
  pending: { label: 'Pendiente', variant: 'warning' },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
};

// Precompute profesor for each student for sorting
interface StudentWithProfesor extends Student {
  _profesorName: string;
}

export default function StudentTable({ students, classrooms = [], onViewStudent, onEditStudent, onDeleteStudent, onBulkAction, pageSize = 10 }: StudentTableProps) {
  const [sortKey, setSortKey] = useState('fullName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const enriched: StudentWithProfesor[] = useMemo(
    () =>
      students.map((s) => ({
        ...s,
        _profesorName: getProfesorDelAlumno(s.level, s.grade, s.group, s.branchName, classrooms, s.branchId),
      })),
    [students, classrooms]
  );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const sorted = [...enriched].sort((a, b) => {
    const aVal = String((a as unknown as Record<string, unknown>)[sortKey] ?? '');
    const bVal = String((b as unknown as Record<string, unknown>)[sortKey] ?? '');
    const cmp = aVal.localeCompare(bVal, 'es');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const allSelectableIds = useMemo(() => new Set(paginated.map((s) => s.id)), [paginated]);
  const allSelected = paginated.length > 0 && paginated.every((s) => selectedIds.has(s.id));
  const someSelected = paginated.some((s) => selectedIds.has(s.id)) && !allSelected;
  const selectedStudents = useMemo(() => enriched.filter((s) => selectedIds.has(s.id)), [enriched, selectedIds]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allSelectableIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allSelectableIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const columns: Column<StudentWithProfesor>[] = [
    {
      key: 'checkbox',
      header: (
        <div className="flex items-center">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-secondary-300 text-primary-500 accent-primary-500 cursor-pointer"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleSelectAll}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
      width: '40px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-secondary-300 text-primary-500 accent-primary-500 cursor-pointer"
            checked={selectedIds.has(row.id)}
            onChange={() => toggleSelect(row.id)}
          />
        </div>
      ),
    },
    {
      key: 'fullName',
      header: 'Alumno',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-secondary-100">
            <TeacherAvatar
              src={row.photo}
              alt={row.fullName}
              filenameHint="student-photo"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground-800 truncate" title={row.fullName}>{row.fullName}</p>
            <p className="text-2xs text-foreground-500">{row.enrollment}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Nivel',
      sortable: true,
      width: '130px',
      render: (row) => (
        <div>
          <p className="text-sm text-foreground-700">{row.level}</p>
          <p className="text-2xs text-foreground-500">{row.grade}° {row.group}</p>
        </div>
      ),
    },
    {
      key: '_profesorName',
      header: 'Profesor',
      sortable: true,
      width: '160px',
      render: (row) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <i className="ri-user-star-line text-xs text-primary-600" />
          </div>
          <span className="text-xs text-foreground-700 truncate">
            {row._profesorName === 'Sin asignar' ? (
              <span className="text-foreground-400 italic">Sin asignar</span>
            ) : (
              row._profesorName
            )}
          </span>
        </div>
      ),
    },
    {
      key: 'branchName',
      header: 'Sucursal',
      sortable: true,
      width: '140px',
      render: (row) => (
        <span className="text-sm text-foreground-700">{row.branchName}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      width: '110px',
      align: 'center',
      render: (row) => {
        const cfg = statusConfig[row.status] || statusConfig.inactive;
        return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
      },
    },
    {
      key: 'balance',
      header: 'Saldo',
      sortable: true,
      width: '110px',
      align: 'right',
      render: (row) => (
        <span className={`text-sm font-medium ${row.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {row.balance > 0 ? formatCurrency(row.balance) : '—'}
        </span>
      ),
    },
    {
      key: 'lastPayment',
      header: 'Último Pago',
      sortable: true,
      width: '120px',
      render: (row) => (
        <span className="text-sm text-foreground-600">{row.lastPayment || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onViewStudent(row); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
            title="Ver expediente"
          >
            <i className="ri-eye-line text-sm" />
          </button>
          {onEditStudent && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditStudent(row); }}
              className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-700 hover:bg-secondary-100 transition-colors cursor-pointer"
              title="Editar"
            >
              <i className="ri-pencil-line text-sm" />
            </button>
          )}
          {onDeleteStudent && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteStudent(row); }}
              className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Eliminar"
            >
              <i className="ri-delete-bin-line text-sm" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {selectedStudents.length > 0 && onBulkAction && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-2 bg-primary-50 border border-primary-200/70 rounded-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-primary-700">
              {selectedStudents.length} {selectedStudents.length === 1 ? 'seleccionado' : 'seleccionados'}
            </span>
            <div className="h-4 w-px bg-primary-200" />
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onBulkAction('activate', selectedStudents); clearSelection(); }}
                className="px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-check-line mr-1" />
                Activar
              </button>
              <button
                onClick={() => { onBulkAction('suspend', selectedStudents); clearSelection(); }}
                className="px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-forbid-2-line mr-1" />
                Suspender
              </button>
              <button
                onClick={() => { onBulkAction('graduate', selectedStudents); clearSelection(); }}
                className="px-2.5 py-1 text-xs font-medium text-accent-700 hover:bg-accent-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-award-line mr-1" />
                Graduar
              </button>
              <div className="h-4 w-px bg-primary-200 mx-1" />
              <button
                onClick={() => { onBulkAction('delete', selectedStudents); clearSelection(); }}
                className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-delete-bin-line mr-1" />
                Eliminar
              </button>
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="text-xs text-foreground-400 hover:text-foreground-600 cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={paginated}
        rowKey={(row) => row.id}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onRowClick={onViewStudent}
        emptyMessage="No se encontraron alumnos con los filtros aplicados"
      />
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={sorted.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        className="mt-4"
      />
    </div>
  );
}