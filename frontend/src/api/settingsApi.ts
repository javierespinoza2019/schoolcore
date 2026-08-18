import { apiClient } from '@/api/apiClient';
import { fetchOrFallback, isGuid, unwrapList } from '@/api/helpers';
import type { ApiResponse, FetchResult, PagedResult } from '@/api/types';
import {
  conceptosPago,
  configInstitucion,
  metodosPago,
  nivelesEducativos,
  notificacionesSettings,
  rolesPermisos,
} from '@/mocks/configuracion';
import type { ConceptoPago } from '@/mocks/configuracion';
import type { UsuarioSistema } from '@/mocks/usuarios';
import { usuariosSistema } from '@/mocks/usuarios';

export type TenantSettings = typeof configInstitucion;
export type PaymentMethod = (typeof metodosPago)[number];
export type EducationLevel = (typeof nivelesEducativos)[number];
export type RoleInfo = (typeof rolesPermisos)[number] & { code?: string };
export type NotificationSetting = (typeof notificacionesSettings)[number];

export interface EmailTemplateSummary {
  id: string;
  key: string;
  name: string;
  subject: string;
  isOverride: boolean;
  culture?: string;
  htmlBody?: string;
  logoUrl?: string;
  primaryColor?: string;
}

/** GET /institution-settings — si no hay fila o API falla, form vacío editable (primer alta). */
export async function getTenantSettings(): Promise<FetchResult<TenantSettings>> {
  const empty: TenantSettings = {
    ...configInstitucion,
    nombre: '',
    nombreCompleto: '',
    rfc: '',
    telefono: '',
    email: '',
    sitioWeb: '',
    direccion: '',
    timeZoneId: 'America/Mexico_City',
  } as TenantSettings;

  try {
    const res = await apiClient<Record<string, unknown> | null>('/institution-settings');
    if (!res.success) {
      return { data: empty, source: 'api', message: res.message || 'Sin configuración de institución' };
    }
    if (!res.data) {
      return { data: empty, source: 'api', message: 'Institución sin datos; completa y guarda.' };
    }
    const d = res.data;
    return {
      data: {
        ...configInstitucion,
        nombre: String(d.displayName ?? ''),
        nombreCompleto: String(d.legalName ?? d.displayName ?? ''),
        rfc: String(d.taxId ?? ''),
        telefono: String(d.phone ?? ''),
        email: String(d.email ?? ''),
        sitioWeb: String(d.website ?? ''),
        direccion: String(d.address ?? ''),
        logo: d.logoUrl ?? configInstitucion.logo,
        timeZoneId: String(d.timeZoneId ?? 'America/Mexico_City'),
      } as TenantSettings,
      source: 'api',
    };
  } catch (err) {
    console.warn('[SchoolCore] institution-settings no disponible:', err);
    return {
      data: empty,
      source: 'api',
      message: 'No se pudo cargar institución (¿API desactualizada?). Puedes intentar guardar de nuevo tras desplegar.',
    };
  }
}

export async function updateTenantSettings(
  payload: Partial<TenantSettings> & { timeZoneId?: string }
): Promise<ApiResponse<TenantSettings>> {
  const res = await apiClient<Record<string, unknown>>('/institution-settings', {
    method: 'PUT',
    body: {
      displayName: (payload as { nombre?: string }).nombre ?? (payload as { nombreCompleto?: string }).nombreCompleto,
      legalName: (payload as { nombreCompleto?: string }).nombreCompleto,
      taxId: (payload as { rfc?: string }).rfc,
      phone: (payload as { telefono?: string }).telefono,
      email: payload.email,
      website: (payload as { sitioWeb?: string }).sitioWeb,
      address: (payload as { direccion?: string }).direccion,
      logoUrl: (payload as { logo?: string | null }).logo ?? undefined,
      primaryColor: (payload as { primaryColor?: string }).primaryColor,
      timeZoneId: payload.timeZoneId ?? 'America/Mexico_City',
    },
  });
  if (res.success) {
    const refreshed = await getTenantSettings();
    return { ...res, data: refreshed.data };
  }
  return { ...res, data: null };
}

