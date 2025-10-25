import { ScheduleItem } from '@/lib/api/schedule'

/**
 * Expand recurring events into individual instances within a date range
 */
export function expandRecurringEvents(
  events: ScheduleItem[],
  startDate: string,
  endDate: string
): ScheduleItem[] {
  const expandedEvents: ScheduleItem[] = []
  const rangeStart = new Date(startDate)
  const rangeEnd = new Date(endDate)

  events.forEach((event) => {
    if (!event.is_recurring) {
      // Non-recurring event - include if within range
      const eventStart = new Date(event.start_time)
      if (eventStart >= rangeStart && eventStart <= rangeEnd) {
        expandedEvents.push(event)
      }
    } else {
      // Recurring event - expand into instances
      const instances = generateRecurringInstances(
        event,
        rangeStart,
        rangeEnd
      )
      expandedEvents.push(...instances)
    }
  })

  return expandedEvents.sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
}

/**
 * Expand recurring availability into individual instances within a date range
 */
export function expandRecurringAvailability(
  availability: ScheduleItem[],
  startDate: string,
  endDate: string
): ScheduleItem[] {
  const expandedSlots: ScheduleItem[] = []
  const rangeStart = new Date(startDate)
  const rangeEnd = new Date(endDate)

  availability.forEach((slot) => {
    if (!slot.is_recurring) {
      // Non-recurring slot - include if within range
      const slotStart = new Date(slot.start_time)
      if (slotStart >= rangeStart && slotStart <= rangeEnd) {
        expandedSlots.push(slot)
      }
    } else {
      // Recurring slot - expand into instances
      const instances = generateRecurringInstances(
        slot,
        rangeStart,
        rangeEnd
      )
      expandedSlots.push(...instances)
    }
  })

  return expandedSlots.sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
}

/**
 * Generate recurring instances for a schedule item
 * Handles weekly recurring patterns based on day_of_week
 */
