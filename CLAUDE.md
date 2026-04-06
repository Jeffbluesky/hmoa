# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Haiming OA (海明OA) is a product management system built as a pnpm + Turborepo monorepo.

## Workspace Structure

- `apps/server` (`@hmoa/server`) — Express + Prisma + TypeScript REST API, port 3001
- `apps/admin` (`@hmoa/admin`) — React 18 + Vite + Ant Design 5 admin dashboard, port 5173
- `packages/types` (`@hmoa/types`) — Shared TypeScript types and Zod schemas
- `packages/utils` (`@hmoa/utils`) — Shared utility functions

## Commands

### Root (runs all workspaces via Turborepo)
```bash
pnpm dev          # start all apps in dev mode
pnpm build        # build all packages and apps
pnpm lint         # lint all workspaces
pnpm format       # prettier format entire repo
```

### Filtered (single workspace)
```bash
pnpm --filter @hmoa/server dev    # server only (tsx watch)
pnpm --filter @hmoa/admin dev     # admin only (vite)
```

### Database (Prisma)
```bash
pnpm db:generate        # regenerate Prisma client after schema changes
pnpm db:migrate         # run migrations in dev
pnpm db:seed            # seed the database
pnpm db:studio          # open Prisma Studio
pnpm --filter @hmoa/server db:use:mysql    # switch to MySQL schema
pnpm --filter @hmoa/server db:use:sqlite   # switch to SQLite schema
```

### Infrastructure
```bash
docker-compose up -d    # start MySQL 8, Redis 7, MinIO
```

## Architecture

### Backend (`apps/server`)
- Entry: `src/server.ts` — Express app setup, CORS, middleware registration
- `src/config/index.ts` — all env vars loaded here; `JWT_SECRET` is required
- `src/routes/` — one file per resource, all mounted under `/api`
- `src/services/` — business logic layer (one service per resource)
- `src/middleware/` — auth, error handler, not-found handler
- Prisma schema lives in `prisma/` with support for both MySQL and SQLite schemas
- File uploads stored locally under `uploads/`, served as static at `/uploads`
- PDF generation via Puppeteer (`pdfGenerationService.ts`)
- Sequence numbers managed by `sequenceService.ts`

### Frontend (`apps/admin`)
- Entry: `src/main.tsx` → `src/App.tsx`
- Auth guard in `App.tsx`: unauthenticated users redirect to `/login`; auth state checked via `checkAuth()` on mount
- `src/stores/` — Zustand stores (e.g. `auth.ts` holds the current user)
- `src/pages/` — one file/folder per route; `Products/` is a folder with `ProductForm.tsx`
- `src/utils/api.ts` — axios wrapper (`http`) used across all pages and stores
- `src/theme/` — Ant Design theme customization
- `src/styles/` — global CSS

### Shared Packages
- `@hmoa/types` — must be built (`pnpm --filter @hmoa/types build`) before server or admin can consume it; exports from `dist/`
- `@hmoa/utils` — same build requirement

## Environment Variables

Server reads from `apps/server/.env`. Required:
- `JWT_SECRET`

Defaults (can be overridden):
- `DATABASE_URL` — `mysql://hmoa:hmoa123@localhost:3306/hmoa`
- `PORT` — `3001`
- `REDIS_URL`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`

## Design System

The project follows an Apple-inspired design language documented in `DESIGN_apple.md`. Key rules when building UI:
- Primary accent: Apple Blue `#0071e3` — used only for interactive elements
- Section backgrounds alternate between `#000000` (dark/immersive) and `#f5f5f7` (light/informational)
- Typography: SF Pro Display at 20px+, SF Pro Text below 20px; negative letter-spacing at all sizes
- Pill CTAs use `border-radius: 980px`; standard buttons use `8px`
- No gradients, textures, or additional accent colors
