import { z } from 'zod'

/**
 * Validate that time is in 15-minute increments
 */
const is15MinuteIncrement = (date: Date): boolean => {
  return date.getMinutes() % 15 === 0
}

/**
 * Validate that duration is at least 30 minutes
 */
const isMinimumDuration = (startTime: Date, endTime: Date): boolean => {
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
  return durationMinutes >= 30
}

/**
 * Time slot schema for availability
 */
export const timeSlotSchema = z.object({
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
}).refine(
  (data) => {
    const start = new Date(data.start_time)
    const end = new Date(data.end_time)
    return end > start
  },
  {
    message: 'End time must be after start time',
  }
).refine(
  (data) => {
    const start = new Date(data.start_time)
    const end = new Date(data.end_time)
    return is15MinuteIncrement(start) && is15MinuteIncrement(end)
  },
  {
    message: 'Time slots must align to 15-minute increments',
  }
).refine(
  (data) => {
    const start = new Date(data.start_time)
    const end = new Date(data.end_time)
    return isMinimumDuration(start, end)
  },
  {
    message: 'Availability slots must be at least 30 minutes long',
  }
)

/**
 * Availability creation schema
 */
export const availabilityCreateSchema = z.object({
  user_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  is_recurring: z.boolean().default(false),
  day_of_week: z.number().int().min(0).max(6).optional().nullable(),
  recurrence_end_date: z.string().date().optional().nullable(),
}).refine(
  (data) => {
    const start = new Date(data.start_time)
    const end = new Date(data.end_time)
    return end > start
  },
  {
    message: 'End time must be after start time',
  }
).refine(
  (data) => {
    const start = new Date(data.start_time)
    const end = new Date(data.end_time)
    return is15MinuteIncrement(start) && is15MinuteIncrement(end)
  },
  {
    message: 'Time slots must align to 15-minute increments',
  }
).refine(
  (data) => {
    const start = new Date(data.start_time)
    const end = new Date(data.end_time)
    return isMinimumDuration(start, end)
  },
  {
    message: 'Availability slots must be at least 30 minutes long',
  }
).refine(
  (data) => {
    // If recurring, day_of_week must be provided
    if (data.is_recurring && data.day_of_week === null) {
      return false
    }
    return true
  },
  {
    message: 'Recurring availability must have a day of week specified',
  }
)

/**
 * Availability update schema
 */
export const availabilityUpdateSchema = z.object({
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  is_recurring: z.boolean().optional(),
  day_of_week: z.number().int().min(0).max(6).optional().nullable(),
  recurrence_end_date: z.string().date().optional().nullable(),
}).refine(
  (data) => {
    // If both times are provided, validate them
    if (data.start_time && data.end_time) {
      const start = new Date(data.start_time)
      const end = new Date(data.end_time)
      return end > start && isMinimumDuration(start, end)
    }
    return true
  },
  {
    message: 'Invalid time range',
  }
)

/**
 * Recurring availability pattern schema
 */
export const recurringPatternSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
}).refine(
  (data) => {
    const start = new Date(data.start_time)
    const end = new Date(data.end_time)
    return end > start && isMinimumDuration(start, end)
  },
  {
    message: 'Invalid recurring time slot',
  }
)

/**
 * Validate time slot
 */
export function validateTimeSlot(startTime: Date, endTime: Date): {
  valid: boolean
  error?: string
} {
  if (endTime <= startTime) {
    return { valid: false, error: 'End time must be after start time' }
  }

  if (!is15MinuteIncrement(startTime) || !is15MinuteIncrement(endTime)) {
    return { valid: false, error: 'Time slots must align to 15-minute increments' }
  }

  if (!isMinimumDuration(startTime, endTime)) {
    return { valid: false, error: 'Availability slots must be at least 30 minutes long' }
  }

  return { valid: true }
}

/**
 * Check if two time slots overlap
 */
export function checkOverlap(
  slot1Start: Date,
  slot1End: Date,
  slot2Start: Date,
  slot2End: Date
): boolean {
  return slot1Start < slot2End && slot1End > slot2Start
}

/**
 * Validate no overlap with existing slots
 */
export function validateNoOverlap(
  newStart: Date,
  newEnd: Date,
  existingSlots: Array<{ start_time: string; end_time: string }>,
  excludeId?: string
): {
  valid: boolean
  error?: string
  conflictingSlot?: { start_time: string; end_time: string }
} {
  for (const slot of existingSlots) {
    const slotStart = new Date(slot.start_time)
    const slotEnd = new Date(slot.end_time)

    if (checkOverlap(newStart, newEnd, slotStart, slotEnd)) {
      return {
        valid: false,
        error: 'This time slot overlaps with an existing availability',
        conflictingSlot: slot,
      }
    }
  }

  return { valid: true }
}

/**
 * Validate recurring availability pattern
 */