export async function listTimeZones(): Promise<FetchResult<{ id: string; displayNameEs: string }[]>> {
  const result = await fetchOrFallback<{ id: string; displayNameEs: string }[]>(
    async () => {
      const res = await apiClient<{ id: string; displayNameEs: string; displayNameEn?: string; sortOrder?: number }[]>(
        '/timezones'
      );
      return res;
    },
    () =>
      [
        { id: 'America/Mexico_City', displayNameEs: 'Ciudad de México / Centro (UTC−6)' },
        { id: 'America/Cancun', displayNameEs: 'Cancún / Quintana Roo (UTC−5)' },
        { id: 'America/Mazatlan', displayNameEs: 'Pacífico — Mazatlán (UTC−7)' },
        { id: 'America/Chihuahua', displayNameEs: 'Chihuahua (UTC−7)' },
        { id: 'America/Hermosillo', displayNameEs: 'Hermosillo / Sonora' },
        { id: 'America/Tijuana', displayNameEs: 'Tijuana / Baja California (UTC−8)' },
      ]
  );
  const items = Array.isArray(result.data) ? result.data : [];
  return { data: items, source: result.source };
}

export async function resolveEffectiveTimeZone(branchId?: string | null): Promise<FetchResult<{
  effectiveTimeZoneId: string;
  source: string;
  tenantTimeZoneId?: string | null;
  branchTimeZoneId?: string | null;
}>> {
  const q = isGuid(branchId) ? `?branchId=${encodeURIComponent(String(branchId))}` : '';
  const result = await fetchOrFallback(
    () => apiClient(`/context/timezone${q}`),
    () => ({
      effectiveTimeZoneId: 'America/Mexico_City',
      source: 'Platform',
      tenantTimeZoneId: 'America/Mexico_City',
      branchTimeZoneId: null,
    })
  );
  return result as FetchResult<{
    effectiveTimeZoneId: string;
    source: string;
    tenantTimeZoneId?: string | null;
    branchTimeZoneId?: string | null;
  }>;
}

/** GET /payment-methods */
export async function listPaymentMethods(): Promise<FetchResult<PaymentMethod[]>> {
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient('/payment-methods?pageSize=100'),
    () => metodosPago as unknown as Record<string, unknown>[]
  );
  const items = unwrapList(result.data).map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      id: String(r.id ?? ''),
      nombre: String(r.name ?? r.nombre ?? ''),
      activo: Boolean(r.isActive ?? r.activo ?? true),
      info: String(r.info ?? r.details ?? ''),
    } satisfies PaymentMethod;
  });
  if (result.source === 'api') return { data: items, source: 'api' };
  return { data: items.length ? items : metodosPago, source: 'fallback' };
}

export async function createPaymentMethod(
  payload: Partial<PaymentMethod>
): Promise<ApiResponse<PaymentMethod>> {
  const res = await apiClient<Record<string, unknown>>('/payment-methods', {
    method: 'POST',
    body: {
      name: payload.nombre ?? '',
      info: payload.info ?? null,
      isActive: payload.activo ?? true,
      sortOrder: 0,
    },
  });
  if (res.success && res.data) {
    const r = res.data;
    return {
      ...res,
      data: {
        id: String(r.id ?? ''),
        nombre: String(r.name ?? payload.nombre ?? ''),
        activo: Boolean(r.isActive ?? true),
        info: String(r.info ?? payload.info ?? ''),
      },
    };
  }
  return { ...res, data: null };
}

export async function updatePaymentMethod(
  id: string,
  payload: Partial<PaymentMethod>
): Promise<ApiResponse<PaymentMethod>> {
  const res = await apiClient<Record<string, unknown>>(`/payment-methods/${id}`, {
    method: 'PUT',
    body: {
      name: payload.nombre ?? '',
      info: payload.info ?? null,
      isActive: payload.activo ?? true,
      sortOrder: 0,
    },
  });
  if (res.success && res.data) {
    const r = res.data;
    return {
      ...res,
      data: {
        id: String(r.id ?? id),
        nombre: String(r.name ?? payload.nombre ?? ''),
        activo: Boolean(r.isActive ?? payload.activo ?? true),
        info: String(r.info ?? payload.info ?? ''),
      },
    };
  }
  return { ...res, data: null };
}

