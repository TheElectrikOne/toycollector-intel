import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { preorder_alerts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { PreorderCard } from '@/components/ui/PreorderCard'

export const metadata: Metadata = {
  title: 'Preorder Alerts',
  description: 'Live preorder alerts for toy collectors — new listings, closing-soon alerts, and restocks.',
}

export const revalidate = 300

const ALERT_TYPES = [
  { value: 'all', label: 'All Alerts' },
  { value: 'now_live', label: 'Now Live' },
  { value: 'closing_soon', label: 'Closing Soon' },
  { value: 'restocked', label: 'Restocked' },
]

interface PageProps {
  searchParams: { type?: string }
}

export default async function PreordersPage({ searchParams }: PageProps) {
  const alertType = searchParams.type

  const alerts = await db.query.preorder_alerts.findMany({
    where: (a, { eq, and }) => {
      const conditions = [eq(a.is_active, true)]
      if (alertType && alertType !== 'all') conditions.push(eq(a.alert_type, alertType))
      return and(...conditions)
    },
    with: { product: true },
    orderBy: [desc(preorder_alerts.detected_at)],
    limit: 100,
  })

  // Filter expired
  const now = new Date()
  const activeAlerts = alerts.filter((a) => !a.expires_at || a.expires_at > now)

  const now_live = activeAlerts.filter((a) => a.alert_type === 'now_live')
  const closing_soon = activeAlerts.filter((a) => a.alert_type === 'closing_soon')
  const restocked = activeAlerts.filter((a) => a.alert_type === 'restocked')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-zinc-100 mb-2">Preorder Alerts</h1>
        <p className="text-zinc-400">
          Actively monitored preorder windows. Confidence labels indicate whether the brand has confirmed the listing.
        </p>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-xl mb-2">No active preorder alerts</p>
          <p className="text-sm">New preorders will appear here as they are detected.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {closing_soon.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-yellow-400 mb-4">
                ⚠️ Closing Soon ({closing_soon.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {closing_soon.map((a) => <PreorderCard key={a.id} alert={a} />)}
              </div>
            </section>
          )}

          {now_live.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-green-400 mb-4">
                🛒 Now Live ({now_live.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {now_live.map((a) => <PreorderCard key={a.id} alert={a} />)}
              </div>
            </section>
          )}

          {restocked.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-blue-400 mb-4">
                🔄 Restocked ({restocked.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {restocked.map((a) => <PreorderCard key={a.id} alert={a} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
