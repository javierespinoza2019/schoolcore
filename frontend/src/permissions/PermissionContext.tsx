import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/auth/AuthContext';
import { fetchMyPermissions } from '@/api/permissionsApi';
import type { PermissionGrant } from '@/api/permissionsApi';

/** Acciones de permiso (granularidad MVP documentada). */
export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'export'
  | 'approve';

interface PermissionContextValue {
  /**
   * Comprueba ViewCode + acción.
   * Si el backend expone /auth/me/permissions → checks reales.
   * Si no → stub: autenticado = allow (estructura lista para ViewCodes).
   */
  can: (view: string, action: PermissionAction) => boolean;
  /** true cuando se cargaron permisos reales del API. */
  usingRealPermissions: boolean;
  isLoadingPermissions: boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

function normalizeGrants(raw: PermissionGrant[] | string[] | null | undefined): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  if (!raw) return map;

  if (raw.length && typeof raw[0] === 'string') {
    (raw as string[]).forEach((entry) => {
      const [view, action] = entry.split(':');
      if (!view) return;
      if (!map.has(view)) map.set(view, new Set());
      if (action) map.get(view)!.add(action);
      else map.get(view)!.add('view');
    });
    return map;
  }

  (raw as PermissionGrant[]).forEach((g) => {
    if (!g?.viewCode) return;
    if (!map.has(g.viewCode)) map.set(g.viewCode, new Set());
    (g.actions || []).forEach((a) => map.get(g.viewCode)!.add(a));
  });
  return map;
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [grants, setGrants] = useState<Map<string, Set<string>>>(new Map());
  const [usingRealPermissions, setUsingReal] = useState(false);
  const [isLoadingPermissions, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setGrants(new Map());
      setUsingReal(false);
      return;
    }

    // Preferir claims embebidos en login si existen
    if (user?.permissions?.length) {
      setGrants(normalizeGrants(user.permissions));
      setUsingReal(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchMyPermissions()
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data != null) {
          const map = normalizeGrants(res.data);
          // Con matriz real: lista vacía = sin permisos (fail-closed).
          setGrants(map);
          setUsingReal(true);
        } else {
          setUsingReal(false);
        }
      })
      .catch(() => {
        if (!cancelled) setUsingReal(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.permissions]);

  const can = useCallback(
    (view: string, action: PermissionAction) => {
      if (!isAuthenticated) return false;
      if (!usingRealPermissions) return true; // stub MVP
      const star = grants.get('*');
      if (star && (star.has('*') || star.has(action))) return true;
      const actions = grants.get(view);
      if (!actions) return false;
      return actions.has(action) || actions.has('*');
    },
    [isAuthenticated, usingRealPermissions, grants]
  );

  const value = useMemo(
    () => ({ can, usingRealPermissions, isLoadingPermissions }),
    [can, usingRealPermissions, isLoadingPermissions]
  );

  return (
    <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
  );
}

export function usePermissions(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return ctx;
}