export async function deletePaymentMethod(id: string): Promise<ApiResponse<null>> {
  return apiClient<null>(`/payment-methods/${id}`, { method: 'DELETE' });
}

/** GET /payment-concepts */
export async function listPaymentConcepts(): Promise<FetchResult<ConceptoPago[]>> {
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient('/payment-concepts'),
    () => conceptosPago as unknown as Record<string, unknown>[]
  );
  const items = unwrapList(result.data).map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      id: String(r.id ?? ''),
      nombre: String(r.name ?? r.nombre ?? ''),
      monto: Number(r.defaultAmount ?? r.monto ?? 0),
      tipo: String(r.conceptType ?? r.tipo ?? ''),
      activo: Boolean(r.isActive ?? r.activo ?? true),
      diferenciadoPorNivel: Boolean(r.differentiatedByLevel ?? r.diferenciadoPorNivel ?? false),
      montosPorNivel: Array.isArray(r.montosPorNivel)
        ? (r.montosPorNivel as ConceptoPago['montosPorNivel'])
        : Array.isArray(r.amounts)
          ? (r.amounts as Record<string, unknown>[]).map((a) => ({
              nivelId: String(a.educationLevelId ?? a.nivelId ?? ''),
              nivelNombre: String(a.educationLevelName ?? a.nivelNombre ?? ''),
              monto: Number(a.amount ?? a.monto ?? 0),
            }))
          : [],
    } satisfies ConceptoPago;
  });
  if (result.source === 'api') return { data: items, source: 'api' };
  return { data: items.length ? items : conceptosPago, source: 'fallback' };
}

export async function createPaymentConcept(
  payload: Partial<ConceptoPago>
): Promise<ApiResponse<ConceptoPago>> {
  const res = await apiClient<Record<string, unknown>>('/payment-concepts', {
    method: 'POST',
    body: {
      name: payload.nombre ?? '',
      conceptType: payload.tipo ?? 'mensual',
      defaultAmount: payload.monto ?? 0,
      differentiatedByLevel: payload.diferenciadoPorNivel ?? false,
      isActive: payload.activo ?? true,
    },
  });
  if (res.success && res.data) {
    const r = res.data;
    return {
      ...res,
      data: {
        id: String(r.id ?? ''),
        nombre: String(r.name ?? payload.nombre ?? ''),
        monto: Number(r.defaultAmount ?? payload.monto ?? 0),
        tipo: String(r.conceptType ?? payload.tipo ?? ''),
        activo: Boolean(r.isActive ?? true),
        diferenciadoPorNivel: Boolean(r.differentiatedByLevel ?? false),
        montosPorNivel: payload.montosPorNivel ?? [],
      },
    };
  }
  return { ...res, data: null };
}

export async function updatePaymentConcept(
  id: string,
  payload: Partial<ConceptoPago>
): Promise<ApiResponse<ConceptoPago>> {
  const res = await apiClient<Record<string, unknown>>(`/payment-concepts/${id}`, {
    method: 'PUT',
    body: {
      name: payload.nombre ?? '',
      conceptType: payload.tipo ?? 'mensual',
      defaultAmount: payload.monto ?? 0,
      differentiatedByLevel: payload.diferenciadoPorNivel ?? false,
      isActive: payload.activo ?? true,
    },
  });
  if (res.success && res.data) {
    const r = res.data;
    return {
      ...res,
      data: {
        id: String(r.id ?? id),
        nombre: String(r.name ?? payload.nombre ?? ''),
        monto: Number(r.defaultAmount ?? payload.monto ?? 0),
        tipo: String(r.conceptType ?? payload.tipo ?? ''),
        activo: Boolean(r.isActive ?? payload.activo ?? true),
        diferenciadoPorNivel: Boolean(r.differentiatedByLevel ?? payload.diferenciadoPorNivel ?? false),
        montosPorNivel: payload.montosPorNivel ?? [],
      },
    };
  }
  return { ...res, data: null };
}

