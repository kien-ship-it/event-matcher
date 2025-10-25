'use client'

import { useRouter } from 'next/navigation'
import { useProfile, useCanApproveEvents, useCanCreateEvents } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Calendar, Clock, Users, CheckSquare, Plus } from 'lucide-react'

export default function BusinessDashboardPage() {
  const router = useRouter()
  const { data: profile } = useProfile()
  const permissions = usePermissions()
  const canApproveEvents = useCanApproveEvents()
  const canCreateEvents = useCanCreateEvents()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Business Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {profile?.full_name} ({profile?.role_id})
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/profile')}
              >
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => router.push('/schedule')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Master Schedule
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View organization calendar
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => router.push('/availability')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Availability
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Manage your availability
              </p>
            </CardContent>
          </Card>

          {canCreateEvents && (
            <Card className="cursor-pointer transition-shadow hover:shadow-lg bg-blue-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">
                  Create Event
                </CardTitle>
                <Plus className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-blue-700">
                  Schedule a new event
                </p>
              </CardContent>
            </Card>
          )}

          {canApproveEvents && (
            <Card className="cursor-pointer transition-shadow hover:shadow-lg bg-green-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900">
                  Pending Requests
                </CardTitle>
                <CheckSquare className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">0</div>
                <p className="text-xs text-green-700">
                  Requests awaiting approval
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Team View
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View team availability
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features */}
        {(canApproveEvents || canCreateEvents || permissions.hasPrivilege('view_all_users')) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Administrative Tools
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {canApproveEvents && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Event Requests</CardTitle>
                    <CardDescription>
                      Review and approve meeting requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      View Requests
                    </Button>
                  </CardContent>
                </Card>
              )}

              {permissions.hasPrivilege('view_all_users') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">User Management</CardTitle>
                    <CardDescription>
                      Manage users and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => router.push('/admin/users')}
                    >
                      Manage Users
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Event Templates</CardTitle>
                  <CardDescription>
                    Create and manage event templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    View Templates
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Overview Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Organization schedule for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p>No upcoming events</p>
                <p className="text-sm mt-1">
                  Scheduled events will appear here
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p>No recent activity</p>
                <p className="text-sm mt-1">
                  Activity will be tracked here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
