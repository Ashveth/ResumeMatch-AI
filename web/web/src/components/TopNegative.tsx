// no React import needed with automatic JSX runtime
import type { Mention } from '../lib/api'

export function TopNegative({ items }: { items: Mention[] }) {
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="text-sm text-gray-500">No data</div>}
      {items.map(m => (
        <div key={(m.id ?? Math.random()) + '-' + m.timestamp} className="text-sm">
          <div className="flex justify-between">
            <div className="font-medium text-negative">@{m.user} • {m.source}</div>
            <div className="text-xs text-gray-500">{new Date(m.timestamp).toLocaleString()}</div>
          </div>
          <div className="text-gray-800 dark:text-gray-200">{m.content}</div>
          <div className="text-xs text-gray-500">Score: {m.sentimentScore}</div>
        </div>
      ))}
    </div>
  )
}
