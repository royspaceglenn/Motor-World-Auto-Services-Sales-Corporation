# EFCP Motor Parts and Trading — Backend

Express API for the **EFCP Motor Parts and Trading** admin desktop and browser app.

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

The SQLite database is created automatically at `server/data/efcp.sqlite` unless `SQLITE_DB_PATH` is set.

## PostgreSQL (Neon / cloud, optional)

Set `DATABASE_URL` in `.env` to a Postgres connection string (Neon, Supabase, Railway, etc.). On first start the server creates a `collections` table and stores the same JSON blobs as SQLite, so **no separate migration tool** is required for a new empty cloud database.

Unset `DATABASE_URL` to use local SQLite again. To **move an existing** `efcp.sqlite` shop into Postgres, export the `collections` rows (or re-seed) — ask if you need a one-off export script.

## Authentication (browser / network exposure)

By default the API **requires a JWT**: sign in through `POST /api/auth/login`, then send `Authorization: Bearer <token>` on requests. The web app stores the token and shows a **sign-in screen** until login succeeds.

For trusted **local-only** workflows (e.g. legacy desktop), you can opt back into anonymous access by setting in `server/.env`:

```env
ALLOW_UNAUTHENTICATED_API=true
```

Keep `JWT_SECRET` strong and unique in production; do **not** commit real secrets.

### Required when `NODE_ENV=production`

The server **refuses to start** unless:

1. **`JWT_SECRET`** is set to a random value **at least 32 characters** (not `dev-secret`, `change-me`, etc.).
2. **`CORS_ORIGINS`** lists every HTTPS origin that may call the API, comma-separated, e.g.  
   `CORS_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com`

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

- `%LOCALAPPDATA%/EFCP Motor Parts and Trading/sync-settings.json`

Use that file to enable Firebase mirror sync for the viewer. The desktop app keeps working offline; when the PC regains internet access, the background sync loop retries publishing viewer data to Firestore.
