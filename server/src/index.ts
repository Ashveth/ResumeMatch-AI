import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./utils/env.js";
import { insertMention, getMentions, getTrendDaily, getTopNegative } from "./data/db.js";
import { analyzeSentiment, generateSuggestedReply } from "./ai/gemini.js";
import { sendSlackAlert } from "./alerts/slack.js";
import { sendEmailAlert } from "./alerts/email.js";
import { addClient, removeClient, broadcast } from "./utils/sse.js";
import { scheduleDigests } from "./alerts/digest.js";
import { pollSources } from "./sources/index.js";
import type { Mention } from "./types.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/mentions", (req, res) => {
  const limit = Number(req.query.limit ?? 100);
  const sentiment = (req.query.sentiment as any) ?? "all";
  const source = (req.query.source as any) ?? "all";
  const search = (req.query.search as string | undefined) ?? undefined;
  const data = getMentions({ limit, sentiment, source, search });
  res.json({ data });
});

app.get("/api/stats/trends", (_req, res) => {
  const data = getTrendDaily(7);
  res.json({ data });
});

app.get("/api/stats/top-negative", (_req, res) => {
  const data = getTopNegative(5);
  res.json({ data });
});

app.post("/api/test/mention", async (req, res) => {
  const { content, source = "test", user = "tester", url } = req.body ?? {};
  if (!content || typeof content !== "string") {
    return res.status(400).json({ error: "content is required" });
  }
  const mention: Mention = { timestamp: Date.now(), user, content, source, url };
  await processMentions([mention]);
  res.json({ ok: true });
});

app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const id = addClient(res);
  res.write(`event: ready\ndata: {"ok":true}\n\n`);

  req.on("close", () => {
    removeClient(id);
  });
});

async function processMentions(mentions: Mention[]) {
  for (const m of mentions) {
    try {
      const { label, score } = await analyzeSentiment(m.content);
      m.sentimentLabel = label;
      m.sentimentScore = score;
      const saved = insertMention(m);
      broadcast("mention", saved);

      if (label === "negative" && score <= env.behavior.negativeThreshold) {
        const reply = await generateSuggestedReply(m);
        await Promise.allSettled([
          sendSlackAlert(saved, reply),
          sendEmailAlert(saved, reply)
        ]);
        broadcast("alert", { mention: saved, suggestedReply: reply });
      }
    } catch (e) {
      // continue processing others
    }
  }
}

// Start source polling
pollSources(processMentions);

// Start server
app.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});

// Schedule periodic digests (no-op if email not configured)
scheduleDigests();
