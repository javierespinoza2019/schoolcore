import { apiClient } from '@/api/apiClient';
import type {
  ApiResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  ResetPasswordRequest,
} from '@/api/types';

/** POST /api/auth/login */
export function login(payload: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });
}

/** POST /api/auth/refresh */
export function refresh(payload: RefreshRequest): Promise<ApiResponse<RefreshResponse>> {
  return apiClient<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });
}

/** POST /api/auth/logout */
export function logout(refreshToken?: string | null): Promise<ApiResponse<null>> {
  return apiClient<null>('/auth/logout', {
    method: 'POST',
    body: refreshToken ? { refreshToken } : {},
  });
}

/** POST /api/auth/forgot-password */
export function forgotPassword(
  payload: ForgotPasswordRequest
): Promise<ApiResponse<null>> {
  return apiClient<null>('/auth/forgot-password', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });
}

/** POST /api/auth/reset-password */
export function resetPassword(
  payload: ResetPasswordRequest
): Promise<ApiResponse<null>> {
  return apiClient<null>('/auth/reset-password', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });
}