export async function setPaymentConceptAmounts(
  id: string,
  amounts: { educationLevelId: string; amount: number }[]
): Promise<ApiResponse<null>> {
  return apiClient<null>(`/payment-concepts/${id}/amounts`, {
    method: 'PUT',
    body: {
      amounts: amounts.map((a) => ({
        educationLevelId: a.educationLevelId,
        amount: a.amount,
      })),
    },
  });
}

export async function deletePaymentConcept(id: string): Promise<ApiResponse<null>> {
  return apiClient<null>(`/payment-concepts/${id}`, { method: 'DELETE' });
}

function normalizeEducationLevel(raw: Record<string, unknown>): EducationLevel {
  return {
    id: String(raw.id ?? ''),
    nombre: String(raw.name ?? raw.nombre ?? ''),
    grados: Number(raw.gradeCount ?? raw.grados ?? 0),
    activo: Boolean(raw.isActive ?? raw.activo ?? true),
  };
}

/** GET /education-levels */
export async function listEducationLevels(): Promise<FetchResult<EducationLevel[]>> {
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient('/education-levels?pageSize=100'),
    () => nivelesEducativos as unknown as Record<string, unknown>[]
  );
  const items = unwrapList(result.data).map((x) =>
    normalizeEducationLevel(x as Record<string, unknown>)
  );
  if (result.source === 'api') return { data: items, source: 'api' };
  return { data: items.length ? items : nivelesEducativos, source: 'fallback' };
}

export async function createEducationLevel(
  payload: Partial<EducationLevel>
): Promise<ApiResponse<EducationLevel>> {
  const name = payload.nombre ?? '';
  const code = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .slice(0, 20)
    .toUpperCase() || 'LVL';
  const res = await apiClient<Record<string, unknown>>('/education-levels', {
    method: 'POST',
    body: {
      name,
      code,
      gradeCount: payload.grados ?? 1,
      sortOrder: 0,
      isActive: payload.activo ?? true,
    },
  });
  if (res.success && res.data) return { ...res, data: normalizeEducationLevel(res.data) };
  return { ...res, data: null };
}

export async function updateEducationLevel(
  id: string,
  payload: Partial<EducationLevel>
): Promise<ApiResponse<EducationLevel>> {
  const name = payload.nombre ?? '';
  const code = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .slice(0, 20)
    .toUpperCase() || 'LVL';
  const res = await apiClient<Record<string, unknown>>(`/education-levels/${id}`, {
    method: 'PUT',
    body: {
      name,
      code,
      gradeCount: payload.grados ?? 1,
      sortOrder: 0,
      isActive: payload.activo ?? true,
    },
  });
  if (res.success && res.data) return { ...res, data: normalizeEducationLevel(res.data) };
  return { ...res, data: null };
}

export async function deleteEducationLevel(id: string): Promise<ApiResponse<null>> {
  return apiClient<null>(`/education-levels/${id}`, { method: 'DELETE' });
}

function mapRoleItems(rawItems: Record<string, unknown>[]): RoleInfo[] {
  return rawItems.map((raw) => {
    const r = raw;
    const code = String(r.roleCode ?? r.code ?? '');
    const roleId = String(r.roleId ?? r.id ?? code);
    const name = String(r.roleName ?? r.name ?? r.nombre ?? roleLabel(code));
    return {
      id: roleId,
      code,
      nombre: name,
      usuarios: Number(r.usuarios ?? r.userCount ?? 0),
      descripcion: String(
        r.descripcion ?? r.description ?? (code ? `Código: ${code}` : '')
      ),
    } as RoleInfo;
  });
}

