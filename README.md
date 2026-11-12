# TMs Portfolio Dashboard

Next.js portfolio console with an integrated **evidence-before-consensus research workspace** for monitoring and reviewing arbitrary investment targets.

## Run

```bash
npm install
npm run dev
# production verification
npm run lint
npm run build
npm start
```

Open `/` for the existing portfolio dashboard and `/research` for the research monitor. The existing environment-based portfolio API remains unchanged. Research data defaults to `data/research.json`; set `RESEARCH_DATA_PATH=/absolute/path/research.json` to place it on a persistent volume.

## Portfolio caching and refresh

Portfolio snapshots use [Vercel Runtime Cache](https://vercel.com/docs/runtime-cache), available on the Hobby plan. Each account selection has a separate cache entry. Snapshots are fresh for 5 minutes and retained for up to 48 hours; Vercel may evict them earlier. A cache miss still waits for the upstream service.

- Opening the dashboard uses the saved account selection in one request.
- Cached data appears immediately. After 5 minutes, a read starts a background refresh; the dashboard checks for the result every 5 seconds for up to a minute. An open, visible dashboard also checks every 5 minutes and when returning to the tab.
- **Refresh** in the upper right bypasses cached data, fetches the latest data, and updates the same cache entry. Failed refreshes preserve the previous snapshot and display an error. **Updated/Cached** shows when the snapshot was successfully fetched, not the market quote time.
- Browser and CDN response caching are disabled for the portfolio API. Only the server-side snapshot is reused. Cache keys isolate projects, environments, data sources, credentials, and account selections.
- Local development uses the SDK's in-memory fallback; Vercel uses the shared regional cache. No Redis or paid storage is required.

### Automatic refresh on Vercel Hobby

`vercel.json` defines the `portfolio-cache-refresh` [Vercel Schedule](https://vercel.com/docs/schedules), running `/api/cron/refresh` every 15 minutes to warm the combined portfolio and every individual account. This works even when nobody has the dashboard open.

To enable it:

1. In the Vercel project's **Settings → Environment Variables**, add `CRON_SECRET` for **Production**, using a random value of at least 16 characters. Keep it private; do not use a `NEXT_PUBLIC_` variable. Vercel automatically sends it as the cron request's bearer token.
2. Deploy the changes to Production. Production schedules start active; new Preview schedules start inactive.
3. In **Schedules**, select Production and check that `portfolio-cache-refresh` is active. Use **Run Schedule** and inspect execution history to verify it. A successful response reports the number of refreshed account selections. Requests without the matching secret return `401`.

Schedules are currently in beta. On Hobby, the minimum interval and execution jitter window are both **15 minutes**: a scheduled run may arrive up to 15 minutes after its scheduled time. This uses at most 2,976 scheduled runs in a 31-day month, within the **5,000 runs per team per billing period** allowance (other projects and manual runs share it). This configuration uses the new `schedules` property; legacy `crons` are limited to once per day on Hobby. The 5-minute background refresh is still triggered by visits. See [Schedules limits](https://vercel.com/docs/schedules/limits).

Validation: `npm run test:data` exercises the real API/cache handlers with a controlled upstream; `npm run test:portfolio` checks the dashboard against a running local server (defaults to `http://localhost:3000`, override with `PORTFOLIO_TEST_URL`).

## Research workflow

1. Create an asset in the watchlist and record its core thesis/current conclusion.
2. Define testable hypotheses and unresolved questions.
3. Attach evidence to one of five links: `usage → revenue → profit → cashflow → shareholder`.
4. Preserve evidence source, observation date, strength, direction and verification state.
5. Define metrics, targets, observation frequency and time-series values.
6. Record earnings, announcements, news or manual observations and associate them with hypotheses/evidence-chain links.
7. Move the asset through `story → evidence → consensus`; every transition requires a written reason and is retained in history.
8. Record judgement changes, confidence changes, position/action decisions and review them chronologically.
9. Export the complete workspace or a single-asset bundle as JSON.

## Core routes

- `/research` — searchable watchlist and stage filter; create assets; workspace export.
- `/research/[id]` — overview, evidence-chain board, metric trends, event timeline, decisions/review.
- `/api/research` — JSON CRUD/import/export API.

API operations:

- `GET /api/research` — complete store.
- `GET /api/research?assetId=<id>` — one asset and all related records.
- `GET /api/research?export=1` — downloadable complete JSON.
- `POST /api/research` with `{ "type": "evidence", "data": {...} }` — create.
- `PUT /api/research` with `{ "type": "assets", "id": "...", "data": {...} }` — update.
- `DELETE /api/research` with `{ "type": "...", "id": "..." }` — delete; deleting an asset cascades its related records.
- `PUT /api/research?import=1` with a complete store — import/replace.

## Data model

The JSON store contains these collections:

| Collection | Purpose |
| --- | --- |
| `assets` | target identity, stage, thesis, conclusion and watch status |
| `hypotheses` | testable claims, status and confidence |
| `questions` | unresolved questions and priority |
| `evidence` | chain link, source, date, strength, verification and direction |
| `metrics`, `metricValues` | target/frequency/direction and observations over time |
| `events` | earnings/news/announcement/manual events and research links |
| `stageChanges` | stage transition history and rationale |
| `journal` | observations, judgement changes and reviews |
| `actions` | watch/initiate/add/reduce/exit and position context |

All entities retain `createdAt` and `updatedAt`. Relationships are explicit IDs, making later migration to a relational database straightforward.

## Integration assessment

The research workspace is implemented **inside `portfolio-dashboard`** rather than as a separate app because the repository already provides the compatible Next.js Pages Router, React/ECharts stack, theme tokens, navigation, deployment and API runtime. The portfolio navbar now links to Research, and the research navbar links back to Portfolio.

What is reused now:

- Next.js application/deployment pipeline and Pages Router API runtime;
- global light/dark theme variables and ECharts dependency;
- product branding/navigation shell;
- same-origin deployment, avoiding a second service and CORS/auth boundary.

Current repository constraints:

- no application-level login/session middleware exists to reuse;
- portfolio holdings come from external authenticated endpoints, while research records are intentionally user-entered and local;
- JSON persistence is suitable for a single-user/private deployment, not concurrent multi-user writes.

Recommended production extension path:

1. Replace `src/lib/researchStore.js` with a PostgreSQL/SQLite repository while retaining API payloads.
2. Add user/workspace ownership once portfolio authentication is exposed at app level.
3. Connect assets to portfolio holding symbols/account IDs without forcing every researched asset to be held.
4. Add scheduled data-provider adapters for filings/news/financial metrics; keep human verification explicit.
5. Add optimistic concurrency, audit actor IDs, attachments and CSV/Markdown export.
6. Add notifications based on metric observation frequency and overdue unresolved questions.

The module deliberately does not execute trades, prescribe automatic scores, or assume real-time market/news feeds.
