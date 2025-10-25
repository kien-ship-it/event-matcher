'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar'
import { useAuth, useCanCreateEvents } from '@/hooks/useAuth'
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents'
import { getMyEvents } from '@/lib/api/events'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { EventCreationDialog } from '@/components/events/EventCreationDialog'

export default function SchedulePage() {
  const { user } = useAuth()
  const canCreateEvents = useCanCreateEvents()
  const [timeZone, setTimeZone] = useState<string>('local')
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  
  // Set user's timezone after mount to avoid hydration mismatch
  useEffect(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (userTimeZone) {
      setTimeZone(userTimeZone)
    }
  }, [])

  // Setup realtime subscriptions for events with optimistic updates
  useRealtimeEvents({
    userId: user?.id || '',
    enabled: !!user,
    showToasts: true,
  })

  // Fetch events for the user
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', user?.id],
    queryFn: () => getMyEvents(user!.id),
    enabled: !!user,
  })

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <p>Please log in to view your schedule.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          {canCreateEvents && (
            <Button onClick={() => setIsEventDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time zone</span>
          <Select value={timeZone} onValueChange={setTimeZone}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select time zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/New_York">America/New_York</SelectItem>
              <SelectItem value="America/Chicago">America/Chicago</SelectItem>
              <SelectItem value="America/Denver">America/Denver</SelectItem>
              <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
              <SelectItem value="Europe/London">Europe/London</SelectItem>
              <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
              <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
              <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
              <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScheduleCalendar
        events={events}
        timeZone={timeZone}
        isLoading={isLoading}
      />
      
      <EventCreationDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
      />
    </div>
  )
}
