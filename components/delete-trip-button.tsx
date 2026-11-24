'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteTrip } from '@/app/actions'
import { Button } from '@/components/ui/button'

export function DeleteTripButton({ tripId }: { tripId: number }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-muted-foreground hover:text-destructive"
      onClick={() => {
        if (confirm('Delete this trip and its packing list?')) startTransition(() => deleteTrip(tripId))
      }}
    >
      <Trash2 />
      {pending ? 'Deleting...' : 'Delete trip'}
    </Button>
  )
}
