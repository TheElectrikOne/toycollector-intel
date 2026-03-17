import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    default: 'Admin — ToyIntel',
    template: '%s — ToyIntel Admin',
  },
  robots: { index: false, follow: false },
}

const adminNav = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/queue', label: 'Review Queue' },
  { href: '/admin/posts', label: 'Posts' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/sources', label: 'Sources' },
  { href: '/admin/monitors', label: 'Monitors' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Admin header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-3 whitespace-nowrap">
              Admin
            </span>
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 whitespace-nowrap transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
