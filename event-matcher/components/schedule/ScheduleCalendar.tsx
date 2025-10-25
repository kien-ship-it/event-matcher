'use client'

import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import luxonPlugin from '@fullcalendar/luxon'
import { EventInput, EventClickArg } from '@fullcalendar/core'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users, FileText } from 'lucide-react'
import { EventWithParticipants } from '@/lib/api/events'
import { format } from 'date-fns'

interface ScheduleCalendarProps {
  events: EventWithParticipants[]
  isLoading?: boolean
  timeZone?: string
}

// Event type color mapping
const EVENT_TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  class: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff' }, // blue
  meeting: { bg: '#10b981', border: '#059669', text: '#ffffff' }, // green
  training: { bg: '#8b5cf6', border: '#7c3aed', text: '#ffffff' }, // purple
  workshop: { bg: '#f59e0b', border: '#d97706', text: '#ffffff' }, // amber
  event: { bg: '#ec4899', border: '#db2777', text: '#ffffff' }, // pink
  other: { bg: '#6b7280', border: '#4b5563', text: '#ffffff' }, // gray
}

export function ScheduleCalendar({
  events,
  isLoading = false,
  timeZone = 'local',
}: ScheduleCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [calendarEvents, setCalendarEvents] = useState<EventInput[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventWithParticipants | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [isCalendarReady, setIsCalendarReady] = useState(false)

  // Scroll to 7am on initial load
  useEffect(() => {
    if (isCalendarReady && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      scrollContainer.style.scrollBehavior = 'auto'
      
      const timeSlot = scrollContainer.querySelector('[data-time="07:00:00"]')
      if (timeSlot) {
        const slotTop = (timeSlot as HTMLElement).offsetTop
        scrollContainer.scrollTop = slotTop - 20
      } else {
        const hourHeight = 60
        scrollContainer.scrollTop = 7 * hourHeight
      }
      
      setTimeout(() => {
        scrollContainer.style.scrollBehavior = 'smooth'
      }, 100)
    }
  }, [isCalendarReady])

  // Convert events to FullCalendar format
  useEffect(() => {
    const formattedEvents: EventInput[] = events.map((event) => {
      const eventTypeColors = EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.other

      return {
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        backgroundColor: eventTypeColors.bg,
        borderColor: eventTypeColors.border,
        textColor: eventTypeColors.text,
        extendedProps: {
          eventType: event.event_type,
          description: event.description,
          location: event.location,
          participants: event.participants,
          createdBy: event.created_by_user,
          subject: event.subject,
          meetingLink: event.meeting_link,
          attachments: event.attachments,
        },
      }
    })

    setCalendarEvents(formattedEvents)
  }, [events])

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id
    const event = events.find((e) => e.id === eventId)
    
    if (event) {
      setSelectedEvent(event)
      setShowDetailsDialog(true)
    }
  }

  const getEventTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const getEventTypeColor = (type: string) => {
    const colors = EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.other
    return colors.bg
  }

  return (
    <>
      <Card className="p-4">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">My Schedule</h2>
              <p className="text-sm text-muted-foreground">
                View all your scheduled events. Events are managed by administrators.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-green-500" />
                <span className="text-sm">One-time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-blue-500" />
                <span className="text-sm">Recurring</span>
              </div>
            </div>
          </div>
          <div ref={scrollContainerRef} className="fc-scroller-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, luxonPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              timeZone={timeZone}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              slotDuration="00:15:00"
              slotLabelInterval="01:00"
              allDaySlot={false}
              height="auto"
              events={calendarEvents}
              eventClick={handleEventClick}
              editable={false}
              selectable={false}
              selectMirror={false}
              dayMaxEvents={true}
              weekends={true}
              nowIndicator={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: 'short',
              }}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: 'short',
              }}
              viewDidMount={() => {
                setIsCalendarReady(true)
              }}
            />
          </div>
        </div>

        {/* Event Type Legend */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2">Event Types:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(EVENT_TYPE_COLORS).map(([type, colors]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors.bg }}
                />
                <span className="text-sm text-muted-foreground capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Event Details
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Event Type Badge */}
              <div>
                <Badge
                  style={{
                    backgroundColor: getEventTypeColor(selectedEvent.event_type),
                    color: '#ffffff',
                  }}
                >
                  {getEventTypeLabel(selectedEvent.event_type)}
                </Badge>
              </div>

              {/* Date and Time */}
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEvent.start_time), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedEvent.start_time), 'h:mm a')} -{' '}
                    {format(new Date(selectedEvent.end_time), 'h:mm a')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration:{' '}
                    {Math.round(
                      (new Date(selectedEvent.end_time).getTime() -
                        new Date(selectedEvent.start_time).getTime()) /
                        60000
                    )}{' '}
                    minutes
                  </p>
                </div>
              </div>

              {/* Subject */}
              {selectedEvent.subject && (
                <div>
                  <p className="font-medium mb-1">Subject</p>
                  <p className="text-sm text-muted-foreground">{selectedEvent.subject}</p>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedEvent.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Location</p>
                    <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                  </div>
                </div>
              )}

              {/* Meeting Link */}
              {selectedEvent.meeting_link && (
                <div>
                  <p className="font-medium mb-1">Meeting Link</p>
                  <a
                    href={selectedEvent.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedEvent.meeting_link}
                  </a>
                </div>
              )}

              {/* Participants */}
              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-2">
                      Participants ({selectedEvent.participants.length})
                    </p>
                    <div className="space-y-1">
                      {selectedEvent.participants.map((participant) => (
                        <div
                          key={participant.user_id}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span>{participant.full_name}</span>
                          <span className="text-xs">({participant.email})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Created By */}
              {selectedEvent.created_by_user && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Created by {selectedEvent.created_by_user.full_name}
                  </p>
                </div>
              )}

              {/* Recurring Info */}
              {selectedEvent.is_recurring && (
                <div className="pt-4 border-t">
                  <Badge variant="outline">Recurring Event</Badge>
                  {selectedEvent.recurrence_end_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Repeats until{' '}
                      {format(new Date(selectedEvent.recurrence_end_date), 'MMMM d, yyyy')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .fc-scroller-container .fc-scroller {
          overflow-y: auto !important;
          max-height: 600px;
        }
        
        .fc-event {
          cursor: pointer;
        }
        
        .fc-event:hover {
          opacity: 0.9;
        }
      `}</style>
    </>
  )
}
