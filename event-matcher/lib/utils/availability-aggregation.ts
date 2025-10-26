import { UserWithRole } from '@/lib/api/users'
import { getAvailability } from '@/lib/api/availability'
import { getEventsForUsers } from '@/lib/api/events'
import { expandRecurringEvents } from './recurring'

/**
 * Represents a 15-minute time slot with availability information
 */
export interface AvailabilitySlot {
  startTime: string // ISO string
  endTime: string // ISO string
  availableCount: number
  totalParticipants: number
  availableUserIds: string[]
  hasHighlighted: boolean
  ratio: number // 0 to 1
}

/**
 * Represents a participant's availability and events for a date range
 */
export interface ParticipantAvailability {
  userId: string
  userName: string
  availableSlots: Array<{
    startTime: string
    endTime: string
    isRecurring: boolean
    dayOfWeek?: number | null
  }>
  busySlots: Array<{
    startTime: string
    endTime: string
    eventTitle: string
    isRecurring: boolean
  }>
}

/**
 * Export availability data for each participant in a date range
 * This function queries all availability slots and events for each participant
 * and returns structured data that can be used for aggregation or individual analysis
 */
export async function exportParticipantAvailability(
  participants: UserWithRole[],
  startDate: string,
  endDate: string
): Promise<ParticipantAvailability[]> {
  const results: ParticipantAvailability[] = []

  // Fetch availability for all participants
  const availabilityPromises = participants.map(async (participant) => {
    const availability = await getAvailability(participant.id)
    return { userId: participant.id, availability }
  })

  const availabilityResults = await Promise.all(availabilityPromises)

  // Fetch events for all participants
  const userIds = participants.map((p) => p.id)
  const events = await getEventsForUsers(userIds, startDate, endDate)

  // Expand recurring events
  const expandedEvents = expandRecurringEvents(events as any[], startDate, endDate)

  // Process each participant
  for (const participant of participants) {
    const userAvailability = availabilityResults.find((a) => a.userId === participant.id)
    const userEvents = expandedEvents.filter((event) =>
      event.participants?.some((p: any) => p.user_id === participant.id)
    )

    const availableSlots = (userAvailability?.availability || []).map((slot) => ({
      startTime: slot.start_time,
      endTime: slot.end_time,
      isRecurring: slot.is_recurring || false,
      dayOfWeek: slot.day_of_week,
    }))

    const busySlots = userEvents.map((event) => ({
      startTime: event.start_time,
      endTime: event.end_time,
      eventTitle: event.title || 'Untitled Event',
      isRecurring: event.is_recurring || false,
    }))

    results.push({
      userId: participant.id,
      userName: participant.full_name,
      availableSlots,
      busySlots,
    })
  }

  return results
}

/**
 * Aggregate participant availability into 15-minute slots
 * Returns a map of time slots with availability counts
 */
export function aggregateAvailability(
  participantData: ParticipantAvailability[],
  highlightedUserIds: string[],
  startDate: string,
  endDate: string
): Map<string, AvailabilitySlot> {
  const slotMap = new Map<string, AvailabilitySlot>()
  const rangeStart = new Date(startDate)
  const rangeEnd = new Date(endDate)
  const totalParticipants = participantData.length

  // Process each participant's availability
  participantData.forEach(({ userId, availableSlots }) => {
    availableSlots.forEach((slot) => {
      if (slot.isRecurring && slot.dayOfWeek !== null && slot.dayOfWeek !== undefined) {
        // Handle recurring weekly availability
        const slotStart = new Date(slot.startTime)
        const slotEnd = new Date(slot.endTime)
        const startHours = slotStart.getHours()
        const startMinutes = slotStart.getMinutes()
        const endHours = slotEnd.getHours()
        const endMinutes = slotEnd.getMinutes()
        const dayOfWeek = slot.dayOfWeek

        // Apply to all matching days in the range
        const current = new Date(rangeStart)
        while (current <= rangeEnd) {
          if (current.getDay() === dayOfWeek) {
            // Break into 15-minute slots
            const startTotalMinutes = startHours * 60 + startMinutes
            const endTotalMinutes = endHours * 60 + endMinutes

            for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += 15) {
              const slotHour = Math.floor(minutes / 60)
              const slotMinute = minutes % 60

              const slotTime = new Date(current)
              slotTime.setHours(slotHour, slotMinute, 0, 0)
              const slotEndTime = new Date(slotTime.getTime() + 15 * 60 * 1000)
              const key = slotTime.toISOString()

              const existing = slotMap.get(key)
              if (existing) {
                existing.availableCount++
                if (!existing.availableUserIds.includes(userId)) {
                  existing.availableUserIds.push(userId)
                }
                if (highlightedUserIds.includes(userId)) {
                  existing.hasHighlighted = true
                }
                existing.ratio = existing.availableCount / totalParticipants
              } else {
                slotMap.set(key, {
                  startTime: key,
                  endTime: slotEndTime.toISOString(),
                  availableCount: 1,
                  totalParticipants,
                  availableUserIds: [userId],
                  hasHighlighted: highlightedUserIds.includes(userId),
                  ratio: 1 / totalParticipants,
                })
              }
            }
          }
          current.setDate(current.getDate() + 1)
        }
      } else if (!slot.isRecurring) {
        // Handle one-time availability
        const start = new Date(slot.startTime)
        const end = new Date(slot.endTime)

        if (start >= rangeStart && start <= rangeEnd) {
          // Break into 15-minute slots
          const current = new Date(start)
          while (current < end) {
            const slotEndTime = new Date(current.getTime() + 15 * 60 * 1000)
            const key = current.toISOString()
            const existing = slotMap.get(key)

            if (existing) {
              existing.availableCount++
              if (!existing.availableUserIds.includes(userId)) {
                existing.availableUserIds.push(userId)
              }
              if (highlightedUserIds.includes(userId)) {
                existing.hasHighlighted = true
              }
              existing.ratio = existing.availableCount / totalParticipants
            } else {
              slotMap.set(key, {
                startTime: key,
                endTime: slotEndTime.toISOString(),
                availableCount: 1,
                totalParticipants,
                availableUserIds: [userId],
                hasHighlighted: highlightedUserIds.includes(userId),
                ratio: 1 / totalParticipants,
              })
            }

            current.setTime(current.getTime() + 15 * 60 * 1000) // Add 15 minutes
          }
        }
      }
    })
  })

  return slotMap
}
