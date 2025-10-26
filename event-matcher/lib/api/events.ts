import { createClient } from '@/lib/supabase/client'
import { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type Event = Tables<'events'>
export type EventInsert = TablesInsert<'events'>
export type EventUpdate = TablesUpdate<'events'>
export type EventParticipant = Tables<'event_participants'>

export interface EventWithParticipants extends Event {
  participants: Array<{
    user_id: string
    full_name: string
    email: string
    role_id: string
  }>
  created_by_user?: {
    full_name: string
    email: string
  } | null
}

/**
 * Get all events for a specific user (as participant or creator)
 */
export async function getMyEvents(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<EventWithParticipants[]> {
  const supabase = createClient()

  // First, get event IDs where user is a participant
  const { data: participantEvents, error: participantError } = await supabase
    .from('event_participants')
    .select('event_id')
    .eq('user_id', userId)

  if (participantError) {
    console.error('Error fetching participant events:', participantError)
    throw new Error('Failed to fetch events')
  }

  const participantEventIds = (participantEvents || []).map((p) => p.event_id)

  // Build query for events where user is participant OR creator
  let query = supabase
    .from('events')
    .select(`
      *,
      created_by_user:profiles!events_created_by_fkey(full_name, email)
    `)

  // Filter: events where user is creator OR in the participant list
  if (participantEventIds.length > 0) {
    query = query.or(`created_by.eq.${userId},id.in.(${participantEventIds.join(',')})`)
  } else {
    // If no participant events, only get events created by user
    query = query.eq('created_by', userId)
  }

  if (startDate) {
    query = query.gte('start_time', startDate)
  }

  if (endDate) {
    query = query.lte('end_time', endDate)
  }

  query = query.order('start_time', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching my events:', error)
    throw new Error('Failed to fetch events')
  }

  // Return empty array if no events found
  if (!data || data.length === 0) {
    return []
  }

  // Fetch participants for each event
  const eventsWithParticipants = await Promise.all(
    data.map(async (event) => {
      const { data: participants } = await supabase
        .from('event_participants')
        .select(`
          user_id,
          profiles:profiles!event_participants_user_id_fkey(full_name, email, role_id)
        `)
        .eq('event_id', event.id)

      return {
        ...event,
        participants: (participants || []).map((p: any) => ({
          user_id: p.user_id,
          full_name: p.profiles?.full_name || '',
          email: p.profiles?.email || '',
          role_id: p.profiles?.role_id || '',
        })),
        created_by_user: event.created_by_user,
      }
    })
  )

  return eventsWithParticipants
}

/**
 * Get all events across the organization (admin view)
 * Requires view_all_events privilege
 */
export async function getAllEvents(
  startDate?: string,
  endDate?: string
): Promise<EventWithParticipants[]> {
  const supabase = createClient()

  let query = supabase
    .from('events')
    .select(`
      *,
      created_by_user:profiles!events_created_by_fkey(full_name, email)
    `)

  if (startDate) {
    query = query.gte('start_time', startDate)
  }

  if (endDate) {
    query = query.lte('end_time', endDate)
  }

  query = query.order('start_time', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching all events:', error)
    throw new Error('Failed to fetch events')
  }

  // Fetch participants for each event
  const eventsWithParticipants = await Promise.all(
    (data || []).map(async (event) => {
      const { data: participants } = await supabase
        .from('event_participants')
        .select(`
          user_id,
          profiles:profiles!event_participants_user_id_fkey(full_name, email, role_id)
        `)
        .eq('event_id', event.id)

      return {
        ...event,
        participants: (participants || []).map((p: any) => ({
          user_id: p.user_id,
          full_name: p.profiles?.full_name || '',
          email: p.profiles?.email || '',
          role_id: p.profiles?.role_id || '',
        })),
        created_by_user: event.created_by_user,
      }
    })
  )

  return eventsWithParticipants
}

/**
 * Get events for specific users (for admin scheduling view)
 * Properly handles recurring events by fetching all recurring events
 * and one-off events within the date range
 */
export async function getEventsForUsers(
  userIds: string[],
  startDate?: string,
  endDate?: string
): Promise<EventWithParticipants[]> {
  if (userIds.length === 0) {
    return []
  }

  const supabase = createClient()

  console.log('🔍 getEventsForUsers called with:', {
    userIds,
    userCount: userIds.length,
    startDate,
    endDate
  })

  // First, get event IDs for the specified users
  console.log('📝 Querying event_participants table for user IDs:', userIds)
  const { data: participantEvents, error: participantError } = await supabase
    .from('event_participants')
    .select('event_id, user_id')
    .in('user_id', userIds)

  if (participantError) {
    console.error('❌ Error fetching participant events:', participantError)
    throw new Error('Failed to fetch participant events')
  }

  console.log('📊 event_participants query result:', {
    rowsFound: (participantEvents || []).length,
    data: participantEvents
  })

  const eventIdsFromParticipants = (participantEvents || []).map((p) => p.event_id)
  
  console.log('📋 Event IDs from participants table:', eventIdsFromParticipants)
  
  // Also fetch events created by these users (they might not be in event_participants)
  const { data: createdEvents, error: createdError } = await supabase
    .from('events')
    .select('id')
    .in('created_by', userIds)
  
  if (createdError) {
    console.error('❌ Error fetching created events:', createdError)
  }
  
  const eventIdsFromCreated = (createdEvents || []).map((e) => e.id)
  console.log('📋 Event IDs from created_by:', eventIdsFromCreated)
  
  // Combine both sets of event IDs (remove duplicates)
  const eventIds = Array.from(new Set([...eventIdsFromParticipants, ...eventIdsFromCreated]))
  
  if (eventIds.length === 0) {
    console.warn('⚠️ No events found for specified users. This means:')
    console.warn('  1. No events exist in the database, OR')
    console.warn('  2. Selected users are not participants OR creators of any events')
    console.warn('  3. Run this SQL to check:')
    console.warn('     SELECT * FROM events WHERE created_by IN (...) OR id IN (SELECT event_id FROM event_participants WHERE user_id IN (...))')
    return []
  }

  console.log('📋 Combined event IDs:', eventIds.length, 'unique events')

  // Fetch recurring events (all of them, regardless of date range)
  const recurringQuery = supabase
    .from('events')
    .select(`
      *,
      created_by_user:profiles!events_created_by_fkey(full_name, email)
    `)
    .in('id', eventIds)
    .eq('is_recurring', true)

  // Fetch one-off events that overlap with the date range
  // An event overlaps if: event_start < range_end AND event_end > range_start
  let oneOffQuery = supabase
    .from('events')
    .select(`
      *,
      created_by_user:profiles!events_created_by_fkey(full_name, email)
    `)
    .in('id', eventIds)
    .eq('is_recurring', false)

  // Filter for events that overlap with the date range
  if (startDate && endDate) {
    // Event must start before range ends AND end after range starts
    oneOffQuery = oneOffQuery
      .lt('start_time', endDate)
      .gt('end_time', startDate)
  } else if (startDate) {
    // If only startDate, get events that end after it
    oneOffQuery = oneOffQuery.gt('end_time', startDate)
  } else if (endDate) {
    // If only endDate, get events that start before it
    oneOffQuery = oneOffQuery.lt('start_time', endDate)
  }

  // Execute both queries in parallel
  const [recurringResult, oneOffResult] = await Promise.all([
    recurringQuery,
    oneOffQuery
  ])

  if (recurringResult.error) {
    console.error('Error fetching recurring events for users:', recurringResult.error)
    throw new Error('Failed to fetch recurring events')
  }

  if (oneOffResult.error) {
    console.error('Error fetching one-off events for users:', oneOffResult.error)
    throw new Error('Failed to fetch one-off events')
  }

  // Combine both result sets
  const allEvents = [...(recurringResult.data || []), ...(oneOffResult.data || [])]
  
  console.log('getEventsForUsers: Found', allEvents.length, 'events')
  console.log('  - Recurring:', (recurringResult.data || []).length)
  console.log('  - One-off:', (oneOffResult.data || []).length)

  // Fetch participants for each event
  const eventsWithParticipants = await Promise.all(
    allEvents.map(async (event) => {
      const { data: participants } = await supabase
        .from('event_participants')
        .select(`
          user_id,
          profiles:profiles!event_participants_user_id_fkey(full_name, email, role_id)
        `)
        .eq('event_id', event.id)

      return {
        ...event,
        participants: (participants || []).map((p: any) => ({
          user_id: p.user_id,
          full_name: p.profiles?.full_name || '',
          email: p.profiles?.email || '',
          role_id: p.profiles?.role_id || '',
        })),
        created_by_user: event.created_by_user,
      }
    })
  )

  return eventsWithParticipants
}

/**
 * Get a single event by ID with full details
 */
export async function getEventDetails(eventId: string): Promise<EventWithParticipants | null> {
  const supabase = createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      created_by_user:profiles!events_created_by_fkey(full_name, email)
    `)
    .eq('id', eventId)
    .single()

  if (error) {
    console.error('Error fetching event details:', error)
    throw new Error('Failed to fetch event details')
  }

  if (!event) {
    return null
  }

  // Fetch participants
  const { data: participants } = await supabase
    .from('event_participants')
    .select(`
      user_id,
      profiles:profiles!event_participants_user_id_fkey(full_name, email, role_id)
    `)
    .eq('event_id', event.id)

  return {
    ...event,
    participants: (participants || []).map((p: any) => ({
      user_id: p.user_id,
      full_name: p.profiles?.full_name || '',
      email: p.profiles?.email || '',
      role_id: p.profiles?.role_id || '',
    })),
    created_by_user: event.created_by_user,
  }
}

/**
 * Create a new event
 */
export async function createEvent(
  eventData: EventInsert,
  participantIds: string[]
): Promise<EventWithParticipants> {
  const supabase = createClient()

  // Create the event
  const { data: newEvent, error: eventError } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single()

  if (eventError) {
    console.error('Error creating event:', eventError)
    throw new Error('Failed to create event')
  }

  // Add participants
  if (participantIds.length > 0) {
    const participants = participantIds.map((userId) => ({
      event_id: newEvent.id,
      user_id: userId,
    }))

    const { error: participantsError } = await supabase
      .from('event_participants')
      .insert(participants)

    if (participantsError) {
      console.error('Error adding participants:', participantsError)
      // Rollback: delete the event
      await supabase.from('events').delete().eq('id', newEvent.id)
      throw new Error('Failed to add participants')
    }
  }

  // Fetch the complete event with participants
  const completeEvent = await getEventDetails(newEvent.id)
  if (!completeEvent) {
    throw new Error('Failed to fetch created event')
  }

  return completeEvent
}

/**
 * Update an event
 */
export async function updateEvent(
  eventId: string,
  eventData: EventUpdate,
  participantIds?: string[]
): Promise<EventWithParticipants> {
  const supabase = createClient()

  // Update the event
  const { error: eventError } = await supabase
    .from('events')
    .update({ ...eventData, updated_at: new Date().toISOString() })
    .eq('id', eventId)
    .select()
    .single()

  if (eventError) {
    console.error('Error updating event:', eventError)
    throw new Error('Failed to update event')
  }

  // Update participants if provided
  if (participantIds !== undefined) {
    // Remove existing participants
    await supabase.from('event_participants').delete().eq('event_id', eventId)

    // Add new participants
    if (participantIds.length > 0) {
      const participants = participantIds.map((userId) => ({
        event_id: eventId,
        user_id: userId,
      }))

      const { error: participantsError } = await supabase
        .from('event_participants')
        .insert(participants)

      if (participantsError) {
        console.error('Error updating participants:', participantsError)
        throw new Error('Failed to update participants')
      }
    }
  }

  // Fetch the complete event with participants
  const completeEvent = await getEventDetails(eventId)
  if (!completeEvent) {
    throw new Error('Failed to fetch updated event')
  }

  return completeEvent
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = createClient()

  // Delete participants first (cascade should handle this, but being explicit)
  await supabase.from('event_participants').delete().eq('event_id', eventId)

  // Delete the event
  const { error } = await supabase.from('events').delete().eq('id', eventId)

  if (error) {
    console.error('Error deleting event:', error)
    throw new Error('Failed to delete event')
  }
}

/**
 * Delete a recurring event and all its instances
 */
export async function deleteRecurringEvent(parentEventId: string): Promise<void> {
  const supabase = createClient()

  // Get all child events
  const { data: childEvents } = await supabase
    .from('events')
    .select('id')
    .eq('parent_event_id', parentEventId)

  // Delete all child events
  if (childEvents && childEvents.length > 0) {
    for (const child of childEvents) {
      await deleteEvent(child.id)
    }
  }

  // Delete the parent event
  await deleteEvent(parentEventId)
}

/**
 * Subscribe to real-time event changes
 */
export function subscribeToEvents(callback: (payload: any) => void) {
  const supabase = createClient()

  const channel = supabase
    .channel('events-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to real-time event participant changes
 */
export function subscribeToEventParticipants(callback: (payload: any) => void) {
  const supabase = createClient()

  const channel = supabase
    .channel('event-participants-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_participants',
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
