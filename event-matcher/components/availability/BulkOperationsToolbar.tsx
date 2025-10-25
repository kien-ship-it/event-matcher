'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Trash2, Copy, Undo2 } from 'lucide-react'
import { format } from 'date-fns'

interface BulkOperationsToolbarProps {
  onClearToday: () => Promise<void>
  onClearWeek: () => Promise<void>
  onClearMonth: () => Promise<void>
  onClearDateRange: (startDate: string, endDate: string) => Promise<void>
  onCopyWeek: (sourceWeek: Date, targetWeek: Date) => Promise<void>
  isLoading?: boolean
}

export function BulkOperationsToolbar({
  onClearToday,
  onClearWeek,
  onClearMonth,
  onClearDateRange,
  onCopyWeek,
  isLoading = false,
}: BulkOperationsToolbarProps) {
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')
  const [sourceWeek, setSourceWeek] = useState('')
  const [targetWeek, setTargetWeek] = useState('')
  const [undoStack, setUndoStack] = useState<Array<{ action: string; timestamp: number }>>([])
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null)

  // Clear undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout)
      }
    }
  }, [undoTimeout])

  const handleClearToday = async () => {
    const confirmed = window.confirm('Are you sure you want to clear all availability for today?')
    if (!confirmed) return

    try {
      await onClearToday()
      toast.success('Today\'s availability cleared')
      addToUndoStack('Clear Today')
    } catch (error) {
      toast.error('Failed to clear today\'s availability')
      console.error(error)
    }
  }

  const handleClearWeek = async () => {
    const confirmed = window.confirm('Are you sure you want to clear all availability for this week?')
    if (!confirmed) return

    try {
      await onClearWeek()
      toast.success('This week\'s availability cleared')
      addToUndoStack('Clear Week')
    } catch (error) {
      toast.error('Failed to clear this week\'s availability')
      console.error(error)
    }
  }

  const handleClearMonth = async () => {
    const confirmed = window.confirm('Are you sure you want to clear all availability for this month?')
    if (!confirmed) return

    try {
      await onClearMonth()
      toast.success('This month\'s availability cleared')
      addToUndoStack('Clear Month')
    } catch (error) {
      toast.error('Failed to clear this month\'s availability')
      console.error(error)
    }
  }

  const handleClearDateRange = async () => {
    if (!dateRangeStart || !dateRangeEnd) {
      toast.error('Please select both start and end dates')
      return
    }

    if (new Date(dateRangeStart) > new Date(dateRangeEnd)) {
      toast.error('Start date must be before end date')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear all availability from ${format(new Date(dateRangeStart), 'MMM d, yyyy')} to ${format(new Date(dateRangeEnd), 'MMM d, yyyy')}?`
    )
    if (!confirmed) return

    try {
      await onClearDateRange(dateRangeStart, dateRangeEnd)
      toast.success('Date range availability cleared')
      addToUndoStack('Clear Date Range')
      setDateRangeStart('')
      setDateRangeEnd('')
    } catch (error) {
      toast.error('Failed to clear date range availability')
      console.error(error)
    }
  }

  const handleCopyWeek = async () => {
    if (!sourceWeek || !targetWeek) {
      toast.error('Please select both source and target weeks')
      return
    }

    if (sourceWeek === targetWeek) {
      toast.error('Source and target weeks must be different')
      return
    }

    const confirmed = window.confirm(
      `Copy availability from week of ${format(new Date(sourceWeek), 'MMM d, yyyy')} to week of ${format(new Date(targetWeek), 'MMM d, yyyy')}?`
    )
    if (!confirmed) return

    try {
      await onCopyWeek(new Date(sourceWeek), new Date(targetWeek))
      toast.success('Week availability copied')
      addToUndoStack('Copy Week')
      setSourceWeek('')
      setTargetWeek('')
    } catch (error) {
      toast.error('Failed to copy week availability')
      console.error(error)
    }
  }

  const addToUndoStack = (action: string) => {
    const newUndo = { action, timestamp: Date.now() }
    setUndoStack((prev) => [...prev, newUndo])

    // Set timeout to remove undo after 10 seconds
    const timeout = setTimeout(() => {
      setUndoStack((prev) => prev.filter((item) => item.timestamp !== newUndo.timestamp))
    }, 10000)

    setUndoTimeout(timeout)
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return

    // Note: Actual undo implementation would require storing the deleted data
    // For now, we just show a message
    toast.info('Undo functionality requires backend support for data restoration')
    setUndoStack([])
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">Bulk Operations</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Quickly manage multiple availability slots at once
          </p>
        </div>

        {/* Quick Clear Buttons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Quick Clear</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearToday}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearWeek}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearMonth}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear This Month
            </Button>
          </div>
        </div>

        {/* Date Range Clear */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Clear Date Range</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="w-auto"
              disabled={isLoading}
            />
            <span className="flex items-center text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="w-auto"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearDateRange}
              disabled={isLoading || !dateRangeStart || !dateRangeEnd}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Range
            </Button>
          </div>
        </div>

        {/* Copy Week */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Copy Week</Label>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col">
              <Label className="text-xs text-muted-foreground mb-1">From Week</Label>
              <Input
                type="date"
                value={sourceWeek}
                onChange={(e) => setSourceWeek(e.target.value)}
                className="w-auto"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col">
              <Label className="text-xs text-muted-foreground mb-1">To Week</Label>
              <Input
                type="date"
                value={targetWeek}
                onChange={(e) => setTargetWeek(e.target.value)}
                className="w-auto"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyWeek}
                disabled={isLoading || !sourceWeek || !targetWeek}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        </div>

        {/* Undo */}
        {undoStack.length > 0 && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={isLoading}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Undo Last Action (10s window)
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
