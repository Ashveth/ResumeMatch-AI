import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";

dotenv.config();

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const dataDir = path.resolve(process.cwd(), "data");
ensureDir(dataDir);

export const env = {
  port: Number(process.env.PORT ?? 3001),
  databasePath: path.resolve(process.cwd(), process.env.DATABASE_PATH ?? "./data/sentiment.db"),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
  monitorKeywords: (process.env.MONITOR_KEYWORDS ?? "example brand|product").split("|").map(s => s.trim()).filter(Boolean),
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL ?? "",
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? "",
    to: process.env.EMAIL_TO ?? "",
  },
  behavior: {
    negativeThreshold: Number(process.env.NEGATIVE_THRESHOLD ?? -0.2),
    pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 45000),
    enableMock: (process.env.ENABLE_MOCK_SOURCE ?? "true").toLowerCase() === "true",
  },
} as const;

export function requireEnv(key: keyof typeof env | string) {
  if (typeof key === "string") {
    const value = (process.env as any)[key];
    if (!value) throw new Error(`Missing required env var ${key}`);
    return value;
  }
  return (env as any)[key];
}
