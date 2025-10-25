/**
 * Permission System
 * 
 * Defines all permissions and role-based access control rules.
 * Permissions are checked at multiple levels:
 * 1. Route level (proxy.ts)
 * 2. Component level (usePermissions hook)
 * 3. Server action level (permission checks in API functions)
 */

// ============================================================================
// ROLES
// ============================================================================

export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  MARKETING: 'marketing',
  OPERATIONS: 'operations',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// ============================================================================
// PRIVILEGES
// ============================================================================

export const PRIVILEGES = {
  // Event management
  APPROVE_EVENTS: 'approve_events',
  CREATE_EVENTS: 'create_events',
  MANAGE_ALL_EVENTS: 'manage_all_events',
  VIEW_ALL_EVENTS: 'view_all_events',
  
  // User management
  MANAGE_USERS: 'manage_users',
  ASSIGN_PRIVILEGES: 'assign_privileges',
  VIEW_ALL_USERS: 'view_all_users',
  
  // Availability
  VIEW_ALL_AVAILABILITY: 'view_all_availability',
  VIEW_TEAM_AVAILABILITY: 'view_team_availability',
  
  // Classes
  MANAGE_CLASSES: 'manage_classes',
  
  // System
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_TEMPLATES: 'manage_templates',
} as const

export type Privilege = (typeof PRIVILEGES)[keyof typeof PRIVILEGES]

// ============================================================================
// ROLE-BASED PERMISSIONS
// ============================================================================

/**
 * Default privileges for each role
 * These match the database role_privileges table
 */
export const ROLE_PERMISSIONS: Record<Role, Privilege[]> = {
  [ROLES.ADMIN]: [
    PRIVILEGES.APPROVE_EVENTS,
    PRIVILEGES.CREATE_EVENTS,
    PRIVILEGES.MANAGE_ALL_EVENTS,
    PRIVILEGES.VIEW_ALL_EVENTS,
    PRIVILEGES.MANAGE_USERS,
    PRIVILEGES.ASSIGN_PRIVILEGES,
    PRIVILEGES.VIEW_ALL_USERS,
    PRIVILEGES.VIEW_ALL_AVAILABILITY,
    PRIVILEGES.MANAGE_CLASSES,
    PRIVILEGES.VIEW_AUDIT_LOGS,
    PRIVILEGES.MANAGE_TEMPLATES,
  ],
  
  [ROLES.HR]: [
    PRIVILEGES.VIEW_ALL_EVENTS,
    PRIVILEGES.VIEW_ALL_AVAILABILITY,
    PRIVILEGES.VIEW_ALL_USERS,
    PRIVILEGES.MANAGE_USERS,
    PRIVILEGES.MANAGE_CLASSES,
  ],
  
  [ROLES.MARKETING]: [
    PRIVILEGES.VIEW_ALL_EVENTS,
    PRIVILEGES.VIEW_ALL_AVAILABILITY,
  ],
  
  [ROLES.OPERATIONS]: [
    PRIVILEGES.VIEW_ALL_EVENTS,
    PRIVILEGES.VIEW_ALL_AVAILABILITY,
  ],
  
  [ROLES.TEACHER]: [
    PRIVILEGES.VIEW_TEAM_AVAILABILITY,
  ],
  
  [ROLES.STUDENT]: [],
}

// ============================================================================
// ROUTE PERMISSIONS
// ============================================================================

/**
 * Define which roles can access which routes
 */
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  // Dashboard routes
  '/dashboard': [ROLES.ADMIN, ROLES.HR, ROLES.MARKETING, ROLES.OPERATIONS, ROLES.TEACHER, ROLES.STUDENT],
  '/dashboard/student': [ROLES.STUDENT],
  '/dashboard/business': [ROLES.ADMIN, ROLES.HR, ROLES.MARKETING, ROLES.OPERATIONS],
  '/dashboard/teacher': [ROLES.TEACHER],
  
  // Admin routes
  '/admin': [ROLES.ADMIN],
  '/admin/users': [ROLES.ADMIN, ROLES.HR],
  '/admin/classes': [ROLES.ADMIN, ROLES.HR],
  '/admin/schedule': [ROLES.ADMIN, ROLES.HR, ROLES.OPERATIONS],
  '/admin/audit-logs': [ROLES.ADMIN],
  
  // Teacher routes
  '/dashboard/teacher/classes': [ROLES.TEACHER],
  
  // Availability and schedule (all authenticated users)
  '/availability': [ROLES.ADMIN, ROLES.HR, ROLES.MARKETING, ROLES.OPERATIONS, ROLES.TEACHER, ROLES.STUDENT],
  '/schedule': [ROLES.ADMIN, ROLES.HR, ROLES.MARKETING, ROLES.OPERATIONS, ROLES.TEACHER, ROLES.STUDENT],
  
  // Profile (all authenticated users)
  '/profile': [ROLES.ADMIN, ROLES.HR, ROLES.MARKETING, ROLES.OPERATIONS, ROLES.TEACHER, ROLES.STUDENT],
}

