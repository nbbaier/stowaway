"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { deleteTrip } from "@/app/actions";
import { Button } from "@/components/ui/button";

export const DeleteTripButton = ({ tripId }: { tripId: number }) => {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await deleteTrip(tripId);
            });
          }}
        >
          {pending ? "Deleting..." : "Confirm delete"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost-destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        setConfirming(true);
      }}
    >
      <Trash2 />
      Delete trip
    </Button>
  );
};
