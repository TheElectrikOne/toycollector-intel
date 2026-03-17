interface StatCardProps {
  label: string
  value: number | string
  sublabel?: string
  color?: 'orange' | 'green' | 'yellow' | 'red' | 'blue' | 'default'
}

function StatCard({ label, value, sublabel, color = 'default' }: StatCardProps) {
  const colorMap = {
    orange: 'text-orange-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    default: 'text-zinc-100',
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-black ${colorMap[color]}`}>{value}</p>
      {sublabel && <p className="text-xs text-zinc-600 mt-1">{sublabel}</p>}
    </div>
  )
}

interface StatsPanelProps {
  stats: {
    pendingDetections: number
    publishedToday: number
    activePreorders: number
    activeMonitors: number
    extractedDetections?: number
    totalProducts?: number
  }
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        label="Pending Review"
        value={stats.pendingDetections}
        color={stats.pendingDetections > 10 ? 'red' : stats.pendingDetections > 0 ? 'yellow' : 'green'}
        sublabel="detections"
      />
      <StatCard
        label="Published Today"
        value={stats.publishedToday}
        color="orange"
        sublabel="posts"
      />
      <StatCard
        label="Active Preorders"
        value={stats.activePreorders}
        color="green"
        sublabel="alerts"
      />
      <StatCard
        label="Active Monitors"
        value={stats.activeMonitors}
        color="blue"
        sublabel="watching"
      />
      {stats.extractedDetections !== undefined && (
        <StatCard
          label="Extracted"
          value={stats.extractedDetections}
          color="yellow"
          sublabel="awaiting review"
        />
      )}
      {stats.totalProducts !== undefined && (
        <StatCard
          label="Total Products"
          value={stats.totalProducts}
          color="default"
          sublabel="in database"
        />
      )}
    </div>
  )
}
