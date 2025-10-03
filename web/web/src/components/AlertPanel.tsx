// no React import needed with automatic JSX runtime

export function AlertPanel({ items }: { items: Array<{ mention: any, suggestedReply: string }> }) {
  return (
    <div className="rounded-md border border-red-200 dark:border-red-900 p-3">
      <div className="font-medium mb-2 text-negative">Recent Alerts</div>
      <div className="space-y-3 max-h-80 overflow-auto pr-1">
        {items.length === 0 && (<div className="text-sm text-gray-500">No alerts yet</div>)}
        {items.map((it, idx) => (
          <div key={idx} className="text-sm">
            <div className="flex justify-between">
              <div className="font-medium">@{it.mention?.user} • {it.mention?.source}</div>
              <div className="text-xs text-gray-500">{new Date(it.mention?.timestamp).toLocaleString()}</div>
            </div>
            <div className="mt-1 text-gray-800 dark:text-gray-200">{it.mention?.content}</div>
            <div className="mt-2 text-xs text-gray-500">Suggested reply:</div>
            <div className="mt-1 p-2 rounded bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 whitespace-pre-wrap">{it.suggestedReply}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
