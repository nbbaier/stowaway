import { cn } from '@/lib/utils'

type LuggageTagProps = {
  name: string
  days: number
  packed: number
  total: number
  size?: 'sm' | 'lg'
}

export function LuggageTag({ name, days, packed, total, size = 'sm' }: LuggageTagProps) {
  const pct = total ? Math.round((packed / total) * 100) : 0
  return (
    <div
      className={cn(
        'relative flex items-center gap-4 bg-accent text-accent-foreground [clip-path:polygon(1.5rem_0,100%_0,100%_100%,1.5rem_100%,0_70%,0_30%)]',
        size === 'lg' ? 'py-6 pr-6 pl-12' : 'py-4 pr-5 pl-10',
      )}
    >
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-4 size-3 -translate-y-1/2 rounded-full bg-background ring-2 ring-accent-foreground/20"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-medium tracking-widest uppercase opacity-70">Destination</span>
        <span
          className={cn(
            'truncate font-heading font-bold text-balance',
            size === 'lg' ? 'text-3xl md:text-4xl' : 'text-xl',
          )}
        >
          {name}
        </span>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-accent-foreground/15">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs tabular-nums opacity-80">{`${packed} of ${total} packed`}</span>
      </div>
      <div className="flex flex-col items-center border-l border-dashed border-accent-foreground/30 pl-4">
        <span className={cn('font-heading font-bold tabular-nums', size === 'lg' ? 'text-5xl' : 'text-3xl')}>
          {days}
        </span>
        <span className="text-xs font-medium tracking-widest uppercase opacity-70">{days === 1 ? 'Day' : 'Days'}</span>
      </div>
    </div>
  )
}
