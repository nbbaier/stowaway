'use client'

import { useActionState, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { createTrip } from '@/app/actions'
import { buildDefaultList, MAX_DAYS } from '@/lib/defaults'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NewTripForm() {
  const [state, formAction, pending] = useActionState(createTrip, {})
  const [days, setDays] = useState(3)
  const preview = buildDefaultList(days)
  const pieces = preview.reduce((sum, item) => sum + item.quantity, 0)

  const clamp = (n: number) => Math.min(Math.max(n, 1), MAX_DAYS)

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-xl border bg-card p-6 text-card-foreground">
      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-name">Where are you headed?</Label>
        <Input id="trip-name" name="name" placeholder="Lisbon long weekend" maxLength={80} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-days">How many days?</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setDays((d) => clamp(d - 1))}
            disabled={days <= 1}
            aria-label="Fewer days"
          >
            <Minus />
          </Button>
          <Input
            id="trip-days"
            name="days"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_DAYS}
            value={days}
            onChange={(e) => setDays(clamp(Number(e.target.value) || 1))}
            className="w-20 text-center font-heading text-lg tabular-nums"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setDays((d) => clamp(d + 1))}
            disabled={days >= MAX_DAYS}
            aria-label="More days"
          >
            <Plus />
          </Button>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground" aria-live="polite">
          {`Starts you with ${preview.length} items (${pieces} pieces), scaled for ${days} ${days === 1 ? 'day' : 'days'}.`}
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Building your list...' : 'Build packing list'}
      </Button>
    </form>
  )
}
