# Motor World — setup from zero (after wiping GitHub, Neon, and Vercel)

This guide assumes you are **starting completely fresh**: new GitHub repo, no Neon project, no Vercel project.

There are **two** good ways to run the app. Pick **one**.

---

## Option A (recommended): **Vercel = website only** · **Render = API + SQLite**

**Why:** Your API always runs on a normal Node server with a **real disk**. No serverless cold starts, no Neon sleep, no 60–300 second login waits. This is the most predictable setup for a small team.

### 1) New GitHub repository

1. Create an **empty** repo on GitHub (no README if you will push existing code).
2. On your PC, in this project folder:

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USER/YOUR_NEW_REPO.git
git branch -M main
git push -u origin main
```

### 2) Render — API (Node + SQLite)

1. Sign in at [render.com](https://render.com).
2. **New → Blueprint** (or **Web Service** if you paste settings manually).
3. Connect the GitHub repo. Commit **`render.yaml`** from this repo, then create a Blueprint from the repo (Render reads `render.yaml`).
4. In the Render dashboard, open the web service → **Environment** and set **`JWT_SECRET`** (random, ≥32 characters) and **`CORS_ORIGINS`** (your future Vercel URL). The blueprint leaves these as *sync: false* so you must add them manually.

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Random string **≥ 32 characters** |
| `CORS_ORIGINS` | Your **Vercel** site URL(s), comma-separated, e.g. `https://your-app.vercel.app` |
| `TRUST_PROXY` | `1` |
| `PORT` | (Render sets this automatically — do not override unless you know why) |

5. **Disk (important for real data):** Add a **persistent disk** (paid feature on Render) mounted e.g. at `/data`, then set:

| Variable | Value |
|----------|--------|
| `SQLITE_DB_PATH` | `/data/motorworld.sqlite` |

Without a disk, SQLite still works for a **demo**, but data can be **lost** when the service restarts.

6. Deploy. Copy the public URL of the API, e.g. `https://motorworld-api-xxxx.onrender.com`.

### 3) Vercel — static frontend only

1. **New Project** → import the **same** GitHub repo.
2. **Framework:** Vite. Root directory: repository root (where `package.json` is).
3. **Replace** the default `vercel.json` with the contents of `config/vercel.frontend-only.example.json` in this repo (rename/copy so your project uses **no** serverless `/api` — everything goes to Render).

   Or manually: remove `api/` rewrites and `functions` from `vercel.json` so Vercel only serves the Vite `dist/` build.

4. **Environment variables (Production)** — must exist **before build** because Vite bakes them in:

| Variable | Value |
|----------|--------|
| `VITE_API_BASE_URL` | `https://YOUR-API.onrender.com` (no trailing slash) |

5. Deploy. Open your `.vercel.app` URL — login calls should go to Render, not to `/api` on Vercel.

### 4) First login (SQLite on Render)

Default REST admin (see `server/README.md`):

- **Email:** `admin@motorworldcorp.com`
- **Password:** `maoningpassword`

Then use **Change password** in the app.

---

## Option B: **Vercel = UI + serverless API** · **Neon = Postgres**

**Why:** One vendor, one domain, no separate API host. **Downside:** Neon + serverless can be slow or finicky on first request; you must use a **pooler** connection string and correct region.

1. **Neon:** New project → copy **pooled** connection string → `DATABASE_URL`.
2. **Vercel:** Import repo, keep the repo’s default `vercel.json` (with `api/index.mjs`).
3. **Vercel env:** `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `NODE_ENV=production`, `TRUST_PROXY=1`.  
   Do **not** set `VITE_API_BASE_URL` (leave empty so the browser uses same-origin `/api`).
4. Redeploy after every env change.

Details: `server/README.md` (section *Vercel + Neon from scratch*).

---

## Emergency mode (only if the database is completely broken)

If you **cannot** log in because Postgres never responds, read **`server/README.md` → *Emergency access***.

Turn it off as soon as the database works — it disables persistence.

---

## Quick checks

| Problem | What to verify |
|---------|------------------|
| Login CORS error | `CORS_ORIGINS` includes the **exact** browser origin (scheme + host, no wrong slash). |
| 404 on `/api` (Option A) | `vercel.json` must **not** rewrite `/api` to a missing function; UI must use `VITE_API_BASE_URL`. |
| Render sleep (free tier) | First request after idle can be slow; upgrade or use a keep-alive ping. |

---

## Local development (unchanged)

```bash
npm install
npm install --prefix server
copy server\.env.example server\.env
npm run dev
```

API: `http://localhost:3001` · UI: Vite port from `package.json` (often `5174`).
