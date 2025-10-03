import cron from "node-cron";
import nodemailer from "nodemailer";
import { env } from "../utils/env.js";
import { getTopNegative, getTrendDaily } from "../data/db.js";

export function scheduleDigests() {
  // Daily at 8am server time
  cron.schedule("0 8 * * *", async () => {
    await sendDigest("daily");
  });
  // Weekly Monday at 8am
  cron.schedule("0 8 * * 1", async () => {
    await sendDigest("weekly");
  });
}

async function sendDigest(kind: "daily" | "weekly") {
  const { host, port, user, pass, from, to } = env.smtp;
  if (!host || !user || !pass || !from || !to) return;

  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  const top = getTopNegative(10);
  const trends = getTrendDaily(7);

  const html = `
    <h2>${kind === "daily" ? "Daily" : "Weekly"} Sentiment Digest</h2>
    <h3>Top Negative Mentions</h3>
    <ol>
      ${top.map(m => `<li><strong>${m.source}</strong> @${m.user}: ${escapeHtml(m.content)} <em>(${m.sentimentScore})</em></li>`).join("")}
    </ol>
    <h3>7-Day Trend</h3>
    <pre>${escapeHtml(JSON.stringify(trends, null, 2))}</pre>
  `;

  await transporter.sendMail({ from, to, subject: `${kind} sentiment digest`, html });
}

function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
