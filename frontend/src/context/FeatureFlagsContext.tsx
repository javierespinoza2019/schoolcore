import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import * as featureFlagsApi from '@/api/featureFlagsApi';
import type {
  FeatureFlagRow,
  FeatureFlagsMap,
  FeatureResolvedFromMap,
} from '@/api/featureFlagsApi';
import { useAuth } from '@/auth/AuthContext';
import { useSchoolContext } from '@/context/SchoolContext';
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlagId,
} from '@/config/features';

interface FeatureFlagsContextValue {
  /** Mapa resuelto para la sucursal activa (defaults OFF solo si aún no hay data). */
  flags: FeatureFlagsMap;
  resolvedFrom: FeatureResolvedFromMap;
  rows: FeatureFlagRow[];
  isLoading: boolean;
  isError: boolean;
  isEnabled: (id: FeatureFlagId) => boolean;
  refresh: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { branchId } = useSchoolContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.featureFlags.list(branchId),
    queryFn: () => featureFlagsApi.listFeatureFlags(branchId),
    enabled: isAuthenticated,
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const flags = query.data?.flags ?? DEFAULT_FEATURE_FLAGS;
  const resolvedFrom = query.data?.resolvedFrom ?? {};
  const rows = query.data?.rows ?? [];

  const isEnabled = useCallback(
    (id: FeatureFlagId) => {
      // Si falló la carga y no hay data previa, no asumir OFF como “diseño”.
      if (query.isError && !query.data) return false;
      return Boolean(flags[id]);
    },
    [flags, query.isError, query.data]
  );

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['featureFlags'] });
  }, [queryClient]);

  const value = useMemo<FeatureFlagsContextValue>(
    () => ({
      flags,
      resolvedFrom,
      rows,
      isLoading: query.isLoading,
      isError: query.isError,
      isEnabled,
      refresh,
    }),
    [flags, resolvedFrom, rows, query.isLoading, query.isError, isEnabled, refresh]
  );

  return (
    <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagsContextValue {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return ctx;
}
