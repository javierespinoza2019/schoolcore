import { useState, useMemo, useEffect } from 'react';
import Card from '@/components/base/Card';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import Select from '@/components/base/Select';
import DeleteConfirmModal from '@/components/base/DeleteConfirmModal';
import { useToast } from '@/components/base/Toast';
import { rolesPermisos } from '@/mocks/configuracion';
import type { UsuarioSistema } from '@/mocks/usuarios';
import { useApiResource } from '@/hooks/useApiResource';
import { queryKeys } from '@/api/queryKeys';
import * as settingsApi from '@/api/settingsApi';
import { useQueryClient } from '@tanstack/react-query';
import { useSchoolContext } from '@/context/SchoolContext';
import { FieldLimits, validateEmail, validatePassword } from '@/lib/validation/fields';
import { afterValidationErrors } from '@/lib/ui/scrollToFirstError';

/** Roles que pueden iniciar sesión en el portal staff (MVP). */
const MVP_LOGIN_ROLE_CODES = new Set([
  'SuperAdmin',
  'Director',
  'Coordinator',
  'Cashier',
  'Accountant',
  'Receptionist',
]);

/** Select value = Role.Code (SP SetRoles hace JOIN por Code, no por Id). */
function roleSelectValue(r: { id: string; code?: string; nombre: string }): string {
  return (r.code && r.code.trim()) || r.id;
}

function getInitials(nombre: string): string {
  const parts = (nombre || '').split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase() || '?';
}

