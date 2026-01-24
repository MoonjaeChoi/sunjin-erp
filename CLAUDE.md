# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install                      # Install dependencies
npm run dev                      # Dev server (port 3000)
npm run build                    # Production build
npm run test                     # Unit tests
npm run lint                     # ESLint check
npm run lint -- --fix            # Auto-fix lint issues
npm run type-check               # TypeScript validation
npm run format                   # Prettier formatting

# Database
npx typeorm migration:generate -n MigrationName   # Create migration
npx typeorm migration:run                          # Run migrations
npx typeorm migration:revert                       # Rollback last migration

# Docker
docker-compose up -d             # Start app (port 3000) + Oracle XE (port 1521)
```

## Architecture Overview

### Full-Stack Next.js 14 (App Router) + Oracle XE 21c

This is a single full-stack project: Next.js handles both frontend rendering and backend API routes. No separate backend server.

**State Management Philosophy:**
- **Zustand** — Client-only UI state (sidebar open/close, form drafts, filters)
- **TanStack Query** — All server data (fetching, caching, mutations, optimistic updates)
- Never duplicate server state in Zustand; TanStack Query is the single source of truth for DB data

**Route Group Architecture:**
```
src/app/
├── (auth)/          # Unauthenticated routes (login page)
│                    # No sidebar/header layout
├── (main)/          # Authenticated routes (requires session)
│   ├── layout.tsx   # Shared layout: sidebar + header + main content area
│   ├── dashboard/   # Landing page after login
│   └── [modules]/   # Each module is a folder with page.tsx + components
└── api/             # Route Handlers (REST endpoints for TanStack Query)
    └── [module]/    # e.g., api/customers/route.ts, api/customers/[id]/route.ts
```

**API Route Pattern:**
- `GET /api/[module]` — List with query params (pagination, filters)
- `GET /api/[module]/[id]` — Single record
- `POST /api/[module]` — Create
- `PUT /api/[module]/[id]` — Update
- `DELETE /api/[module]/[id]` — Soft delete (sets `deleted_at`)

**Component Organization:**
- `src/components/ui/` — shadcn/ui primitives (Button, Input, Dialog, etc.)
- `src/components/layout/` — App shell (Sidebar, Header, Breadcrumb)
- `src/components/features/` — Domain components grouped by module (e.g., `features/customers/`)

### Entity Relationships (Core Domain)

```
[Department] ──── [Employee] ─┬── [Task]
                               ├── [TechSupport] ──── [Customer]
                               ├── [Project] ────── [Customer]
                               └── [Issue] ─────── [Customer]

[Customer] ──── [CustomerContact]
            ├── [MaintenanceContract]
            └── [Attachment]

[Inventory] ──── [InventoryHistory]
[Notice] ──── [NoticeComment]
```

## Database Rules (Oracle XE 21c)

### Oracle-Specific Types

- `VARCHAR2` (not VARCHAR) for strings
- `CLOB` for large text (not TEXT)
- `NUMBER` for all numeric types
- Sequence objects for auto-increment IDs

### Safety Rules (Mandatory)

- **CASCADE DELETE 금지** — All foreign keys use `ON DELETE RESTRICT`
- **Soft delete only** — Every table has `deleted_at` column; physical delete requires separate approval
- **No fallback DB** — Oracle connection failure returns HTTP 500 with error details; never fall back to SQLite or other databases
- **Check dependencies before delete** — Verify no related records exist

## Authentication & Authorization

NextAuth.js (Auth.js v5) with session + JWT.

| Role | Access |
|------|--------|
| `ADMIN` | All features + employee/department management |
| `MANAGER` | Department-scope read/write |
| `USER` | Own data + read-only for shared resources |

## Environment Variables

```bash
# .env (required)
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=XEPDB1
ORACLE_USERNAME=sunjin_admin
ORACLE_PASSWORD=<password>

NEXTAUTH_SECRET=<32+ character random string>
NEXTAUTH_URL=http://localhost:3000

UPLOAD_DIR=./uploads
```

## Conventions

### File Creation Timestamp

All new files must have a generation timestamp at the top:
- TypeScript/JavaScript: `// Generated: YYYY-MM-DD HH:MM:SS KST`
- HTML/Markdown: `<!-- Generated: YYYY-MM-DD HH:MM:SS KST -->`
- Always Seoul timezone (KST)

### Git Commits

Conventional Commits format:
```
<type>(<scope>): <description>

Types: feat, fix, docs, test, refactor, perf, chore
Scopes: dashboard, tasks, support, projects, issues, inventory, maintenance, customers, employees, notices
```

Branch naming: `feat/feature-name` or `fix/bug-description`

## Module Implementation Order

| Phase | Modules | Depends On |
|-------|---------|------------|
| 1 | Auth + Employees + Customers | — |
| 2 | Dashboard + Tasks | Phase 1 |
| 3 | Tech Support + Issues | Phase 1 |
| 4 | Projects (Sales Pipeline) | Phase 1 |
| 5 | Inventory + Maintenance | Phase 1 |
| 6 | Notices | Phase 1 |

## Staging Server

- **URL**: `http://192.168.75.194:3200`
- **Oracle schema**: `sunjin_admin` (isolated from existing `ocr_admin`)
- **Docker network**: `sunjin-network` (172.21.0.0/16, isolated from existing `zine-network`)
- Details in `docs/operation/` documents
