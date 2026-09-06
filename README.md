# Builder

To see and track where we are going.

This is **Founder OS** — a local-first personal execution tracker. Inputs don't count; output is the only truth.

## Features

- **Daily log** — primary objective, deep work minutes, self-scored output/technical/business/discipline/focus
- **Founder Score** — computed each day from actual daily data (deep work + technical capability + output + business + discipline)
- **Focus timer** — timed deep-work sessions with browser notifications; survives page refresh
- **Distraction log** — track where time actually went, with WASTED TIME signal
- **Projects & milestones** — idea → research → building → shipped, with evidence URLs
- **Skills** — self-assessed 0–6 capability levels with linked evidence
- **Business metrics** — contacts, conversations, demos, customers, revenue, retention
- **Weekly & monthly reviews** — auto-aggregated numbers with Recharts history
- **Settings** — import/export all data as JSON, clear, or load sample data

## Stack

Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS v4, Prisma 7 + SQLite (better-sqlite3), Recharts, Zod.

## Getting Started

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Local-only, single user. No accounts. You own the data (`dev.db`).
- Seed sample data from **Settings → Development Seed**.