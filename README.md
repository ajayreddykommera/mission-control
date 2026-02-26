# Mission Control

A full-stack feature flag management platform built with **TanStack Start**, **Ant Design**, and **Azure Table Storage**.  
Admins can create, toggle, edit, and audit feature flags across `dev`, `stage`, and `prod` environments — without deploying code.

---

## Features

- **Feature flag CRUD** — create, view, edit, soft-delete flags grouped by capability
- **Live toggle** with confirmation — flip flags on/off with a popconfirm guard
- **Audit history** — every change is recorded (who, what, when) with a computed diff description
- **Flags history timeline** — per-flag or global changelog with search and pagination
- **Duplicate detection** — real-time check on creation (PK+RK composite uniqueness)
- **Auto-slug** — label → control name auto-fill, stops on manual edit
- **Environment sidebar links** — jump directly to sibling `dev / stage / prod` deployments
- **Environment badge** in the header — always shows which env you are on
- **Success toasts** on every mutation
- **Unsaved-changes guard** on the edit drawer

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, SSR) |
| UI | [Ant Design 6](https://ant.design) |
| Routing | [TanStack Router](https://tanstack.com/router) (file-based) |
| Data fetching | [TanStack Query](https://tanstack.com/query) |
| Tables | [TanStack Table](https://tanstack.com/table) |
| Storage | [Azure Table Storage](https://learn.microsoft.com/azure/storage/tables/) |
| Local storage emulator | [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite) |
| Build / bundler | Vite + Nitro |
| Package manager | pnpm |

---

## Prerequisites

- **Node.js** ≥ 22
- **pnpm** ≥ 9 — `npm install -g pnpm`
- **Azurite** (for local dev) — `npm install -g azurite`

---

## Getting Started (Local)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Use local Azurite emulator
AZURE_TABLES_ENV=local
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true

# Label and link sibling deployments (optional for local dev)
APP_ENV=dev
APP_DEV_URL=http://localhost:3000
APP_STAGE_URL=
APP_PROD_URL=
```

### 3. Start Azurite

In a separate terminal:

```bash
azurite --silent --location . --debug azurite.log
```

Or use the [VS Code Azurite extension](https://marketplace.visualstudio.com/items?itemName=Azurite.azurite) — click **Start Blob Service**, **Start Queue Service**, **Start Table Service** in the status bar.

### 4. Seed the database

Creates the Azure Tables and populates them with sample flags and history:

```bash
pnpm seed
```

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Server-side (runtime — never exposed to the browser)

| Variable | Required | Description |
|---|---|---|
| `AZURE_TABLES_ENV` | No (default: `local`) | `local` = Azurite, `azure` = real Azure Tables |
| `AZURE_STORAGE_CONNECTION_STRING` | When `local` | Azurite connection string |
| `AZURE_STORAGE_ACCOUNT_URL` | When `azure` | `https://<account>.table.core.windows.net` |
| `AZURE_TENANT_ID` | When `azure` | Service principal tenant ID |
| `AZURE_CLIENT_ID` | When `azure` | Service principal client ID |
| `AZURE_CLIENT_SECRET` | When `azure` | Service principal secret |

### Client-side (build-time — baked into the JS bundle, non-sensitive only)

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `dev` | Which environment this deployment is (`dev` \| `stage` \| `prod`) |
| `APP_DEV_URL` | `""` | Full URL of the dev deployment |
| `APP_STAGE_URL` | `""` | Full URL of the staging deployment |
| `APP_PROD_URL` | `""` | Full URL of the production deployment |

> **Note:** These variables are substituted by Vite at build time via the `APP_` prefix configured in `vite.config.ts`. They appear in the compiled JS bundle — never put secrets here.

---

## Multi-Environment Setup

Each environment is a **separate deployment** with its own Azure Storage account and tables. The sidebar shows links to sibling environments; the current environment is highlighted with a coloured badge in the header.

Set `VITE_APP_ENV`, `VITE_DEV_URL`, `VITE_STAGE_URL`, and `VITE_PROD_URL` in each deployment's CI/CD pipeline to wire up the cross-env navigation automatically.

---

## API Routes

### Internal (admin — write access)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/internal/flags` | List all flags |
| `POST` | `/api/internal/flags` | Create a flag |
| `GET` | `/api/internal/flags/:capability` | List flags by capability |
| `PATCH` | `/api/internal/flags/:capability/:control` | Update / toggle / delete a flag |
| `GET` | `/api/internal/flags/history` | Full audit history |
| `GET` | `/api/internal/flags/:capability/:control/history` | Per-flag audit history |

### Public (read-only — no auth required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/public/flags` | All active flags (minimal projection) |
| `GET` | `/api/public/flags/:capability` | Active flags for a capability |
| `GET` | `/api/public/flags/:capability/:control` | Single active flag state |

---

## Project Structure

```
src/
├── components/
│   ├── flags/           # Feature flag UI (dashboard, table, drawers)
│   ├── flags-history/   # History page (timeline, table, controls)
│   └── layout/          # AppHeader, AppSider, AppLayout, AppFooter
├── config/
│   └── env.ts           # Validated server + client env exports
├── hooks/
│   ├── useFlags.ts      # TanStack Query hooks for flag mutations
│   └── useHistory.ts    # TanStack Query hooks for history
├── lib/
│   ├── azure-tables.ts        # Azure Table Storage client factory
│   ├── flags-store.ts         # Flag CRUD operations
│   └── flags-history-store.ts # History read operations
├── middleware/
│   └── auth.ts          # isAdmin() — replace with real SSO check
├── routes/
│   ├── __root.tsx       # App shell (QueryClient, StyleProvider)
│   ├── index.tsx        # Feature Flags page
│   ├── history.tsx      # Flags History page
│   └── api/
│       ├── internal/    # Admin API routes (CRUD + history)
│       └── public/      # Public read-only API routes
├── scripts/
│   └── seed.ts          # Local dev database seeder
├── types/
│   └── flags.ts         # ControlFlag, ControlFlagHistory, PublicFlag types
└── utils/
    ├── api.ts           # apiFetch / apiPatch / apiPost helpers
    ├── date.ts          # Date formatting utilities
    └── historyUtils.tsx # Change description renderer
```

---

## Building for Production

```bash
pnpm build
```

Output is written to `.output/`. The server entry point is `.output/server/index.mjs`.

```bash
# Preview the production build locally
pnpm preview
```

---

## Docker

### Build

```bash
docker build \
  --build-arg APP_ENV=prod \
  --build-arg DEV_URL=https://dev.mission-control.example.com \
  --build-arg STAGE_URL=https://stage.mission-control.example.com \
  --build-arg PROD_URL=https://mission-control.example.com \
  -t mission-control:prod .
```

### Run

```bash
docker run -p 3000:3000 \
  -e AZURE_TABLES_ENV=azure \
  -e AZURE_STORAGE_ACCOUNT_URL=https://<account>.table.core.windows.net \
  -e AZURE_TENANT_ID=<tenant-id> \
  -e AZURE_CLIENT_ID=<client-id> \
  -e AZURE_CLIENT_SECRET=<secret> \
  mission-control:prod
```

> Runtime secrets are injected via environment variables — never baked into the image.

### Azure Container Apps (recommended)

1. Push the image to **Azure Container Registry**
2. Create a **Container App** pointing to the image
3. Set environment variables in the Container App's **Secrets** and **Environment variables** blade (or reference Key Vault secrets)
4. Set scale rules as needed — the app is stateless and scales to zero safely

---

## Azure Table Storage Schema

### `ControlFlagsTable`

| Field | Azure Key | Type | Description |
|---|---|---|---|
| `capabilityName` | PartitionKey | string | Groups related flags (e.g. `payments`) |
| `controlName` | RowKey | string | Unique within a capability (e.g. `enable-checkout-v2`) |
| `label` | — | string | Human-readable display name |
| `description` | — | string | What this flag controls |
| `state` | — | boolean | `true` = enabled |
| `status` | — | `active \| inactive \| deleted` | Lifecycle status |
| `updatedBy` | — | string | Identity that last changed this flag |
| `lastUpdatedAt` | — | ISO-8601 string | Timestamp of last change |
| `version` | — | number | Monotonically increasing for optimistic concurrency |

### `ControlFlagsHistoryTable`

| Field | Azure Key | Type | Description |
|---|---|---|---|
| `controlName` | PartitionKey | string | Groups history by flag |
| `version_timestamp` | RowKey | string | Ensures chronological order |
| `capabilityName` | — | string | Capability at time of change |
| `state` | — | boolean | State after change |
| `status` | — | string | Status after change |
| `updatedBy` | — | string | Who made the change |
| `updatedAt` | — | ISO-8601 string | When the change was made |
| `changeDescription` | — | string | Human-readable diff (e.g. `State: OFF → ON`) |

---

## Roadmap / Known TODOs

- [ ] Replace `isAdmin()` stub in `src/middleware/auth.ts` with real SSO (Azure AD / MSAL)
- [ ] Replace hardcoded `MOCK_USER` in `AppHeader` with authenticated identity
- [ ] Replace hardcoded `updatedBy: 'admin'` in hooks with real user UPN from auth
- [ ] Add role-based access control (admin vs read-only) enforced at the API layer
- [ ] Unit + integration tests for the flags store and API routes
