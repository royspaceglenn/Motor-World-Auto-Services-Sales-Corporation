<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Motor World Auto Services & Sales Corporation — app workspace

This repository contains the Motor World admin UI, Electron desktop shell, REST API (SQLite or Postgres), and Capacitor/Android viewer build targets.

## Deploy to Vercel (frontend + API on one domain)

The static UI and the `/api/**` Express routes are deployed together:

- **`api/index.mjs`** — serverless wrapper around `server/app.js`
- **`vercel.json`** — rewrites `/api/*` to that function; installs **root devDependencies** (Vite) and **`server/`** dependencies

In the Vercel project → **Settings → Environment Variables** (apply to *Production* and *Preview* as needed):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | **Yes** on Vercel | Postgres (e.g. Neon). Serverless cannot rely on bundled SQLite for real data. |
| `JWT_SECRET` | **Yes** if `NODE_ENV=production` | Random string **≥ 32 characters**. |
| `NODE_ENV` | Recommended | `production` for live sites. |
| `CORS_ORIGINS` | **Yes** if `NODE_ENV=production` | Exact origins, comma-separated, e.g. `https://your-app.vercel.app`. Add each **Preview** URL you use, or logins from preview deployments will fail CORS. |
| `TRUST_PROXY` | Recommended | `1` so rate limits see the real client IP behind Vercel. |

Leave **`VITE_API_BASE_URL` unset** (or empty) in Vercel so the browser calls **`/api/...` on the same hostname** (fixes “404 NOT_FOUND” on login).

Redeploy after changing env vars.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and adjust if needed (see `server/README.md` for API env vars).
3. Run API + Vite together: `npm run dev`  
   Or full desktop dev: `npm run setup` once, then `npm run desktop:start`.
