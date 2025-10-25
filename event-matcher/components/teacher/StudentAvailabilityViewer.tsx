'use client'

import { useState, useMemo } from 'react'
import { StudentWithAvailability } from '@/lib/api/classes'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface StudentAvailabilityViewerProps {
  students: StudentWithAvailability[]
}

export function StudentAvailabilityViewer({ students }: StudentAvailabilityViewerProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  )

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  )

  // Group availability by day of week for recurring slots
  const groupedAvailability = useMemo(() => {
    if (!selectedStudent) return { recurring: [], oneTime: [] }

    const recurring = selectedStudent.availability.filter((slot) => slot.is_recurring)
    const oneTime = selectedStudent.availability.filter((slot) => !slot.is_recurring)

    return { recurring, oneTime }
  }, [selectedStudent])

  const getDayName = (dayOfWeek: number | null) => {
    if (dayOfWeek === null) return 'Daily'
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek]
  }

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a')
    } catch {
      return dateString
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy')
    } catch {
      return dateString
    }
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No students to display availability for.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Select Student:</label>
        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStudent && (
        <div className="space-y-6">
          {/* Recurring Availability */}
          {groupedAvailability.recurring.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recurring Availability
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {groupedAvailability.recurring.map((slot) => (
                  <Card key={slot.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {getDayName(slot.day_of_week)}
                        </Badge>
                        <Badge variant="outline">Recurring</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                      </div>
                      {slot.recurrence_end_date && (
                        <p className="text-xs text-muted-foreground">
                          Until {formatDate(slot.recurrence_end_date)}
                        </p>
                      )}
                      {slot.exception_dates && Array.isArray(slot.exception_dates) && slot.exception_dates.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {slot.exception_dates.length} exception{' '}
                          {slot.exception_dates.length === 1 ? 'date' : 'dates'}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* One-Time Availability */}
          {groupedAvailability.oneTime.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                One-Time Availability
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {groupedAvailability.oneTime.map((slot) => (
                  <Card key={slot.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {formatDate(slot.start_time)}
                        </Badge>
                        <Badge variant="outline">One-time</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Availability */}
          {groupedAvailability.recurring.length === 0 &&
            groupedAvailability.oneTime.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{selectedStudent.full_name} has not set any availability yet.</p>
              </div>
            )}
        </div>
      )}
    </div>
  )
}
