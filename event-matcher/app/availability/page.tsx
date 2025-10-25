'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AvailabilityCalendar } from '@/components/availability/AvailabilityCalendar'
import { useAuth } from '@/hooks/useAuth'
import { getAvailability, createAvailability, updateAvailability, deleteAvailability, subscribeToAvailability, makeSlotRecurring, addExceptionDate, setRecurrenceEndDate, createRecurringFromDate } from '@/lib/api/availability'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AvailabilityPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [timeZone, setTimeZone] = useState<string>('local')
  
  // Set user's timezone after mount to avoid hydration mismatch
  useEffect(() => {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (userTimeZone) {
      setTimeZone(userTimeZone)
    }
  }, [])

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToAvailability(user.id, (payload: any) => {
      // Invalidate queries on any change
      queryClient.invalidateQueries({ queryKey: ['availability', user.id] })

      // Show toast notification for external changes
      if (payload.eventType === 'INSERT') {
        toast.info('New availability slot added')
      } else if (payload.eventType === 'UPDATE') {
        toast.info('Availability slot updated')
      } else if (payload.eventType === 'DELETE') {
        toast.info('Availability slot deleted')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [user, queryClient])

  // Fetch availability slots
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['availability', user?.id],
    queryFn: () => getAvailability(user!.id),
    enabled: !!user,
  })

  // Create availability mutation with optimistic updates
  const createMutation = useMutation({
    mutationFn: createAvailability,
    onMutate: async (newSlot) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['availability', user?.id] })

      // Snapshot previous value
      const previousSlots = queryClient.getQueryData(['availability', user?.id])

      // Optimistically update
      queryClient.setQueryData(['availability', user?.id], (old: any) => {
        const tempSlot = { ...(newSlot as any), id: 'temp-' + Date.now() }
        return [...(old || []), tempSlot]
      })

      return { previousSlots }
    },
    onError: (_err, _newSlot, context: any) => {
      // Rollback on error
      queryClient.setQueryData(['availability', user?.id], context.previousSlots)
      toast.error('Failed to create availability slot')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', user?.id] })
    },
  })

  // Update availability mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAvailability(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['availability', user?.id] })

      const previousSlots = queryClient.getQueryData(['availability', user?.id])

      queryClient.setQueryData(['availability', user?.id], (old: any) => {
        return (old || []).map((slot: any) =>
          slot.id === id ? { ...slot, ...data } : slot
        )
      })

      return { previousSlots }
    },
    onError: (_err, _variables, context: any) => {
      queryClient.setQueryData(['availability', user?.id], context.previousSlots)
      toast.error('Failed to update availability slot')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', user?.id] })
    },
  })

  // Delete availability mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: deleteAvailability,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['availability', user?.id] })

      const previousSlots = queryClient.getQueryData(['availability', user?.id])

      queryClient.setQueryData(['availability', user?.id], (old: any) => {
        return (old || []).filter((slot: any) => slot.id !== id)
      })

      return { previousSlots }
    },
    onError: (_err, _id, context: any) => {
      queryClient.setQueryData(['availability', user?.id], context.previousSlots)
      toast.error('Failed to delete availability slot')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', user?.id] })
    },
  })

  const handleAddSlot = async (start: Date, end: Date) => {
    if (!user) return

    await createMutation.mutateAsync({
      user_id: user.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      is_recurring: false,
    })
  }

  const handleUpdateSlot = async (id: string, start: Date, end: Date) => {
    await updateMutation.mutateAsync({
      id,
      data: {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      },
    })
  }

  const handleDeleteSlot = async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }

  // Make slot recurring mutation
  const makeRecurringMutation = useMutation({
    mutationFn: ({ id, frequency, startTime }: { id: string; frequency: 'daily' | 'weekly'; startTime: string }) =>
      makeSlotRecurring(id, frequency, startTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', user?.id] })
    },
    onError: () => {
      toast.error('Failed to make slot recurring')
    },
  })

  const handleMakeRecurring = async (id: string, frequency: 'daily' | 'weekly', startTime: string) => {
    await makeRecurringMutation.mutateAsync({ id, frequency, startTime })
  }

  // Add exception date mutation
  const addExceptionMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => addExceptionDate(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', user?.id] })
    },
  })

  const handleAddExceptionDate = async (id: string, date: string) => {
    await addExceptionMutation.mutateAsync({ id, date })
  }

  // Set recurrence end date mutation
  const setEndDateMutation = useMutation({
    mutationFn: ({ id, endDate }: { id: string; endDate: string }) => setRecurrenceEndDate(id, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', user?.id] })
    },
  })

  const handleSetRecurrenceEndDate = async (id: string, endDate: string) => {
    await setEndDateMutation.mutateAsync({ id, endDate })
  }

  // Create recurring from date mutation
  const createRecurringMutation = useMutation({
    mutationFn: ({ dayOfWeek, startDate, startTime, endTime }: { 
      dayOfWeek: number | null; 
      startDate: string; 
      startTime: string; 
      endTime: string 
    }) => createRecurringFromDate(user!.id, dayOfWeek, startDate, startTime, endTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', user?.id] })
    },
  })

  const handleCreateRecurringFromDate = async (
    dayOfWeek: number | null,
    startDate: string,
    startTime: string,
    endTime: string
  ) => {
    await createRecurringMutation.mutateAsync({ dayOfWeek, startDate, startTime, endTime })
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <p>Please log in to manage your availability.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time zone</span>
          <Select value={timeZone} onValueChange={setTimeZone}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select time zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/New_York">America/New_York</SelectItem>
            <SelectItem value="America/Chicago">America/Chicago</SelectItem>
            <SelectItem value="America/Denver">America/Denver</SelectItem>
            <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
            <SelectItem value="Europe/London">Europe/London</SelectItem>
            <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
            <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
            <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>
      
      <AvailabilityCalendar
        slots={slots}
        onAddSlot={handleAddSlot}
        onUpdateSlot={handleUpdateSlot}
        onDeleteSlot={handleDeleteSlot}
        onMakeRecurring={handleMakeRecurring}
        onAddExceptionDate={handleAddExceptionDate}
        onSetRecurrenceEndDate={handleSetRecurrenceEndDate}
        onCreateRecurringFromDate={handleCreateRecurringFromDate}
        userId={user?.id || ''}
        timeZone={timeZone}
        isLoading={
          isLoading || 
          createMutation.isPending || 
          updateMutation.isPending || 
          deleteMutation.isPending || 
          makeRecurringMutation.isPending ||
          addExceptionMutation.isPending ||
          setEndDateMutation.isPending ||
          createRecurringMutation.isPending
        }
      />
    </div>
  )
}
