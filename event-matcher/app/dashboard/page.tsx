'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile, useUser } from '@/hooks/useAuth'

/**
 * Main dashboard page that redirects users to their role-specific dashboard
 */
export default function DashboardPage() {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: profile, isLoading: profileLoading } = useProfile()

  useEffect(() => {
    if (!userLoading && !profileLoading) {
      if (profile) {
        // Redirect based on role
        switch (profile.role_id) {
          case 'admin':
            router.push('/dashboard/business')
            break
          case 'teacher':
            router.push('/dashboard/teacher')
            break
          case 'student':
            router.push('/dashboard/student')
            break
          case 'marketing':
          case 'hr':
          case 'operations':
            router.push('/dashboard/business')
            break
          default:
            // Default to business dashboard
            router.push('/dashboard/business')
        }
      } else if (!profile && user) {
        // User exists but no profile - show error
        console.error('Profile not found for user:', user.id)
      }
    }
  }, [user, profile, userLoading, profileLoading, router])

  // Show error if profile fetch failed
  if (!userLoading && !profileLoading && !profile && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="mb-4 text-red-600">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">
            Your account exists but no profile was found in the database. This usually means:
          </p>
          <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
            <li>• Database migrations haven't been run</li>
            <li>• Profile wasn't created during signup</li>
            <li>• Database connection issue</li>
          </ul>
          <button
            onClick={() => router.push('/profile')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
          >
            Try Profile Page
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
        {userLoading && <p className="text-xs text-gray-500 mt-2">Checking authentication...</p>}
        {!userLoading && profileLoading && <p className="text-xs text-gray-500 mt-2">Loading profile...</p>}
      </div>
    </div>
  )
}
