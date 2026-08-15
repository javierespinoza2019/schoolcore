import { apiClient } from '@/api/apiClient';
import { buildQuery, unwrapList } from '@/api/helpers';
import type { ApiResponse } from '@/api/types';
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_KEYS,
  apiKeyToFeatureId,
  type FeatureFlagId,
} from '@/config/features';

export interface FeatureFlagRow {
  featureKey: string;
  isEnabled: boolean;
  resolvedFrom: string;
}

export type FeatureFlagsMap = Record<FeatureFlagId, boolean>;
export type FeatureResolvedFromMap = Partial<Record<FeatureFlagId, string>>;

function mapRows(rows: FeatureFlagRow[]): {
  flags: FeatureFlagsMap;
  resolvedFrom: FeatureResolvedFromMap;
} {
  const flags: FeatureFlagsMap = { ...DEFAULT_FEATURE_FLAGS };
  const resolvedFrom: FeatureResolvedFromMap = {};
  for (const row of rows) {
    const id = apiKeyToFeatureId(row.featureKey);
    if (!id) continue;
    flags[id] = Boolean(row.isEnabled);
    resolvedFrom[id] = row.resolvedFrom || 'None';
  }
  return { flags, resolvedFrom };
}

function normalizeRow(raw: Record<string, unknown>): FeatureFlagRow {
  return {
    featureKey: String(raw.featureKey ?? raw.FeatureKey ?? ''),
    isEnabled: Boolean(raw.isEnabled ?? raw.IsEnabled),
    resolvedFrom: String(raw.resolvedFrom ?? raw.ResolvedFrom ?? 'None'),
  };
}

/** GET /feature-flags?branchId= — resolución Branch > Tenant > Global. */
export async function listFeatureFlags(branchId?: string | null): Promise<{
  flags: FeatureFlagsMap;
  resolvedFrom: FeatureResolvedFromMap;
  rows: FeatureFlagRow[];
}> {
  const q = buildQuery({ branchId: branchId ?? undefined });
  try {
    const res = await apiClient<FeatureFlagRow[] | Record<string, unknown>[]>(`/feature-flags${q}`);
    if (!res.success || !res.data) {
      return { flags: { ...DEFAULT_FEATURE_FLAGS }, resolvedFrom: {}, rows: [] };
    }
    const rows = unwrapList(res.data as FeatureFlagRow[]).map((r) =>
      normalizeRow(r as unknown as Record<string, unknown>)
    );
    const mapped = mapRows(rows);
    return { ...mapped, rows };
  } catch {
    return { flags: { ...DEFAULT_FEATURE_FLAGS }, resolvedFrom: {}, rows: [] };
  }
}

/** PUT /feature-flags — BranchId null = override tenant; con GUID = override sucursal. */
export async function setFeatureFlag(params: {
  featureId: FeatureFlagId;
  isEnabled: boolean;
  branchId?: string | null;
}): Promise<ApiResponse<null>> {
  return apiClient('/feature-flags', {
    method: 'PUT',
    body: {
      featureKey: FEATURE_KEYS[params.featureId],
      isEnabled: params.isEnabled,
      branchId: params.branchId || null,
    },
  });
}
