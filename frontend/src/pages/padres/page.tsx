import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Input from '@/components/base/Input';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import DataTable from '@/components/base/DataTable';
import type { Column } from '@/components/base/DataTable';
import Pagination from '@/components/base/Pagination';
import ParentFormModal from '@/pages/padres/components/ParentFormModal';
import type { ParentFormData } from '@/pages/padres/components/ParentFormModal';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import EmptyState from '@/components/base/EmptyState';
import { useToast } from '@/components/base/Toast';
import type { Parent } from '@/mocks/padres';
import { useSchoolContext } from '@/context/SchoolContext';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as parentsApi from '@/api/parentsApi';
import { isGuid } from '@/api/helpers';

function exportToCSV(data: Parent[]) {
  const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Ocupación', 'Dirección', 'Hijos', 'Estado', 'Registro'];
  const rows = data.map((p) => [
    p.id,
    p.fullName,
    p.email,
    p.phone,
    p.occupation,
    p.address,
    String(p.childrenCount),
    p.status === 'active' ? 'Activo' : 'Inactivo',
    p.createdAt,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `padres-tutores-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Padres() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { branchId } = useSchoolContext();

  const [data, setData] = useState<Parent[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('fullName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const parentsQuery = useApiResource({
    queryKey: queryKeys.parents.list({ branchId }),
    queryFn: () => parentsApi.listParents({ branchId, pageSize: 200 }),
    errorToast: 'Error al cargar padres/tutores',
  });

  useEffect(() => {
    if (parentsQuery.data) setData(parentsQuery.data);
  }, [parentsQuery.data]);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.parents.all });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [formOpen, setFormOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Parent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (search && !p.fullName.toLowerCase().includes(search.toLowerCase()) && !p.email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, search]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const sorted = [...filtered].sort((a, b) => {
    const aVal = String((a as unknown as Record<string, unknown>)[sortKey] ?? '');
    const bVal = String((b as unknown as Record<string, unknown>)[sortKey] ?? '');
    const cmp = aVal.localeCompare(bVal, 'es');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const totalActive = data.filter((p) => p.status === 'active').length;
  const totalInactive = data.filter((p) => p.status === 'inactive').length;

  const allIdsOnPage = useMemo(() => new Set(paginated.map((p) => p.id)), [paginated]);
  const allPageSelected = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));
  const somePageSelected = paginated.some((p) => selectedIds.has(p.id));

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

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    setData((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, status } : p))
    );
    showToast(`${selectedIds.size} tutores actualizados a ${status === 'active' ? 'Activo' : 'Inactivo'}`, 'success');
    clearSelection();
  };

  const handleBulkDelete = () => {
    setIsBulkDeleting(true);
    setTimeout(() => {
      setData((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      showToast(`${selectedIds.size} tutores eliminados correctamente`, 'success');
      clearSelection();
      setIsBulkDeleting(false);
    }, 400);
  };

  const handleAdd = () => {
    setEditingParent(null);
    setFormOpen(true);
  };

  const handleEdit = async (parent: Parent) => {
    if (isGuid(parent.id)) {
      const linked = await parentsApi.listParentStudents(parent.id);
      if (linked.success && linked.data) {
        setEditingParent({
          ...parent,
          childrenIds: linked.data.map((s) => s.id),
          childrenNames: linked.data.map((s) => s.fullName),
          childrenCount: linked.data.length,
        });
      } else {
        setEditingParent(parent);
      }
    } else {
      setEditingParent(parent);
    }
    setFormOpen(true);
  };

  const handleDelete = (parent: Parent) => {
    setDeleteTarget(parent);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await parentsApi.deleteParent(deleteTarget.id);
    if (res.success || parentsQuery.isFallback) {
      setData((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast(`Tutor "${deleteTarget.fullName}" eliminado correctamente`, 'success');
      invalidate();
    } else {
      showToast(res.message || 'No se pudo eliminar', 'error');
    }
    setDeleteTarget(null);
    setIsDeleting(false);
  };

  const handleSave = async (formData: ParentFormData) => {
    setSaving(true);
    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      occupation: formData.occupation.trim(),
      address: formData.address.trim(),
      status: formData.status as Parent['status'],
    };
    try {
      let parentId = editingParent?.id;
      if (editingParent) {
        const res = await parentsApi.updateParent(editingParent.id, payload);
        if (!res.success) {
          showToast(res.message || 'No se pudo actualizar', 'error');
          return;
        }
      } else {
        const res = await parentsApi.createParent({
          ...payload,
          childrenCount: 0,
          childrenIds: [],
          childrenNames: [],
          createdAt: new Date().toISOString().split('T')[0],
        });
        if (!res.success || !res.data) {
          showToast(res.message || 'No se pudo crear', 'error');
          return;
        }
        parentId = res.data.id;
      }

      if (parentId) {
        const currentIds = new Set((editingParent?.childrenIds ?? []).filter(Boolean));
        const nextIds = new Set(formData.linkedStudentIds.filter(Boolean));
        for (const studentId of nextIds) {
          if (!currentIds.has(studentId)) {
            const linkRes = await parentsApi.linkStudent(parentId, studentId);
            if (!linkRes.success) {
              showToast(linkRes.message || 'Tutor guardado, pero un vínculo falló', 'error');
            }
          }
        }
        if (editingParent) {
          for (const studentId of currentIds) {
            if (!nextIds.has(studentId)) {
              await parentsApi.unlinkStudent(parentId, studentId);
            }
          }
        }
      }

      showToast(
        `Tutor "${payload.fullName}" ${editingParent ? 'actualizado' : 'registrado'} correctamente`,
        'success'
      );
      invalidate();
      setFormOpen(false);
      setEditingParent(null);
    } catch {
      showToast('Error de red al guardar tutor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = selectedIds.size;

  const columns: Column<Parent>[] = [
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
        <div
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => toggleSelectOne(row.id)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
              selectedIds.has(row.id) ? 'bg-primary-500 border-primary-500' : 'border-secondary-300 hover:border-secondary-400'
            }`}
          >
            {selectedIds.has(row.id) && <i className="ri-check-line text-white text-3xs" />}
          </div>
        </div>
      ),
    },
    {
      key: 'fullName',
      header: 'Tutor',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-600">
              {row.firstName[0]}{row.lastName[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground-800 truncate">{row.fullName}</p>
            <p className="text-2xs text-foreground-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'occupation',
      header: 'Ocupación',
      sortable: true,
      width: '160px',
      render: (row) => (
        <span className="text-sm text-foreground-700">{row.occupation}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      width: '150px',
      render: (row) => (
        <span className="text-sm text-foreground-600">{row.phone}</span>
      ),
    },
    {
      key: 'childrenCount',
      header: 'Hijos',
      sortable: true,
      width: '70px',
      align: 'center',
      render: (row) => (
        <span className="text-sm font-medium text-foreground-800">{row.childrenCount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      width: '100px',
      align: 'center',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'} size="sm">
          {row.status === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Registro',
      sortable: true,
      width: '110px',
      render: (row) => (
        <span className="text-sm text-foreground-600">{row.createdAt}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '110px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/padres/${row.id}`); }}
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
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

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Padres / Tutores</h1>
            <p className="text-sm text-foreground-500 mt-0.5">Gestión de padres y tutores vinculados a alumnos</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon="ri-download-line" onClick={() => exportToCSV(filtered)}>
              Exportar CSV
            </Button>
            <Button variant="primary" size="sm" icon="ri-user-add-line" onClick={handleAdd}>
              Nuevo Tutor
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <Card padding="sm" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <i className="ri-user-heart-line text-primary-500" />
            </div>
            <div className="min-w-0">
              <p className="text-3xs text-foreground-500 font-medium uppercase tracking-wider">Total</p>
              <p className="text-base font-bold text-foreground-900">{data.length}</p>
            </div>
          </Card>
          <Card padding="sm" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <i className="ri-check-line text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-3xs text-foreground-500 font-medium uppercase tracking-wider">Activos</p>
              <p className="text-base font-bold text-foreground-900">{totalActive}</p>
            </div>
          </Card>
          <Card padding="sm" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0">
              <i className="ri-user-unfollow-line text-secondary-500" />
            </div>
            <div className="min-w-0">
              <p className="text-3xs text-foreground-500 font-medium uppercase tracking-wider">Inactivos</p>
              <p className="text-base font-bold text-foreground-900">{totalInactive}</p>
            </div>
          </Card>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-72">
          <Input
            icon="ri-search-line"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {selectedCount > 0 && (
          <div className="mb-3 p-3 bg-primary-50 border border-primary-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-sm font-medium text-primary-800">
              {selectedCount} tutor{selectedCount !== 1 ? 'es' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="ghost" size="sm" onClick={clearSelection}>Cancelar</Button>
              <Button variant="outline" size="sm" icon="ri-check-line" onClick={() => handleBulkStatusChange('active')}>
                Activar
              </Button>
              <Button variant="outline" size="sm" icon="ri-close-line" onClick={() => handleBulkStatusChange('inactive')}>
                Desactivar
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

        {filtered.length === 0 && search ? (
          <EmptyState
            icon="ri-user-search-line"
            title="Sin resultados"
            description={`No se encontraron tutores que coincidan con "${search}".`}
            action={
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setCurrentPage(1); }}>
                Limpiar búsqueda
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
              onRowClick={(row) => navigate(`/padres/${row.id}`)}
              emptyMessage="No hay tutores registrados"
            />
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={sorted.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              className="mt-4"
            />
          </>
        )}

        <ParentFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingParent(null); }}
          onSave={(data) => void handleSave(data)}
          parent={editingParent}
          saving={saving}
        />

        <DeleteConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Eliminar Tutor"
          message="¿Estás seguro de que deseas eliminar a este tutor? Esta acción no se puede deshacer."
          itemName={deleteTarget?.fullName}
          loading={isDeleting}
        />
      </div>
    </MainLayout>
  );
}