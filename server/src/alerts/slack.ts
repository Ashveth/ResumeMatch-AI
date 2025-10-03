import axios from "axios";
import { env } from "../utils/env.js";
import type { Mention } from "../types.js";

export async function sendSlackAlert(mention: Mention, suggestedReply: string) {
  if (!env.slackWebhookUrl) return;
  const blocks = [
    { type: "header", text: { type: "plain_text", text: "Negative Mention Detected" } },
    { type: "section", fields: [
      { type: "mrkdwn", text: `*Source:* ${mention.source}` },
      { type: "mrkdwn", text: `*User:* ${mention.user}` },
      { type: "mrkdwn", text: `*Sentiment:* ${mention.sentimentLabel} (${mention.sentimentScore})` },
      { type: "mrkdwn", text: `*Time:* ${new Date(mention.timestamp).toLocaleString()}` }
    ]},
    { type: "section", text: { type: "mrkdwn", text: `*Content:*\n${mention.content}` } },
    mention.url ? { type: "section", text: { type: "mrkdwn", text: `*Link:* ${mention.url}` } } : undefined,
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: `*Suggested reply:*\n${suggestedReply}` } }
  ].filter(Boolean);
  await axios.post(env.slackWebhookUrl, { blocks });
}
