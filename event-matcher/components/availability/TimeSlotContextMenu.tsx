'use client'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import { Repeat, Trash2, Calendar } from 'lucide-react'

interface TimeSlotContextMenuProps {
  children: React.ReactNode
  isRecurring: boolean
  onMakeRecurring?: (frequency: 'daily' | 'weekly') => void
  onDelete: () => void
  onDeleteRecurring?: (scope: 'this' | 'following' | 'all') => void
}

export function TimeSlotContextMenu({
  children,
  isRecurring,
  onMakeRecurring,
  onDelete,
  onDeleteRecurring,
}: TimeSlotContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {!isRecurring && onMakeRecurring && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Repeat className="mr-2 h-4 w-4" />
                Make Recurring
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={() => onMakeRecurring('daily')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Repeat Daily
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onMakeRecurring('weekly')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Repeat Weekly
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
          </>
        )}

        {isRecurring && onDeleteRecurring ? (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={() => onDeleteRecurring('this')}>
                This Event Only
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onDeleteRecurring('following')}>
                This and Following Events
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onDeleteRecurring('all')}>
                All Events in Series
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        ) : (
          <ContextMenuItem onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
