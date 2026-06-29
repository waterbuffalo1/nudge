# nudge

A mobile-first habit tracker. Pick a category from the home grid, complete daily activities, and get satisfying done animations. The **eat** category adds a metabolic timing model — meal logging, liver glycogen simulation, phase nudges, and educational info screens.

## Setup

```bash
npm install
cp .env.example .env
# fill in TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `TURSO_DATABASE_URL` | Yes | libSQL/Turso database URL |
| `TURSO_AUTH_TOKEN` | Usually | Auth token for remote Turso |
| `SITE_PASSWORD` | No | When set, gates the whole site behind a shared password |

If `SITE_PASSWORD` is unset, the app is publicly accessible — fine for local dev, risky if deployed without intending to.

## Data model

**Server (Turso)** — keyed by anonymous `nudge_device_id` cookie:

- Activity completions per category
- Custom activities (expire at end of nudge day)
- Activity submissions from the “suggest an activity” flow

**Client (`localStorage`)** — device-only, not synced:

- Eat meal log (`nudge-eat-meals`)
- Eat info screen font scale

Clearing browser storage deletes eat history permanently.

## Nudge day

Completions roll over at **5:00 AM** in the user's IANA timezone (sent with API requests), not midnight. Custom activities also expire at that boundary.

## Eat model

The metabolic simulation lives in `src/lib/eat-metabolic.ts` with UI/copy in `src/lib/eat-meal.ts`. See `docs/eat-metabolic-model.md` for the full spec.

## Scripts

```bash
npm run dev          # development server
npm run check        # lint + test + build
npm test             # vitest

npm run submissions           # list open activity submissions
npm run submissions:done-list # list done submissions
npm run submissions:done -- <id>  # mark a submission done
```

Submission scripts read `.env` for Turso credentials.
