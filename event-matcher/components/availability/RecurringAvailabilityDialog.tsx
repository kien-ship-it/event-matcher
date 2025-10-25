'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { addWeeks, format } from 'date-fns'

interface TimeSlot {
  startTime: string
  endTime: string
}

interface RecurringAvailabilityDialogProps {
  onSubmit: (data: {
    slots: Array<{
      day_of_week: number
      start_time: string
      end_time: string
    }>
    recurrenceEndDate?: string
  }) => Promise<void>
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export function RecurringAvailabilityDialog({ onSubmit }: RecurringAvailabilityDialogProps) {
  const [open, setOpen] = useState(false)
  const [weeklySlots, setWeeklySlots] = useState<Record<number, TimeSlot[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('')

  const addSlotToDay = (dayOfWeek: number) => {
    setWeeklySlots((prev) => ({
      ...prev,
      [dayOfWeek]: [
        ...(prev[dayOfWeek] || []),
        { startTime: '09:00', endTime: '10:00' },
      ],
    }))
  }

  const removeSlotFromDay = (dayOfWeek: number, index: number) => {
    setWeeklySlots((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].filter((_, i) => i !== index),
    }))
  }

  const updateSlot = (
    dayOfWeek: number,
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setWeeklySlots((prev) => ({
      ...prev,
      [dayOfWeek]: prev[dayOfWeek].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }))
  }

  const validateSlots = (): boolean => {
    for (const [day, slots] of Object.entries(weeklySlots)) {
      for (const slot of slots) {
        const [startHour, startMin] = slot.startTime.split(':').map(Number)
        const [endHour, endMin] = slot.endTime.split(':').map(Number)

        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        const duration = endMinutes - startMinutes

        if (duration < 30) {
          toast.error(`Slots must be at least 30 minutes long (${DAYS_OF_WEEK[Number(day)].label})`)
          return false
        }

        if (startMin % 15 !== 0 || endMin % 15 !== 0) {
          toast.error('Time slots must align to 15-minute increments')
          return false
        }
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateSlots()) return

    setIsSubmitting(true)
    try {
      const slots = Object.entries(weeklySlots).flatMap(([dayOfWeek, timeSlots]) =>
        timeSlots.map((slot) => {
          // Create a date for the next occurrence of this day of week
          const now = new Date()
          const currentDay = now.getDay()
          const targetDay = Number(dayOfWeek)
          const daysUntilTarget = (targetDay - currentDay + 7) % 7
          const targetDate = new Date(now)
          targetDate.setDate(now.getDate() + daysUntilTarget)

          const [startHour, startMin] = slot.startTime.split(':').map(Number)
          const [endHour, endMin] = slot.endTime.split(':').map(Number)

          const startTime = new Date(targetDate)
          startTime.setHours(startHour, startMin, 0, 0)

          const endTime = new Date(targetDate)
          endTime.setHours(endHour, endMin, 0, 0)

          return {
            day_of_week: Number(dayOfWeek),
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
          }
        })
      )

      await onSubmit({
        slots,
        recurrenceEndDate: recurrenceEndDate || undefined,
      })

      toast.success('Recurring availability created')
      setOpen(false)
      setWeeklySlots({})
      setRecurrenceEndDate('')
    } catch (error) {
      toast.error('Failed to create recurring availability')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPreviewDates = () => {
    const previews: string[] = []
    const now = new Date()

    for (let week = 0; week < 4; week++) {
      const weekStart = addWeeks(now, week)
      for (const [dayOfWeek, slots] of Object.entries(weeklySlots)) {
        if (slots.length > 0) {
          const currentDay = weekStart.getDay()
          const targetDay = Number(dayOfWeek)
          const daysUntilTarget = (targetDay - currentDay + 7) % 7
          const targetDate = new Date(weekStart)
          targetDate.setDate(weekStart.getDate() + daysUntilTarget)

          previews.push(
            `${format(targetDate, 'EEE, MMM d')}: ${slots.length} slot${slots.length > 1 ? 's' : ''}`
          )
        }
      }
    }

    return previews.slice(0, 10)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Set Recurring Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Recurring Availability</DialogTitle>
          <DialogDescription>
            Set your weekly availability schedule. These slots will repeat every week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recurrence End Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Recurrence End Date (Optional)</label>
            <Input
              type="date"
              value={recurrenceEndDate}
              onChange={(e) => setRecurrenceEndDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for indefinite recurrence
            </p>
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => (
              <Card key={day.value} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{day.label}</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addSlotToDay(day.value)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Slot
                  </Button>
                </div>

                {weeklySlots[day.value]?.length > 0 ? (
                  <div className="space-y-2">
                    {weeklySlots[day.value].map((slot, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) =>
                            updateSlot(day.value, index, 'startTime', e.target.value)
                          }
                          step="900"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) =>
                            updateSlot(day.value, index, 'endTime', e.target.value)
                          }
                          step="900"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSlotFromDay(day.value, index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No slots added</p>
                )}
              </Card>
            ))}
          </div>

          {/* Preview */}
          {Object.keys(weeklySlots).length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold mb-2">Preview (Next 4 Weeks)</h4>
              <div className="space-y-1">
                {getPreviewDates().map((preview, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {preview}
                  </p>
                ))}
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(weeklySlots).length === 0}
          >
            {isSubmitting ? 'Creating...' : 'Create Recurring Availability'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
