/** Query keys centralizadas; incluyen branchId/cycleId para invalidación por contexto. */
export const queryKeys = {
  branches: {
    all: ['branches'] as const,
    list: (params?: Record<string, unknown>) => ['branches', 'list', params] as const,
    detail: (id: string) => ['branches', 'detail', id] as const,
  },
  cycles: {
    all: ['cycles'] as const,
    list: () => ['cycles', 'list'] as const,
  },
  students: {
    all: ['students'] as const,
    list: (params: Record<string, unknown>) => ['students', 'list', params] as const,
    detail: (id: string) => ['students', 'detail', id] as const,
  },
  parents: {
    all: ['parents'] as const,
    list: (params: Record<string, unknown>) => ['parents', 'list', params] as const,
    detail: (id: string) => ['parents', 'detail', id] as const,
  },
  teachers: {
    all: ['teachers'] as const,
    list: (params: Record<string, unknown>) => ['teachers', 'list', params] as const,
    detail: (id: string) => ['teachers', 'detail', id] as const,
  },
  classrooms: {
    all: ['classrooms'] as const,
    list: (params: Record<string, unknown>) => ['classrooms', 'list', params] as const,
  },
  enrollments: {
    all: ['enrollments'] as const,
  },
  finance: {
    all: ['finance'] as const,
    summary: (params: Record<string, unknown>) => ['finance', 'summary', params] as const,
    payments: (params: Record<string, unknown>) => ['finance', 'payments', params] as const,
    charges: (params: Record<string, unknown>) => ['finance', 'charges', params] as const,
    expenses: (params: Record<string, unknown>) => ['finance', 'expenses', params] as const,
    revenue: (params: Record<string, unknown>) => ['finance', 'revenue', params] as const,
    concepts: (params: Record<string, unknown>) => ['finance', 'concepts', params] as const,
    accountStatement: (studentId: string) => ['finance', 'account-statement', studentId] as const,
  },
  cash: {
    all: ['cash'] as const,
    cortes: (params: Record<string, unknown>) => ['cash', 'cortes', params] as const,
    open: (branchId: string) => ['cash', 'open', branchId] as const,
    movements: (corteId: string) => ['cash', 'movements', corteId] as const,
  },
  reports: {
    all: ['reports'] as const,
    data: (params: Record<string, unknown>) => ['reports', 'data', params] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (params?: Record<string, unknown>) => ['notifications', 'list', params] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    kpis: (params: Record<string, unknown>) => ['dashboard', 'kpis', params] as const,
  },
  settings: {
    all: ['settings'] as const,
    tenant: () => ['settings', 'tenant'] as const,
    paymentMethods: () => ['settings', 'payment-methods'] as const,
    paymentConcepts: () => ['settings', 'payment-concepts'] as const,
    catalogs: () => ['settings', 'catalogs'] as const,
    users: (params?: Record<string, unknown>) => ['settings', 'users', params] as const,
    emailTemplates: () => ['settings', 'email-templates'] as const,
  },
  featureFlags: {
    all: ['featureFlags'] as const,
    list: (branchId?: string | null) => ['featureFlags', 'list', branchId ?? null] as const,
  },
  context: {
    timezone: (branchId?: string | null) => ['context', 'timezone', branchId ?? null] as const,
  },
  permissions: {
    me: ['permissions', 'me'] as const,
  },
} as const;

/** Prefijos a invalidar cuando cambia sucursal o ciclo en ContextSwitcher. */
export const CONTEXT_DEPENDENT_KEY_PREFIXES = [
  'students',
  'parents',
  'teachers',
  'classrooms',
  'finance',
  'cash',
  'reports',
  'dashboard',
  'notifications',
  'enrollments',
  'featureFlags',
] as const;
