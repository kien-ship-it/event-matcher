'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useRouter } from 'next/navigation'
import { getAllUsers, searchUsers, getUsersByRole, getRoles, subscribeToUsers } from '@/lib/api/users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Search, UserPlus, Mail, Shield, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  
  const hasViewPrivilege = permissions.hasPrivilege('view_all_users')

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', searchQuery, selectedRole],
    queryFn: async () => {
      if (searchQuery) {
        return searchUsers(searchQuery)
      }
      if (selectedRole && selectedRole !== 'all') {
        return getUsersByRole(selectedRole)
      }
      return getAllUsers()
    },
    enabled: !!user && hasViewPrivilege,
  })

  // Fetch roles for filter
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  })

  // Setup real-time subscriptions
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToUsers(() => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.info('User list updated')
    })

    return () => {
      unsubscribe()
    }
  }, [user, queryClient])

  // Check permissions - show loading while checking
  if (!user) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  if (!hasViewPrivilege) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRoleBadgeVariant = (roleId: string) => {
    switch (roleId) {
      case 'admin':
        return 'destructive'
      case 'hr':
      case 'marketing':
      case 'operations':
        return 'default'
      case 'teacher':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
        </div>
        {permissions.hasPrivilege('manage_users') && (
          <Link href="/admin/users/new">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role_id === 'teacher').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.role_id === 'student').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Users List */}
      {!isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <CardDescription>
              {searchQuery && `Results for "${searchQuery}"`}
              {selectedRole && selectedRole !== 'all' && ` • Role: ${selectedRole}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.full_name}</p>
                          {user.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getRoleBadgeVariant(user.role_id)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role.name}
                      </Badge>
                      {permissions.hasPrivilege('manage_users') && (
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
