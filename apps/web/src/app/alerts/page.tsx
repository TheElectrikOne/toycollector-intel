import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Alert Subscriptions',
  description: 'Subscribe to ToyIntel alerts for preorders, releases, and breaking news.',
}

export default function AlertsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">🔔</div>
        <h1 className="text-3xl font-black text-zinc-100 mb-3">Stay Ahead of Every Drop</h1>
        <p className="text-zinc-400 leading-relaxed">
          Get notified when new preorders open, release dates are confirmed, and breaking news hits —
          before anyone else knows.
        </p>
      </div>

      <div className="space-y-6">
        {/* Discord */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-indigo-900 rounded-lg flex items-center justify-center text-xl shrink-0">
              💬
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 mb-1">Discord</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                Real-time alerts in our Discord server. Separate channels for preorders, rumors, and breaking news.
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Join Discord Server →
              </a>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-900 rounded-lg flex items-center justify-center text-xl shrink-0">
              ✉️
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-100 mb-1">Email Newsletter</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                Weekly digest with the top stories, active preorders, and upcoming releases.
                Breaking alerts for high-priority news.
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-zinc-600 mt-2">No spam. Unsubscribe anytime.</p>
            </div>
          </div>
        </div>

        {/* RSS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-900/50 rounded-lg flex items-center justify-center text-xl shrink-0">
              📡
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 mb-1">RSS Feed</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                Subscribe to our RSS feed in your favorite reader for all published news.
              </p>
              <a
                href="/feed.xml"
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                Subscribe to RSS →
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-500">
        <p>
          <strong className="text-zinc-400">Alert confidence:</strong> Alerts clearly indicate whether information
          is confirmed by the brand or is a retailer listing. We never send alerts for pure rumors.
        </p>
      </div>
    </div>
  )
}
