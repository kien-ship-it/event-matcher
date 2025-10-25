'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useRouter } from 'next/navigation'
import { createUser, getRoles } from '@/lib/api/users'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewUserPage() {
  const { user } = useAuth()
  const permissions = usePermissions()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role_id: 'student',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  })

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: { email: string; full_name: string; role_id: string; password: string }) =>
      createUser(data, user!.id),
    onSuccess: () => {
      toast.success('User created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      router.push('/admin/users')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user')
    },
  })

  // Check permissions
  if (!permissions.hasPrivilege('manage_users')) {
    router.push('/dashboard')
    return null
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.full_name) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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

    createUserMutation.mutate({
      email: formData.email,
      full_name: formData.full_name,
      role_id: formData.role_id,
      password: formData.password,
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New User</h1>
          <p className="text-muted-foreground">Add a new user to the system</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Enter the details for the new user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="John Doe"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john.doe@example.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role_id">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.role_id} onValueChange={(value) => handleChange('role_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          - {role.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role_id && <p className="text-sm text-destructive">{errors.role_id}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Minimum 8 characters"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Link href="/admin/users">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
