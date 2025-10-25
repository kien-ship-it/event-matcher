'use client'

import { useQuery } from '@tanstack/react-query'
import { UserWithRole } from '@/lib/api/users'
import { getAvailability } from '@/lib/api/availability'
import { useMemo } from 'react'

interface AvailabilityHeatmapProps {
  participants: UserWithRole[]
  highlightedUserIds: string[]
}

interface TimeSlot {
  hour: number
  day: number
  availableCount: number
  highlightedCount: number
  users: string[]
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function AvailabilityHeatmap({
  participants,
  highlightedUserIds,
}: AvailabilityHeatmapProps) {
  // Fetch availability for all participants
  const availabilityQueries = useQuery({
    queryKey: ['availability-multiple', participants.map((p) => p.id)],
    queryFn: async () => {
      const results = await Promise.all(
        participants.map(async (participant) => {
          const availability = await getAvailability(participant.id)
          return { userId: participant.id, availability }
        })
      )
      return results
    },
    enabled: participants.length > 0,
  })

  // Process availability data into time slots
  const heatmapData = useMemo(() => {
    if (!availabilityQueries.data) return []

    const slots: Map<string, TimeSlot> = new Map()

    // Get current date for expanding recurring availability
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(now.getDate() - now.getDay()) // Start of current week
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 7) // One week

    availabilityQueries.data.forEach(({ userId, availability }) => {
      availability.forEach((slot) => {
        if (slot.is_recurring && slot.day_of_week !== null) {
          // Handle recurring weekly availability
          const slotStart = new Date(slot.start_time)
          const slotEnd = new Date(slot.end_time)
          const startHour = slotStart.getUTCHours()
          const endHour = slotEnd.getUTCHours()
          const dayOfWeek = slot.day_of_week

          // Mark hours for this day of week
          let currentHour = startHour
          while (currentHour <= endHour) {
            const key = `${dayOfWeek}-${currentHour}`
            const existing = slots.get(key)

            if (existing) {
              existing.availableCount++
              existing.users.push(userId)
              if (highlightedUserIds.includes(userId)) {
                existing.highlightedCount++
              }
            } else {
              slots.set(key, {
                hour: currentHour,
                day: dayOfWeek,
                availableCount: 1,
                highlightedCount: highlightedUserIds.includes(userId) ? 1 : 0,
                users: [userId],
              })
            }

            currentHour++
          }
        } else if (!slot.is_recurring) {
          // Handle one-time availability
          const start = new Date(slot.start_time)
          const end = new Date(slot.end_time)
          
          // Only include if within current week
          if (start >= startDate && start <= endDate) {
            const day = start.getDay()
            let currentHour = start.getHours()
            const endHour = end.getHours()

            while (currentHour <= endHour) {
              const key = `${day}-${currentHour}`
              const existing = slots.get(key)

              if (existing) {
                existing.availableCount++
                existing.users.push(userId)
                if (highlightedUserIds.includes(userId)) {
                  existing.highlightedCount++
                }
              } else {
                slots.set(key, {
                  hour: currentHour,
                  day,
                  availableCount: 1,
                  highlightedCount: highlightedUserIds.includes(userId) ? 1 : 0,
                  users: [userId],
                })
              }

              currentHour++
            }
          }
        }
      })
    })

    return Array.from(slots.values())
  }, [availabilityQueries.data, highlightedUserIds])

  // Calculate color intensity based on availability
  const getColor = (slot: TimeSlot | undefined) => {
    if (!slot || slot.availableCount === 0) {
      return 'bg-gray-100'
    }

    const ratio = slot.availableCount / participants.length
    const hasHighlighted = slot.highlightedCount > 0

    if (hasHighlighted) {
      // Use blue shades for highlighted users
      if (ratio >= 0.75) return 'bg-blue-600'
      if (ratio >= 0.5) return 'bg-blue-500'
      if (ratio >= 0.25) return 'bg-blue-400'
      return 'bg-blue-300'
    }

    // Use green shades for regular availability
    if (ratio >= 0.75) return 'bg-green-600'
    if (ratio >= 0.5) return 'bg-green-500'
    if (ratio >= 0.25) return 'bg-green-400'
    return 'bg-green-300'
  }

  const getSlot = (day: number, hour: number): TimeSlot | undefined => {
    return heatmapData.find((s) => s.day === day && s.hour === hour)
  }

  if (availabilityQueries.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading availability...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold">Availability Heatmap</h3>
        <p className="text-sm text-muted-foreground">
          Showing aggregated availability for the current week. Darker colors indicate more
          participants are available.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded" />
          <span>High availability (all participants)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded" />
          <span>Highlighted participant available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded border" />
          <span>No availability</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1">
            {/* Header row - Days */}
            <div className="font-semibold text-sm" />
            {DAYS.map((day) => (
              <div key={day} className="font-semibold text-sm text-center py-2">
                {day.slice(0, 3)}
              </div>
            ))}

            {/* Time rows */}
            {HOURS.map((hour) => (
              <>
                <div key={`label-${hour}`} className="text-sm text-muted-foreground py-1">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {DAYS.map((_, dayIndex) => {
                  const slot = getSlot(dayIndex, hour)
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className={`h-8 rounded ${getColor(slot)} transition-colors cursor-pointer hover:ring-2 hover:ring-primary`}
                      title={
                        slot
                          ? `${slot.availableCount}/${participants.length} available${
                              slot.highlightedCount > 0
                                ? ` (${slot.highlightedCount} highlighted)`
                                : ''
                            }`
                          : 'No availability'
                      }
                    />
                  )
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        <p>
          Total participants: {participants.length} •{' '}
          {highlightedUserIds.length > 0 && `Highlighted: ${highlightedUserIds.length} • `}
          Hover over cells to see details
        </p>
      </div>
    </div>
  )
}
