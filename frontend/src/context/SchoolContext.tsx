import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isGuid } from '@/api/helpers';
import { CONTEXT_DEPENDENT_KEY_PREFIXES, queryKeys } from '@/api/queryKeys';
import * as settingsApi from '@/api/settingsApi';
import { useAuth } from '@/auth/AuthContext';
import {
  detectDeviceTimeZone,
  PLATFORM_DEFAULT_TIME_ZONE,
  type EffectiveTimeZone,
} from '@/lib/timeZones';

export interface SchoolBranchOption {
  id: string;
  name: string;
  shortName: string;
  studentCount?: number;
}

export interface SchoolCycleOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface SchoolContextValue {
  branchId: string | null;
  cycleId: string | null;
  branch: SchoolBranchOption | null;
  cycle: SchoolCycleOption | null;
  setBranch: (branch: SchoolBranchOption) => void;
  setCycle: (cycle: SchoolCycleOption) => void;
  setBranchOptions: (branches: SchoolBranchOption[]) => void;
  setCycleOptions: (cycles: SchoolCycleOption[]) => void;
  branchOptions: SchoolBranchOption[];
  cycleOptions: SchoolCycleOption[];
  /** Zona efectiva Branch → Tenant → Platform (solo display / “hoy” de negocio). */
  effectiveTimeZone: EffectiveTimeZone;
  deviceTimeZone: string | null;
  deviceDiffersFromBusiness: boolean;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

const STORAGE_BRANCH = 'sc_active_branch_id';
const STORAGE_CYCLE = 'sc_active_cycle_id';

const DEFAULT_TZ: EffectiveTimeZone = {
  effectiveTimeZoneId: PLATFORM_DEFAULT_TIME_ZONE,
  source: 'Platform',
  tenantTimeZoneId: PLATFORM_DEFAULT_TIME_ZONE,
  branchTimeZoneId: null,
};

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function SchoolProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [branchOptions, setBranchOptionsState] = useState<SchoolBranchOption[]>([]);
  const [cycleOptions, setCycleOptionsState] = useState<SchoolCycleOption[]>([]);
  const [branch, setBranchState] = useState<SchoolBranchOption | null>(null);
  const [cycle, setCycleState] = useState<SchoolCycleOption | null>(null);
  const [deviceTimeZone] = useState<string | null>(() => detectDeviceTimeZone());

  const invalidateContextQueries = useCallback(() => {
    CONTEXT_DEPENDENT_KEY_PREFIXES.forEach((prefix) => {
      void queryClient.invalidateQueries({ queryKey: [prefix] });
    });
  }, [queryClient]);

  const setBranch = useCallback(
    (next: SchoolBranchOption) => {
      setBranchState(next);
      writeStored(STORAGE_BRANCH, next.id);
      invalidateContextQueries();
    },
    [invalidateContextQueries]
  );

  const setCycle = useCallback(
    (next: SchoolCycleOption) => {
      setCycleState(next);
      writeStored(STORAGE_CYCLE, next.id);
      invalidateContextQueries();
    },
    [invalidateContextQueries]
  );

  const setBranchOptions = useCallback((branches: SchoolBranchOption[]) => {
    setBranchOptionsState(branches);
    setBranchState((prev) => {
      if (!branches.length) return null;
      const storedId = readStored(STORAGE_BRANCH);
      // Ignorar "0" / basura de builds anteriores (Guid→Number→0).
      const fromStored =
        storedId && isGuid(storedId) ? branches.find((b) => b.id === storedId) : null;
      if (storedId && !isGuid(storedId)) {
        try {
          localStorage.removeItem(STORAGE_BRANCH);
        } catch {
          /* ignore */
        }
      }
      const keep = prev && isGuid(prev.id) ? branches.find((b) => b.id === prev.id) : null;
      return keep || fromStored || branches[0];
    });
  }, []);

  const setCycleOptions = useCallback((cycles: SchoolCycleOption[]) => {
    setCycleOptionsState(cycles);
    setCycleState((prev) => {
      if (!cycles.length) return null;
      const storedId = readStored(STORAGE_CYCLE);
      const fromStored =
        storedId && isGuid(storedId) ? cycles.find((c) => c.id === storedId) : null;
      if (storedId && !isGuid(storedId)) {
        try {
          localStorage.removeItem(STORAGE_CYCLE);
        } catch {
          /* ignore */
        }
      }
      const keep = prev && isGuid(prev.id) ? cycles.find((c) => c.id === prev.id) : null;
      const active = cycles.find((c) => c.isActive);
      return keep || fromStored || active || cycles[0];
    });
  }, []);

  const tzQuery = useQuery({
    queryKey: queryKeys.context.timezone(branch?.id),
    queryFn: async () => {
      const res = await settingsApi.resolveEffectiveTimeZone(branch?.id ?? null);
      return (
        res.data ?? {
          effectiveTimeZoneId: PLATFORM_DEFAULT_TIME_ZONE,
          source: 'Platform',
          tenantTimeZoneId: PLATFORM_DEFAULT_TIME_ZONE,
          branchTimeZoneId: null,
        }
      );
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });

  const effectiveTimeZone: EffectiveTimeZone = tzQuery.data
    ? {
        effectiveTimeZoneId: tzQuery.data.effectiveTimeZoneId || PLATFORM_DEFAULT_TIME_ZONE,
        source: tzQuery.data.source || 'Platform',
        tenantTimeZoneId: tzQuery.data.tenantTimeZoneId,
        branchTimeZoneId: tzQuery.data.branchTimeZoneId,
      }
    : DEFAULT_TZ;

  const deviceDiffersFromBusiness = Boolean(
    deviceTimeZone &&
      effectiveTimeZone.effectiveTimeZoneId &&
      deviceTimeZone !== effectiveTimeZone.effectiveTimeZoneId
  );

  const value = useMemo<SchoolContextValue>(
    () => ({
      branchId: branch?.id ?? null,
      cycleId: cycle?.id ?? null,
      branch,
      cycle,
      setBranch,
      setCycle,
      setBranchOptions,
      setCycleOptions,
      branchOptions,
      cycleOptions,
      effectiveTimeZone,
      deviceTimeZone,
      deviceDiffersFromBusiness,
    }),
    [
      branch,
      cycle,
      setBranch,
      setCycle,
      setBranchOptions,
      setCycleOptions,
      branchOptions,
      cycleOptions,
      effectiveTimeZone,
      deviceTimeZone,
      deviceDiffersFromBusiness,
    ]
  );

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchoolContext(): SchoolContextValue {
  const ctx = useContext(SchoolContext);
  if (!ctx) {
    throw new Error('useSchoolContext must be used within SchoolProvider');
  }
  return ctx;
}
