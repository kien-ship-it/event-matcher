import { ScheduleItem } from '@/lib/api/schedule'

// Type for recurrence pattern stored in events table
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval?: number // e.g., every 2 weeks
  daysOfWeek?: number[] // 0 = Sunday, 6 = Saturday (for weekly)
  dayOfMonth?: number // for monthly
  exceptionDates?: string[] // ISO date strings
}

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

  console.log('🔧 expandRecurringEvents called with', events.length, 'events')

  events.forEach((event) => {
    if (!event.is_recurring) {
      // Non-recurring event - include if overlaps with range
      const eventStart = new Date(event.start_time)
      const eventEnd = new Date(event.end_time)
      // Include if event overlaps with range: event_start < range_end AND event_end > range_start
      if (eventStart < rangeEnd && eventEnd > rangeStart) {
        expandedEvents.push(event)
        console.log('  ✓ Including one-off event:', event.title)
      } else {
        console.log('  ✗ Skipping one-off event (out of range):', event.title)
      }
    } else {
      // Recurring event - expand into instances
      console.log('  🔁 Expanding recurring event:', event.title, {
        recurrence_pattern: (event as any).recurrence_pattern,
        start_time: event.start_time,
        end_time: event.end_time
      })
      const instances = generateRecurringInstances(
        event,
        rangeStart,
        rangeEnd
      )
      console.log('    → Generated', instances.length, 'instances')
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
 * Handles both availability table (day_of_week) and events table (recurrence_pattern)
 */
function generateRecurringInstances(
  item: ScheduleItem & { 
    day_of_week?: number | null
    exception_dates?: string[] | null
    recurrence_end_date?: string | null
    recurrence_pattern?: RecurrencePattern | null
  },
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
  
  // Parse exception dates from both possible sources
  const exceptionDatesArray = (item.exception_dates || []) as string[]
  const patternExceptions = (item.recurrence_pattern as any)?.exceptionDates || []
  const allExceptions = [...exceptionDatesArray, ...patternExceptions]
  
  const exceptionDates = new Set(
    allExceptions.map((date: string) => {
      const normalized = date.includes('T') ? date.split('T')[0] : date
      return normalized
    })
  )
  
  // Check if using recurrence_pattern (events table) or day_of_week (availability table)
  const pattern = item.recurrence_pattern as RecurrencePattern | null
  
  console.log('      🔍 generateRecurringInstances:', {
    title: (item as any).title,
    pattern,
    day_of_week: item.day_of_week,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    recurrenceEnd: recurrenceEnd.toISOString(),
    startHours,
    startMinutes,
    duration: duration / (1000 * 60) + ' minutes'
  })
  
  if (pattern && pattern.frequency === 'weekly' && pattern.daysOfWeek) {
    // Handle weekly recurrence with multiple days (events table format)
    console.log('      → Using weekly pattern with daysOfWeek:', pattern.daysOfWeek)
    const daysOfWeek = pattern.daysOfWeek
    const interval = pattern.interval || 1
    
    let currentDate = new Date(rangeStart)
    currentDate.setUTCHours(0, 0, 0, 0)
    
    let weekCount = 0
    while (currentDate <= rangeEnd && currentDate <= recurrenceEnd) {
      if (daysOfWeek.includes(currentDate.getUTCDay())) {
        const instanceStart = new Date(currentDate)
        instanceStart.setUTCHours(startHours, startMinutes, startSeconds, 0)
        
        const instanceEnd = new Date(instanceStart.getTime() + duration)
        const dateKey = instanceStart.toISOString().split('T')[0]
        
        if (!exceptionDates.has(dateKey) && instanceStart >= rangeStart && instanceStart <= rangeEnd) {
          instances.push({
            ...item,
            id: `${item.id}-${instanceStart.toISOString()}`,
            start_time: instanceStart.toISOString(),
            end_time: instanceEnd.toISOString(),
            is_recurring: false,
          })
        }
      }
      
      // Move to next day
      const prevDay = currentDate.getUTCDay()
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
      
      // If we've moved to Sunday, increment week counter
      if (prevDay === 6 && currentDate.getUTCDay() === 0) {
        weekCount++
        // Skip weeks based on interval
        if (interval > 1 && weekCount % interval !== 0) {
          currentDate.setUTCDate(currentDate.getUTCDate() + 7)
        }
      }
    }
  } else if (item.day_of_week !== null && item.day_of_week !== undefined) {
    // Handle single day weekly recurrence (availability table format)
    console.log('      → Using day_of_week pattern:', item.day_of_week)
    const targetDayOfWeek = item.day_of_week
    
    let currentDate = new Date(rangeStart)
    currentDate.setUTCHours(0, 0, 0, 0)
    
    // Find the first occurrence of the target day of week
    while (currentDate.getUTCDay() !== targetDayOfWeek) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
    
    // Generate instances for each week
    while (currentDate <= rangeEnd && currentDate <= recurrenceEnd) {
      const instanceStart = new Date(currentDate)
      instanceStart.setUTCHours(startHours, startMinutes, startSeconds, 0)
      
      const instanceEnd = new Date(instanceStart.getTime() + duration)
      const dateKey = instanceStart.toISOString().split('T')[0]
      
      if (!exceptionDates.has(dateKey) && instanceStart >= rangeStart && instanceStart <= rangeEnd) {
        instances.push({
          ...item,
          id: `${item.id}-${instanceStart.toISOString()}`,
          start_time: instanceStart.toISOString(),
          end_time: instanceEnd.toISOString(),
          is_recurring: false,
        })
      }
      
      // Move to next week
      currentDate.setUTCDate(currentDate.getUTCDate() + 7)
    }
  } else if (pattern && pattern.frequency === 'daily') {
    // Handle daily recurrence
    console.log('      → Using daily pattern with interval:', pattern.interval || 1)
    const interval = pattern.interval || 1
    
    let currentDate = new Date(rangeStart)
    currentDate.setUTCHours(0, 0, 0, 0)
    
    let dayCount = 0
    while (currentDate <= rangeEnd && currentDate <= recurrenceEnd) {
      if (dayCount % interval === 0) {
        const instanceStart = new Date(currentDate)
        instanceStart.setUTCHours(startHours, startMinutes, startSeconds, 0)
        
        const instanceEnd = new Date(instanceStart.getTime() + duration)
        const dateKey = instanceStart.toISOString().split('T')[0]
        
        if (!exceptionDates.has(dateKey) && instanceStart >= rangeStart && instanceStart <= rangeEnd) {
          instances.push({
            ...item,
            id: `${item.id}-${instanceStart.toISOString()}`,
            start_time: instanceStart.toISOString(),
            end_time: instanceEnd.toISOString(),
            is_recurring: false,
          })
        }
      }
      
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
      dayCount++
    }
  } else {
    // Fallback: daily recurring (no specific pattern)
    console.log('      → Using fallback daily pattern (no specific pattern found)')
    let currentDate = new Date(rangeStart)
    currentDate.setUTCHours(0, 0, 0, 0)
    
    while (currentDate <= rangeEnd && currentDate <= recurrenceEnd) {
      const instanceStart = new Date(currentDate)
      instanceStart.setUTCHours(startHours, startMinutes, startSeconds, 0)
      
      const instanceEnd = new Date(instanceStart.getTime() + duration)
      const dateKey = instanceStart.toISOString().split('T')[0]
      
      if (!exceptionDates.has(dateKey) && instanceStart >= rangeStart && instanceStart <= rangeEnd) {
        instances.push({
          ...item,
          id: `${item.id}-${instanceStart.toISOString()}`,
          start_time: instanceStart.toISOString(),
          end_time: instanceEnd.toISOString(),
          is_recurring: false,
        })
      }
      
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
  }
  
  console.log('      ✅ Generated', instances.length, 'instances for', (item as any).title || 'item')
  
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
  item: ScheduleItem & { 
    day_of_week?: number | null
    exception_dates?: string[] | null
    recurrence_end_date?: string | null
    recurrence_pattern?: RecurrencePattern | null
  },
  afterDate: Date
): Date | null {
  if (!item.is_recurring) {
    return null
  }
  
  const recurrenceEnd = item.recurrence_end_date 
    ? new Date(item.recurrence_end_date)
    : null
  
  const exceptionDatesArray = (item.exception_dates || []) as string[]
  const patternExceptions = (item.recurrence_pattern as any)?.exceptionDates || []
  const exceptionDates = [...exceptionDatesArray, ...patternExceptions]
  
  const originalStart = new Date(item.start_time)
  const startHours = originalStart.getUTCHours()
  const startMinutes = originalStart.getUTCMinutes()
  const startSeconds = originalStart.getUTCSeconds()
  
  const pattern = item.recurrence_pattern as RecurrencePattern | null
  
  if (pattern && pattern.frequency === 'weekly' && pattern.daysOfWeek) {
    // Weekly recurring with multiple days
    const daysOfWeek = pattern.daysOfWeek
    let currentDate = new Date(afterDate)
    currentDate.setUTCHours(0, 0, 0, 0)
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    
    // Check up to 52 weeks ahead
    for (let i = 0; i < 365; i++) {
      if (daysOfWeek.includes(currentDate.getUTCDay())) {
        const instanceStart = new Date(currentDate)
        instanceStart.setUTCHours(startHours, startMinutes, startSeconds, 0)
        
        if (recurrenceEnd && instanceStart > recurrenceEnd) {
          return null
        }
        
        if (!isExceptionDate(instanceStart, exceptionDates)) {
          return instanceStart
        }
      }
      
      currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    }
  } else if (item.day_of_week !== null && item.day_of_week !== undefined) {
    // Weekly recurring (single day)
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
  item: ScheduleItem & { 
    day_of_week?: number | null
    exception_dates?: string[] | null
    recurrence_end_date?: string | null
    recurrence_pattern?: RecurrencePattern | null
  },
  startDate: Date,
  endDate: Date
): number {
  const instances = generateRecurringInstances(item, startDate, endDate)
  return instances.length
}
