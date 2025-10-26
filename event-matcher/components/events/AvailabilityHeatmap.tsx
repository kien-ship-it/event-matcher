'use client'

import { useQuery } from '@tanstack/react-query'
import { UserWithRole } from '@/lib/api/users'
import { getAvailability } from '@/lib/api/availability'
import { getEventsForUsers } from '@/lib/api/events'
import { expandRecurringEvents } from '@/lib/utils/recurring'
import { useMemo, useRef, useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput } from '@fullcalendar/core'
import { Card } from '@/components/ui/card'

interface AvailabilityHeatmapProps {
  participants: UserWithRole[]
  highlightedUserIds: string[]
  startDate?: string // ISO date string
  endDate?: string // ISO date string
}

export function AvailabilityHeatmap({
  participants,
  highlightedUserIds,
  startDate,
  endDate,
}: AvailabilityHeatmapProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isCalendarReady, setIsCalendarReady] = useState(false)

  // Fetch availability for all participants
  const availabilityQueries = useQuery({
    queryKey: ['availability-multiple', participants.map((p) => p.id), startDate, endDate],
    queryFn: async () => {
      console.log('🔍 Fetching availability for participants:', participants.map(p => p.id))
      const results = await Promise.all(
        participants.map(async (participant) => {
          const availability = await getAvailability(participant.id)
          console.log(`  User ${participant.id}: ${availability.length} availability slots`)
          console.log(`    Recurring: ${availability.filter(a => a.is_recurring).length}`)
          console.log(`    One-off: ${availability.filter(a => !a.is_recurring).length}`)
          return { userId: participant.id, availability }
        })
      )
      console.log('✅ Availability fetch complete:', results.length, 'users')
      return results
    },
    enabled: participants.length > 0,
  })

  // Fetch events for all participants
  const eventsQuery = useQuery({
    queryKey: ['events-multiple', participants.map((p) => p.id), startDate, endDate],
    queryFn: async () => {
      const userIds = participants.map((p) => p.id)
      const events = await getEventsForUsers(userIds, startDate, endDate)
      console.log('Fetched events for participants:', events.length, 'events')
      console.log('Recurring events:', events.filter(e => e.is_recurring).length)
      console.log('One-off events:', events.filter(e => !e.is_recurring).length)
      return events
    },
    enabled: participants.length > 0 && !!startDate && !!endDate,
  })

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

  // Process availability data into 15-minute slot aggregations for heatmap
  const calendarEvents = useMemo(() => {
    if (!availabilityQueries.data || !startDate || !endDate) return []

    console.log('🗓️ Processing availability for heatmap...')
    console.log('  Date range:', startDate, 'to', endDate)
    console.log('  Participants:', availabilityQueries.data.length)

    const events: EventInput[] = []
    // Map of 15-minute slots: "2024-01-15T09:00:00" -> { count, hasHighlighted, users }
    const slotMap = new Map<string, { count: number; hasHighlighted: boolean; users: string[] }>()

    // Calculate date range for calendar
    const rangeStart = new Date(startDate)
    const rangeEnd = new Date(endDate)

    availabilityQueries.data.forEach(({ userId, availability }) => {
      const recurringSlots = availability.filter(s => s.is_recurring)
      const oneOffSlots = availability.filter(s => !s.is_recurring)
      console.log(`  User ${userId}: ${recurringSlots.length} recurring, ${oneOffSlots.length} one-off slots`)
      
      availability.forEach((slot) => {
        console.log('    📋 Slot:', {
          is_recurring: slot.is_recurring,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time?.substring(0, 19),
          end_time: slot.end_time?.substring(0, 19)
        })
        
        if (slot.is_recurring) {
          console.log('    🔁 Processing recurring slot:', {
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time
          })
          
          // Handle recurring availability (both daily and weekly)
          const slotStart = new Date(slot.start_time)
          const slotEnd = new Date(slot.end_time)
          const startHours = slotStart.getHours()
          const startMinutes = slotStart.getMinutes()
          const endHours = slotEnd.getHours()
          const endMinutes = slotEnd.getMinutes()
          const dayOfWeek = slot.day_of_week

          // Apply to all matching days in the range
          const current = new Date(rangeStart)
          let matchCount = 0
          while (current <= rangeEnd) {
            // For weekly recurring: match specific day of week
            // For daily recurring: match all days
            const shouldInclude = dayOfWeek !== null 
              ? current.getDay() === dayOfWeek 
              : true
            
            if (shouldInclude) {
              matchCount++
              // Check exception dates
              const dateStr = current.toISOString().split('T')[0]
              const exceptionDates = (slot.exception_dates as string[]) || []
              const isException = exceptionDates.some(exDate => {
                const normalized = exDate.includes('T') ? exDate.split('T')[0] : exDate
                return normalized === dateStr
              })
              
              // Check recurrence end date
              const recurrenceEndDate = slot.recurrence_end_date
              const isAfterEndDate = recurrenceEndDate && current > new Date(recurrenceEndDate)
              
              if (!isException && !isAfterEndDate) {
                // Break into 15-minute slots
                const startTotalMinutes = startHours * 60 + startMinutes
                const endTotalMinutes = endHours * 60 + endMinutes
                
                for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 15) {
                  const slotHour = Math.floor(minutes / 60)
                  const slotMinute = minutes % 60
                  
                  const slotTime = new Date(current)
                  slotTime.setHours(slotHour, slotMinute, 0, 0)
                  const key = slotTime.toISOString()
                  
                  const existing = slotMap.get(key)
                  if (existing) {
                    existing.count++
                    if (!existing.users.includes(userId)) {
                      existing.users.push(userId)
                    }
                    if (highlightedUserIds.includes(userId)) {
                      existing.hasHighlighted = true
                    }
                  } else {
                    slotMap.set(key, {
                      count: 1,
                      hasHighlighted: highlightedUserIds.includes(userId),
                      users: [userId]
                    })
                  }
                }
              }
            }
            current.setDate(current.getDate() + 1)
          }
          const recurrenceType = dayOfWeek !== null ? `weekly (day ${dayOfWeek})` : 'daily'
          console.log(`      → Generated ${matchCount} instances for ${recurrenceType}`)
        } else {
          // Handle one-time availability
          const start = new Date(slot.start_time)
          const end = new Date(slot.end_time)
          
          if (start >= rangeStart && start <= rangeEnd) {
            // Break into 15-minute slots
            const current = new Date(start)
            while (current < end) {
              const key = current.toISOString()
              const existing = slotMap.get(key)
              
              if (existing) {
                existing.count++
                if (!existing.users.includes(userId)) {
                  existing.users.push(userId)
                }
                if (highlightedUserIds.includes(userId)) {
                  existing.hasHighlighted = true
                }
              } else {
                slotMap.set(key, {
                  count: 1,
                  hasHighlighted: highlightedUserIds.includes(userId),
                  users: [userId]
                })
              }
              
              current.setTime(current.getTime() + 15 * 60 * 1000) // Add 15 minutes
            }
          }
        }
      })
    })

    console.log('✅ Availability processing complete:')
    console.log('  Total 15-min slots:', slotMap.size)

    // Convert 15-minute slots to calendar background events with heatmap colors
    const totalParticipants = participants.length
    
    // Define 5 levels of green opacity (when2meet style)
    const greenLevels = [
      { opacity: 0.2, rgb: '34, 197, 94' },   // Level 1: Faintest
      { opacity: 0.35, rgb: '34, 197, 94' },  // Level 2
      { opacity: 0.5, rgb: '34, 197, 94' },   // Level 3
      { opacity: 0.65, rgb: '34, 197, 94' },  // Level 4
      { opacity: 1, rgb: '34, 197, 94' },  // Level 5: Darkest
    ]
    
    // Define 5 levels of blue opacity for highlighted participants
    const blueLevels = [
      { opacity: 0.2, rgb: '59, 130, 246' },   // Level 1: Faintest
      { opacity: 0.35, rgb: '59, 130, 246' },  // Level 2
      { opacity: 0.5, rgb: '59, 130, 246' },   // Level 3
      { opacity: 0.65, rgb: '59, 130, 246' },  // Level 4
      { opacity: 1, rgb: '59, 130, 246' },  // Level 5: Darkest
    ]
    
    slotMap.forEach((data, startStr) => {
      const start = new Date(startStr)
      const end = new Date(start.getTime() + 15 * 60 * 1000) // 15 minutes later
      
      // Determine which level this slot belongs to
      // Always use extremes (1 and 5), fill in middle as participant count increases
      let level: number
      let displayText: string
      
      if (totalParticipants === 1) {
        // Only 1 participant: use level 0 (faintest)
        level = 0
        displayText = '1'
      } else if (totalParticipants === 2) {
        // 2 participants: use levels 0 and 4 (faintest and darkest)
        level = data.count === 1 ? 0 : 4
        displayText = `${data.count}`
      } else if (totalParticipants === 3) {
        // 3 participants: use levels 0, 2, 4 (faintest, middle, darkest)
        level = data.count === 1 ? 0 : data.count === 2 ? 2 : 4
        displayText = `${data.count}`
      } else if (totalParticipants === 4) {
        // 4 participants: use levels 0, 1, 3, 4
        level = data.count === 1 ? 0 : data.count === 2 ? 1 : data.count === 3 ? 3 : 4
        displayText = `${data.count}`
      } else if (totalParticipants === 5) {
        // 5 participants: use all 5 levels (0, 1, 2, 3, 4)
        level = data.count - 1
        displayText = `${data.count}`
      } else {
        // More than 5 participants: map to 5 levels
        // Always: 1 person = level 0, all = level 4
        if (data.count === 1) {
          level = 0
          displayText = '1'
        } else if (data.count === totalParticipants) {
          level = 4
          displayText = 'All'
        } else {
          // Distribute middle counts across levels 1, 2, 3
          const ratio = (data.count - 1) / (totalParticipants - 1)
          level = Math.min(3, Math.max(1, Math.floor(ratio * 4)))
          displayText = `${data.count}`
        }
      }
      
      // Get color based on level
      const levels = data.hasHighlighted ? blueLevels : greenLevels
      const colorLevel = levels[level]
      const backgroundColor = `rgba(${colorLevel.rgb}, ${colorLevel.opacity})`
      const borderColor = data.hasHighlighted 
        ? `rgba(37, 99, 235, 0.15)` 
        : `rgba(22, 163, 74, 0.15)`

      events.push({
        start: start.toISOString(),
        end: end.toISOString(),
        display: 'background',
        backgroundColor,
        borderColor,
        extendedProps: {
          availableCount: data.count,
          totalParticipants,
          users: data.users,
          hasHighlighted: data.hasHighlighted,
          level: level + 1,
          displayText
        }
      })
    })

    return events
  }, [availabilityQueries.data, highlightedUserIds, participants.length, startDate, endDate])

  // Process events to display as busy times on the calendar
  const eventBlocks = useMemo(() => {
    if (!eventsQuery.data || !startDate || !endDate) return []

    console.log('🔄 Expanding recurring events...')
    console.log('  Input events:', eventsQuery.data.length)
    console.log('  Recurring events:', eventsQuery.data.filter(e => e.is_recurring).length)
    console.log('  Date range:', startDate, 'to', endDate)
    
    // Log recurring event details
    eventsQuery.data.filter(e => e.is_recurring).forEach(event => {
      console.log('  📅 Recurring event:', {
        id: event.id,
        title: event.title,
        start_time: event.start_time,
        end_time: event.end_time,
        recurrence_pattern: event.recurrence_pattern,
        recurrence_end_date: event.recurrence_end_date
      })
    })
    
    // Expand recurring events into individual instances
    const expandedEvents = expandRecurringEvents(
      eventsQuery.data as any[], // Cast to ScheduleItem[] compatible type
      startDate,
      endDate
    )
    console.log('✅ Expanded events:', expandedEvents.length, 'instances')
    console.log('  Recurring instances:', expandedEvents.filter(e => e.is_recurring === false && e.id.includes('-')).length)
    console.log('  One-off events:', expandedEvents.filter(e => !e.id.includes('-')).length)

    const events: EventInput[] = []
    
    expandedEvents.forEach((event) => {
      // Display events as red blocks to show busy times
      events.push({
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        backgroundColor: '#ef4444', // red
        borderColor: '#dc2626',
        textColor: '#ffffff',
        display: 'block',
        extendedProps: {
          eventType: event.event_type,
          description: event.description,
          isRecurring: event.is_recurring
        }
      })
    })

    return events
  }, [eventsQuery.data, startDate, endDate])

  // Combine availability heatmap and event blocks
  const allCalendarEvents = useMemo(() => {
    return [...calendarEvents, ...eventBlocks]
  }, [calendarEvents, eventBlocks])

  if (availabilityQueries.isLoading || eventsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading availability...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Global styles to control hover behavior for background events */}
      <style jsx global>{`
        /* Ensure background events don't change opacity on hover */
        .fc .fc-bg-event { opacity: 1 !important; }
        .fc .fc-bg-event:hover { opacity: 1 !important; }

        /* Availability slot box fills the cell */
        .availability-slot {
          width: 100%;
          height: 100%;
          border-radius: 0px;
          border: 3px solid transparent;
          transition: border-color 100ms ease;
        }
        /* Hover highlight: blue border only */
        .fc .fc-bg-event:hover .availability-slot[data-hl="0"],
        .fc .fc-bg-event:hover .availability-slot[data-hl="1"] {
          border-color: rgba(59, 130, 246, 0.7); /* blue-500 with 70% opacity */
          box-shadow: none;
        }
      `}</style>
      <div className="space-y-2">
        <h3 className="font-semibold">Availability Heatmap</h3>
        <p className="text-sm text-muted-foreground">
          Darker colors indicate more participants are available. Click and drag to select a time slot for your event.
        </p>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="font-medium text-muted-foreground">Availability levels:</span>
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }} />
            <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: 'rgba(34, 197, 94, 0.35)' }} />
            <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }} />
            <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: 'rgba(34, 197, 94, 0.65)' }} />
            <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: 'rgba(34, 197, 94, 0.95)' }} />
            <span className="text-xs text-muted-foreground ml-1">
              (fewer → more people)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: 'rgba(59, 130, 246, 0.5)' }} />
            <span className="text-muted-foreground">Highlighted participant available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-muted-foreground">Scheduled events (busy)</span>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div ref={scrollContainerRef} className="fc-scroller-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            initialDate={startDate || new Date().toISOString()}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay',
            }}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:15:00"
            slotLabelInterval="01:00"
            allDaySlot={false}
            contentHeight="auto"
            events={allCalendarEvents}
            editable={false}
            selectable={true}
            selectMirror={true}
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
            select={(selectInfo) => {
              // Handle time slot selection for event creation
              console.log('Selected time:', selectInfo.start, 'to', selectInfo.end)
              // TODO: Implement event creation with selected time
            }}
            eventContent={(arg) => {
              // Custom rendering for background events to show availability count
              if (arg.event.display === 'background') {
                const { availableCount, totalParticipants, displayText, level, hasHighlighted } = arg.event.extendedProps
                const tooltip = `${availableCount}/${totalParticipants} available (Level ${level})`
                const hl = hasHighlighted ? '1' : '0'
                return {
                  html: `<div class="availability-slot" data-hl="${hl}" title="${tooltip}"></div>`
                }
              }
              return { html: '' }
            }}
            viewDidMount={() => {
              setIsCalendarReady(true)
            }}
            validRange={{
              start: startDate,
              end: endDate ? new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined
            }}
          />
        </div>
      </Card>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        <p>
          Total participants: {participants.length}
          {highlightedUserIds.length > 0 && ` • Highlighted: ${highlightedUserIds.length}`}
        </p>
      </div>

      <style jsx global>{`
        .fc-scroller-container .fc-scroller {
          overflow-y: auto !important;
        }
        
        /* Reduce time slot height for more compact view */
        .fc-timegrid-slot {
          height: 0.4em !important;
        }
        
        .fc-timegrid-slot-label {
          vertical-align: middle !important;
        }
        
        /* Heatmap styling */
        .fc-timegrid-event.fc-event-start.fc-event-end {
          border: none !important;
        }
        
        .availability-slot {
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        
        /* Make background events fill the entire slot */
        .fc-timegrid-event-harness {
          margin: 0 !important;
        }
        
        .fc-timegrid-event {
          border-radius: 0 !important;
          margin: 0 !important;
        }
        
        /* Hover effect for time slots */
        .fc-timegrid-slot:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
        
        /* Selection styling */
        .fc-highlight {
          background-color: rgba(59, 130, 246, 0.2) !important;
          border: 2px dashed rgba(59, 130, 246, 0.5) !important;
        }
      `}</style>
    </div>
  )
}
