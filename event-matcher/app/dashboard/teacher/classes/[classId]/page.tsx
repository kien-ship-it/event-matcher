'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import {
  getClassDetails,
  getClassStudentsWithAvailability,
  isTeacherForClass,
  subscribeToEnrollments,
} from '@/lib/api/classes'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, Calendar, Mail } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { StudentAvailabilityViewer } from '@/components/teacher/StudentAvailabilityViewer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ClassDetailPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const classId = params.classId as string

  // Check if user is teacher for this class
  const { data: isTeacher } = useQuery({
    queryKey: ['is-teacher', user?.id, classId],
    queryFn: () => isTeacherForClass(user!.id, classId),
    enabled: !!user && !!classId,
  })

  // Fetch class details
  const { data: classDetails, isLoading: isLoadingClass } = useQuery({
    queryKey: ['class-details', classId],
    queryFn: () => getClassDetails(classId),
    enabled: !!classId && isTeacher === true,
  })

  // Fetch students with availability
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => getClassStudentsWithAvailability(classId),
    enabled: !!classId && isTeacher === true,
  })

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user || !classId) return

    const unsubscribe = subscribeToEnrollments(() => {
      queryClient.invalidateQueries({ queryKey: ['class-details', classId] })
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] })
      toast.info('Student enrollment updated')
    })

    return () => {
      unsubscribe()
    }
  }, [user, classId, queryClient])

  // Redirect if not authorized
  useEffect(() => {
    if (isTeacher === false) {
      toast.error('You are not authorized to view this class')
      router.push('/dashboard/teacher/classes')
    }
  }, [isTeacher, router])

  if (!user || !profile) {
    return (
      <div className="container mx-auto py-8">
        <p>Please log in to view class details.</p>
      </div>
    )
  }

  if (profile.role_id !== 'teacher') {
    router.push('/dashboard')
    return null
  }

  const isLoading = isLoadingClass || isLoadingStudents

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/teacher/classes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Classes
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{classDetails?.name || 'Loading...'}</h1>
            <p className="text-muted-foreground">{classDetails?.subject}</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Class Info */}
      {!isLoading && classDetails && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Class Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Class Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{classDetails.subject}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="font-medium">{classDetails.class_enrollments.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(classDetails.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Teacher Info */}
            {classDetails.teacher && (
              <Card>
                <CardHeader>
                  <CardTitle>Teacher</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={classDetails.teacher.avatar_url || undefined} />
                      <AvatarFallback>
                        {classDetails.teacher.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{classDetails.teacher.full_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {classDetails.teacher.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Student Roster */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Roster
              </CardTitle>
              <CardDescription>
                {students.length} {students.length === 1 ? 'student' : 'students'} enrolled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students enrolled in this class yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={student.avatar_url || undefined} />
                          <AvatarFallback>
                            {student.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {student.availability.length} availability{' '}
                            {student.availability.length === 1 ? 'slot' : 'slots'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Availability Viewer */}
          {students.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Student Availability
                </CardTitle>
                <CardDescription>
                  View when your students are available for scheduling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentAvailabilityViewer students={students} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
