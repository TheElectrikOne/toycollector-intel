import Link from 'next/link'
import { Nav, MobileNav } from './Nav'

export function Header() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'ToyIntel'

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black text-white text-sm">
              TI
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-zinc-100 text-base leading-none">{siteName}</div>
              <div className="text-zinc-500 text-xs leading-none mt-0.5">Toy Collector Intelligence</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <Nav />

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/alerts"
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
              title="Alerts"
            >
              <span className="relative">
                🔔
              </span>
            </Link>
            <Link
              href="/admin"
              className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-md transition-colors border border-zinc-700"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
      <MobileNav />
    </header>
  )
}
