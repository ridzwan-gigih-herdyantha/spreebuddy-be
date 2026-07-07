/**
 * RBAC roles. Permissions are intentionally omitted for now — access is
 * decided purely by role. Add a permissions layer later if needed.
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES: Role[] = Object.values(ROLES);
