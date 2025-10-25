import { createClient } from '@/lib/supabase/client'
import { Tables, TablesInsert, TablesUpdate } from '@/types/database'

export type Availability = Tables<'availability'>
export type AvailabilityInsert = TablesInsert<'availability'>
export type AvailabilityUpdate = TablesUpdate<'availability'>

/**
 * Get all availability slots for a user
 */
export async function getAvailability(userId: string): Promise<Availability[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching availability:', error)
    throw new Error('Failed to fetch availability')
  }

  return data || []
}

/**
 * Get availability slots within a date range
 */
export async function getAvailabilityByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<Availability[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startDate)
    .lte('end_time', endDate)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching availability by date range:', error)
    throw new Error('Failed to fetch availability')
  }

  return data || []
}

/**
 * Create a new availability slot
 */
export async function createAvailability(data: AvailabilityInsert): Promise<Availability> {
  const supabase = createClient()

  const { data: newSlot, error } = await supabase
    .from('availability')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating availability:', error)
    throw new Error('Failed to create availability')
  }

  return newSlot
}

/**
 * Update an availability slot
 */
export async function updateAvailability(
  id: string,
  data: AvailabilityUpdate
): Promise<Availability> {
  const supabase = createClient()

  const { data: updatedSlot, error } = await supabase
    .from('availability')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating availability:', error)
    throw new Error('Failed to update availability')
  }

  return updatedSlot
}

/**
 * Delete an availability slot
 */
export async function deleteAvailability(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('availability')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting availability:', error)
    throw new Error('Failed to delete availability')
  }
}

/**
 * Delete multiple availability slots
 */
export async function deleteMultipleAvailability(ids: string[]): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('availability')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error deleting multiple availability slots:', error)
    throw new Error('Failed to delete availability slots')
  }
}

/**
 * Clear availability for a specific date range
 */
export async function clearAvailabilityByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('availability')
    .delete()
    .eq('user_id', userId)
    .gte('start_time', startDate)
    .lte('end_time', endDate)

  if (error) {
    console.error('Error clearing availability:', error)
    throw new Error('Failed to clear availability')
  }
}

/**
 * Create recurring availability slots
 */
export async function createRecurringAvailability(
  userId: string,
  slots: Array<{
    day_of_week: number
    start_time: string
    end_time: string
  }>,
  recurrenceEndDate?: string
): Promise<Availability[]> {
  const supabase = createClient()

  const recurringSlots: AvailabilityInsert[] = slots.map((slot) => ({
    user_id: userId,
    start_time: slot.start_time,
    end_time: slot.end_time,
    is_recurring: true,
    day_of_week: slot.day_of_week,
    recurrence_end_date: recurrenceEndDate || null,
  }))

  const { data, error } = await supabase
    .from('availability')
    .insert(recurringSlots)
    .select()

  if (error) {
    console.error('Error creating recurring availability:', error)
    throw new Error('Failed to create recurring availability')
  }

  return data || []
}

/**
 * Convert a slot to recurring
 */
export async function makeSlotRecurring(
  id: string,
  frequency: 'daily' | 'weekly',
  startTime: string
): Promise<Availability> {
  const supabase = createClient()

  const updateData: AvailabilityUpdate = {
    is_recurring: true,
    day_of_week: frequency === 'weekly' ? new Date(startTime).getDay() : null,
    updated_at: new Date().toISOString(),
  }

  const { data: updatedSlot, error } = await supabase
    .from('availability')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error making slot recurring:', error)
    throw new Error('Failed to make slot recurring')
  }

  return updatedSlot
}

/**
 * Add an exception date to a recurring slot
 * Prevents duplicate exception dates
 */
export async function addExceptionDate(
  id: string,
  exceptionDate: string
): Promise<Availability> {
  const supabase = createClient()

  // First get current exception dates
  const { data: slot, error: fetchError } = await supabase
    .from('availability')
    .select('exception_dates')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching slot:', fetchError)
    throw new Error('Failed to fetch slot')
  }

  const currentExceptions = (slot.exception_dates as string[]) || []
  
  // Normalize the exception date to date-only format (YYYY-MM-DD)
  const normalizedDate = exceptionDate.includes('T') 
    ? exceptionDate.split('T')[0] 
    : exceptionDate
  
  // Check if exception date already exists (prevent duplicates)
  const alreadyExists = currentExceptions.some(existingDate => {
    const normalized = existingDate.includes('T') 
      ? existingDate.split('T')[0] 
      : existingDate
    return normalized === normalizedDate
  })
  
  if (alreadyExists) {
    // Return current slot without modification
    const { data: currentSlot, error: refetchError } = await supabase
      .from('availability')
      .select('*')
      .eq('id', id)
      .single()
    
    if (refetchError) {
      throw new Error('Failed to fetch slot')
    }
    
    return currentSlot
  }
  
  const updatedExceptions = [...currentExceptions, normalizedDate]

  const { data: updatedSlot, error } = await supabase
    .from('availability')
    .update({
      exception_dates: updatedExceptions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error adding exception date:', error)
    throw new Error('Failed to add exception date')
  }

  return updatedSlot
}

/**
 * Set recurrence end date for a recurring slot
 * Also cleans up exception dates that fall after the new end date
 */
export async function setRecurrenceEndDate(
  id: string,
  endDate: string
): Promise<Availability> {
  const supabase = createClient()

  // First get current exception dates
  const { data: slot, error: fetchError } = await supabase
    .from('availability')
    .select('exception_dates')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching slot:', fetchError)
    throw new Error('Failed to fetch slot')
  }

  const currentExceptions = (slot.exception_dates as string[]) || []
  const endDateOnly = new Date(endDate).toISOString().split('T')[0]
  
  // Filter out exception dates that are after the new end date
  const cleanedExceptions = currentExceptions.filter(exDate => {
    const exDateOnly = exDate.includes('T') ? exDate.split('T')[0] : exDate
    return exDateOnly <= endDateOnly
  })

  const { data: updatedSlot, error } = await supabase
    .from('availability')
    .update({
      recurrence_end_date: endDate,
      exception_dates: cleanedExceptions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error setting recurrence end date:', error)
    throw new Error('Failed to set recurrence end date')
  }

  return updatedSlot
}

/**
 * Create a new recurring slot starting from a specific date
 */
export async function createRecurringFromDate(
  userId: string,
  dayOfWeek: number | null,
  startDate: string,
  startTime: string,
  endTime: string
): Promise<Availability> {
  const supabase = createClient()

  const newSlot: AvailabilityInsert = {
    user_id: userId,
    start_time: startTime,
    end_time: endTime,
    is_recurring: true,
    day_of_week: dayOfWeek,
    recurrence_end_date: null,
  }

  const { data, error } = await supabase
    .from('availability')
    .insert(newSlot)
    .select()
    .single()

  if (error) {
    console.error('Error creating recurring slot:', error)
    throw new Error('Failed to create recurring slot')
  }

  return data
}

/**
 * Subscribe to real-time availability changes
 */
export function subscribeToAvailability(
  userId: string,
  callback: (payload: any) => void
) {
  const supabase = createClient()

  const channel = supabase
    .channel(`availability:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'availability',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
