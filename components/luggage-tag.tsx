import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface LuggageTagProps {
  name: string;
  days: number;
  packed: number;
  total: number;
  size?: "sm" | "lg";
}

type ProgressStyle = CSSProperties & { "--progress": string };

export const LuggageTag = ({
  name,
  days,
  packed,
  total,
  size = "sm",
}: LuggageTagProps) => {
  const pct = total ? Math.round((packed / total) * 100) : 0;
  const progressStyle: ProgressStyle = { "--progress": `${pct}%` };
  return (
    <div
      className={cn(
        "bg-accent text-accent-foreground relative flex items-center gap-4 [clip-path:polygon(1.5rem_0,100%_0,100%_100%,1.5rem_100%,0_70%,0_30%)]",
        size === "lg" ? "py-6 pr-6 pl-12" : "py-4 pr-5 pl-10"
      )}
    >
      <span
        aria-hidden="true"
        className="bg-background ring-accent-foreground/20 absolute top-1/2 left-4 size-3 -translate-y-1/2 rounded-full ring-2"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-medium tracking-widest uppercase opacity-70">
          Destination
        </span>
        <span
          className={cn(
            "font-heading truncate font-bold text-balance",
            size === "lg" ? "text-3xl md:text-4xl" : "text-xl"
          )}
        >
          {name}
        </span>
        <div className="bg-accent-foreground/15 mt-1 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full w-(--progress) rounded-full transition-all"
            style={progressStyle}
          />
        </div>
        <span className="text-xs tabular-nums opacity-80">{`${packed} of ${total} packed`}</span>
      </div>
      <div className="border-accent-foreground/30 flex flex-col items-center border-l border-dashed pl-4">
        <span
          className={cn(
            "font-heading font-bold tabular-nums",
            size === "lg" ? "text-5xl" : "text-3xl"
          )}
        >
          {days}
        </span>
        <span className="text-xs font-medium tracking-widest uppercase opacity-70">
          {days === 1 ? "Day" : "Days"}
        </span>
      </div>
    </div>
  );
};
