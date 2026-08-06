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
