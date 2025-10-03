import * as React from 'react'
import './App.css'
import { ToggleTheme } from './components/ToggleTheme'
import { fetchMentions, connectStream, type Mention } from './lib/api'
import { AlertPanel } from './components/AlertPanel'
import { MentionItem } from './components/MentionItem'
import { TrendChart } from './components/TrendChart'
import { TopNegative } from './components/TopNegative'

function useRealtimeMentions(onAlert: (payload: any) => void) {
  const [mentions, setMentions] = React.useState<Mention[]>([])
  React.useEffect(() => {
    fetchMentions({ limit: 50 }).then(setMentions)
    const disconnect = connectStream((type, data) => {
      if (type === 'mention') {
        setMentions(prev => [data as Mention, ...prev].slice(0, 200))
      } else if (type === 'alert') {
        onAlert(data)
      }
    })
    return () => disconnect()
  }, [onAlert])
  return mentions
}

function Header() {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-xl font-semibold">Customer Sentiment Alerts</div>
      <ToggleTheme />
    </div>
  )
}

function Filters({ onApply, sources }: { onApply: (args: { q: string; sentiment: 'all'|'positive'|'neutral'|'negative'; source: 'all'|string }) => void; sources: string[] }) {
  const [q, setQ] = React.useState('')
  const [sentiment, setSentiment] = React.useState<'all'|'positive'|'neutral'|'negative'>('all')
  const [source, setSource] = React.useState<'all'|string>('all')
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Filter by keyword"
        className="px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      />
      <select value={sentiment} onChange={e => setSentiment(e.target.value as any)} className="px-2 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <option value="all">All sentiments</option>
        <option value="positive">Positive</option>
        <option value="neutral">Neutral</option>
        <option value="negative">Negative</option>
      </select>
      <select value={source} onChange={e => setSource(e.target.value)} className="px-2 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <option value="all">All sources</option>
        {sources.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={() => onApply({ q, sentiment, source })} className="px-3 py-2 rounded-md bg-blue-600 text-white">Apply</button>
      <button onClick={() => { setQ(''); setSentiment('all'); setSource('all'); onApply({ q: '', sentiment: 'all', source: 'all' }) }} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700">Clear</button>
    </div>
  )
}

function useTrends() {
  const [trend, setTrend] = React.useState<{ date: string; positive: number; neutral: number; negative: number }[]>([])
  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/stats/trends`).then(r => r.json()).then(j => setTrend(j.data))
  }, [])
  return trend
}

export default function App() {
  const [filtered, setFiltered] = React.useState<Mention[] | null>(null)
  const [alerts, setAlerts] = React.useState<any[]>([])
  const mentions = useRealtimeMentions((payload) => setAlerts(prev => [payload, ...prev].slice(0, 10)))
  const trend = useTrends()
  const [topNeg, setTopNeg] = React.useState<Mention[]>([])
  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/stats/top-negative`).then(r => r.json()).then(j => setTopNeg(j.data))
  }, [])

  const onApplyFilters = async ({ q, sentiment, source }: { q: string; sentiment: 'all'|'positive'|'neutral'|'negative'; source: 'all'|string }) => {
    if (!q && sentiment === 'all' && source === 'all') { setFiltered(null); return }
    const data = await fetchMentions({ search: q || undefined, sentiment, source })
    setFiltered(data)
  }

  const sources = React.useMemo(() => Array.from(new Set(mentions.map(m => m.source))), [mentions])
  const list = filtered ?? mentions

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
      <div className="container mx-auto max-w-6xl px-4">
        <Header />
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            {list.map(m => (
              <MentionItem key={(m.id ?? Math.random()) + '-' + m.timestamp} mention={m} />
            ))}
          </div>
          <div className="md:col-span-1 space-y-3">
            <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
              <div className="font-medium mb-2">Filters</div>
              <Filters onApply={onApplyFilters} sources={sources} />
            </div>
            <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
              <div className="font-medium mb-2">7-Day Trend</div>
              <TrendChart data={trend} />
            </div>
            <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
              <div className="font-medium mb-2">Top Negative</div>
              <TopNegative items={topNeg} />
            </div>
            <AlertPanel items={alerts} />
          </div>
        </div>
      </div>
    </div>
  )
}
