import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Get a user's profile by ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    throw error
  }

  return data
}

/**
 * Update a user's profile
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<Profile> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  return data
}

/**
 * Get all profiles (admin only)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching profiles:', error)
    throw error
  }

  return data
}

/**
 * Search profiles by name or email
 */
export async function searchProfiles(query: string): Promise<Profile[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('full_name', { ascending: true })
    .limit(20)

  if (error) {
    console.error('Error searching profiles:', error)
    throw error
  }

  return data
}

/**
 * Get profiles by role
 */
export async function getProfilesByRole(roleId: string): Promise<Profile[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role_id', roleId)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching profiles by role:', error)
    throw error
  }

  return data
}
