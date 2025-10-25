'use client'

import { useEffect, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import luxonPlugin from '@fullcalendar/luxon'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Repeat, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { validateNoOverlapWithRecurring } from '@/lib/validation/availability'

export interface AvailabilitySlot {
  id: string
  start_time: string
  end_time: string
  is_recurring: boolean | null
  day_of_week?: number | null
  recurrence_end_date?: string | null
  exception_dates?: any // Json type from database (string[] at runtime)
  created_at?: string | null
  updated_at?: string | null
  user_id?: string | null
}

interface AvailabilityCalendarProps {
  slots: AvailabilitySlot[]
  onAddSlot: (start: Date, end: Date) => Promise<void>
  onDeleteSlot: (id: string) => Promise<void>
  onUpdateSlot: (id: string, start: Date, end: Date) => Promise<void>
  onMakeRecurring: (id: string, frequency: 'daily' | 'weekly', startTime: string) => Promise<void>
  onAddExceptionDate: (id: string, date: string) => Promise<void>
  onSetRecurrenceEndDate: (id: string, endDate: string) => Promise<void>
  onCreateRecurringFromDate: (dayOfWeek: number | null, startDate: string, startTime: string, endTime: string) => Promise<void>
  userId: string
  isLoading?: boolean
  timeZone?: string
}

export function AvailabilityCalendar({
  slots,
  onAddSlot,
  onDeleteSlot,
  onUpdateSlot,
  onMakeRecurring,
  onAddExceptionDate,
  onSetRecurrenceEndDate,
  onCreateRecurringFromDate,
  userId,
  isLoading = false,
  timeZone = 'local',
}: AvailabilityCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [events, setEvents] = useState<EventInput[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null)
  const [showOptionsDialog, setShowOptionsDialog] = useState(false)
  const [showRecurringEditDialog, setShowRecurringEditDialog] = useState(false)
  const [showRecurringDeleteDialog, setShowRecurringDeleteDialog] = useState(false)
  const [pendingEdit, setPendingEdit] = useState<{
    eventId: string
    start: Date
    end: Date
    revert: () => void
  } | null>(null)
  const [isCalendarReady, setIsCalendarReady] = useState(false)

  // Scroll to 7am on initial load (no animation)
  useEffect(() => {
    if (isCalendarReady && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) return

      // Disable smooth scrolling temporarily
      scrollContainer.style.scrollBehavior = 'auto'
      
      // Find the 7am time slot
      const timeSlot = scrollContainer.querySelector('[data-time="07:00:00"]')
      if (timeSlot) {
        const slotTop = (timeSlot as HTMLElement).offsetTop
        scrollContainer.scrollTop = slotTop - 20 // Small offset for better visibility
      } else {
        // Fallback: calculate scroll position
        // Each hour is approximately 60px with default FullCalendar sizing
        // 7am = 7 hours from midnight
        const hourHeight = 60
        scrollContainer.scrollTop = 7 * hourHeight
      }
      
      // Re-enable smooth scrolling after initial positioning
      requestAnimationFrame(() => {
        scrollContainer.style.scrollBehavior = 'smooth'
      })
    }
  }, [isCalendarReady])

  // Convert availability slots to FullCalendar events
  useEffect(() => {
    const calendarEvents: EventInput[] = []
    
    slots.forEach((slot) => {
      if (slot.is_recurring) {
        const startDate = new Date(slot.start_time)
        const endDate = new Date(slot.end_time)
        
        // Extract time components
        const startTime = startDate.toTimeString().slice(0, 8) // HH:MM:SS
        const endTime = endDate.toTimeString().slice(0, 8)
        
        // Get exception dates
        const exceptionDates = (slot.exception_dates || []).map((d: string) => {
          const dateOnly = d.includes('T') ? d.split('T')[0] : d
          return dateOnly
        })
        
        console.log('Recurring slot:', slot.id, 'Exception dates:', exceptionDates)
        
        // If there are exception dates, generate individual instances instead of using recurring syntax
        if (exceptionDates.length > 0) {
          // Generate individual event instances, skipping exception dates
          const today = new Date()
          const endLimit = new Date(today)
          endLimit.setMonth(endLimit.getMonth() + 6) // Generate 6 months ahead
          
          const recurrenceEnd = slot.recurrence_end_date ? new Date(slot.recurrence_end_date) : endLimit
          const finalEnd = recurrenceEnd < endLimit ? recurrenceEnd : endLimit
          
          let currentDate = new Date(startDate)
          
          // Note: recurrence_end_date is exclusive (like FullCalendar's endRecur)
          // So we generate events while currentDate < finalEnd (not <=)
          while (currentDate < finalEnd) {
            const dateStr = currentDate.toISOString().split('T')[0]
            
            // Check if this date should be included
            let shouldInclude = false
            if (slot.day_of_week !== null && slot.day_of_week !== undefined) {
              // Weekly: only include if day matches
              shouldInclude = currentDate.getDay() === slot.day_of_week
            } else {
              // Daily: include every day
              shouldInclude = true
            }
            
            // Skip if it's an exception date
            if (shouldInclude && !exceptionDates.includes(dateStr)) {
              const eventStart = new Date(currentDate)
              const [hours, minutes, seconds] = startTime.split(':').map(Number)
              eventStart.setHours(hours, minutes, seconds)
              
              const eventEnd = new Date(currentDate)
              const [endHours, endMinutes, endSeconds] = endTime.split(':').map(Number)
              eventEnd.setHours(endHours, endMinutes, endSeconds)
              
              calendarEvents.push({
                id: `${slot.id}-${dateStr}`,
                start: eventStart.toISOString(),
                end: eventEnd.toISOString(),
                title: 'Available',
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                editable: true,
                extendedProps: {
                  isRecurring: true,
                  originalSlotId: slot.id,
                  dayOfWeek: slot.day_of_week,
                },
              })
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1)
          }
        } else {
          // No exceptions - use FullCalendar's efficient recurring syntax
          if (slot.day_of_week !== null && slot.day_of_week !== undefined) {
            // Weekly recurrence
            calendarEvents.push({
              id: slot.id,
              title: 'Available',
              daysOfWeek: [slot.day_of_week],
              startTime: startTime,
              endTime: endTime,
              startRecur: slot.start_time,
              endRecur: slot.recurrence_end_date || undefined,
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb',
              editable: true,
              extendedProps: {
                isRecurring: true,
                dayOfWeek: slot.day_of_week,
                originalSlotId: slot.id,
              },
            })
          } else {
            // Daily recurrence
            calendarEvents.push({
              id: slot.id,
              title: 'Available',
              startTime: startTime,
              endTime: endTime,
              startRecur: slot.start_time,
              endRecur: slot.recurrence_end_date || undefined,
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb',
              editable: true,
              extendedProps: {
                isRecurring: true,
                originalSlotId: slot.id,
              },
            })
          }
        }
      } else {
        // One-time slot
        calendarEvents.push({
          id: slot.id,
          start: slot.start_time,
          end: slot.end_time,
          title: 'Available',
          backgroundColor: '#10b981',
          borderColor: '#059669',
          editable: true,
          extendedProps: {
            isRecurring: false,
          },
        })
      }
    })
    
    setEvents(calendarEvents)
  }, [slots])

  // Validate time slot (30-min minimum, 15-min increments)
  const validateTimeSlot = (start: Date, end: Date): boolean => {
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
    
    if (durationMinutes < 30) {
      toast.error('Availability slots must be at least 30 minutes long')
      return false
    }

    // Check 15-minute increments
    const startMinutes = start.getMinutes()
    const endMinutes = end.getMinutes()
    
    if (startMinutes % 15 !== 0 || endMinutes % 15 !== 0) {
      toast.error('Time slots must align to 15-minute increments')
      return false
    }

    return true
  }

  // Check for overlaps using comprehensive validation
  const checkOverlap = (start: Date, end: Date, excludeId?: string, isRecurring?: boolean, dayOfWeek?: number | null): boolean => {
    const validation = validateNoOverlapWithRecurring(
      {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        is_recurring: isRecurring || false,
        day_of_week: dayOfWeek,
      },
      slots,
      excludeId
    )

    if (!validation.valid) {
      toast.error(validation.error || 'This time slot overlaps with an existing availability')
      return true
    }

    return false
  }

  // Handle date selection (click/drag to add slot)
  const handleDateSelect = async (selectInfo: DateSelectArg) => {
    const { start, end } = selectInfo

    // Validate
    if (!validateTimeSlot(start, end)) {
      selectInfo.view.calendar.unselect()
      return
    }

    if (checkOverlap(start, end)) {
      selectInfo.view.calendar.unselect()
      return
    }

    try {
      await onAddSlot(start, end)
      toast.success('Availability slot added')
    } catch (error) {
      toast.error('Failed to add availability slot')
      console.error(error)
    }

    selectInfo.view.calendar.unselect()
  }

  // Handle event click - show options dialog
  const handleEventClick = (clickInfo: EventClickArg) => {
    clickInfo.jsEvent.preventDefault()
    
    // For recurring event instances, use the original slot ID
    const eventId = clickInfo.event.extendedProps.originalSlotId || clickInfo.event.id
    const eventDate = clickInfo.event.start || new Date()
    
    setSelectedEventId(eventId)
    setSelectedEventDate(eventDate)
    setShowOptionsDialog(true)
  }
  
  // Handle delete
  const handleDelete = async () => {
    if (!selectedEventId) return
    
    const slot = slots.find(s => s.id === selectedEventId)
    
    if (slot?.is_recurring) {
      // Show recurring delete dialog
      setShowOptionsDialog(false)
      setShowRecurringDeleteDialog(true)
    } else {
      // Simple delete for one-time events
      try {
        await onDeleteSlot(selectedEventId)
        toast.success('Availability slot deleted')
        setShowOptionsDialog(false)
        setSelectedEventId(null)
        setSelectedEventDate(null)
      } catch (error) {
        toast.error('Failed to delete availability slot')
        console.error(error)
      }
    }
  }
  
  // Handle make recurring
  const handleMakeRecurring = async (frequency: 'daily' | 'weekly') => {
    if (!selectedEventId) return
    
    const slot = slots.find(s => s.id === selectedEventId)
    if (!slot) return
    
    try {
      await onMakeRecurring(selectedEventId, frequency, slot.start_time)
      toast.success(`Slot set to repeat ${frequency}`)
      setShowOptionsDialog(false)
      setSelectedEventId(null)
    } catch (error) {
      toast.error('Failed to make slot recurring')
      console.error(error)
    }
  }
  
  // Get selected event details
  const selectedEvent = slots.find(slot => slot.id === selectedEventId)


  // Handle event resize/drop (update)
  const handleEventChange = async (changeInfo: any) => {
    const { event, revert } = changeInfo
    const start = event.start as Date
    const end = event.end as Date

    // Validate
    if (!validateTimeSlot(start, end)) {
      revert()
      return
    }

    // Check if this is a recurring event
    const isRecurring = event.extendedProps?.isRecurring
    const originalSlotId = event.extendedProps?.originalSlotId || event.id
    const dayOfWeek = event.extendedProps?.dayOfWeek

    // Use originalSlotId for overlap check to properly exclude the slot being edited
    // For recurring events with exceptions, event.id is composite (slot.id-date)
    // Pass recurring info so we check recurring pattern overlap, not just one-time overlap
    if (checkOverlap(start, end, originalSlotId, isRecurring, dayOfWeek)) {
      revert()
      return
    }

    if (isRecurring) {
      // Show dialog for recurring event edit options
      setPendingEdit({
        eventId: originalSlotId,
        start,
        end,
        revert,
      })
      setShowRecurringEditDialog(true)
    } else {
      // Non-recurring event - update directly
      try {
        await onUpdateSlot(event.id, start, end)
        toast.success('Availability slot updated')
      } catch (error) {
        toast.error('Failed to update availability slot')
        console.error(error)
        revert()
      }
    }
  }

  // Handle recurring edit choice with transaction safety
  const handleRecurringEditChoice = async (choice: 'this' | 'all' | 'following') => {
    if (!pendingEdit) return

    try {
      if (choice === 'this') {
        // Add exception date to hide the original recurring instance
        const dateStr = pendingEdit.start.toISOString().split('T')[0]
        console.log('Adding exception date:', dateStr, 'for slot:', pendingEdit.eventId)
        
        await onAddExceptionDate(pendingEdit.eventId, dateStr)
        
        // Create a new one-time slot for this instance
        await onAddSlot(pendingEdit.start, pendingEdit.end)
        toast.success('Created one-time exception for this date')
      } else if (choice === 'all') {
        // Update the recurring slot's time
        await onUpdateSlot(pendingEdit.eventId, pendingEdit.start, pendingEdit.end)
        toast.success('Updated all recurring events')
      } else if (choice === 'following') {
        // Split the series: end original before this date, create new from this date
        // Previous events remain unchanged with old times
        const slot = slots.find(s => s.id === pendingEdit.eventId)
        if (!slot) {
          throw new Error('Slot not found')
        }
        
        const currentDate = pendingEdit.start.toISOString().split('T')[0]
        const slotStartDate = new Date(slot.start_time).toISOString().split('T')[0]
        
        // Check if we're editing the FIRST occurrence of this slot
        // If so, we should DELETE the entire slot (not just set end date)
        // This prevents "dead" slot artifacts with start_date == end_date
        const isFirstOccurrence = currentDate === slotStartDate
        
        // Store original state for rollback
        const originalEndDate = slot.recurrence_end_date
        let deletedSlot = false
        
        try {
          if (isFirstOccurrence) {
            // Editing first occurrence: DELETE the entire slot
            // This replaces the whole series with the new one
            await onDeleteSlot(pendingEdit.eventId)
            deletedSlot = true
          } else {
            // Editing middle occurrence: Set end date to split the series
            // Note: recurrence_end_date is exclusive (events recur up to but not including this date)
            await onSetRecurrenceEndDate(pendingEdit.eventId, currentDate)
          }
          
          // Create new series from this date with new times
          await onCreateRecurringFromDate(
            slot.day_of_week ?? null,
            pendingEdit.start.toISOString(),
            pendingEdit.start.toISOString(),
            pendingEdit.end.toISOString()
          )
          
          toast.success('Updated this and following events')
        } catch (error) {
          // Rollback: restore original state
          console.error('Failed to split series, attempting rollback:', error)
          try {
            if (deletedSlot) {
              // Can't easily rollback a deletion - would need to recreate the slot
              console.error('Cannot rollback deletion - slot was deleted')
              toast.error('Failed to update. Please refresh the page.')
            } else if (originalEndDate) {
              await onSetRecurrenceEndDate(pendingEdit.eventId, originalEndDate)
            } else {
              // If there was no end date, we need to remove it
              console.error('Cannot rollback - no original end date')
            }
          } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError)
          }
          toast.error('Failed to update this and following events')
          throw error
        }
      }

      setShowRecurringEditDialog(false)
      setPendingEdit(null)
    } catch (error) {
      toast.error('Failed to update recurring event')
      console.error(error)
      pendingEdit.revert()
      setShowRecurringEditDialog(false)
      setPendingEdit(null)
    }
  }

  // Cancel recurring edit
  const handleCancelRecurringEdit = () => {
    if (pendingEdit) {
      pendingEdit.revert()
    }
    setShowRecurringEditDialog(false)
    setPendingEdit(null)
  }

  // Handle recurring delete choice
  const handleRecurringDeleteChoice = async (choice: 'this' | 'all' | 'following') => {
    if (!selectedEventId || !selectedEventDate) return
    
    try {
      if (choice === 'this') {
        // Add exception date to hide this occurrence
        const dateStr = selectedEventDate.toISOString().split('T')[0]
        await onAddExceptionDate(selectedEventId, dateStr)
        toast.success('Removed this occurrence')
      } else if (choice === 'all') {
        // Delete entire series
        await onDeleteSlot(selectedEventId)
        toast.success('Deleted all occurrences')
      } else if (choice === 'following') {
        // Delete this and following occurrences
        const slot = slots.find(s => s.id === selectedEventId)
        if (!slot) {
          throw new Error('Slot not found')
        }
        
        const currentDate = selectedEventDate.toISOString().split('T')[0]
        const slotStartDate = new Date(slot.start_time).toISOString().split('T')[0]
        
        // Check if we're deleting from the FIRST occurrence
        // If so, delete the entire slot (same as "delete all")
        const isFirstOccurrence = currentDate === slotStartDate
        
        if (isFirstOccurrence) {
          // Deleting from first occurrence: DELETE entire slot
          await onDeleteSlot(selectedEventId)
          toast.success('Deleted all occurrences')
        } else {
          // Deleting from middle occurrence: Set end date (exclusive)
          // This keeps all events before this date
          await onSetRecurrenceEndDate(selectedEventId, currentDate)
          toast.success('Deleted this and following occurrences')
        }
      }
      
      setShowRecurringDeleteDialog(false)
      setSelectedEventId(null)
      setSelectedEventDate(null)
    } catch (error) {
      toast.error('Failed to delete')
      console.error(error)
      setShowRecurringDeleteDialog(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Availability</h2>
          <p className="text-sm text-muted-foreground">
            Click and drag to add availability slots. Click a slot to manage it.
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

      <div className="calendar-wrapper">
        <div 
          ref={scrollContainerRef}
          className={`calendar-scroll-container ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin, luxonPlugin]}
            initialView="timeGridWeek"
            timeZone={timeZone}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay',
            }}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:15:00"
            slotLabelInterval="01:00:00"
            snapDuration="00:15:00"
            allDaySlot={false}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventChange}
            eventResize={handleEventChange}
            height="auto"
            stickyHeaderDates={true}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
              omitZeroMinute: true,
            }}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
            viewDidMount={() => {
              setIsCalendarReady(true)
            }}
          />
        </div>
      </div>

      {/* Recurring Delete Dialog */}
      <Dialog open={showRecurringDeleteDialog} onOpenChange={setShowRecurringDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recurring Event</DialogTitle>
            <DialogDescription>
              This is a recurring event. What would you like to delete?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              variant="outline"
              className="justify-start text-left"
              onClick={() => handleRecurringDeleteChoice('this')}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">This Event Only</span>
                <span className="text-xs text-muted-foreground">
                  Removes only this occurrence
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start text-left"
              onClick={() => handleRecurringDeleteChoice('all')}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">All Events</span>
                <span className="text-xs text-muted-foreground">
                  Deletes the entire series
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start text-left"
              onClick={() => handleRecurringDeleteChoice('following')}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">This and Following Events</span>
                <span className="text-xs text-muted-foreground">
                  Deletes this and all future occurrences
                </span>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRecurringDeleteDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Edit Dialog */}
      <Dialog open={showRecurringEditDialog} onOpenChange={(open) => !open && handleCancelRecurringEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recurring Event</DialogTitle>
            <DialogDescription>
              This is a recurring event. How would you like to apply this change?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              variant="outline"
              className="justify-start text-left"
              onClick={() => handleRecurringEditChoice('this')}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">This Event Only</span>
                <span className="text-xs text-muted-foreground">
                  Creates a one-time exception for this date
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start text-left"
              onClick={() => handleRecurringEditChoice('all')}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">All Events</span>
                <span className="text-xs text-muted-foreground">
                  Updates all occurrences in the series
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start text-left"
              onClick={() => handleRecurringEditChoice('following')}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">This and Following Events</span>
                <span className="text-xs text-muted-foreground">
                  Updates this and all future occurrences
                </span>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCancelRecurringEdit}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Options Dialog */}
      <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Availability Slot</DialogTitle>
            <DialogDescription>
              {selectedEvent?.is_recurring 
                ? 'This is a recurring slot' 
                : 'Choose an action for this slot'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {!selectedEvent?.is_recurring && (
              <>
                <div className="text-sm font-medium mb-1">Make Recurring</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 justify-start gap-2"
                    onClick={() => handleMakeRecurring('daily')}
                  >
                    <Repeat className="h-4 w-4" />
                    Repeat Daily
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start gap-2"
                    onClick={() => handleMakeRecurring('weekly')}
                  >
                    <Repeat className="h-4 w-4" />
                    Repeat Weekly
                  </Button>
                </div>
                <div className="border-t my-2" />
              </>
            )}
            <Button
              variant="outline"
              className="justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete Slot
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowOptionsDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
