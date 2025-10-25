'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { getTeacherClasses, subscribeToClasses, subscribeToEnrollments } from '@/lib/api/classes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export default function TeacherClassesPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch teacher's classes
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: () => getTeacherClasses(user!.id),
    enabled: !!user,
  })

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user) return

    const unsubscribeClasses = subscribeToClasses(() => {
      queryClient.invalidateQueries({ queryKey: ['teacher-classes', user.id] })
      toast.info('Class information updated')
    })

    const unsubscribeEnrollments = subscribeToEnrollments(() => {
      queryClient.invalidateQueries({ queryKey: ['teacher-classes', user.id] })
      toast.info('Student enrollment updated')
    })

    return () => {
      unsubscribeClasses()
      unsubscribeEnrollments()
    }
  }, [user, queryClient])

  if (!user || !profile) {
    return (
      <div className="container mx-auto py-8">
        <p>Please log in to view your classes.</p>
      </div>
    )
  }

  if (profile.role_id !== 'teacher') {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/teacher">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">My Classes</h1>
            <p className="text-muted-foreground">
              View and manage your assigned classes
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && classes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have any classes assigned yet. Contact your administrator
              to get assigned to classes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Classes Grid */}
      {!isLoading && classes.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card
              key={classItem.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/teacher/classes/${classItem.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {classItem.name}
                </CardTitle>
                <CardDescription>{classItem.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {classItem.class_enrollments.length}{' '}
                      {classItem.class_enrollments.length === 1 ? 'student' : 'students'}
                    </span>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    View Class Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">
                  {classes.reduce((sum, c) => sum + c.class_enrollments.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Class Size</p>
                <p className="text-2xl font-bold">
                  {classes.length > 0
                    ? Math.round(
                        classes.reduce((sum, c) => sum + c.class_enrollments.length, 0) /
                          classes.length
                      )
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
