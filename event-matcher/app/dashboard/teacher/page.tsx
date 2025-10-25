'use client'

import { useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Calendar, Clock, Users, BookOpen } from 'lucide-react'

export default function TeacherDashboardPage() {
  const router = useRouter()
  const { data: profile } = useProfile()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Teacher Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {profile?.full_name}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/profile')}
            >
              Profile
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick Actions */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                Manage your available time slots
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => router.push('/schedule')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View your upcoming events
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => router.push('/dashboard/teacher/classes')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View assigned classes
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => router.push('/dashboard/teacher/classes')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View student information
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Overview Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your schedule for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p>No upcoming events</p>
                <p className="text-sm mt-1">
                  Events will appear here once scheduled
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
