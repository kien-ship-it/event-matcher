'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useProfile, useUser } from '@/hooks/useAuth'
import { updateProfile } from '@/lib/api/profiles'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: user } = useUser()
  const { data: profile, isLoading } = useProfile()
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.full_name || '',
      email: profile?.email || '',
      avatarUrl: profile?.avatar_url || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.id) throw new Error('User not found')

      return updateProfile(user.id, {
        full_name: values.fullName,
        email: values.email,
        avatar_url: values.avatarUrl || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update profile', {
        description: error.message,
      })
    },
  })

  async function onSubmit(values: ProfileFormValues) {
    updateMutation.mutate(values)
  }

  async function handleSignOut() {
    setIsUpdating(true)
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast.error('Failed to sign out')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              Unable to load your profile. Please try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account information
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            disabled={updateMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            disabled={updateMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://example.com/avatar.jpg"
                            disabled={updateMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="flex-1"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Role</p>
                <p className="text-sm text-gray-900 capitalize">
                  {profile.role_id}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Account Status
                </p>
                <p className="text-sm text-gray-900">
                  {profile.is_active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Member Since
                </p>
                <p className="text-sm text-gray-900">
                  {new Date(profile.created_at || '').toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => router.push('/update-password')}
                className="w-full"
              >
                Change Password
              </Button>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? 'Signing out...' : 'Sign Out'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
