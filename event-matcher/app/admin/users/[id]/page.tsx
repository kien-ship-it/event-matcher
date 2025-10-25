'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useRouter, useParams } from 'next/navigation'
import {
  getUserById,
  updateUser,
  deactivateUser,
  reactivateUser,
  getRoles,
  getUserAuditLogs,
  getPrivileges,
  getUserPrivileges,
  getAllUserPrivileges,
  grantPrivilege,
  revokePrivilege,
} from '@/lib/api/users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Save, Loader2, UserX, UserCheck, History, Shield, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function EditUserPage() {
  const { user: currentUser } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const userId = params.id as string

  const [formData, setFormData] = useState({
    full_name: '',
    role_id: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch user details
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId && permissions.hasPrivilege('view_all_users'),
  })

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  })

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['user-audit-logs', userId],
    queryFn: () => getUserAuditLogs(userId),
    enabled: !!userId && permissions.isAdmin,
  })

  // Fetch all privileges
  const { data: allPrivileges = [] } = useQuery({
    queryKey: ['privileges'],
    queryFn: getPrivileges,
    enabled: permissions.hasPrivilege('assign_privileges'),
  })

  // Fetch user's specific privileges
  const { data: userPrivileges = [] } = useQuery({
    queryKey: ['user-privileges', userId],
    queryFn: () => getUserPrivileges(userId),
    enabled: !!userId && permissions.hasPrivilege('assign_privileges'),
  })

  // Fetch all user privileges (role + user-specific)
  const { data: allUserPrivileges = [] } = useQuery({
    queryKey: ['all-user-privileges', userId],
    queryFn: () => getAllUserPrivileges(userId),
    enabled: !!userId && permissions.hasPrivilege('assign_privileges'),
  })

  // Grant privilege mutation
  const grantPrivilegeMutation = useMutation({
    mutationFn: (privilegeId: string) => grantPrivilege(userId, privilegeId, currentUser!.id),
    onSuccess: () => {
      toast.success('Privilege granted successfully')
      queryClient.invalidateQueries({ queryKey: ['user-privileges', userId] })
      queryClient.invalidateQueries({ queryKey: ['all-user-privileges', userId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to grant privilege')
    },
  })

  // Revoke privilege mutation
  const revokePrivilegeMutation = useMutation({
    mutationFn: (privilegeId: string) => revokePrivilege(userId, privilegeId, currentUser!.id),
    onSuccess: () => {
      toast.success('Privilege revoked successfully')
      queryClient.invalidateQueries({ queryKey: ['user-privileges', userId] })
      queryClient.invalidateQueries({ queryKey: ['all-user-privileges', userId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to revoke privilege')
    },
  })

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: { full_name?: string; role_id?: string }) =>
      updateUser(userId, data, currentUser!.id),
    onSuccess: () => {
      toast.success('User updated successfully')
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user')
    },
  })

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: () => deactivateUser(userId, currentUser!.id),
    onSuccess: () => {
      toast.success('User deactivated successfully')
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to deactivate user')
    },
  })

  // Reactivate user mutation
  const reactivateUserMutation = useMutation({
    mutationFn: () => reactivateUser(userId, currentUser!.id),
    onSuccess: () => {
      toast.success('User reactivated successfully')
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reactivate user')
    },
  })

  // Initialize form data when user is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        role_id: user.role_id,
      })
    }
  }, [user])

  // Check permissions
  if (!permissions.hasPrivilege('view_all_users')) {
    router.push('/dashboard')
    return null
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.role_id) {
      newErrors.role_id = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const updates: any = {}
    if (formData.full_name !== user?.full_name) {
      updates.full_name = formData.full_name
    }
    if (formData.role_id !== user?.role_id) {
      updates.role_id = formData.role_id
    }

    if (Object.keys(updates).length === 0) {
      toast.info('No changes to save')
      return
    }

    updateUserMutation.mutate(updates)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <p>User not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit User</h1>
            <p className="text-muted-foreground">Manage user details and permissions</p>
          </div>
        </div>
        {user.is_active ? (
          <Badge variant="default" className="bg-green-500">
            <UserCheck className="h-3 w-3 mr-1" />
            Active
          </Badge>
        ) : (
          <Badge variant="destructive">
            <UserX className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Update user details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">
                      {user.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    disabled={!permissions.hasPrivilege('manage_users')}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name}</p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                {/* Role */}
                {permissions.hasPrivilege('manage_users') && (
                  <div className="space-y-2">
                    <Label htmlFor="role_id">
                      Role <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.role_id}
                      onValueChange={(value) => handleChange('role_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role_id && (
                      <p className="text-sm text-destructive">{errors.role_id}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {permissions.hasPrivilege('manage_users') && (
                  <div className="flex gap-4 justify-end">
                    <Button
                      type="submit"
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          {permissions.isAdmin && auditLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Audit Log
                </CardTitle>
                <CardDescription>Recent changes to this user</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-start gap-4 text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          {permissions.hasPrivilege('manage_users') && (
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>Manage user account status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.is_active ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate User
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will prevent {user.full_name} from logging in. You can
                          reactivate them later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deactivateUserMutation.mutate()}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Deactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => reactivateUserMutation.mutate()}
                    disabled={reactivateUserMutation.isPending}
                  >
                    {reactivateUserMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Reactivating...
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Reactivate User
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* User Privileges */}
          {permissions.hasPrivilege('assign_privileges') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privileges
                </CardTitle>
                <CardDescription>
                  Manage additional privileges for this user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role Privileges */}
                <div>
                  <p className="text-sm font-medium mb-2">From Role ({user.role.name})</p>
                  <div className="flex flex-wrap gap-2">
                    {allUserPrivileges
                      .filter((p: any) => p.source === 'role')
                      .map((p: any) => (
                        <Badge key={p.privilege_id} variant="secondary">
                          {p.privilege_name}
                        </Badge>
                      ))}
                  </div>
                </div>

                {/* User-Specific Privileges */}
                <div>
                  <p className="text-sm font-medium mb-2">Additional Privileges</p>
                  {userPrivileges.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {userPrivileges.map((up: any) => (
                        <Badge key={up.privilege_id} variant="default" className="flex items-center gap-1">
                          {up.privilege.name}
                          <button
                            onClick={() => revokePrivilegeMutation.mutate(up.privilege_id)}
                            className="ml-1 hover:text-destructive"
                            disabled={revokePrivilegeMutation.isPending}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-3">No additional privileges</p>
                  )}

                  {/* Add Privilege Dropdown */}
                  <Select
                    onValueChange={(value) => grantPrivilegeMutation.mutate(value)}
                    disabled={grantPrivilegeMutation.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Grant a privilege..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allPrivileges
                        .filter((p: any) => 
                          !allUserPrivileges.some((up: any) => up.privilege_id === p.id)
                        )
                        .map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Stats */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {format(new Date(user.created_at), 'MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {format(new Date(user.updated_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