// ============================================================================
// PERMISSION CHECKING FUNCTIONS
// ============================================================================

/**
 * Check if a role has a specific privilege
 */
export function hasPrivilege(role: Role, privilege: Privilege): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || []
  return rolePermissions.includes(privilege)
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  // Find the most specific matching route
  const matchingRoutes = Object.keys(ROUTE_PERMISSIONS)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length) // Sort by specificity (longest first)
  
  if (matchingRoutes.length === 0) {
    // No specific route defined, allow access (public or general authenticated route)
    return true
  }
  
  const mostSpecificRoute = matchingRoutes[0]
  const allowedRoles = ROUTE_PERMISSIONS[mostSpecificRoute]
  
  return allowedRoles.includes(role)
}

/**
 * Check if a user has any of the specified privileges
 */
export function hasAnyPrivilege(role: Role, privileges: Privilege[]): boolean {
  return privileges.some(privilege => hasPrivilege(role, privilege))
}

/**
 * Check if a user has all of the specified privileges
 */
export function hasAllPrivileges(role: Role, privileges: Privilege[]): boolean {
  return privileges.every(privilege => hasPrivilege(role, privilege))
}

/**
 * Get all privileges for a role
 */
export function getRolePrivileges(role: Role): Privilege[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if a role is an admin
 */
export function isAdmin(role: Role): boolean {
  return role === ROLES.ADMIN
}

/**
 * Check if a role is HR
 */
export function isHR(role: Role): boolean {
  return role === ROLES.HR
}

/**
 * Check if a role is a teacher
 */
export function isTeacher(role: Role): boolean {
  return role === ROLES.TEACHER
}

/**
 * Check if a role is a student
 */
export function isStudent(role: Role): boolean {
  return role === ROLES.STUDENT
}

/**
 * Check if a role can manage users
 */
export function canManageUsers(role: Role): boolean {
  return hasPrivilege(role, PRIVILEGES.MANAGE_USERS)
}

/**
 * Check if a role can manage events
 */
export function canManageEvents(role: Role): boolean {
  return hasPrivilege(role, PRIVILEGES.MANAGE_ALL_EVENTS)
}

/**
 * Check if a role can view all availability
 */
export function canViewAllAvailability(role: Role): boolean {
  return hasPrivilege(role, PRIVILEGES.VIEW_ALL_AVAILABILITY)
}

/**
 * Check if a role can manage classes
 */
export function canManageClasses(role: Role): boolean {
  return hasPrivilege(role, PRIVILEGES.MANAGE_CLASSES)
}

// ============================================================================
// PERMISSION ERROR MESSAGES
// ============================================================================

export const PERMISSION_ERRORS = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  INSUFFICIENT_PRIVILEGES: 'You do not have sufficient privileges',
  INVALID_ROLE: 'Invalid role specified',
  ACCESS_DENIED: 'Access denied',
  ROUTE_FORBIDDEN: 'You do not have permission to access this page',
} as const

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface UserPermissions {
  role: Role
  privileges: Privilege[]
  canAccessRoute: (pathname: string) => boolean
  hasPrivilege: (privilege: Privilege) => boolean
  hasAnyPrivilege: (privileges: Privilege[]) => boolean
  hasAllPrivileges: (privileges: Privilege[]) => boolean
  isAdmin: boolean
  isHR: boolean
  isTeacher: boolean
  isStudent: boolean
}