function generateRecurringInstances(
  item: ScheduleItem & { day_of_week?: number | null; exception_dates?: string[] | null; recurrence_end_date?: string | null },
  rangeStart: Date,
  rangeEnd: Date
): ScheduleItem[] {
  const instances: ScheduleItem[] = []
  
  // Parse the original start and end times to get time components
  const originalStart = new Date(item.start_time)
  const originalEnd = new Date(item.end_time)
  
  // Get time components (hours, minutes, seconds)
  const startHours = originalStart.getUTCHours()
  const startMinutes = originalStart.getUTCMinutes()
  const startSeconds = originalStart.getUTCSeconds()
  
  // Calculate duration in milliseconds
  const duration = originalEnd.getTime() - originalStart.getTime()
  
  // Determine recurrence end date
  const recurrenceEnd = item.recurrence_end_date 
    ? new Date(item.recurrence_end_date)
    : rangeEnd
  
  // Parse exception dates
  const exceptionDates = new Set(
    (item.exception_dates || []).map((date: string) => {
      const normalized = date.includes('T') ? date.split('T')[0] : date
      return normalized
    })
  )
  
  // If day_of_week is specified, generate weekly recurring instances
  if (item.day_of_week !== null && item.day_of_week !== undefined) {
    const targetDayOfWeek = item.day_of_week // 0 = Sunday, 6 = Saturday
    
    // Start from the beginning of the range
    let currentDate = new Date(rangeStart)
    currentDate.setUTCHours(0, 0, 0, 0)
    
    // Find the first occurrence of the target day of week
    while (currentDate.getUTCDay() !== targetDayOfWeek) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
    
    // Generate instances for each week
    while (currentDate <= rangeEnd && currentDate <= recurrenceEnd) {
      // Create instance with the correct time
      const instanceStart = new Date(currentDate)
      instanceStart.setUTCHours(startHours, startMinutes, startSeconds, 0)
      
      const instanceEnd = new Date(instanceStart.getTime() + duration)
      
      // Check if this date is in the exception list
      const dateKey = instanceStart.toISOString().split('T')[0]
      
      if (!exceptionDates.has(dateKey) && instanceStart >= rangeStart && instanceStart <= rangeEnd) {
        instances.push({
          ...item,
          id: `${item.id}-${instanceStart.toISOString()}`,
          start_time: instanceStart.toISOString(),
          end_time: instanceEnd.toISOString(),
          is_recurring: false, // Mark as expanded instance
        })
      }
      
      // Move to next week
      currentDate.setUTCDate(currentDate.getUTCDate() + 7)
    }
  } else {
    // Daily recurring (no day_of_week specified)
    let currentDate = new Date(rangeStart)
    currentDate.setUTCHours(0, 0, 0, 0)
    
    while (currentDate <= rangeEnd && currentDate <= recurrenceEnd) {
      const instanceStart = new Date(currentDate)
      instanceStart.setUTCHours(startHours, startMinutes, startSeconds, 0)
      
      const instanceEnd = new Date(instanceStart.getTime() + duration)
      
      // Check if this date is in the exception list
      const dateKey = instanceStart.toISOString().split('T')[0]
      
      if (!exceptionDates.has(dateKey) && instanceStart >= rangeStart && instanceStart <= rangeEnd) {
        instances.push({
          ...item,
          id: `${item.id}-${instanceStart.toISOString()}`,
          start_time: instanceStart.toISOString(),
          end_time: instanceEnd.toISOString(),
          is_recurring: false, // Mark as expanded instance
        })
      }
      
      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
  }
  
  return instances
}

/**
 * Check if a date falls on an exception date
 */
export function isExceptionDate(date: Date, exceptionDates: string[]): boolean {
  const dateKey = date.toISOString().split('T')[0]
  return exceptionDates.some((exDate) => {
    const normalized = exDate.includes('T') ? exDate.split('T')[0] : exDate
    return normalized === dateKey
  })
}

/**
 * Get the next occurrence of a recurring item after a given date
 */
export function getNextOccurrence(
  item: ScheduleItem & { day_of_week?: number | null; exception_dates?: string[] | null; recurrence_end_date?: string | null },
  afterDate: Date
): Date | null {
  if (!item.is_recurring) {
    return null
  }
  
  const recurrenceEnd = item.recurrence_end_date 
    ? new Date(item.recurrence_end_date)
    : null
  
  const exceptionDates = item.exception_dates || []
  
  const originalStart = new Date(item.start_time)
  const startHours = originalStart.getUTCHours()
  const startMinutes = originalStart.getUTCMinutes()
  const startSeconds = originalStart.getUTCSeconds()
  
  if (item.day_of_week !== null && item.day_of_week !== undefined) {
    // Weekly recurring
    const targetDayOfWeek = item.day_of_week
    let currentDate = new Date(afterDate)
    currentDate.setUTCHours(0, 0, 0, 0)
    
    // Find next occurrence of target day
    while (currentDate.getUTCDay() !== targetDayOfWeek) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
    
    // Check up to 52 weeks ahead
    for (let i = 0; i < 52; i++) {
      const instanceStart = new Date(currentDate)
      instanceStart.setUTCHours(startHours, startMinutes, startSeconds, 0)
      
      if (recurrenceEnd && instanceStart > recurrenceEnd) {
        return null
      }
      
      if (!isExceptionDate(instanceStart, exceptionDates)) {
        return instanceStart
      }
      
      currentDate.setUTCDate(currentDate.getUTCDate() + 7)
    }
  } else {
    // Daily recurring
    let currentDate = new Date(afterDate)
    currentDate.setUTCHours(0, 0, 0, 0)
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    
    // Check up to 365 days ahead
    for (let i = 0; i < 365; i++) {
      const instanceStart = new Date(currentDate)
      instanceStart.setUTCHours(startHours, startMinutes, startSeconds, 0)
      
      if (recurrenceEnd && instanceStart > recurrenceEnd) {
        return null
      }
      
      if (!isExceptionDate(instanceStart, exceptionDates)) {
        return instanceStart
      }
      
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
  }
  
  return null
}

/**
 * Calculate the number of occurrences for a recurring item within a date range
 */
export function countOccurrences(
  item: ScheduleItem & { day_of_week?: number | null; exception_dates?: string[] | null; recurrence_end_date?: string | null },
  startDate: Date,
  endDate: Date
): number {
  const instances = generateRecurringInstances(item, startDate, endDate)
  return instances.length
}
