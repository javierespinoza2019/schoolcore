import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MainLayout from '@/components/feature/MainLayout';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import Badge from '@/components/base/Badge';
import Modal from '@/components/base/Modal';
import EmptyState from '@/components/base/EmptyState';
import SucursalFormModal from '@/pages/sucursales/components/SucursalFormModal';
import type { SucursalFormData } from '@/pages/sucursales/components/SucursalFormModal';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useToast } from '@/components/base/Toast';
import TeacherAvatar from '@/components/feature/TeacherAvatar';
import { Sucursal } from '@/mocks/sucursales';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as branchesApi from '@/api/branchesApi';
import { isGuid } from '@/api/helpers';

function getEstadoBadge(estado: string) {
  switch (estado) {
    case 'Operando': return <Badge variant="success" size="sm">{estado}</Badge>;
    case 'Mantenimiento': return <Badge variant="warning" size="sm">{estado}</Badge>;
    case 'Próxima Apertura': return <Badge variant="info" size="sm">{estado}</Badge>;
    default: return <Badge variant="default" size="sm">{estado}</Badge>;
  }
}

function getOcupacionPct(inscritos: number, capacidad: number) {
  return Math.round((inscritos / capacidad) * 100);
}

function exportToCSV(dataToExport: Sucursal[]) {
  const headers = [
    'Nombre', 'Ciudad', 'Estado', 'Dirección', 'CP', 'Teléfono', 'Email',
    'Director', 'Director Email', 'Director Teléfono',
    'Capacidad', 'Inscritos', 'Profesores', 'Salones',
    'Niveles', 'Estado Operativo', 'Apertura', 'Superficie',
  ];
  const rows = dataToExport.map((s) => [
    s.nombre,
    s.ciudad,
    s.estado,
    s.direccion,
    s.codigoPostal,
    s.telefono,
    s.email,
    s.director,
    s.directorEmail,
    s.directorTelefono,
    String(s.capacidadTotal),
    String(s.alumnosInscritos),
    String(s.profesoresActivos),
    String(s.salones),
    s.niveles.join('; '),
    s.estadoOperativo,
    s.fechaApertura,
    s.superficie,
  ]);
  const csvContent = [headers, ...rows].map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sucursales_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Sucursales() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [data, setData] = useState<Sucursal[]>([]);
  const branchesQ = useApiResource({
    queryKey: queryKeys.branches.list(),
    queryFn: () => branchesApi.listBranches({ pageSize: 100 }),
    errorToast: 'Error al cargar sucursales',
  });
  useEffect(() => {
    if (branchesQ.data) setData(branchesQ.data);
  }, [branchesQ.data]);

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sucursal | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let filteredData = [...data];
    if (search) {
      const s = search.toLowerCase();
      filteredData = filteredData.filter(
        (r) =>
          r.nombre.toLowerCase().includes(s) ||
          r.ciudad.toLowerCase().includes(s) ||
          r.director.toLowerCase().includes(s)
      );
    }
    if (estadoFilter) filteredData = filteredData.filter((r) => r.estadoOperativo === estadoFilter);
    return filteredData;
  }, [data, search, estadoFilter]);

  const kpis = useMemo(() => ({
    total: data.length,
    operando: data.filter((s) => s.estadoOperativo === 'Operando').length,
    totalAlumnos: data.reduce((acc, s) => acc + s.alumnosInscritos, 0),
    capacidadTotal: data.reduce((acc, s) => acc + s.capacidadTotal, 0),
    totalProfesores: data.reduce((acc, s) => acc + s.profesoresActivos, 0),
  }), [data]);

  const clearFilters = () => {
    setSearch('');
    setEstadoFilter('');
  };

  const hasFilters = search || estadoFilter;

  const handleAdd = () => {
    setEditingSucursal(null);
    setFormOpen(true);
  };

  const handleEdit = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal);
    setFormOpen(true);
  };

  const handleDelete = (sucursal: Sucursal) => {
    setDeleteTarget(sucursal);
  };

  const invalidateBranches = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await branchesApi.deleteBranch(deleteTarget.id);
    setDeleteLoading(false);
    if (!res.success) {
      showToast(res.message || 'No se pudo eliminar la sucursal', 'error');
      return;
    }
    showToast(`Sucursal "${deleteTarget.nombre}" eliminada`, 'success');
    setDeleteTarget(null);
    invalidateBranches();
  };

  const handleSave = async (formData: SucursalFormData) => {
    setSaving(true);
    const payload: Partial<Sucursal> = {
      code: editingSucursal?.code,
      nombre: formData.nombre.trim(),
      direccion: formData.direccion.trim(),
      ciudad: formData.ciudad.trim(),
      estado: formData.estado.trim(),
      codigoPostal: formData.codigoPostal.trim(),
      telefono: formData.telefono.trim(),
      email: formData.email.trim(),
      director: formData.director.trim(),
      directorEmail: formData.directorEmail.trim(),
      directorTelefono: formData.directorTelefono.trim(),
      capacidadTotal: Number(formData.capacidadTotal) || 0,
      niveles: formData.niveles.split(',').map((s) => s.trim()).filter(Boolean),
      fechaApertura: formData.fechaApertura,
      superficie: formData.superficie.trim(),
      estadoOperativo: formData.estadoOperativo as Sucursal['estadoOperativo'],
      timeZoneId: formData.timeZoneId,
      fotoUrl: formData.photoRemoved ? '' : editingSucursal?.fotoUrl || '',
    };
    try {
      const res = editingSucursal
        ? await branchesApi.updateBranch(editingSucursal.id, payload)
        : await branchesApi.createBranch(payload);
      if (!res.success || !res.data) {
        showToast(res.message || 'No se pudo guardar la sucursal', 'error');
        return;
      }
      if (formData.photoFile && isGuid(String(res.data.id))) {
        const up = await branchesApi.uploadBranchPhoto(String(res.data.id), formData.photoFile);
        if (!up.success || !up.data) {
          showToast(up.message || 'Sucursal guardada, pero la imagen no se pudo subir', 'error');
          setFormOpen(false);
          setEditingSucursal(null);
          invalidateBranches();
          return;
        }
        const withPhoto = await branchesApi.updateBranch(res.data.id, { ...payload, fotoUrl: up.data });
        if (!withPhoto.success) {
          showToast(withPhoto.message || 'La imagen se subió pero no se vinculó a la sucursal', 'error');
          invalidateBranches();
          return;
        }
      }
      showToast(
        editingSucursal
          ? `Sucursal "${formData.nombre}" actualizada`
          : `Sucursal "${formData.nombre}" registrada`,
        'success'
      );
      setFormOpen(false);
      setEditingSucursal(null);
      invalidateBranches();
    } catch {
      showToast('Error de red al guardar la sucursal', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-lg font-bold text-foreground-900 tracking-tight">Sucursales</h1>
            <p className="text-sm text-foreground-500 mt-0.5">Gestión de campus y planteles educativos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm" icon="ri-download-line"
              onClick={() => { exportToCSV(filtered); showToast(`${filtered.length} sucursales exportadas a CSV`, 'success'); }}
            >
              Exportar
            </Button>
            <Button variant="primary" size="sm" icon="ri-add-line" onClick={handleAdd}>Nueva Sucursal</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Total Campus</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{kpis.total}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Operando</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">{kpis.operando}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Alumnos Totales</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{kpis.totalAlumnos.toLocaleString()}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Capacidad Total</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{kpis.capacidadTotal.toLocaleString()}</div>
          </Card>
          <Card padding="sm">
            <div className="text-2xs text-foreground-500 font-medium uppercase tracking-wider">Profesores</div>
            <div className="text-lg font-bold text-foreground-900 mt-0.5">{kpis.totalProfesores}</div>
          </Card>
        </div>

        <Card padding="sm" className="mb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Input
              icon="ri-search-line"
              placeholder="Buscar sucursal, ciudad o director..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
            <Select
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'Operando', label: 'Operando' },
                { value: 'Mantenimiento', label: 'Mantenimiento' },
                { value: 'Próxima Apertura', label: 'Próxima Apertura' },
              ]}
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full sm:w-44"
            />
            {hasFilters && (
              <Button variant="ghost" size="sm" icon="ri-close-line" onClick={clearFilters}>Limpiar</Button>
            )}
          </div>
        </Card>

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((suc) => {
              const ocupPct = getOcupacionPct(suc.alumnosInscritos, suc.capacidadTotal);
              return (
                <Card key={suc.id} padding="none" hover className="overflow-hidden">
                  <div className="relative h-44 overflow-hidden">
                    {suc.fotoUrl ? (
                      <TeacherAvatar
                        src={suc.fotoUrl}
                        alt={suc.nombre}
                        filenameHint="branch-photo"
                        emptyIcon="ri-building-4-line text-4xl"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary-200 text-foreground-400">
                        <i className="ri-building-4-line text-4xl" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white drop-shadow-sm">{suc.nombre}</h3>
                        {getEstadoBadge(suc.estadoOperativo)}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-sm text-foreground-500 mb-3">
                      <i className="ri-map-pin-line text-sm" />
                      <span className="truncate">{suc.direccion}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-2xs text-foreground-500 uppercase tracking-wider">Alumnos</p>
                        <p className="text-sm font-semibold text-foreground-800">{suc.alumnosInscritos.toLocaleString()} / {suc.capacidadTotal.toLocaleString()}</p>
                        <div className="w-full h-1.5 bg-secondary-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ocupPct > 90 ? 'bg-red-400' : ocupPct > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${ocupPct}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-2xs text-foreground-500 uppercase tracking-wider">Profesores</p>
                        <p className="text-sm font-semibold text-foreground-800">{suc.profesoresActivos}</p>
                        <p className="text-2xs text-foreground-500 uppercase tracking-wider mt-1">Salones</p>
                        <p className="text-sm font-semibold text-foreground-800">{suc.salones}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-foreground-500 mb-3">
                      <i className="ri-user-star-line text-sm" />
                      <span className="truncate">{suc.director}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {suc.niveles.map((n) => (
                        <span key={n} className="text-xs px-2 py-0.5 bg-accent-100 text-accent-700 rounded-full font-medium">{n}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedSucursal(suc)}
                      >
                        Ver Detalle
                      </Button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(suc); }}
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-secondary-200 text-foreground-500 hover:text-foreground-700 hover:bg-secondary-50 transition-colors cursor-pointer flex-shrink-0"
                        title="Editar"
                      >
                        <i className="ri-pencil-line text-sm" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(suc); }}
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-secondary-200 text-foreground-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer flex-shrink-0"
                        title="Eliminar"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <EmptyState
            icon="ri-store-2-line"
            title={hasFilters ? 'Sin resultados' : 'No hay sucursales registradas'}
            description={hasFilters ? 'No hay sucursales que coincidan con los filtros aplicados. Intenta ajustar los criterios de búsqueda.' : 'Aún no se ha registrado ninguna sucursal. Crea la primera para comenzar.'}
            action={
              hasFilters ? (
                <Button variant="outline" size="sm" icon="ri-close-line" onClick={clearFilters}>
                  Limpiar todos los filtros
                </Button>
              ) : (
                <Button variant="primary" size="sm" icon="ri-add-line" onClick={handleAdd}>
                  Nueva Sucursal
                </Button>
              )
            }
          />
        )}

        <Modal
          open={!!selectedSucursal}
          onClose={() => setSelectedSucursal(null)}
          title={selectedSucursal?.nombre}
          subtitle={`${selectedSucursal?.ciudad}, ${selectedSucursal?.estado}`}
          size="lg"
          footer={
            <div className="flex items-center gap-2">
              {selectedSucursal && (
                <Button variant="outline" size="sm" icon="ri-pencil-line" onClick={() => { handleEdit(selectedSucursal); setSelectedSucursal(null); }}>
                  Editar
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedSucursal(null)}>Cerrar</Button>
            </div>
          }
        >
          {selectedSucursal && (
            <div className="space-y-5">
              <div className="rounded-lg overflow-hidden border border-secondary-200">
                <iframe
                  title={`Mapa de ${selectedSucursal.nombre}`}
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDIVkGgkTqOHzvG5IvRSCYPBQqx_2mR5Js&q=${selectedSucursal.lat},${selectedSucursal.lng}&zoom=15`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card padding="md">
                  <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
                    <i className="ri-information-line text-base" />
                    Datos Generales
                  </h4>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-2xs text-foreground-500 uppercase tracking-wider">Dirección</p>
                      <p className="text-sm text-foreground-800">{selectedSucursal.direccion}</p>
                      <p className="text-xs text-foreground-500">{selectedSucursal.ciudad}, {selectedSucursal.estado} CP {selectedSucursal.codigoPostal}</p>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-2xs text-foreground-500 uppercase tracking-wider">Teléfono</p>
                        <p className="text-sm text-foreground-800">{selectedSucursal.telefono}</p>
                      </div>
                      <div>
                        <p className="text-2xs text-foreground-500 uppercase tracking-wider">Email</p>
                        <p className="text-sm text-foreground-800">{selectedSucursal.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-2xs text-foreground-500 uppercase tracking-wider">Apertura</p>
                        <p className="text-sm text-foreground-800">{new Date(selectedSucursal.fechaApertura).toLocaleDateString('es-MX', { dateStyle: 'long' })}</p>
                      </div>
                      <div>
                        <p className="text-2xs text-foreground-500 uppercase tracking-wider">Superficie</p>
                        <p className="text-sm text-foreground-800">{selectedSucursal.superficie}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card padding="md">
                  <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
                    <i className="ri-user-star-line text-base" />
                    Director
                  </h4>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-2xs text-foreground-500 uppercase tracking-wider">Nombre</p>
                      <p className="text-sm font-semibold text-foreground-800">{selectedSucursal.director}</p>
                    </div>
                    <div>
                      <p className="text-2xs text-foreground-500 uppercase tracking-wider">Email</p>
                      <p className="text-sm text-foreground-800">{selectedSucursal.directorEmail}</p>
                    </div>
                    <div>
                      <p className="text-2xs text-foreground-500 uppercase tracking-wider">Teléfono</p>
                      <p className="text-sm text-foreground-800">{selectedSucursal.directorTelefono}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card padding="sm" className="text-center">
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Capacidad</p>
                  <p className="text-lg font-bold text-foreground-900">{selectedSucursal.capacidadTotal.toLocaleString()}</p>
                </Card>
                <Card padding="sm" className="text-center">
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Inscritos</p>
                  <p className="text-lg font-bold text-foreground-900">{selectedSucursal.alumnosInscritos.toLocaleString()}</p>
                </Card>
                <Card padding="sm" className="text-center">
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Profesores</p>
                  <p className="text-lg font-bold text-foreground-900">{selectedSucursal.profesoresActivos}</p>
                </Card>
                <Card padding="sm" className="text-center">
                  <p className="text-2xs text-foreground-500 uppercase tracking-wider">Salones</p>
                  <p className="text-lg font-bold text-foreground-900">{selectedSucursal.salones}</p>
                </Card>
              </div>

              <Card padding="md">
                <h4 className="text-sm font-semibold text-foreground-800 mb-3 flex items-center gap-2">
                  <i className="ri-building-4-line text-base" />
                  Instalaciones
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSucursal.instalaciones.map((inst) => (
                    <span key={inst} className="text-sm px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-md font-medium">{inst}</span>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </Modal>

        <SucursalFormModal
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditingSucursal(null); }}
          onSave={handleSave}
          sucursal={editingSucursal}
          saving={saving}
        />

        <DeleteConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Eliminar Sucursal"
          message="¿Estás seguro de que deseas eliminar esta sucursal? Todos los datos asociados se perderán. Esta acción no se puede deshacer."
          itemName={deleteTarget?.nombre}
          loading={deleteLoading}
        />
      </div>
    </MainLayout>
  );
}