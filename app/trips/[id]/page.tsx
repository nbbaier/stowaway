import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTripWithItems, isDbConfigured } from '@/lib/db'
import { PackingList } from '@/components/packing-list'
import { DeleteTripButton } from '@/components/delete-trip-button'

export const dynamic = 'force-dynamic'

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tripId = Number(id)
  if (!isDbConfigured() || !Number.isSafeInteger(tripId) || tripId <= 0) notFound()

  const data = await getTripWithItems(tripId)
  if (!data) notFound()

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All trips
        </Link>
        <DeleteTripButton tripId={data.trip.id} />
      </nav>
      <PackingList trip={data.trip} items={data.items} />
    </main>
  )
}
