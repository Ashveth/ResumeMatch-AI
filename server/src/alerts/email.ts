import nodemailer from "nodemailer";
import { env } from "../utils/env.js";
import type { Mention } from "../types.js";

export async function sendEmailAlert(mention: Mention, suggestedReply: string) {
  const { host, port, user, pass, from, to } = env.smtp;
  if (!host || !user || !pass || !from || !to) return; // Not configured

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const subject = `Negative mention: ${mention.source} @${mention.user}`;
  const html = `<p><strong>Source:</strong> ${mention.source}</p>
    <p><strong>User:</strong> ${mention.user}</p>
    <p><strong>Sentiment:</strong> ${mention.sentimentLabel} (${mention.sentimentScore})</p>
    <p><strong>Time:</strong> ${new Date(mention.timestamp).toLocaleString()}</p>
    ${mention.url ? `<p><strong>Link:</strong> <a href="${mention.url}">${mention.url}</a></p>` : ""}
    <p><strong>Content:</strong></p>
    <blockquote>${escapeHtml(mention.content)}</blockquote>
    <hr/>
    <p><strong>Suggested reply:</strong></p>
    <blockquote>${escapeHtml(suggestedReply)}</blockquote>`;

  await transporter.sendMail({ from, to, subject, html });
}

function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
