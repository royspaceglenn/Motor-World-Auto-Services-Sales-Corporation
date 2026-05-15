# Motor World Auto Services & Sales Corporation — Backend

**New install or redeploy?** Start with **[deploy/STEP_BY_STEP_WEB.md](../deploy/STEP_BY_STEP_WEB.md)** (or the short pointer **[docs/SETUP_FROM_ZERO.md](../docs/SETUP_FROM_ZERO.md)**).

Express API for the **Motor World Auto Services & Sales Corporation** admin desktop and browser app.

The server is now the primary admin backend again:

- Express API for all admin and POS writes
- **SQLite** (default) or **PostgreSQL** when `DATABASE_URL` is set (e.g. [Neon](https://neon.tech) free tier)
- JWT-based admin authentication
- Firestore mirror publishing for the mobile viewer

## Start

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

The SQLite database is created automatically at `server/data/motorworld.sqlite` (new installs). If `server/data/efcp.sqlite` exists from an older build, that file is used until you migrate or set `SQLITE_DB_PATH`.

## PostgreSQL (Neon / cloud, optional)

Set `DATABASE_URL` in `.env` to a Postgres connection string (Neon, Supabase, Railway, etc.). On first start the server creates a `collections` table and stores the same JSON blobs as SQLite, so **no separate migration tool** is required for a new empty cloud database.

Unset `DATABASE_URL` to use local SQLite again. To **move an existing** SQLite shop into Postgres, export the `collections` rows (or re-seed) — ask if you need a one-off export script.

### Vercel + Neon from scratch (production browser app)

1. **Neon** — [console.neon.tech](https://console.neon.tech): create a project, pick a region **close to your Vercel region** (e.g. US East with `iad1`). Copy the **connection string** (include `?sslmode=require` if Neon shows it).
2. **Vercel** — Import the GitHub repo. Root directory = repo root (where `vercel.json` lives). Production branch = `main`.
3. **Vercel → Settings → Environment Variables** (Production):

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Full Neon Postgres URL |
   | `MOTOR_WORLD_APP_SECRET` | Random string **≥ 32 characters** (e.g. `openssl rand -hex 32`) — not `dev-secret` (alias: `JWT_SECRET`) |
   | `MOTOR_WORLD_ORIGINS` | Your site origin(s), comma-separated, e.g. `https://your-app.vercel.app` (alias: `CORS_ORIGINS`) |
   | `NODE_ENV` | `production` |

4. **Redeploy** after saving env vars. On Vercel the API uses **Neon’s serverless driver** (HTTP), not TCP `pg`, so login should respond without multi‑minute cold hangs.
5. **First login** (empty Neon DB): **Email** `admin@motorworldcorp.com`, **Password** `maoningpassword` — then use **Change password** in the app.
6. **Cron** (optional): `vercel.json` schedules `GET /api/system/warm` every 5 minutes to nudge Neon; path must be **`warm`** not `warn`.

### Emergency access when the database will not connect (Vercel)

Use **only** until Neon is fixed, then **delete these variables** and redeploy.

1. In Vercel → Environment Variables (Production), set:

   | Name | Value |
   |------|--------|
   | `EMERGENCY_BYPASS_DB` | `true` |
   | `EMERGENCY_STATIC_LOGIN` | `true` |
   | `EMERGENCY_LOGIN_EMAIL` | Same email you will type on the login screen (e.g. `admin@motorworldcorp.com`) |
   | `EMERGENCY_LOGIN_PASSWORD` | A **new long random password** you choose (stored in plain text in Vercel — HTTPS only; remove ASAP) |

2. Keep **`MOTOR_WORLD_APP_SECRET`** and **`MOTOR_WORLD_ORIGINS`** (or legacy **`JWT_SECRET`** / **`CORS_ORIGINS`**) as they already are.

3. You may **remove `DATABASE_URL`** temporarily while bypassing (the API will not contact Postgres). Restore it when Neon works.

4. Redeploy. Sign in with **`EMERGENCY_LOGIN_EMAIL`** + **`EMERGENCY_LOGIN_PASSWORD`**. The app opens with **empty lists**; **writes are ignored** until bypass is off.

5. **Turn off emergency mode** as soon as login works against the real DB: unset the four variables above, set `DATABASE_URL` again, redeploy.

## Authentication (browser / network exposure)

By default the API **requires a JWT**: sign in through `POST /api/auth/login`, then send `Authorization: Bearer <token>` on requests. The web app stores the token and shows a **sign-in screen** until login succeeds.

For trusted **local-only** workflows (e.g. legacy desktop), you can opt back into anonymous access by setting in `server/.env`:

```env
ALLOW_UNAUTHENTICATED_API=true
```

Keep **`MOTOR_WORLD_APP_SECRET`** strong and unique in production; do **not** commit real secrets.

### Required when `NODE_ENV=production`

The server **refuses to start** unless:

1. **`MOTOR_WORLD_APP_SECRET`** (or legacy `JWT_SECRET`) is a random value **at least 32 characters** (not `dev-secret`, `change-me`, etc.).
2. **`MOTOR_WORLD_ORIGINS`** (or legacy `CORS_ORIGINS`) lists every HTTPS origin that may call the API, comma-separated, e.g.  
   `MOTOR_WORLD_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com`

Optional:

- **`TRUST_PROXY=1`** when the app sits behind nginx, Cloudflare, Railway, etc., so login rate limits use the real client IP.
- **`LOGIN_RATE_LIMIT_MAX`** / **`LOGIN_RATE_LIMIT_WINDOW_MS`** to tune brute-force protection (defaults: 30 attempts per 15 minutes per IP).

### Response headers and login limits

- **[Helmet](https://helmetjs.github.io/)** sets standard security headers (CSP disabled for this JSON API).
- **`express-rate-limit`** applies to `POST /api/auth/login`.

## Default account (local SQLite / REST)

On first start the user list is normalized to a **single** administrator row used for JWT login:

- **Email:** `admin@motorworldcorp.com`
- **Password:** `maoningpassword`

Typing **`admin`** still signs you in (it maps to the email above). **Change this password before exposing the app to the internet** (use **Change password** in the app after first login). Production web builds do **not** show the password on the login screen.

## Desktop Sync Settings

When the Electron desktop app runs, it also creates a local sync settings file in the app data folder:

- `%LOCALAPPDATA%/Motor World Auto Services & Sales Corporation/sync-settings.json`

(If you never ran the rebranded desktop build, the same file may still be under `%LOCALAPPDATA%/EFCP Motor Parts and Trading/`.)

Use that file to enable Firebase mirror sync for the viewer. The desktop app keeps working offline; when the PC regains internet access, the background sync loop retries publishing viewer data to Firestore.
