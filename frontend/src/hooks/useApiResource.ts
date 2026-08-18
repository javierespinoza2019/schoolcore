import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/base/Toast';
import type { FetchResult } from '@/api/types';
import { isDevelopment } from '@/config/env';

/**
 * Hook estándar: TanStack Query + toast en error + flag de fallback mock (solo DEV).
 */
export function useApiResource<T>(options: {
  queryKey: readonly unknown[];
  queryFn: () => Promise<FetchResult<T>>;
  enabled?: boolean;
  errorToast?: string;
}) {
  const { showToast } = useToast();
  const query = useQuery({
    queryKey: options.queryKey,
    queryFn: options.queryFn,
    enabled: options.enabled !== false,
  });

  useEffect(() => {
    if (query.isError) {
      showToast(options.errorToast || 'No se pudo cargar la información', 'error');
    }
  }, [query.isError, options.errorToast, showToast]);

  useEffect(() => {
    if (query.data?.source === 'fallback' && isDevelopment) {
      console.info('[SchoolCore] Usando datos mock (API no disponible aún)');
    }
  }, [query.data?.source]);

  return {
    ...query,
    data: query.data?.data,
    totalCount: query.data?.totalCount,
    source: query.data?.source,
    isFallback: query.data?.source === 'fallback',
  };
}