/** GET /roles — fail-soft si API desactualizada (404) para no romper Configuración. */
export async function listRoles(): Promise<FetchResult<RoleInfo[]>> {
  try {
    const res = await apiClient<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
      '/roles'
    );
    if (!res.success) {
      return {
        data: [],
        source: 'api',
        message: res.message || 'Roles no disponibles; redeploy API si persiste.',
      };
    }
    const rawItems = Array.isArray(res.data) ? res.data : unwrapList(res.data);
    return { data: mapRoleItems(rawItems as Record<string, unknown>[]), source: 'api' };
  } catch (err) {
    console.warn('[SchoolCore] roles no disponible:', err);
    return {
      data: [],
      source: 'api',
      message: 'No se pudieron cargar roles (¿API desactualizada?).',
    };
  }
}

/** Notificaciones automáticas: MVP sin persistencia (no llamar endpoint inexistente). */
export async function listNotificationSettings(): Promise<FetchResult<NotificationSetting[]>> {
  return {
    data: notificacionesSettings.map((n) => ({ ...n })),
    source: 'api',
    message: 'Catálogo informativo; persistencia de notificaciones aún no disponible.',
  };
}

/** GET /users — normaliza StaffUserDto (API) → UsuarioSistema (UI). */
export async function listUsers(): Promise<FetchResult<UsuarioSistema[]>> {
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient('/users'),
    () => usuariosSistema as unknown as Record<string, unknown>[]
  );
  const items = unwrapList(result.data).map((x) => normalizeStaffUser(x as Record<string, unknown>));
  if (result.source === 'api') return { data: items, source: 'api' };
  return { data: items.length ? items : usuariosSistema, source: 'fallback' };
}

function roleLabel(code: string): string {
  const map: Record<string, string> = {
    SuperAdmin: 'Super Admin',
    Director: 'Director',
    Coordinator: 'Coordinador',
    Cashier: 'Cajero',
    Accountant: 'Contador',
    Receptionist: 'Recepcionista',
    Teacher: 'Profesor',
  };
  return map[code] || code || 'Sin rol';
}

function normalizeStaffUser(raw: Record<string, unknown>): UsuarioSistema {
  const roles = Array.isArray(raw.roles) ? (raw.roles as Record<string, unknown>[]) : [];
  const branches = Array.isArray(raw.branches) ? (raw.branches as Record<string, unknown>[]) : [];
  const firstRole = roles[0];
  const roleCode = String(firstRole?.roleCode ?? firstRole?.code ?? '');
  const roleName = String(firstRole?.roleName ?? firstRole?.name ?? roleLabel(roleCode));
  const firstName = String(raw.firstName ?? '');
  const lastName = String(raw.lastName ?? '');
  const nombre =
    String(raw.nombre ?? '').trim() ||
    `${firstName} ${lastName}`.trim() ||
    String(raw.email ?? 'Usuario');

  return {
    id: String(raw.id ?? ''),
    nombre,
    email: String(raw.email ?? ''),
    rol: roleName || 'Sin rol',
    rolId: roleCode || String(firstRole?.roleId ?? ''),
    activo: Boolean(raw.isActive ?? raw.activo ?? true),
    ultimoAcceso: String(raw.lastLoginAt ?? raw.ultimoAcceso ?? raw.createdAt ?? ''),
    telefono: String(raw.phone ?? raw.telefono ?? ''),
    sucursal: String(branches[0]?.branchName ?? branches[0]?.name ?? raw.sucursal ?? '—'),
    avatar: (raw.avatar as string | null) ?? null,
    fechaCreacion: String(raw.createdAt ?? raw.fechaCreacion ?? ''),
  };
}

export async function createUser(
  payload: Partial<UsuarioSistema> & { password?: string; roleCodes?: string[]; branchIds?: string[] }
): Promise<ApiResponse<UsuarioSistema>> {
  const { firstName, lastName } = splitFullName(payload.nombre || '');
  const res = await apiClient<Record<string, unknown>>('/users', {
    method: 'POST',
    body: {
      email: payload.email,
      password: payload.password,
      firstName,
      lastName,
      isActive: payload.activo ?? true,
      roleCodes: payload.roleCodes?.length
        ? payload.roleCodes
        : payload.rolId
          ? [payload.rolId]
          : [],
      branchIds: payload.branchIds ?? [],
    },
  });
  if (res.success && res.data) {
    return { ...res, data: normalizeStaffUser(res.data) };
  }
  return { ...res, data: null };
}

