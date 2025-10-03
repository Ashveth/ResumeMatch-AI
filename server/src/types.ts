export type SentimentLabel = "positive" | "neutral" | "negative";

export interface Mention {
  id?: number;
  timestamp: number; // ms since epoch
  user: string;
  content: string;
  source: string; // e.g., "reddit"
  url?: string;
  keywords?: string; // matched keywords (optional)
  sentimentLabel?: SentimentLabel;
  sentimentScore?: number; // -1..1
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  positive: number;
  neutral: number;
  negative: number;
}
