import Link from 'next/link'
import { isDbConfigured, listTrips } from '@/lib/db'
import { NewTripForm } from '@/components/new-trip-form'
import { LuggageTag } from '@/components/luggage-tag'
import { SetupNotice } from '@/components/setup-notice'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const configured = isDbConfigured()
  const trips = configured ? await listTrips() : []

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-12 px-4 py-12 md:py-20">
      <header className="flex flex-col gap-3">
        <span className="font-heading text-sm font-bold tracking-widest text-primary uppercase">Daypack</span>
        <h1 className="max-w-2xl font-heading text-4xl font-bold text-balance md:text-6xl">
          Tell us how long. We&apos;ll start the list.
        </h1>
        <p className="max-w-xl leading-relaxed text-pretty text-muted-foreground">
          Enter your trip length and get a packing list with quantities already worked out. Tweak it, tick things off,
          and come back to it anytime.
        </p>
      </header>

      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section aria-labelledby="new-trip" className="flex flex-col gap-4">
          <h2 id="new-trip" className="font-heading text-xl font-bold">
            New trip
          </h2>
          {configured ? <NewTripForm /> : <SetupNotice />}
        </section>

        <section aria-labelledby="saved-trips" className="flex flex-col gap-4">
          <h2 id="saved-trips" className="font-heading text-xl font-bold">
            Your trips
          </h2>
          {trips.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-sm leading-relaxed text-muted-foreground">
              No trips yet. Your packing lists will show up here.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {trips.map((trip) => (
                <li key={trip.id}>
                  <Link
                    href={`/trips/${trip.id}`}
                    className="block transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <LuggageTag name={trip.name} days={trip.days} packed={trip.packedCount} total={trip.itemCount} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
