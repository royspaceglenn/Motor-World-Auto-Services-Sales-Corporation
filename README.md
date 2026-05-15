# Motor World — operations app

Admin workspace for **Motor World Auto Services & Sales Corporation**: inventory, purchasing, POS, receivables, expenses, and related workflows. Same codebase can run **locally**, on **Vercel**, on **Render**, or packaged with **Electron**.

## Start here after a full reset

**[deploy/STEP_BY_STEP_WEB.md](deploy/STEP_BY_STEP_WEB.md)** — GitHub → Render (API) → Vercel (site) → your domain. You mainly set **`MOTOR_WORLD_APP_SECRET`**, **`MOTOR_WORLD_ORIGINS`**, and **`VITE_API_BASE_URL`**.

Shorter index: **[docs/SETUP_FROM_ZERO.md](docs/SETUP_FROM_ZERO.md)** (links to the deploy guide and the Vercel+Neon alternative).

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm install --prefix server
copy server\.env.example server\.env
npm run dev
```

API defaults to port **3001**; Vite UI uses the port in `package.json` / `.env` (often **5174**). Details: **[server/README.md](server/README.md)**.

## Repository layout (short)

| Path | Role |
|------|------|
| `components/`, `App.tsx`, `lib/` | React admin UI |
| `server/` | Express REST API (SQLite or Postgres) |
| `api/index.mjs` | Vercel serverless entry when API is deployed on Vercel |
| `vercel.json` | Default: Vite + serverless API on one host |
| `config/vercel.frontend-only.example.json` | Use when API lives only on Render (copy to `vercel.json`) |
| `render.yaml` | Optional Render blueprint for the API service |

## Desktop & viewer

- **Desktop:** `npm run desktop:start` (after `npm run setup` once).
- **Mobile viewer:** `viewer.html` build targets and Capacitor scripts are described in `package.json` scripts.

---

*For deployment details (secrets, origins, Neon, emergency bypass), see **server/README.md**.*
