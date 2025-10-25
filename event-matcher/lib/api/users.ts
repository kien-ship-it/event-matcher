import { createClient } from '@/lib/supabase/client'

export interface User {
  id: string
  email: string
  full_name: string
  role_id: string
  avatar_url: string | null
  notification_preferences: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserWithRole extends User {
  role: {
    id: string
    name: string
    description: string | null
  }
}

export interface CreateUserData {
  email: string
  full_name: string
  role_id: string
  password: string
}

export interface UpdateUserData {
  full_name?: string
  role_id?: string
  avatar_url?: string
  notification_preferences?: any
  is_active?: boolean
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: any
  created_at: string
}

/**
 * Get all users with their roles
 */
export async function getAllUsers(): Promise<UserWithRole[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role_id,
      avatar_url,
      notification_preferences,
      is_active,
      created_at,
      updated_at,
      role:roles!profiles_role_id_fkey (
        id,
        name,
        description
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }

  return (data || []) as UserWithRole[]
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string): Promise<UserWithRole | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role_id,
      avatar_url,
      notification_preferences,
      is_active,
      created_at,
      updated_at,
      role:roles!profiles_role_id_fkey (
        id,
        name,
        description
      )
    `)
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data as UserWithRole
}

/**
 * Search users by name or email
 */
export async function searchUsers(query: string): Promise<UserWithRole[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role_id,
      avatar_url,
      notification_preferences,
      is_active,
      created_at,
      updated_at,
      role:roles!profiles_role_id_fkey (
        id,
        name,
        description
      )
    `)
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching users:', error)
    throw new Error('Failed to search users')
  }

  return (data || []) as UserWithRole[]
}

/**
 * Filter users by role
 */
export async function getUsersByRole(roleId: string): Promise<UserWithRole[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role_id,
      avatar_url,
      notification_preferences,
      is_active,
      created_at,
      updated_at,
      role:roles!profiles_role_id_fkey (
        id,
        name,
        description
      )
    `)
    .eq('role_id', roleId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users by role:', error)
    throw new Error('Failed to fetch users')
  }

  return (data || []) as UserWithRole[]
}

/**
 * Create a new user (admin only)
 * Note: This creates the auth user and profile
 */
export async function createUser(userData: CreateUserData, adminId: string): Promise<UserWithRole> {
  const supabase = createClient()

  // Create auth user via Supabase Admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: {
      full_name: userData.full_name,
      role_id: userData.role_id,
    },
  })

  if (authError || !authData.user) {
    console.error('Error creating auth user:', authError)
    throw new Error('Failed to create user')
  }

  // The profile should be created automatically via the trigger
  // Wait a moment and fetch the profile
  await new Promise(resolve => setTimeout(resolve, 500))

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role_id,
      avatar_url,
      notification_preferences,
      is_active,
      created_at,
      updated_at,
      role:roles!profiles_role_id_fkey (
        id,
        name,
        description
      )
    `)
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching created profile:', profileError)
    throw new Error('User created but profile not found')
  }

  // Log the action
  await logAuditAction({
    userId: adminId,
    action: 'create_user',
    resourceType: 'user',
    resourceId: authData.user.id,
    details: {
      email: userData.email,
      full_name: userData.full_name,
      role_id: userData.role_id,
    },
  })

  return profile as UserWithRole
}

/**
 * Update a user's profile (admin only)
 */
export async function updateUser(
  userId: string,
  updates: UpdateUserData,
  adminId: string
): Promise<UserWithRole> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select(`
      id,
      email,
      full_name,
      role_id,
      avatar_url,
      notification_preferences,
      is_active,
      created_at,
      updated_at,
      role:roles!profiles_role_id_fkey (
        id,
        name,
        description
      )
    `)
    .single()

  if (error) {
    console.error('Error updating user:', error)
    throw new Error('Failed to update user')
  }

  // Log the action
  await logAuditAction({
    userId: adminId,
    action: 'update_user',
    resourceType: 'user',
    resourceId: userId,
    details: updates,
  })

  return data as UserWithRole
}

/**
 * Deactivate a user (soft delete)
 */
export async function deactivateUser(userId: string, adminId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error deactivating user:', error)
    throw new Error('Failed to deactivate user')
  }

  // Log the action
  await logAuditAction({
    userId: adminId,
    action: 'deactivate_user',
    resourceType: 'user',
    resourceId: userId,
    details: { is_active: false },
  })
}

/**
 * Reactivate a user
 */
export async function reactivateUser(userId: string, adminId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error reactivating user:', error)
    throw new Error('Failed to reactivate user')
  }

  // Log the action
  await logAuditAction({
    userId: adminId,
    action: 'reactivate_user',
    resourceType: 'user',
    resourceId: userId,
    details: { is_active: true },
  })
}

/**
 * Get all available roles
 */
export async function getRoles() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching roles:', error)
    throw new Error('Failed to fetch roles')
  }

  return data || []
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string): Promise<AuditLog[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('resource_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return []
  }

  return (data || []) as AuditLog[]
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(limit = 100): Promise<AuditLog[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching audit logs:', error)
    return []
  }

  return (data || []) as AuditLog[]
}

/**
 * Log an audit action
 */
async function logAuditAction({
  userId,
  action,
  resourceType,
  resourceId,
  details,
}: {
  userId: string
  action: string
  resourceType: string
  resourceId: string | null
  details: any
}): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  })

  if (error) {
    console.error('Error logging audit action:', error)
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

/**
 * Get all available privileges
 */
export async function getPrivileges() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('privileges')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching privileges:', error)
    throw new Error('Failed to fetch privileges')
  }

  return data || []
}

/**
 * Get user's specific privileges (beyond role privileges)
 */
export async function getUserPrivileges(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_privileges')
    .select(`
      privilege_id,
      granted_at,
      granted_by,
      privilege:privileges!user_privileges_privilege_id_fkey (
        id,
        name,
        description,
        category
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching user privileges:', error)
    return []
  }

  return data || []
}

/**
 * Grant a privilege to a user
 */
export async function grantPrivilege(
  userId: string,
  privilegeId: string,
  grantedBy: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('user_privileges').insert({
    user_id: userId,
    privilege_id: privilegeId,
    granted_by: grantedBy,
  })

  if (error) {
    console.error('Error granting privilege:', error)
    throw new Error('Failed to grant privilege')
  }

  // Log the action
  await logAuditAction({
    userId: grantedBy,
    action: 'grant_privilege',
    resourceType: 'user_privilege',
    resourceId: userId,
    details: { privilege_id: privilegeId },
  })
}

/**
 * Revoke a privilege from a user
 */
export async function revokePrivilege(
  userId: string,
  privilegeId: string,
  revokedBy: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_privileges')
    .delete()
    .eq('user_id', userId)
    .eq('privilege_id', privilegeId)

  if (error) {
    console.error('Error revoking privilege:', error)
    throw new Error('Failed to revoke privilege')
  }

  // Log the action
  await logAuditAction({
    userId: revokedBy,
    action: 'revoke_privilege',
    resourceType: 'user_privilege',
    resourceId: userId,
    details: { privilege_id: privilegeId },
  })
}

/**
 * Get all privileges for a user (role + user-specific)
 */
export async function getAllUserPrivileges(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_all_privileges')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching all user privileges:', error)
    return []
  }

  return data || []
}

/**
 * Subscribe to user changes
 */
export function subscribeToUsers(callback: (payload: any) => void) {
  const supabase = createClient()

  const subscription = supabase
    .channel('users_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
      },
      callback
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}
