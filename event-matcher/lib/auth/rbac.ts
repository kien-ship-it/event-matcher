import type { Database, RoleId, PrivilegeId } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserPrivilege = {
  user_id: string
  privilege_id: string
  privilege_name: string
  category: string | null
  source: 'role' | 'user'
}

/**
 * Check if a user has a specific privilege
 * Privileges can come from their role or be granted individually
 */
export function hasPrivilege(
  userPrivileges: UserPrivilege[],
  privilegeId: PrivilegeId
): boolean {
  return userPrivileges.some((p) => p.privilege_id === privilegeId)
}

/**
 * Check if a user has any of the specified privileges
 */
export function hasAnyPrivilege(
  userPrivileges: UserPrivilege[],
  privilegeIds: PrivilegeId[]
): boolean {
  return privilegeIds.some((id) => hasPrivilege(userPrivileges, id))
}

/**
 * Check if a user has all of the specified privileges
 */
export function hasAllPrivileges(
  userPrivileges: UserPrivilege[],
  privilegeIds: PrivilegeId[]
): boolean {
  return privilegeIds.every((id) => hasPrivilege(userPrivileges, id))
}

/**
 * Check if a user has a specific role
 */
export function hasRole(profile: Profile | null, roleId: RoleId): boolean {
  return profile?.role_id === (roleId as string)
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(
  profile: Profile | null,
  roleIds: RoleId[]
): boolean {
  return profile ? roleIds.includes(profile.role_id as RoleId) : false
}

/**
 * Check if user is a teacher
 */
export function isTeacher(profile: Profile | null): boolean {
  return hasRole(profile, 'teacher')
}

/**
 * Check if user is a student
 */
export function isStudent(profile: Profile | null): boolean {
  return hasRole(profile, 'student')
}

/**
 * Check if user is in a business role (marketing, hr, operations)
 */
export function isBusinessRole(profile: Profile | null): boolean {
  return hasAnyRole(profile, ['marketing', 'hr', 'operations'])
}

/**
 * Check if user can approve events (has admin privilege)
 */
export function canApproveEvents(userPrivileges: UserPrivilege[]): boolean {
  return hasPrivilege(userPrivileges, 'approve_events')
}

/**
 * Check if user can create events for others
 */
export function canCreateEvents(userPrivileges: UserPrivilege[]): boolean {
  return hasPrivilege(userPrivileges, 'create_events')
}

/**
 * Check if user can manage all events
 */
export function canManageAllEvents(userPrivileges: UserPrivilege[]): boolean {
  return hasPrivilege(userPrivileges, 'manage_all_events')
}

/**
 * Check if user can view all events
 */
export function canViewAllEvents(userPrivileges: UserPrivilege[]): boolean {
  return hasPrivilege(userPrivileges, 'view_all_events')
}

/**
 * Check if user can manage users
 */
export function canManageUsers(userPrivileges: UserPrivilege[]): boolean {
  return hasPrivilege(userPrivileges, 'manage_users')
}

/**
 * Check if user can assign privileges to others
 */
export function canAssignPrivileges(userPrivileges: UserPrivilege[]): boolean {
  return hasPrivilege(userPrivileges, 'assign_privileges')
}

/**
 * Check if user can view all availability
 */
export function canViewAllAvailability(
  userPrivileges: UserPrivilege[]
): boolean {
  return hasPrivilege(userPrivileges, 'view_all_availability')
}

/**
 * Check if user can manage classes
 */
export function canManageClasses(userPrivileges: UserPrivilege[]): boolean {
  return hasPrivilege(userPrivileges, 'manage_classes')
}

/**
 * Check if user can view audit logs
 */
export function canViewAuditLogs(userPrivileges: UserPrivilege[]): boolean {
  return hasPrivilege(userPrivileges, 'view_audit_logs')
}

/**
 * Get privileges by category
 */
export function getPrivilegesByCategory(
  userPrivileges: UserPrivilege[],
  category: string
): UserPrivilege[] {
  return userPrivileges.filter((p) => p.category === category)
}

/**
 * Check if user has any admin-level privileges
 * (approve_events, manage_users, assign_privileges)
 */
export function hasAdminPrivileges(userPrivileges: UserPrivilege[]): boolean {
  return hasAnyPrivilege(userPrivileges, [
    'approve_events',
    'manage_users',
    'assign_privileges',
  ])
}