export function validateRecurringPattern(
  slots: Array<{
    day_of_week: number
    start_time: string
    end_time: string
  }>
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  for (const slot of slots) {
    if (slot.day_of_week < 0 || slot.day_of_week > 6) {
      errors.push(`Invalid day of week: ${slot.day_of_week}`)
    }

    const start = new Date(slot.start_time)
    const end = new Date(slot.end_time)

    const validation = validateTimeSlot(start, end)
    if (!validation.valid) {
      errors.push(`Day ${slot.day_of_week}: ${validation.error}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Extract time-of-day (hours and minutes) from a Date object
 */
function extractTimeOfDay(date: Date): { hours: number; minutes: number } {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
  }
}

/**
 * Check if two time-of-day ranges overlap
 */
function checkTimeOfDayOverlap(
  start1Hours: number,
  start1Minutes: number,
  end1Hours: number,
  end1Minutes: number,
  start2Hours: number,
  start2Minutes: number,
  end2Hours: number,
  end2Minutes: number
): boolean {
  const start1 = start1Hours * 60 + start1Minutes
  const end1 = end1Hours * 60 + end1Minutes
  const start2 = start2Hours * 60 + start2Minutes
  const end2 = end2Hours * 60 + end2Minutes

  return start1 < end2 && end1 > start2
}

/**
 * Check if a specific date is within a recurring slot's active range
 * Note: recurrence_end_date is EXCLUSIVE (events recur up to but not including this date)
 */
function isDateInRecurringRange(
  date: Date,
  slotStartTime: string,
  recurrenceEndDate: string | null | undefined
): boolean {
  const dateOnly = date.toISOString().split('T')[0]
  const slotStartDate = new Date(slotStartTime).toISOString().split('T')[0]
  
  if (dateOnly < slotStartDate) return false
  
  if (recurrenceEndDate) {
    const endDateOnly = new Date(recurrenceEndDate).toISOString().split('T')[0]
    // Use >= because recurrence_end_date is exclusive
    if (dateOnly >= endDateOnly) return false
  }
  
  return true
}

/**
 * Check if a date is in the exception dates list
 */
function isDateInExceptions(
  date: Date,
  exceptionDates: string[] | null | undefined
): boolean {
  if (!exceptionDates || exceptionDates.length === 0) return false
  
  const dateOnly = date.toISOString().split('T')[0]
  return exceptionDates.some(exDate => {
    const exDateOnly = exDate.includes('T') ? exDate.split('T')[0] : exDate
    return exDateOnly === dateOnly
  })
}

/**
 * Check if two recurring slots overlap
 */
export function checkRecurringOverlap(
  slot1: {
    start_time: string
    end_time: string
    is_recurring: boolean | null
    day_of_week?: number | null
    recurrence_end_date?: string | null
    exception_dates?: string[] | null
  },
  slot2: {
    start_time: string
    end_time: string
    is_recurring: boolean | null
    day_of_week?: number | null
    recurrence_end_date?: string | null
    exception_dates?: string[] | null
  }
): boolean {
  // Both must be recurring
  if (!slot1.is_recurring || !slot2.is_recurring) return false

  const start1 = new Date(slot1.start_time)
  const end1 = new Date(slot1.end_time)
  const start2 = new Date(slot2.start_time)
  const end2 = new Date(slot2.end_time)

  const time1 = extractTimeOfDay(start1)
  const endTime1 = extractTimeOfDay(end1)
  const time2 = extractTimeOfDay(start2)
  const endTime2 = extractTimeOfDay(end2)

  // Check if time-of-day overlaps
  const timeOverlaps = checkTimeOfDayOverlap(
    time1.hours, time1.minutes,
    endTime1.hours, endTime1.minutes,
    time2.hours, time2.minutes,
    endTime2.hours, endTime2.minutes
  )

  if (!timeOverlaps) return false

  // Check day-of-week compatibility
  const slot1IsWeekly = slot1.day_of_week !== null && slot1.day_of_week !== undefined
  const slot2IsWeekly = slot2.day_of_week !== null && slot2.day_of_week !== undefined

  if (slot1IsWeekly && slot2IsWeekly) {
    // Both weekly: must be same day to overlap
    if (slot1.day_of_week !== slot2.day_of_week) return false
  }
  // If one is daily and one is weekly, they can overlap on the weekly's day
  // If both are daily, they overlap every day

  // Check if date ranges overlap
  // Note: recurrence_end_date is EXCLUSIVE (events recur up to but not including this date)
  const slot1Start = new Date(slot1.start_time).toISOString().split('T')[0]
  const slot1End = slot1.recurrence_end_date 
    ? new Date(slot1.recurrence_end_date).toISOString().split('T')[0]
    : '9999-12-31'
  
  const slot2Start = new Date(slot2.start_time).toISOString().split('T')[0]
  const slot2End = slot2.recurrence_end_date
    ? new Date(slot2.recurrence_end_date).toISOString().split('T')[0]
    : '9999-12-31'

  // Since end dates are exclusive, use >= for the comparison
  // If slot1 starts on or after slot2's end date (exclusive), they don't overlap
  if (slot1Start >= slot2End || slot2Start >= slot1End) return false

  return true
}

/**
 * Check if a one-time slot overlaps with a recurring slot
 */
export function checkRecurringVsOneTimeOverlap(
  oneTimeSlot: {
    start_time: string
    end_time: string
  },
  recurringSlot: {
    start_time: string
    end_time: string
    is_recurring: boolean | null
    day_of_week?: number | null
    recurrence_end_date?: string | null
    exception_dates?: string[] | null
  }
): boolean {
  if (!recurringSlot.is_recurring) return false

  const oneTimeStart = new Date(oneTimeSlot.start_time)
  const oneTimeEnd = new Date(oneTimeSlot.end_time)
  const recurringStart = new Date(recurringSlot.start_time)
  const recurringEnd = new Date(recurringSlot.end_time)

  // Check if one-time slot is in the recurring slot's date range
  if (!isDateInRecurringRange(oneTimeStart, recurringSlot.start_time, recurringSlot.recurrence_end_date)) {
    return false
  }

  // Check if one-time slot is in exception dates
  if (isDateInExceptions(oneTimeStart, recurringSlot.exception_dates)) {
    return false
  }

  // Check day-of-week for weekly recurring
  if (recurringSlot.day_of_week !== null && recurringSlot.day_of_week !== undefined) {
    if (oneTimeStart.getDay() !== recurringSlot.day_of_week) {
      return false
    }
  }

  // Check time-of-day overlap
  const oneTimeStartTime = extractTimeOfDay(oneTimeStart)
  const oneTimeEndTime = extractTimeOfDay(oneTimeEnd)
  const recurringStartTime = extractTimeOfDay(recurringStart)
  const recurringEndTime = extractTimeOfDay(recurringEnd)

  return checkTimeOfDayOverlap(
    oneTimeStartTime.hours, oneTimeStartTime.minutes,
    oneTimeEndTime.hours, oneTimeEndTime.minutes,
    recurringStartTime.hours, recurringStartTime.minutes,
    recurringEndTime.hours, recurringEndTime.minutes
  )
}

/**
 * Comprehensive overlap validation including recurring patterns
 */
export function validateNoOverlapWithRecurring(
  newSlot: {
    start_time: string
    end_time: string
    is_recurring?: boolean | null
    day_of_week?: number | null
    recurrence_end_date?: string | null
  },
  existingSlots: Array<{
    id?: string
    start_time: string
    end_time: string
    is_recurring: boolean | null
    day_of_week?: number | null
    recurrence_end_date?: string | null
    exception_dates?: string[] | null
  }>,
  excludeId?: string
): {
  valid: boolean
  error?: string
  conflictingSlot?: any
} {
  const newStart = new Date(newSlot.start_time)
  const newEnd = new Date(newSlot.end_time)
  const newIsRecurring = newSlot.is_recurring || false

  for (const slot of existingSlots) {
    if (excludeId && slot.id === excludeId) continue

    const slotStart = new Date(slot.start_time)
    const slotEnd = new Date(slot.end_time)

    let overlaps = false

    if (!newIsRecurring && !slot.is_recurring) {
      // Both one-time: simple date-time overlap check
      overlaps = checkOverlap(newStart, newEnd, slotStart, slotEnd)
    } else if (newIsRecurring && slot.is_recurring) {
      // Both recurring: check recurring pattern overlap
      overlaps = checkRecurringOverlap(
        {
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          is_recurring: true,
          day_of_week: newSlot.day_of_week,
          recurrence_end_date: newSlot.recurrence_end_date,
        },
        slot
      )
    } else if (!newIsRecurring && slot.is_recurring) {
      // New is one-time, existing is recurring
      overlaps = checkRecurringVsOneTimeOverlap(
        { start_time: newSlot.start_time, end_time: newSlot.end_time },
        slot
      )
    } else if (newIsRecurring && !slot.is_recurring) {
      // New is recurring, existing is one-time
      overlaps = checkRecurringVsOneTimeOverlap(
        { start_time: slot.start_time, end_time: slot.end_time },
        {
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          is_recurring: true,
          day_of_week: newSlot.day_of_week,
          recurrence_end_date: newSlot.recurrence_end_date,
          exception_dates: null,
        }
      )
    }

    if (overlaps) {
      return {
        valid: false,
        error: 'This time slot overlaps with an existing availability',
        conflictingSlot: slot,
      }
    }
  }

  return { valid: true }
}

/**
 * Type exports
 */
export type TimeSlot = z.infer<typeof timeSlotSchema>
export type AvailabilityCreate = z.infer<typeof availabilityCreateSchema>
export type AvailabilityUpdate = z.infer<typeof availabilityUpdateSchema>
export type RecurringPattern = z.infer<typeof recurringPatternSchema>
