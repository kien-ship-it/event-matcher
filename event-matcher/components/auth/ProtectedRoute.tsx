'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUser, usePrivileges } from '@/hooks/useAuth'
import { hasPrivilege, hasAnyPrivilege, hasAllPrivileges } from '@/lib/auth/rbac'
import type { PrivilegeId } from '@/types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPrivilege?: PrivilegeId
  requiredPrivileges?: PrivilegeId[]
  requireAll?: boolean
  fallback?: React.ReactNode
}

/**
 * Component to protect routes based on authentication and privileges
 * 
 * @param children - Content to render if authorized
 * @param requiredPrivilege - Single privilege required to access
 * @param requiredPrivileges - Array of privileges (checks if user has any by default)
 * @param requireAll - If true with requiredPrivileges, user must have all privileges
 * @param fallback - Optional custom fallback component
 */
export function ProtectedRoute({
  children,
  requiredPrivilege,
  requiredPrivileges,
  requireAll = false,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: privileges = [], isLoading: privilegesLoading } = usePrivileges()
  
  const userHasPrivilege = requiredPrivilege ? hasPrivilege(privileges, requiredPrivilege) : true
  const userHasAnyPrivilege = requiredPrivileges ? hasAnyPrivilege(privileges, requiredPrivileges) : true
  const userHasAllPrivileges = requiredPrivileges ? hasAllPrivileges(privileges, requiredPrivileges) : true

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  // Show loading state
  if (userLoading || privilegesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    return null
  }

  // Check privilege requirements
  if (requiredPrivilege && !userHasPrivilege) {
    if (fallback) return <>{fallback}</>
    router.push('/unauthorized')
    return null
  }

  if (requiredPrivileges && requiredPrivileges.length > 0) {
    if (requireAll) {
      // Check if user has all required privileges
      if (!userHasAllPrivileges) {
        if (fallback) return <>{fallback}</>
        router.push('/unauthorized')
        return null
      }
    } else {
      // Check if user has any of the required privileges
      if (!userHasAnyPrivilege) {
        if (fallback) return <>{fallback}</>
        router.push('/unauthorized')
        return null
      }
    }
  }

  return <>{children}</>
}
