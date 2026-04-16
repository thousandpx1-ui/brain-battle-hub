# Brain Battle Hub

## Overview

A mobile-first brain training game web app with 5 addictive mini puzzle games, shared leaderboard, daily streaks, and ad integration. Built as a React + Vite app backed by an Express API with PostgreSQL.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/brain-battle-hub)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **State management**: Zustand with persist (localStorage)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Routing**: Wouter
- **Animations**: Framer Motion
- **UI**: Tailwind CSS + Radix UI + shadcn/ui components

## Games

1. **Memory Collapse** (memory) — Sequence recall with numbered tiles
2. **Don't Blink** (blink) — Moving bar with perfect/good zones

## Pages

- `/` — Home (game cards, leaderboard preview, daily streak)
- `/game/:gameId` — Game page (gameplay, game loop, score submission)
- `/leaderboard` — Leaderboard (global/daily/per-game tabs, rank badges)

## Ad Placements

- Bottom banner (always visible)
- Interstitial after every 3 game overs
- Reward ad on game over screen (double score or continue)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## API Endpoints

- `POST /api/scores` — Submit a score
- `GET /api/leaderboard` — Get leaderboard (filter by gameId, period, limit)
- `GET /api/leaderboard/stats` — Get global stats
- `GET /api/leaderboard/rank?username=X` — Get player rank and badge

## Retention Features

- Daily streak tracked in localStorage via Zustand persist
- Rank badges: Bronze / Silver / Gold based on percentile
- "You are top X% of players" on leaderboard