function formatLastAccess(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return 'Hace unos minutos';
  if (diffH < 24) return `Hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Hace ${diffD} día${diffD > 1 ? 's' : ''}`;
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [roleOptions, setRoleOptions] = useState(rolesPermisos);
  const { branchId } = useSchoolContext();
  const usersQ = useApiResource({
    queryKey: queryKeys.settings.users(),
    queryFn: () => settingsApi.listUsers(),
    errorToast: 'Error al cargar usuarios',
  });
  const rolesQ = useApiResource({
    queryKey: ['settings', 'roles'],
    queryFn: () => settingsApi.listRoles(),
  });

  useEffect(() => {
    if (usersQ.data) setUsuarios(usersQ.data);
  }, [usersQ.data]);

  useEffect(() => {
    if (!rolesQ.data?.length) return;
    const loginRoles = rolesQ.data.filter((r) => MVP_LOGIN_ROLE_CODES.has(roleSelectValue(r)));
    setRoleOptions(loginRoles.length ? loginRoles : rolesQ.data);
  }, [rolesQ.data]);

  const queryClient = useQueryClient();
  const invalidateUsers = () => void queryClient.invalidateQueries({ queryKey: queryKeys.settings.users() });
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioSistema | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UsuarioSistema | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRolId, setFormRolId] = useState('');
  const [formSucursal, setFormSucursal] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return usuarios.filter((u) => {
      const q = search.toLowerCase();
      const nombre = (u.nombre || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const matchSearch = !q || nombre.includes(q) || email.includes(q);
      const matchRol = !rolFilter || u.rolId === rolFilter;
      const matchEstado = !estadoFilter || (estadoFilter === 'activo' ? u.activo : !u.activo);
      return matchSearch && matchRol && matchEstado;
    });
  }, [usuarios, search, rolFilter, estadoFilter]);

  const resetForm = () => {
    setFormNombre('');
    setFormEmail('');
    setFormRolId('');
    setFormSucursal('');
    setFormPassword('');
    setFormErrors({});
    setEditingUser(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (u: UsuarioSistema) => {
    setEditingUser(u);
    setFormNombre(u.nombre);
    setFormEmail(u.email);
    setFormRolId(u.rolId);
    setFormSucursal(u.sucursal);
    setFormPassword('');
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (saving) return;
    const errs: Record<string, string> = {};
    if (!formNombre.trim()) errs.nombre = 'Ingresa el nombre completo';
    const emailErr = validateEmail(formEmail, true);
    if (emailErr) errs.email = emailErr;
    if (!formRolId) errs.rol = 'Selecciona un rol';
    if (!editingUser) {
      const pwdErr = validatePassword(formPassword);
      if (pwdErr) errs.password = pwdErr;
    }
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      afterValidationErrors(errs);
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const res = await settingsApi.updateUser(editingUser.id, {
          nombre: formNombre.trim(),
          email: formEmail.trim(),
          rolId: formRolId,
          roleCodes: [formRolId],
          activo: editingUser.activo,
          branchIds: branchId ? [branchId] : undefined,
        });
        if (!res.success) {
          showToast(res.message || res.errors?.[0] || 'No se pudo actualizar el usuario', 'error');
          return;
        }
        showToast('Usuario actualizado correctamente', 'success');
      } else {
        const res = await settingsApi.createUser({
          nombre: formNombre.trim(),
          email: formEmail.trim(),
          password: formPassword,
          rolId: formRolId,
          roleCodes: [formRolId],
          activo: true,
          branchIds: branchId ? [branchId] : [],
        });
        if (!res.success) {
          showToast(res.message || res.errors?.[0] || 'No se pudo crear el usuario', 'error');
          return;
        }
        showToast('Usuario creado. Ya puede iniciar sesión con ese correo y contraseña.', 'success');
      }
      invalidateUsers();
      setModalOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await settingsApi.deleteUser(deleteTarget.id);
      if (!res.success) {
        showToast(res.message || 'No se pudo eliminar', 'error');
        return;
      }
      showToast(`Usuario "${deleteTarget.nombre}" eliminado`, 'success');
      setDeleteTarget(null);
      invalidateUsers();
    } finally {
      setDeleting(false);
    }
  };

  const toggleUsuario = async (id: string) => {
    const u = usuarios.find((x) => x.id === id);
    if (!u) return;
    const res = await settingsApi.updateUser(id, {
      nombre: u.nombre,
      email: u.email,
      rolId: u.rolId,
      roleCodes: u.rolId ? [u.rolId] : [],
      activo: !u.activo,
    });
    if (!res.success) {
      showToast(res.message || 'No se pudo cambiar el estado', 'error');
      return;
    }
    showToast(`Usuario ${u.activo ? 'desactivado' : 'activado'} correctamente`, 'success');
    invalidateUsers();
  };

  return (
    <>
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground-900">Usuarios del Sistema</h3>
            <p className="text-xs text-foreground-500 mt-0.5">{filtered.length} de {usuarios.length} usuarios</p>
          </div>
          <Button variant="primary" size="sm" icon="ri-user-add-line" onClick={openCreate} className="whitespace-nowrap">Nuevo Usuario</Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-secondary-200/70 bg-background-50 text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 cursor-pointer">
                <i className="ri-close-line text-sm" />
              </button>
            )}
          </div>
          <Select
            options={[{ value: '', label: 'Todos los roles' }, ...roleOptions.map((r) => ({ value: roleSelectValue(r), label: r.nombre }))]}
            value={rolFilter}
            onChange={(e) => setRolFilter(e.target.value)}
            className="w-full sm:w-44"
          />
          <Select
            options={[{ value: '', label: 'Todos los estados' }, { value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }]}
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary-100 flex items-center justify-center mb-3">
              <i className="ri-user-search-line text-2xl text-foreground-400" />
            </div>
            <p className="text-sm font-medium text-foreground-700 mb-1">Sin resultados</p>
            <p className="text-xs text-foreground-500 mb-4">No se encontraron usuarios con esos filtros</p>
            <Button variant="outline" size="sm" icon="ri-filter-off-line" onClick={() => { setSearch(''); setRolFilter(''); setEstadoFilter(''); }}>Limpiar filtros</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full responsive-table">
              <thead>
                <tr className="border-b border-secondary-200/70">
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Usuario</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Email</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-left" scope="col">Rol</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-center hidden sm:table-cell" scope="col">Sucursal</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-center" scope="col">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right hidden md:table-cell" scope="col">Último Acceso</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 text-right" scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-secondary-100/70 last:border-0">
                    <td className="px-4 py-3" data-label="Usuario">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">{getInitials(u.nombre)}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground-800">{u.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-600" data-label="Email">{u.email}</td>
                    <td className="px-4 py-3" data-label="Rol">
                      <Badge variant={u.rolId === 'SuperAdmin' ? 'primary' : u.rolId === 'Director' ? 'accent' : 'default'} size="sm">{u.rol}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-600 text-center hidden sm:table-cell" data-label="Sucursal">{u.sucursal}</td>
                    <td className="px-4 py-3 text-center" data-label="Estado">
                      <button onClick={() => void toggleUsuario(u.id)} className="cursor-pointer">
                        <Badge variant={u.activo ? 'success' : 'default'} size="sm">{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground-500 text-right hidden md:table-cell" data-label="Último Acceso">{formatLastAccess(u.ultimoAcceso)}</td>
                    <td className="px-4 py-3 text-right" data-label="Acciones">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="xs" icon="ri-pencil-line" onClick={() => openEdit(u)} aria-label={`Editar ${u.nombre}`} />
                        <Button variant="ghost" size="xs" icon="ri-delete-bin-line" onClick={() => setDeleteTarget(u)} aria-label={`Eliminar ${u.nombre}`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        subtitle={editingUser ? `Editando: ${editingUser.nombre}` : 'Se guarda en el servidor (puede iniciar sesión de inmediato)'}
        size="md"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setModalOpen(false); resetForm(); }}>Cancelar</Button>
            <Button variant="primary" size="sm" icon={saving ? undefined : 'ri-check-line'} onClick={() => void handleSave()} disabled={saving} loading={saving}>
              {saving ? 'Guardando...' : editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Nombre Completo" required maxLength={FieldLimits.name} value={formNombre} onChange={(e) => { setFormNombre(e.target.value); if (formErrors.nombre) setFormErrors((p) => { const n = { ...p }; delete n.nombre; return n; }); }} error={formErrors.nombre} placeholder="Ej. Ana García López" />
          <Input label="Correo Electrónico" required type="email" maxLength={FieldLimits.email} value={formEmail} onChange={(e) => { setFormEmail(e.target.value); if (formErrors.email) setFormErrors((p) => { const n = { ...p }; delete n.email; return n; }); }} error={formErrors.email} placeholder="usuario@colegio.edu.mx" />
          <Select
            label="Rol"
            required
            options={[{ value: '', label: 'Seleccionar rol...' }, ...roleOptions.map((r) => ({ value: roleSelectValue(r), label: r.nombre }))]}
            value={formRolId}
            onChange={(e) => { setFormRolId(e.target.value); if (formErrors.rol) setFormErrors((p) => { const n = { ...p }; delete n.rol; return n; }); }}
            error={formErrors.rol}
          />
          <Input label="Sucursal" value={formSucursal} onChange={(e) => setFormSucursal(e.target.value)} placeholder="Se asigna la sucursal activa del contexto" disabled hint={branchId ? 'Se vinculará a la sucursal activa' : 'Sin sucursal activa en el contexto'} />
          {!editingUser && (
            <Input
              label="Contraseña Temporal"
              required
              type="password"
              maxLength={FieldLimits.password}
              value={formPassword}
              onChange={(e) => { setFormPassword(e.target.value); if (formErrors.password) setFormErrors((p) => { const n = { ...p }; delete n.password; return n; }); }}
              error={formErrors.password}
              placeholder="Mínimo 8 caracteres, mayúscula, minúscula y dígito"
              hint="El usuario la usará para iniciar sesión"
            />
          )}
        </div>
      </Modal>

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Eliminar Usuario"
        message={`¿Eliminar a "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        loading={deleting}
      />
    </>
  );
}
