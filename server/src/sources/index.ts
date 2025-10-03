import { env } from "../utils/env.js";
import { fetchRedditMentions } from "./reddit.js";
import { generateMockMention } from "./mock.js";
import type { Mention } from "../types.js";

export type SourceHandler = (keywords: string[]) => Promise<Mention[]>;

async function fetchFromReddit(keywords: string[]): Promise<Mention[]> {
  const queries = keywords;
  const results: Mention[] = [];
  for (const q of queries) {
    try {
      const m = await fetchRedditMentions(q, 5);
      results.push(...m);
    } catch {}
  }
  return dedupe(results);
}

function dedupe(arr: Mention[]): Mention[] {
  const seen = new Set<string>();
  const out: Mention[] = [];
  for (const m of arr) {
    const key = `${m.source}-${m.user}-${m.timestamp}-${m.content.slice(0,50)}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}

export async function pollSources(onMentions: (mentions: Mention[]) => Promise<void>) {
  // Initial mock burst for demo
  if (env.behavior.enableMock) {
    const initial: Mention[] = Array.from({ length: 5 }, () => generateMockMention());
    await onMentions(initial);
  }

  // Reddit poller
  setInterval(async () => {
    try {
      const reddit = await fetchFromReddit(env.monitorKeywords);
      await onMentions(reddit);
    } catch (e) {
      // swallow errors to keep polling
    }
  }, env.behavior.pollIntervalMs);

  // Mock generator every so often
  if (env.behavior.enableMock) {
    setInterval(async () => {
      await onMentions([generateMockMention()]);
    }, Math.max(10000, Math.floor(env.behavior.pollIntervalMs / 3)));
  }
}
