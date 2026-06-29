# nudge

Personal habit tracker — **single user, used daily on a phone**. Pick a category from the home grid, complete daily activities, and get satisfying done animations. The **eat** category is the main feature: a metabolic timing model with meal logging, liver glycogen simulation, phase nudges, and educational info screens.

> **Note for agents:** This README is primarily context for future AI sessions, not end-user documentation. Read this before proposing changes — many “production app” improvements (multi-user auth, eat sync, rate limiting, broad test coverage) are out of scope unless the owner asks for them.

## Context for agents

**Who uses it:** One person (the owner), on their phone, every day.

**Implications — prioritize:**
- Mobile UX bugs (loading traps, stale UI, edit flows, touch targets)
- Eat model correctness — heavily used and well-tested in `src/lib/`; regressions are felt immediately
- Small, focused diffs that match existing conventions

**Implications — deprioritize unless asked:**
- Multi-user auth, role separation, rate limiting
- Server sync for eat data — `localStorage` on the phone is intentional
- API/component test suites, E2E, slug validation hardening
- “Scale” concerns (schema migration strategy, admin API exposure)
- Placeholder categories (`hidden: true` in `categories.ts`) — not user-facing yet

**Auth:** Optional `SITE_PASSWORD` is a simple gate on the deployed URL, not real user accounts. Device identity is an anonymous cookie (`nudge_device_id`).

**Where complexity lives:** ~80 source files total; most cognitive load is in eat (`eat-metabolic.ts`, `eat-meal.ts`, `EatScreen.tsx`). Everything else is straightforward Next.js + Turso.

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
| `SITE_PASSWORD` | Recommended on deploy | Shared password; whole site is open if unset |

## Data model

**Server (Turso)** — keyed by `nudge_device_id` cookie:

- Activity completions per category
- Custom activities (expire at end of nudge day)
- Activity submissions

**Client (`localStorage`)** — device-only, not synced (by design for personal phone use):

- Eat meal log (`nudge-eat-meals`)
- Eat info screen font scale

Clearing browser storage deletes eat history permanently. Do not add server sync unless explicitly requested.

## Nudge day

Completions roll over at **5:00 AM** in the user's IANA timezone (sent with API requests), not midnight. Custom activities also expire at that boundary.

## Eat model

The metabolic simulation lives in `src/lib/eat-metabolic.ts` with UI/copy in `src/lib/eat-meal.ts`. See `docs/eat-metabolic-model.md` for the full spec.

Key files:
- `src/lib/eat-metabolic.ts` — simulation engine
- `src/lib/eat-meal-timing.ts` — phase windows, 15-min rounding
- `src/lib/eat-meal.ts` — localStorage, status copy, home card lines
- `src/components/EatScreen.tsx` — main eat UI
- `src/lib/eat-metabolic.test.ts`, `src/lib/eat-meal.test.ts` — domain tests (run these after eat changes)

Home grid eat card refreshes on `EAT_UPDATED_EVENT` (dispatched when meals are saved) and on a 60s interval.

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

## Next.js

This project uses Next.js 16 with breaking changes from older versions. See `node_modules/next/dist/docs/` and `AGENTS.md` before assuming familiar APIs.
