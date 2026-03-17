'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/news', label: 'News' },
  { href: '/releases', label: 'Releases' },
  { href: '/preorders', label: 'Preorders' },
  { href: '/brands', label: 'Brands' },
  { href: '/franchises', label: 'Franchises' },
  { href: '/rumor-watch', label: 'Rumor Watch' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-zinc-800 text-orange-400'
                : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileNav() {
  return (
    <nav className="border-t border-zinc-800 md:hidden">
      <div className="flex overflow-x-auto px-4 py-2 gap-1 no-scrollbar">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 whitespace-nowrap transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
