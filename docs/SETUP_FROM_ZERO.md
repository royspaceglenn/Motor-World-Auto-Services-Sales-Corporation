# Setup from zero (short)

The **single** walkthrough for the web + your domain (GitHub → Render API → Vercel site → DNS) is:

**[deploy/STEP_BY_STEP_WEB.md](../deploy/STEP_BY_STEP_WEB.md)**

Environment names there are **`MOTOR_WORLD_APP_SECRET`** (long random string for login tokens) and **`MOTOR_WORLD_ORIGINS`** (comma-separated site URLs). Older names **`JWT_SECRET`** and **`CORS_ORIGINS`** still work as aliases.

---

## Alternative: everything on Vercel + Neon

One host, serverless API + Postgres. Slower cold starts possible; see **[server/README.md](../server/README.md)** → *Vercel + Neon from scratch*. Use the same secret/origin variables (`MOTOR_WORLD_APP_SECRET` / `MOTOR_WORLD_ORIGINS` or the legacy names).

---

## Local development

```bash
npm install
npm install --prefix server
copy server\.env.example server\.env
npm run dev
```

API: `http://localhost:3001` · UI: Vite port from `package.json` (often `5174`).
