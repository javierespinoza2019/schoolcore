import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/base/Toast';
import type { FetchResult } from '@/api/types';
import { isDevelopment, isQa } from '@/config/env';

/**
 * Hook estándar: TanStack Query + toast en error + flag de fallback mock.
 */
export function useApiResource<T>(options: {
  queryKey: readonly unknown[];
  queryFn: () => Promise<FetchResult<T>>;
  enabled?: boolean;
  errorToast?: string;
}) {
  const { showToast } = useToast();
  const fallbackToastShown = useRef(false);
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
    if (query.data?.source !== 'fallback') {
      fallbackToastShown.current = false;
      return;
    }
    if (isDevelopment) {
      console.info('[SchoolCore] Usando datos mock (API no disponible aún)');
    }
    if ((isQa || !isDevelopment) && !fallbackToastShown.current) {
      fallbackToastShown.current = true;
      showToast('Datos de demostración: la API no respondió', 'info');
    }
  }, [query.data?.source, showToast]);

  return {
    ...query,
    data: query.data?.data,
    source: query.data?.source,
    isFallback: query.data?.source === 'fallback',
  };
}
