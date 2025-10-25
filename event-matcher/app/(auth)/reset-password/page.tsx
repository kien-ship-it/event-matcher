'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      )

      if (error) {
        toast.error('Password reset failed', {
          description: error.message,
        })
        return
      }

      setEmailSent(true)
      toast.success('Password reset email sent', {
        description: 'Please check your email for the reset link',
      })
    } catch (error) {
      toast.error('An unexpected error occurred', {
        description: 'Please try again later',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a password reset link to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Click the link in the email to reset your password. The link will
              expire in 1 hour.
            </p>
            <p className="text-sm text-gray-600">
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setEmailSent(false)}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                try again
              </button>
              .
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
