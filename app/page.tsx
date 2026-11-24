import Link from "next/link";

import { LuggageTag } from "@/components/luggage-tag";
import { NewTripForm } from "@/components/new-trip-form";
import { SetupNotice } from "@/components/setup-notice";
import { SignOutButton } from "@/components/sign-out-button";
import { isDbConfigured, listTrips } from "@/lib/db";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = isDbConfigured();
  const session = configured ? await requireSession() : null;
  const trips = session ? await listTrips(session.user.id) : [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-12 px-4 py-12 md:py-20">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-heading text-primary text-sm font-bold tracking-widest uppercase">
            Stowaway
          </span>
          {session && (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm">
                {session.user.email}
              </span>
              <SignOutButton />
            </div>
          )}
        </div>
        <h1 className="font-heading max-w-2xl text-4xl font-bold text-balance md:text-6xl">
          Tell us how long. We&apos;ll start the list.
        </h1>
        <p className="text-muted-foreground max-w-xl leading-relaxed text-pretty">
          Enter your trip length and get a packing list with quantities already
          worked out. Tweak it, tick things off, and come back to it anytime.
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
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm leading-relaxed">
              No trips yet. Your packing lists will show up here.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {trips.map((trip) => (
                <li key={trip.id}>
                  <Link
                    href={`/trips/${trip.id}`}
                    className="focus-visible:outline-ring block transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <LuggageTag
                      name={trip.name}
                      days={trip.days}
                      packed={trip.packedCount}
                      total={trip.itemCount}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
