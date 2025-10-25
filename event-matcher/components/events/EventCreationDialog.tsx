'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { getAllUsers, getRoles, UserWithRole } from '@/lib/api/users'
import { AvailabilityHeatmap } from './AvailabilityHeatmap'
import { Search, X, ChevronRight, ChevronLeft } from 'lucide-react'

interface EventCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type EventType = 'meeting' | 'class' | 'training' | 'internal'

const EVENT_TYPES: { value: EventType; label: string; description: string }[] = [
  {
    value: 'meeting',
    label: 'Meeting',
    description: 'General meetings and discussions',
  },
  {
    value: 'class',
    label: 'Class',
    description: 'Educational classes and sessions',
  },
  {
    value: 'training',
    label: 'Training',
    description: 'Training and development sessions',
  },
  {
    value: 'internal',
    label: 'Internal',
    description: 'Internal company events',
  },
]

type Step = 'name' | 'type' | 'participants' | 'heatmap'

export function EventCreationDialog({ open, onOpenChange }: EventCreationDialogProps) {
  const [step, setStep] = useState<Step>('name')
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState<EventType>('meeting')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedParticipants, setSelectedParticipants] = useState<UserWithRole[]>([])
  const [highlightedUsers, setHighlightedUsers] = useState<Set<string>>(new Set())

  // Fetch users and roles
  const { data: users = [], error: usersError, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
    enabled: step === 'participants' || step === 'heatmap',
  })
  
  // Log errors for debugging
  useEffect(() => {
    if (usersError) {
      console.error('Error fetching users in EventCreationDialog:', usersError)
    }
  }, [usersError])

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: step === 'participants',
  })

  // Filter users based on search and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role_id === selectedRole
    const notSelected = !selectedParticipants.find((p) => p.id === user.id)
    return matchesSearch && matchesRole && notSelected
  })

  const handleNext = () => {
    if (step === 'name' && eventName.trim()) {
      setStep('type')
    } else if (step === 'type') {
      setStep('participants')
    } else if (step === 'participants' && selectedParticipants.length > 0) {
      setStep('heatmap')
    }
  }

  const handleBack = () => {
    if (step === 'type') {
      setStep('name')
    } else if (step === 'participants') {
      setStep('type')
    } else if (step === 'heatmap') {
      setStep('participants')
    }
  }

  const handleAddParticipant = (user: UserWithRole) => {
    setSelectedParticipants([...selectedParticipants, user])
  }

  const handleRemoveParticipant = (userId: string) => {
    setSelectedParticipants(selectedParticipants.filter((p) => p.id !== userId))
    setHighlightedUsers((prev) => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }

  const toggleHighlight = (userId: string) => {
    setHighlightedUsers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleClose = () => {
    setStep('name')
    setEventName('')
    setEventType('meeting')
    setSearchQuery('')
    setSelectedRole('all')
    setSelectedParticipants([])
    setHighlightedUsers(new Set())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            {step === 'name' && 'Enter the event name'}
            {step === 'type' && 'Select the event type'}
            {step === 'participants' && 'Select participants for the event'}
            {step === 'heatmap' && 'View participant availability'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Event Name */}
          {step === 'name' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Event Name</Label>
                <Input
                  id="event-name"
                  placeholder="Enter event name..."
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleNext} disabled={!eventName.trim()}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Event Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Event Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {EVENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setEventType(type.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                        eventType === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="font-semibold">{type.label}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleNext}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Participant Selection */}
          {step === 'participants' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="role-filter">Filter by Role</Label>
                  <select
                    id="role-filter"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Roles</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search">Search by Name</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Participants */}
              {selectedParticipants.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Participants ({selectedParticipants.length})</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                    {selectedParticipants.map((user) => (
                      <Badge key={user.id} variant="secondary" className="gap-1">
                        {user.full_name}
                        <button
                          onClick={() => handleRemoveParticipant(user.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Users */}
              <div className="space-y-2">
                <Label>Available Users</Label>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleAddParticipant(user)}
                          className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email} • {user.role.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={selectedParticipants.length === 0}
                >
                  View Availability <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Availability Heatmap */}
          {step === 'heatmap' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Participant List</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
                  {selectedParticipants.map((user) => (
                    <Badge
                      key={user.id}
                      variant={highlightedUsers.has(user.id) ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleHighlight(user.id)}
                    >
                      {user.full_name}
                      {highlightedUsers.has(user.id) && ' ★'}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click on a participant to highlight their availability in a custom color
                </p>
              </div>

              <AvailabilityHeatmap
                participants={selectedParticipants}
                highlightedUserIds={Array.from(highlightedUsers)}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
