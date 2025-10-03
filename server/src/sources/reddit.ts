import axios from "axios";
import type { Mention } from "../types.js";

export async function fetchRedditMentions(query: string, limit: number = 10): Promise<Mention[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=${limit}`;
  const { data } = await axios.get(url, { headers: { "User-Agent": "sentiment-alert-bot/0.1" } });
  const children = data?.data?.children ?? [];
  const mentions: Mention[] = children.map((c: any) => {
    const p = c.data;
    const content = [p.title, p.selftext].filter(Boolean).join("\n\n").trim();
    const user = p.author || "unknown";
    const timestamp = (p.created_utc ? p.created_utc * 1000 : Date.now());
    const url = p.permalink ? `https://www.reddit.com${p.permalink}` : undefined;
    return { timestamp, user, content, source: "reddit", url } as Mention;
  }).filter((m: Mention) => m.content && m.content.length > 0);
  return mentions;
}
