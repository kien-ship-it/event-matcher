import { createClient } from '@/lib/supabase/client'
import { getMyEvents, getAllEvents, getEventsForUsers, EventWithParticipants } from './events'
import { getAvailability, getAvailabilityByDateRange, Availability } from './availability'
import { expandRecurringEvents, expandRecurringAvailability } from '@/lib/utils/recurring'

export interface ScheduleItem {
  id: string
  type: 'event' | 'availability'
  title: string
  start_time: string
  end_time: string
  description?: string
  is_recurring: boolean
  user_id: string
  user_name?: string
  event_type?: string
  location?: string
  participants?: Array<{
    user_id: string
    full_name: string
    email: string
  }>
}

export interface UserSchedule {
  user_id: string
  full_name: string
  email: string
  role_id: string
  events: EventWithParticipants[]
  availability: Availability[]
  schedule_items: ScheduleItem[]
}

/**
 * Get complete schedule for a user (events + availability)
 */
export async function getMySchedule(
  userId: string,
  startDate?: string,
  endDate?: string,
  expandRecurring: boolean = true
): Promise<ScheduleItem[]> {
  // Fetch events and availability in parallel
  const [events, availability] = await Promise.all([
    getMyEvents(userId, startDate, endDate),
    startDate && endDate
      ? getAvailabilityByDateRange(userId, startDate, endDate)
      : getAvailability(userId),
  ])

  // Convert events to schedule items
  let eventItems: ScheduleItem[] = events.map((event) => ({
    id: event.id,
    type: 'event' as const,
    title: event.title,
    start_time: event.start_time,
    end_time: event.end_time,
    description: event.description || undefined,
    is_recurring: event.is_recurring || false,
    user_id: userId,
    event_type: event.event_type,
    location: event.location || undefined,
    participants: event.participants,
  }))

  // Expand recurring events if requested
  if (expandRecurring && startDate && endDate) {
    eventItems = expandRecurringEvents(eventItems, startDate, endDate)
  }

  // Convert availability to schedule items
  let availabilityItems: ScheduleItem[] = availability.map((slot) => ({
    id: slot.id,
    type: 'availability' as const,
    title: 'Available',
    start_time: slot.start_time,
    end_time: slot.end_time,
    is_recurring: slot.is_recurring || false,
    user_id: userId,
  }))

  // Expand recurring availability if requested
  if (expandRecurring && startDate && endDate) {
    availabilityItems = expandRecurringAvailability(availabilityItems, startDate, endDate)
  }

  // Combine and sort by start time
  const scheduleItems = [...eventItems, ...availabilityItems].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  return scheduleItems
}

/**
 * Get schedules for all users (admin view)
 * Requires view_all_events and view_all_availability privileges
 */
export async function getAllSchedules(
  startDate?: string,
  endDate?: string,
  expandRecurring: boolean = true
): Promise<UserSchedule[]> {
  const supabase = createClient()

  // Fetch all active users
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role_id')
    .eq('is_active', true)
    .order('full_name')

  if (usersError) {
    console.error('Error fetching users:', usersError)
    throw new Error('Failed to fetch users')
  }

  if (!users || users.length === 0) {
    return []
  }

  // Fetch all events
  const allEvents = await getAllEvents(startDate, endDate)

  // Fetch all availability
  const { data: allAvailability, error: availabilityError } = await supabase
    .from('availability')
    .select('*')
    .order('start_time')

  if (availabilityError) {
    console.error('Error fetching availability:', availabilityError)
    throw new Error('Failed to fetch availability')
  }

  // Build schedule for each user
  const userSchedules: UserSchedule[] = users.map((user) => {
    // Filter events for this user
    const userEvents = allEvents.filter(
      (event) =>
        event.created_by === user.id ||
        event.participants.some((p) => p.user_id === user.id)
    )

    // Filter availability for this user
    const userAvailability = (allAvailability || []).filter(
      (slot) => slot.user_id === user.id
    )

    // Convert to schedule items
    let eventItems: ScheduleItem[] = userEvents.map((event) => ({
      id: event.id,
      type: 'event' as const,
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
      description: event.description || undefined,
      is_recurring: event.is_recurring || false,
      user_id: user.id,
      user_name: user.full_name,
      event_type: event.event_type,
      location: event.location || undefined,
      participants: event.participants,
    }))

    // Expand recurring events if requested
    if (expandRecurring && startDate && endDate) {
      eventItems = expandRecurringEvents(eventItems, startDate, endDate)
    }

    let availabilityItems: ScheduleItem[] = userAvailability.map((slot) => ({
      id: slot.id,
      type: 'availability' as const,
      title: 'Available',
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_recurring: slot.is_recurring || false,
      user_id: user.id,
      user_name: user.full_name,
    }))

    // Expand recurring availability if requested
    if (expandRecurring && startDate && endDate) {
      availabilityItems = expandRecurringAvailability(availabilityItems, startDate, endDate)
    }

    const scheduleItems = [...eventItems, ...availabilityItems].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

    return {
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id,
      events: userEvents,
      availability: userAvailability,
      schedule_items: scheduleItems,
    }
  })

  return userSchedules
}

/**
 * Get schedules for specific users (for filtered admin view)
 */
