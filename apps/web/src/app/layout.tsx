import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'ToyIntel'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toyintel.com'

export const metadata: Metadata = {
  title: {
    default: `${siteName} — Toy Collector Intelligence`,
    template: `%s | ${siteName}`,
  },
  description:
    'Real-time toy news, release dates, preorder alerts, and rumor tracking for serious collectors. Monitoring 25+ brands and retailers.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    siteName,
    title: `${siteName} — Toy Collector Intelligence`,
    description: 'Real-time toy news, release dates, and preorder alerts for serious collectors.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@toyintel',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-screen flex flex-col bg-zinc-950">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
