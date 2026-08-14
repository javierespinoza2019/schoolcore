/** Forma uniforme de respuesta de la API SchoolCore. */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: string[];
}

/** Resultado paginado alineado con SchoolCore.Models.Dtos.Common.PagedResult. */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** Usuario en sesión local (derivado del payload de login/refresh). */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  tenantCode?: string;
  tenantName?: string;
  roles: string[];
  branchIds?: string[];
  /** Permisos granulares si el backend los expone (viewCode:action). */
  permissions?: string[];
}

/**
 * Payload de login/refresh alineado con SchoolCore.Models.Dtos.Auth.LoginResponse
 * (campos de usuario en plano; JSON camelCase).
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  userId: string;
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  branchIds: string[];
  permissions?: string[];
}

/** Refresh reutiliza el mismo shape que login (BE AuthController). */
export type RefreshResponse = LoginResponse;

export interface LoginRequest {
  email: string;
  password: string;
  /** Código de tenant opcional para desambiguar email en varias escuelas. */
  tenantCode?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
  tenantCode?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/** Mapea el payload plano de auth al AuthUser de sesión. */
export function toAuthUser(data: LoginResponse): AuthUser {
  return {
    id: data.userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    tenantId: data.tenantId,
    tenantCode: data.tenantCode,
    tenantName: data.tenantName,
    roles: data.roles ?? [],
    branchIds: data.branchIds ?? [],
    permissions: data.permissions,
  };
}

/** Origen de datos para UI: API real o fallback mock temporal. */
export type DataSource = 'api' | 'fallback';

export interface FetchResult<T> {
  data: T;
  source: DataSource;
  message?: string | null;
}
