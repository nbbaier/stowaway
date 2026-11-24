"use client";

import { Minus, Plus } from "lucide-react";
import { useActionState, useState } from "react";

import { createTrip } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildDefaultList, MAX_DAYS } from "@/lib/defaults";

const clamp = (n: number) => Math.min(Math.max(n, 1), MAX_DAYS);

export const NewTripForm = () => {
  const [state, formAction, pending] = useActionState(createTrip, {});
  const [days, setDays] = useState(3);
  const preview = buildDefaultList(days);
  const pieces = preview.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <form
      action={formAction}
      className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-name">Where are you headed?</Label>
        <Input
          id="trip-name"
          name="name"
          placeholder="Lisbon long weekend"
          maxLength={80}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-days">How many days?</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setDays((d) => clamp(d - 1));
            }}
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
            variant="numeric"
            min={1}
            max={MAX_DAYS}
            value={days}
            onChange={(e) => {
              setDays(clamp(Number(e.target.value) || 1));
            }}
            className="w-20 text-center"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setDays((d) => clamp(d + 1));
            }}
            disabled={days >= MAX_DAYS}
            aria-label="More days"
          >
            <Plus />
          </Button>
        </div>
        <p
          className="text-muted-foreground text-sm leading-relaxed"
          aria-live="polite"
        >
          {`Starts you with ${preview.length} items (${pieces} pieces), scaled for ${days} ${days === 1 ? "day" : "days"}.`}
        </p>
      </div>

      {Boolean(state.error) && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Building your list..." : "Build packing list"}
      </Button>
    </form>
  );
};
