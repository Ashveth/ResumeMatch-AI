## Customer Sentiment Alert System (MVP)

End-to-end MVP: fetch mentions (Reddit + mock) → analyze with Google Gemini → store in SQLite → real-time alerts (Slack/email) with suggested replies → live dashboard.

### Quick start

1) Environment
- Copy `.env.example` to `server/.env` and root `.env` as needed.
- Set `GEMINI_API_KEY` and optionally `SLACK_WEBHOOK_URL` and SMTP creds.

2) Install
- Server: `cd server && npm install`
- Web: `cd web/web && npm install`

3) Run (two terminals) or use root scripts
- Terminal A: `npm run server:dev`
- Terminal B: `npm run web:dev`
- Or: `npm run dev` (runs both)

4) Open
- API server: http://localhost:3001/health
- Web app: http://localhost:5173/

### Features
- Real-time polling: Reddit search for `MONITOR_KEYWORDS`, optional mock stream for demo
- Sentiment with Gemini (`GEMINI_MODEL`, default flash)
- SQLite storage with indices; trend and top-negative endpoints
- Slack alerts + email alerts with AI suggested reply when negative<=threshold
- SSE stream for live updates and alerts
- React + Vite + Tailwind + D3 + Framer Motion; dark/light toggle; responsive

### Testing
- Trigger test mention: 
```bash
curl -X POST http://localhost:3001/api/test/mention -H 'Content-Type: application/json' -d '{"content":"this product is terrible and crashes", "source":"twitter", "user":"demo"}'
```
- You should see the item appear in the dashboard and, if configured, an alert in Slack/email.

### Deployment
- Backend: containerize Node server; ensure persistent volume for `data/`. Set env vars.
- Frontend: build with `npm run web:build` and serve `web/web/dist` via static hosting or a reverse proxy.
- CORS is enabled by default; set proper origins for production.

### Notes
- Add more sources by creating modules in `server/src/sources/` and wiring into `pollSources`.
- Adjust alert threshold via `NEGATIVE_THRESHOLD`.
- Digests run daily/weekly when SMTP is configured.
