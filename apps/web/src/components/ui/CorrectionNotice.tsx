import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface CorrectionNoticeProps {
  correctionNote: string
  correctedAt?: Date | null
  correctionPostSlug?: string | null
}

export function CorrectionNotice({
  correctionNote,
  correctedAt,
  correctionPostSlug,
}: CorrectionNoticeProps) {
  return (
    <div className="my-6 border border-yellow-700 rounded-lg bg-yellow-900/20 p-4">
      <div className="flex items-start gap-3">
        <span className="text-yellow-400 text-lg shrink-0">⚠️</span>
        <div>
          <p className="text-sm font-bold text-yellow-400 mb-1">
            Correction Issued{correctedAt ? ` — ${formatDate(correctedAt)}` : ''}
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">{correctionNote}</p>
          {correctionPostSlug && (
            <Link
              href={`/news/${correctionPostSlug}`}
              className="text-xs text-yellow-400 hover:text-yellow-300 mt-2 inline-block transition-colors"
            >
              View full correction →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
