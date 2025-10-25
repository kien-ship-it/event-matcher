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
import { Calendar, Clock, MessageSquare, BookOpen } from 'lucide-react'

export default function StudentDashboardPage() {
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
                Student Dashboard
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
                Set your available times
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => router.push('/schedule')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View your schedule
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Request Meeting
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Request a meeting with staff
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View enrolled classes
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
                  Your scheduled events will appear here
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meeting Requests</CardTitle>
              <CardDescription>Status of your meeting requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p>No pending requests</p>
                <p className="text-sm mt-1">
                  Your meeting requests will be shown here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
