import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getAllUserPrivileges } from '@/lib/api/users'
import {
  type Role,
  type Privilege,
  type UserPermissions,
  ROLES,
  getRolePrivileges,
  canAccessRoute as checkRouteAccess,
} from '@/lib/auth/permissions'

/**
 * Hook to check user permissions based on their role AND user-specific privileges
 * Now fetches from database to include user_privileges table
 * 
 * Usage:
 * ```tsx
 * const permissions = usePermissions()
 * 
 * if (permissions.isAdmin) {
 *   // Show admin features
 * }
 * 
 * if (permissions.hasPrivilege('manage_users')) {
 *   // Show user management
 * }
 * 
 * if (permissions.canAccessRoute('/admin')) {
 *   // Allow navigation
 * }
 * ```
 */
export function usePermissions(): UserPermissions {
  const { user, profile } = useAuth()
  
  const role = (profile?.role_id as Role) || ROLES.STUDENT
  
  // Fetch all privileges from database (role + user-specific)
  const { data: dbPrivileges = [] } = useQuery({
    queryKey: ['user-all-privileges', user?.id],
    queryFn: () => getAllUserPrivileges(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
  
  const permissions = useMemo<UserPermissions>(() => {
    // Get role privileges as fallback
    const rolePrivileges = getRolePrivileges(role)
    
    // Extract privilege IDs from database
    const dbPrivilegeIds = dbPrivileges.map((p: any) => p.privilege_id)
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[usePermissions] Role:', role)
      console.log('[usePermissions] DB Privileges:', dbPrivileges)
      console.log('[usePermissions] DB Privilege IDs:', dbPrivilegeIds)
      console.log('[usePermissions] Role Privileges:', rolePrivileges)
    }
    
    // Combine: use database privileges if available, otherwise fall back to role privileges
    const allPrivileges = dbPrivileges.length > 0 ? dbPrivilegeIds : rolePrivileges
    
    // Helper to check if user has a privilege
    const hasPrivilege = (privilege: Privilege): boolean => {
      return allPrivileges.includes(privilege)
    }
    
    // Check if user has admin-level privileges
    const hasAdminPrivileges = hasPrivilege('assign_privileges') || 
                               hasPrivilege('manage_users') || 
                               hasPrivilege('view_audit_logs')
    
    return {
      role,
      privileges: allPrivileges,
      canAccessRoute: (pathname: string) => checkRouteAccess(role, pathname),
      hasPrivilege,
      hasAnyPrivilege: (privileges: Privilege[]) => privileges.some(p => hasPrivilege(p)),
      hasAllPrivileges: (privileges: Privilege[]) => privileges.every(p => hasPrivilege(p)),
      isAdmin: hasAdminPrivileges,
      isHR: role === ROLES.HR,
      isTeacher: role === ROLES.TEACHER,
      isStudent: role === ROLES.STUDENT,
    }
  }, [role, dbPrivileges])
  
  return permissions
}

/**
 * Hook to check if user has a specific privilege
 * Returns boolean for conditional rendering
 * 
 * Usage:
 * ```tsx
 * const canManageUsers = useHasPrivilege('manage_users')
 * 
 * if (canManageUsers) {
 *   return <UserManagementPanel />
 * }
 * ```
 */
export function useHasPrivilege(privilege: Privilege): boolean {
  const permissions = usePermissions()
  return permissions.hasPrivilege(privilege)
}

/**
 * Hook to check if user has any of the specified privileges
 * 
 * Usage:
 * ```tsx
 * const canViewSchedules = useHasAnyPrivilege([
 *   'view_all_events',
 *   'view_team_availability'
 * ])
 * ```
 */
export function useHasAnyPrivilege(privileges: Privilege[]): boolean {
  const permissions = usePermissions()
  return permissions.hasAnyPrivilege(privileges)
}

/**
 * Hook to check if user has all of the specified privileges
 * 
 * Usage:
 * ```tsx
 * const canFullyManageEvents = useHasAllPrivileges([
 *   'create_events',
 *   'manage_all_events',
 *   'approve_events'
 * ])
 * ```
 */
export function useHasAllPrivileges(privileges: Privilege[]): boolean {
  const permissions = usePermissions()
  return permissions.hasAllPrivileges(privileges)
}

/**
 * Hook to check if user can access a specific route
 * 
 * Usage:
 * ```tsx
 * const canAccessAdmin = useCanAccessRoute('/admin')
 * 
 * if (!canAccessAdmin) {
 *   return <AccessDenied />
 * }
 * ```
 */
export function useCanAccessRoute(pathname: string): boolean {
  const permissions = usePermissions()
  return permissions.canAccessRoute(pathname)
}

/**
 * Hook to check if user is an admin
 * 
 * Usage:
 * ```tsx
 * const isAdmin = useIsAdmin()
 * 
 * if (isAdmin) {
 *   return <AdminDashboard />
 * }
 * ```
 */
export function useIsAdmin(): boolean {
  const permissions = usePermissions()
  return permissions.isAdmin
}

/**
 * Hook to check if user is HR
 */
export function useIsHR(): boolean {
  const permissions = usePermissions()
  return permissions.isHR
}

/**
 * Hook to check if user is a teacher
 */
export function useIsTeacher(): boolean {
  const permissions = usePermissions()
  return permissions.isTeacher
}

/**
 * Hook to check if user is a student
 */
export function useIsStudent(): boolean {
  const permissions = usePermissions()
  return permissions.isStudent
}

/**
 * Hook to get user's role
 * 
 * Usage:
 * ```tsx
 * const role = useRole()
 * 
 * switch (role) {
 *   case 'admin':
 *     return <AdminView />
 *   case 'teacher':
 *     return <TeacherView />
 *   default:
 *     return <StudentView />
 * }
 * ```
 */
export function useRole(): Role {
  const permissions = usePermissions()
  return permissions.role
}
