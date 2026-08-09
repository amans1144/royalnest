import { STAFF_ROLE_RANK, UserRole } from '@spb/types';

/** True if `role` is at least as privileged as `minimum` in the staff hierarchy. */
export function hasMinRole(role: UserRole, minimum: UserRole): boolean {
  const roleRank = STAFF_ROLE_RANK.indexOf(role);
  const minRank = STAFF_ROLE_RANK.indexOf(minimum);
  if (roleRank === -1 || minRank === -1) return false; // CUSTOMER isn't in the staff ladder
  return roleRank >= minRank;
}

export function isStaff(role: UserRole): boolean {
  return role !== UserRole.CUSTOMER;
}

export function canManageProjects(role: UserRole): boolean {
  return hasMinRole(role, UserRole.EDITOR);
}

export function canChangePlotStatus(role: UserRole): boolean {
  return hasMinRole(role, UserRole.EXECUTIVE);
}

export function canPublish(role: UserRole): boolean {
  return hasMinRole(role, UserRole.SALES_MANAGER);
}
