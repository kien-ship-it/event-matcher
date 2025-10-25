import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessRoute, type Role } from '@/lib/auth/permissions'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/reset-password', '/update-password']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/availability',
    '/schedule',
    '/profile',
    '/admin',
  ]
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  if (isPublicRoute && user && pathname !== '/update-password') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Check role-based permissions for authenticated users
  if (user && isProtectedRoute) {
    // Get user's profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      const userRole = profile.role_id as Role
      
      // For /admin routes, check if user has admin privileges from database
      if (pathname.startsWith('/admin')) {
        const { data: userPrivileges } = await supabase
          .from('user_all_privileges')
          .select('privilege_id')
          .eq('user_id', user.id)
        
        const privilegeIds = userPrivileges?.map(p => p.privilege_id) || []
        
        // Allow access if user has any admin-level privilege
        const hasAdminAccess = privilegeIds.some(p => 
          ['assign_privileges', 'manage_users', 'view_all_users', 'view_audit_logs'].includes(p)
        )
        
        if (!hasAdminAccess) {
          // No admin privileges, redirect to dashboard
          const redirectUrl = request.nextUrl.clone()
          
          if (userRole === 'student') {
            redirectUrl.pathname = '/dashboard/student'
          } else if (userRole === 'teacher') {
            redirectUrl.pathname = '/dashboard/teacher'
          } else {
            redirectUrl.pathname = '/dashboard/business'
          }
          
          return NextResponse.redirect(redirectUrl)
        }
      } else {
        // For non-admin routes, use role-based check
        if (!canAccessRoute(userRole, pathname)) {
          // Redirect to appropriate dashboard based on role
          const redirectUrl = request.nextUrl.clone()
          
          if (userRole === 'student') {
            redirectUrl.pathname = '/dashboard/student'
          } else if (userRole === 'teacher') {
            redirectUrl.pathname = '/dashboard/teacher'
          } else {
            redirectUrl.pathname = '/dashboard/business'
          }
          
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export default proxy
