export type SentimentLabel = 'positive' | 'neutral' | 'negative';
export interface Mention {
  id?: number;
  timestamp: number;
  user: string;
  content: string;
  source: string;
  url?: string;
  keywords?: string;
  sentimentLabel?: SentimentLabel;
  sentimentScore?: number;
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchMentions(params: { limit?: number; sentiment?: SentimentLabel | 'all'; source?: string | 'all'; search?: string } = {}) {
  const url = new URL(`${API}/api/mentions`);
  Object.entries(params).forEach(([k,v]) => { if (v != null) url.searchParams.set(k, String(v)); });
  const res = await fetch(url);
  const json = await res.json();
  return json.data as Mention[];
}

export function connectStream(onEvent: (type: string, data: any) => void) {
  const evt = new EventSource(`${API}/api/stream`);
  evt.addEventListener('mention', (e: MessageEvent) => onEvent('mention', JSON.parse(e.data)));
  evt.addEventListener('alert', (e: MessageEvent) => onEvent('alert', JSON.parse(e.data)));
  return () => evt.close();
}