export async function getSchedulesForUsers(
  userIds: string[],
  startDate?: string,
  endDate?: string,
  expandRecurring: boolean = true
): Promise<UserSchedule[]> {
  if (userIds.length === 0) {
    return []
  }

  const supabase = createClient()

  // Fetch user details
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role_id')
    .in('id', userIds)
    .eq('is_active', true)
    .order('full_name')

  if (usersError) {
    console.error('Error fetching users:', usersError)
    throw new Error('Failed to fetch users')
  }

  if (!users || users.length === 0) {
    return []
  }

  // Fetch events for these users
  const events = await getEventsForUsers(userIds, startDate, endDate)

  // Fetch availability for these users
  const { data: availability, error: availabilityError } = await supabase
    .from('availability')
    .select('*')
    .in('user_id', userIds)
    .order('start_time')

  if (availabilityError) {
    console.error('Error fetching availability:', availabilityError)
    throw new Error('Failed to fetch availability')
  }

  // Build schedule for each user
  const userSchedules: UserSchedule[] = users.map((user) => {
    // Filter events for this user
    const userEvents = events.filter(
      (event) =>
        event.created_by === user.id ||
        event.participants.some((p) => p.user_id === user.id)
    )

    // Filter availability for this user
    const userAvailability = (availability || []).filter(
      (slot) => slot.user_id === user.id
    )

    // Convert to schedule items
    let eventItems: ScheduleItem[] = userEvents.map((event) => ({
      id: event.id,
      type: 'event' as const,
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
      description: event.description || undefined,
      is_recurring: event.is_recurring || false,
      user_id: user.id,
      user_name: user.full_name,
      event_type: event.event_type,
      location: event.location || undefined,
      participants: event.participants,
    }))

    // Expand recurring events if requested
    if (expandRecurring && startDate && endDate) {
      eventItems = expandRecurringEvents(eventItems, startDate, endDate)
    }

    let availabilityItems: ScheduleItem[] = userAvailability.map((slot) => ({
      id: slot.id,
      type: 'availability' as const,
      title: 'Available',
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_recurring: slot.is_recurring || false,
      user_id: user.id,
      user_name: user.full_name,
    }))

    // Expand recurring availability if requested
    if (expandRecurring && startDate && endDate) {
      availabilityItems = expandRecurringAvailability(availabilityItems, startDate, endDate)
    }

    const scheduleItems = [...eventItems, ...availabilityItems].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )

    return {
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id,
      events: userEvents,
      availability: userAvailability,
      schedule_items: scheduleItems,
    }
  })

  return userSchedules
}

/**
 * Export schedule to CSV format
 * Properly handles recurring events by expanding them
 */
export function exportScheduleToCSV(
  schedules: UserSchedule[],
  startDate: string,
  endDate: string
): string {
  const headers = [
    'User Name',
    'Email',
    'Role',
    'Type',
    'Title',
    'Start Time',
    'End Time',
    'Duration (min)',
    'Event Type',
    'Location',
    'Description',
    'Participants',
  ]

  const rows: string[][] = [headers]

  schedules.forEach((schedule) => {
    // Expand recurring items for export
    const expandedItems = [
      ...expandRecurringEvents(
        schedule.schedule_items.filter((item) => item.type === 'event'),
        startDate,
        endDate
      ),
      ...expandRecurringAvailability(
        schedule.schedule_items.filter((item) => item.type === 'availability'),
        startDate,
        endDate
      ),
    ].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

    expandedItems.forEach((item) => {
      const duration = Math.round(
        (new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / 60000
      )

      const participants =
        item.participants?.map((p: { full_name: string; email: string }) => `${p.full_name} (${p.email})`).join('; ') || ''

      rows.push([
        schedule.full_name,
        schedule.email,
        schedule.role_id,
        item.type,
        item.title,
        new Date(item.start_time).toLocaleString(),
        new Date(item.end_time).toLocaleString(),
        duration.toString(),
        item.event_type || '',
        item.location || '',
        item.description || '',
        participants,
      ])
    })
  })

  // Convert to CSV
  return rows
    .map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    )
    .join('\n')
}

/**
 * Export schedule to iCalendar format
 * Properly handles recurring events
 */
export function exportScheduleToICS(
  schedules: UserSchedule[],
  startDate: string,
  endDate: string
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Event Matcher//Schedule Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  schedules.forEach((schedule) => {
    // Expand recurring items for export
    const expandedItems = [
      ...expandRecurringEvents(
        schedule.schedule_items.filter((item) => item.type === 'event'),
        startDate,
        endDate
      ),
      ...expandRecurringAvailability(
        schedule.schedule_items.filter((item) => item.type === 'availability'),
        startDate,
        endDate
      ),
    ]

    expandedItems.forEach((item) => {
      const startDT = new Date(item.start_time)
      const endDT = new Date(item.end_time)

      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }

      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${item.id}@eventmatcher.com`)
      lines.push(`DTSTAMP:${formatDate(new Date())}`)
      lines.push(`DTSTART:${formatDate(startDT)}`)
      lines.push(`DTEND:${formatDate(endDT)}`)
      lines.push(`SUMMARY:${item.title}`)

      if (item.description) {
        lines.push(`DESCRIPTION:${item.description.replace(/\n/g, '\\n')}`)
      }

      if (item.location) {
        lines.push(`LOCATION:${item.location}`)
      }

      if (item.participants && item.participants.length > 0) {
        item.participants.forEach((p: { full_name: string; email: string }) => {
          lines.push(`ATTENDEE;CN=${p.full_name}:mailto:${p.email}`)
        })
      }

      lines.push(`ORGANIZER;CN=${schedule.full_name}:mailto:${schedule.email}`)
      lines.push('STATUS:CONFIRMED')
      lines.push('END:VEVENT')
    })
  })

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}