export async function updateUser(
  id: string,
  payload: Partial<UsuarioSistema> & { roleCodes?: string[]; branchIds?: string[] }
): Promise<ApiResponse<UsuarioSistema>> {
  const { firstName, lastName } = splitFullName(payload.nombre || '');
  const res = await apiClient<Record<string, unknown>>(`/users/${id}`, {
    method: 'PUT',
    body: {
      email: payload.email,
      firstName,
      lastName,
      isActive: payload.activo ?? true,
      roleCodes: payload.roleCodes?.length
        ? payload.roleCodes
        : payload.rolId
          ? [payload.rolId]
          : undefined,
      branchIds: payload.branchIds,
    },
  });
  if (res.success && res.data) {
    return { ...res, data: normalizeStaffUser(res.data) };
  }
  return { ...res, data: null };
}

export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  return apiClient(`/users/${id}`, { method: 'DELETE' });
}

function splitFullName(nombre: string): { firstName: string; lastName: string } {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'User', lastName: 'Staff' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** GET /email-templates */
export async function listEmailTemplates(): Promise<FetchResult<EmailTemplateSummary[]>> {
  const fallback: EmailTemplateSummary[] = [
    { id: 'tpl-reset', key: 'password_reset', name: 'Recuperación de contraseña', subject: 'Restablece tu contraseña', isOverride: false },
    { id: 'tpl-welcome', key: 'welcome', name: 'Bienvenida', subject: 'Bienvenido a {{SchoolName}}', isOverride: false },
    { id: 'tpl-payment', key: 'payment_received', name: 'Confirmación de pago', subject: 'Pago recibido', isOverride: false },
  ];
  const result = await fetchOrFallback<PagedResult<Record<string, unknown>> | Record<string, unknown>[]>(
    () => apiClient('/email-templates'),
    () => fallback as unknown as Record<string, unknown>[]
  );
  const items = unwrapList(result.data).map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      id: String(r.id ?? ''),
      key: String(r.templateKey ?? r.key ?? ''),
      name: String(r.templateKey ?? r.name ?? ''),
      subject: String(r.subject ?? ''),
      isOverride: r.tenantId != null,
      culture: String(r.culture ?? 'es'),
      htmlBody: String(r.htmlBody ?? ''),
      logoUrl: r.logoUrl != null ? String(r.logoUrl) : undefined,
      primaryColor: r.primaryColor != null ? String(r.primaryColor) : undefined,
    } satisfies EmailTemplateSummary;
  });
  if (result.source === 'api') return { data: items, source: 'api' };
  return { data: items.length ? items : fallback, source: 'fallback' };
}

/** PUT /email-templates (upsert por templateKey; no por id). */
export async function updateEmailTemplate(
  id: string,
  payload: Partial<EmailTemplateSummary> & { bodyText?: string; primaryColor?: string; logoUrl?: string }
): Promise<ApiResponse<EmailTemplateSummary>> {
  const templateKey = (payload.key || '').trim();
  if (!templateKey) {
    return {
      success: false,
      data: null,
      message: 'templateKey es requerido (no usar id GUID).',
      errors: ['Validation'],
    };
  }
  const res = await apiClient<Record<string, unknown>>('/email-templates', {
    method: 'PUT',
    body: {
      templateKey,
      culture: payload.culture ?? 'es',
      subject: payload.subject ?? '',
      htmlBody: payload.htmlBody ?? payload.bodyText ?? '',
      logoUrl: payload.logoUrl,
      primaryColor: payload.primaryColor,
      isActive: true,
    },
  });
  if (res.success && res.data) {
    const r = res.data;
    return {
      ...res,
      data: {
        id: String(r.id ?? id),
        key: String(r.templateKey ?? templateKey),
        name: String(r.templateKey ?? payload.name ?? ''),
        subject: String(r.subject ?? ''),
        isOverride: true,
      },
    };
  }
  return { ...res, data: null };
}
