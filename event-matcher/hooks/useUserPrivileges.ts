import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getAllUserPrivileges } from '@/lib/api/users'

/**
 * Hook to get all privileges for the current user (role + user-specific)
 * This fetches from the database, not just the hardcoded role permissions
 */
export function useUserPrivileges() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-all-privileges', user?.id],
    queryFn: () => getAllUserPrivileges(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

/**
 * Hook to check if current user has a specific privilege
 * Checks both role privileges and user-specific privileges from database
 */
export function useHasPrivilege(privilegeId: string): boolean {
  const { data: privileges = [] } = useUserPrivileges()
  return privileges.some((p: any) => p.privilege_id === privilegeId)
}
