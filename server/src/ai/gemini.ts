import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../utils/env.js";
import type { Mention, SentimentLabel } from "../types.js";

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

function clamp(n: number, min = -1, max = 1) { return Math.max(min, Math.min(max, n)); }

export async function analyzeSentiment(text: string): Promise<{ label: SentimentLabel; score: number }>
{
  const prompt = `Analyze the customer's sentiment in the following text. Return strict JSON with fields {"label": "positive|neutral|negative", "score": number between -1 and 1}. Only JSON, no extra text.\n\nTEXT:\n${text}`;
  const model = genAI.getGenerativeModel({ model: env.geminiModel });
  const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
  const textResp = result.response.text();
  try {
    const json = JSON.parse(textResp);
    let label = (json.label as string).toLowerCase() as SentimentLabel;
    if (!['positive','neutral','negative'].includes(label)) label = 'neutral';
    const score = clamp(Number(json.score));
    return { label, score: Number.isFinite(score) ? score : 0 };
  } catch {
    // Fallback heuristic if JSON parsing fails
    const lc = textResp.toLowerCase();
    const score = lc.includes('negative') ? -0.5 : lc.includes('positive') ? 0.5 : 0;
    const label: SentimentLabel = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';
    return { label, score };
  }
}

export async function generateSuggestedReply(mention: Mention): Promise<string> {
  const prompt = `Craft a concise, empathetic, professional reply to a public mention about a brand.\nConstraints: 2-4 sentences, friendly tone, acknowledge issue, offer help, avoid promises you can't keep.\nReturn only the reply text, no quotes or JSON.\n\nContext:\nSource: ${mention.source}\nUser: ${mention.user}\nOriginal text: ${mention.content}`;
  const model = genAI.getGenerativeModel({ model: env.geminiModel });
  const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
  return result.response.text().trim();
}
