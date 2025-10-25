import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeToEvents, subscribeToEventParticipants } from '@/lib/api/events'
import { toast } from 'sonner'

interface UseRealtimeEventsOptions {
  userId: string
  enabled?: boolean
  onEventInsert?: (event: any) => void
  onEventUpdate?: (event: any) => void
  onEventDelete?: (event: any) => void
  onParticipantAdd?: (participant: any) => void
  onParticipantRemove?: (participant: any) => void
  showToasts?: boolean
}

/**
 * Hook to setup real-time subscriptions for events and participants
 * Automatically updates React Query cache and shows toast notifications
 */
export function useRealtimeEvents({
  userId,
  enabled = true,
  onEventInsert,
  onEventUpdate,
  onEventDelete,
  onParticipantAdd,
  onParticipantRemove,
  showToasts = true,
}: UseRealtimeEventsOptions) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled || !userId) return

    // Subscribe to event changes
    const unsubscribeEvents = subscribeToEvents((payload: any) => {
      const eventType = payload.eventType
      const newEvent = payload.new
      const oldEvent = payload.old

      // Update cache optimistically
      queryClient.setQueryData(['events', userId], (oldData: any) => {
        if (!oldData) return oldData

        if (eventType === 'INSERT') {
          if (showToasts) {
            toast.info('New event added to your schedule', {
              description: newEvent.title || 'Check your calendar for details',
            })
          }
          onEventInsert?.(newEvent)
          // Invalidate to refetch with full participant data
          queryClient.invalidateQueries({ queryKey: ['events', userId] })
          return oldData
        } else if (eventType === 'UPDATE') {
          const updatedData = oldData.map((event: any) =>
            event.id === newEvent.id ? { ...event, ...newEvent } : event
          )
          if (showToasts) {
            toast.info('Event updated', {
              description: newEvent.title || 'An event has been modified',
            })
          }
          onEventUpdate?.(newEvent)
          // Refetch to get updated participant data
          queryClient.invalidateQueries({ queryKey: ['events', userId] })
          return updatedData
        } else if (eventType === 'DELETE') {
          const filteredData = oldData.filter((event: any) => event.id !== oldEvent.id)
          if (showToasts) {
            toast.info('Event removed from your schedule', {
              description: oldEvent.title || 'An event has been deleted',
            })
          }
          onEventDelete?.(oldEvent)
          return filteredData
        }

        return oldData
      })
    })

    // Subscribe to participant changes
    const unsubscribeParticipants = subscribeToEventParticipants((payload: any) => {
      const eventType = payload.eventType
      const participantData = payload.new || payload.old

      // Check if the change involves the current user
      if (participantData.user_id === userId) {
        if (eventType === 'INSERT') {
          if (showToasts) {
            toast.success('You were added to an event', {
              description: 'Check your schedule for the new event',
            })
          }
          onParticipantAdd?.(participantData)
        } else if (eventType === 'DELETE') {
          if (showToasts) {
            toast.info('You were removed from an event')
          }
          onParticipantRemove?.(participantData)
          // Remove the event from cache if user is no longer a participant
          queryClient.setQueryData(['events', userId], (oldData: any) => {
            if (!oldData) return oldData
            return oldData.filter((event: any) => event.id !== participantData.event_id)
          })
        }
      }

      // Always refetch to get updated participant lists
      queryClient.invalidateQueries({ queryKey: ['events', userId] })
    })

    return () => {
      unsubscribeEvents()
      unsubscribeParticipants()
    }
  }, [
    enabled,
    userId,
    queryClient,
    onEventInsert,
    onEventUpdate,
    onEventDelete,
    onParticipantAdd,
    onParticipantRemove,
    showToasts,
  ])
}
