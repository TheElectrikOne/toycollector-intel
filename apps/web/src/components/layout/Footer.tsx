import Link from 'next/link'

export function Footer() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'ToyIntel'
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center font-black text-white text-xs">
                TI
              </div>
              <span className="font-black text-zinc-100">{siteName}</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Intelligence for serious toy collectors. Tracking releases, preorders, and rumors from 25+ sources.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Content</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/news', label: 'News' },
                { href: '/releases', label: 'Release Calendar' },
                { href: '/preorders', label: 'Preorders' },
                { href: '/rumor-watch', label: 'Rumor Watch' },
                { href: '/corrections', label: 'Corrections' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Brands</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/brands/hasbro', label: 'Hasbro' },
                { href: '/brands/good-smile-company', label: 'Good Smile' },
                { href: '/brands/bandai', label: 'Bandai' },
                { href: '/brands/neca', label: 'NECA' },
                { href: '/brands', label: 'All Brands →' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">About</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/alerts', label: 'Email Alerts' },
                { href: '/admin', label: 'Admin' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © {year} {siteName}. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600">
            Confidence labels and source trust levels are editorial assessments.
            Always verify with official sources before making purchasing decisions.
          </p>
        </div>
      </div>
    </footer>
  )
}
