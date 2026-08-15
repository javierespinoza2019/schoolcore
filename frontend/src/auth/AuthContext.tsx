import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '@/api/authApi';
import type { AuthUser, LoginRequest } from '@/api/types';
import { toAuthUser } from '@/api/types';
import { friendlyApiError } from '@/lib/interaction/messages';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setStoredUser,
  setTokens,
} from '@/auth/tokenStorage';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (!res.success || !res.data?.accessToken || !res.data?.refreshToken || !res.data?.userId) {
        return {
          ok: false,
          message: friendlyApiError(res) || 'No se pudo iniciar sesión.',
        };
      }

      const authUser = toAuthUser(res.data);
      setTokens(res.data.accessToken, res.data.refreshToken);
      setStoredUser(authUser);
      setUser(authUser);
      return { ok: true };
    } catch {
      return { ok: false, message: 'Error de red al iniciar sesión.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      await authApi.logout(refreshToken);
    } catch {
      // limpiar sesión local aunque el API falle
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(getAccessToken() && user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
