/** Roles de login staff (Role.Code). */
export function isSuperAdminRole(roles: string[] | string | undefined | null): boolean {
  if (!roles) return false;
  const list = Array.isArray(roles) ? roles : [roles];
  return list.some((r) => r.trim().toLowerCase() === 'superadmin');
}
