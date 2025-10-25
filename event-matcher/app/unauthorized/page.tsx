'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600">
            This page requires specific privileges that your account doesn&apos;t
            currently have. If you believe this is an error, please contact your
            administrator.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full"
          >
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
