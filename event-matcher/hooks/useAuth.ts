'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database, RoleId, PrivilegeId } from '@/types/database'
import * as rbac from '@/lib/auth/rbac'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserPrivilege = {
  user_id: string
  privilege_id: string
  privilege_name: string
  category: string | null
  source: 'role' | 'user'
}

/**
 * Consolidated auth hook combining user, profile, and privilege data
 */
export function useAuth() {
  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    error: userError,
  } = useUser()
  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
    error: profileError,
  } = useProfile()
  const {
    data: privileges,
    isLoading: isLoadingPrivileges,
    isError: isErrorPrivileges,
    error: privilegesError,
  } = usePrivileges()

  return {
    user,
    profile,
    privileges: privileges ?? [],
    isLoading: isLoadingUser || isLoadingProfile || isLoadingPrivileges,
    isError: isErrorUser || isErrorProfile || isErrorPrivileges,
    error: userError || profileError || privilegesError,
  }
}

/**
 * Hook to get the current authenticated user
 */
export function useUser() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return user
    },
  })
}

/**
 * Hook to get the current user's profile
 */
export function useProfile() {
  const supabase = createClient()
  const { data: user } = useUser()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data as Profile
    },
    enabled: !!user?.id,
  })
}

/**
 * Hook to get the current user's privileges
 */
export function usePrivileges() {
  const supabase = createClient()
  const { data: user } = useUser()

  return useQuery({
    queryKey: ['privileges', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('user_all_privileges')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      return (data as UserPrivilege[]) || []
    },
    enabled: !!user?.id,
  })
}

/**
 * Hook to check if user has a specific privilege
 */
export function useHasPrivilege(privilegeId: PrivilegeId) {
  const { data: privileges = [] } = usePrivileges()
  return rbac.hasPrivilege(privileges, privilegeId)
}

/**
 * Hook to check if user has any of the specified privileges
 */
export function useHasAnyPrivilege(privilegeIds: PrivilegeId[]) {
  const { data: privileges = [] } = usePrivileges()
  return rbac.hasAnyPrivilege(privileges, privilegeIds)
}

/**
 * Hook to check if user has all of the specified privileges
 */
export function useHasAllPrivileges(privilegeIds: PrivilegeId[]) {
  const { data: privileges = [] } = usePrivileges()
  return rbac.hasAllPrivileges(privileges, privilegeIds)
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(roleId: RoleId) {
  const { data: profile } = useProfile()
  return rbac.hasRole(profile || null, roleId)
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roleIds: RoleId[]) {
  const { data: profile } = useProfile()
  return rbac.hasAnyRole(profile || null, roleIds)
}

/**
 * Hook to check if user is a teacher
 */
export function useIsTeacher() {
  const { data: profile } = useProfile()
  return rbac.isTeacher(profile || null)
}

/**
 * Hook to check if user is a student
 */
export function useIsStudent() {
  const { data: profile } = useProfile()
  return rbac.isStudent(profile || null)
}

/**
 * Hook to check if user is in a business role
 */
export function useIsBusinessRole() {
  const { data: profile } = useProfile()
  return rbac.isBusinessRole(profile || null)
}

/**
 * Hook to check if user can approve events
 */
export function useCanApproveEvents() {
  const { data: privileges = [] } = usePrivileges()
  return rbac.canApproveEvents(privileges)
}

/**
 * Hook to check if user can create events
 */
export function useCanCreateEvents() {
  const { data: privileges = [] } = usePrivileges()
  return rbac.canCreateEvents(privileges)
}

/**
 * Hook to check if user can view all events
 */
export function useCanViewAllEvents() {
  const { data: privileges = [] } = usePrivileges()
  return rbac.canViewAllEvents(privileges)
}

/**
 * Hook to check if user can manage users
 */
export function useCanManageUsers() {
  const { data: privileges = [] } = usePrivileges()
  return rbac.canManageUsers(privileges)
}

/**
 * Hook to check if user can view all availability
 */
export function useCanViewAllAvailability() {
  const { data: privileges = [] } = usePrivileges()
  return rbac.canViewAllAvailability(privileges)
}

/**
 * Hook to check if user has any admin-level privileges
 */
export function useHasAdminPrivileges() {
  const { data: privileges = [] } = usePrivileges()
  return rbac.hasAdminPrivileges(privileges)
}
