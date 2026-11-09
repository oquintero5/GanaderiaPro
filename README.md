# 🐄 AgroGanaderíaPro

**Full-stack farm management platform** for small and medium cattle farms in Colombia — livestock, health records, dairy production, supplies, workers and finances in one mobile-friendly web app.

🔗 **[Live app](https://agroganaderiapro.web.app/)** · Currently in **beta** with farms in Colombia.

> Born from a real problem: a family farm lost two years of records when a paper notebook got soaked in the rain.

---

## ✨ Features

| Module | What it does |
|--------|--------------|
| 🐄 **Ganado** | Animal registry (tag, breed, age, weight, sex, calves), per-animal health history (vaccines, vitamins, deworming, treatments) and QR card |
| 🥛 **Lechería** | Daily milk log. Milk price is set **once per fortnight** (1–15 / 16–end of month) and can be changed for the whole fortnight |
| 📦 **Insumos** | Supply inventory; each purchase is recorded as an expense in Finanzas |
| 👷 **Obreros** | Day-labor tracking; marking a worker as paid creates the expense in Finanzas |
| 💰 **Finanzas** | Income, expenses and balance. Milk income per fortnight and worker payments are **generated and kept in sync automatically** |
| 🔐 **Cuentas** | Sign up / login by email, JWT sessions that survive page reloads, password recovery by 6-digit email code |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy 2, Pydantic, psycopg 3 |
| Database | PostgreSQL on **Supabase** (São Paulo, via Session pooler) |
| Hosting | **Firebase Hosting** (frontend) + **Google Cloud Run** (backend, Docker) |
| CI/CD | GitHub Actions — deploy to Firebase on push to `main`, PR previews, keep-alive job |
| Email | SMTP (Gmail app password) for password-recovery codes |

## 🚀 Architecture

```
            ┌──────────────────────────┐
 Browser ──▶│ Firebase Hosting (React) │
            └────────────┬─────────────┘
                         │ HTTPS + JWT
            ┌────────────▼─────────────┐        ┌──────────────────────────┐
            │ Cloud Run (FastAPI, Docker)├──────▶│ Supabase PostgreSQL      │
            └────────────┬─────────────┘        └──────────────────────────┘
                         │ SMTP
                         ▼
                  Recovery emails

 GitHub Actions: build + deploy frontend on push to main · ping /health/db every 2 days
```

## 🔒 Security

- Passwords hashed with **bcrypt**; JWT signed with a secret from the environment (no secrets in the repo)
- Every record is checked against the farm in the token — a farm can never read or change another farm's data
- Input validation on every field, rate limiting on login/sign-up/recovery
- Recovery codes stored only as HMAC hashes, expire in 15 minutes, max 5 attempts
- CORS restricted to the app's domains in production; API docs disabled in production

---

## 📁 Project Structure

```
agroganaderiapro/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, health checks
│   │   ├── routes.py            # API endpoints
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── database.py          # DB engine (psycopg 3, pool_pre_ping)
│   │   ├── auth.py              # JWT
│   │   ├── config.py            # required env vars, allowed origins
│   │   ├── correo.py            # SMTP sender
│   │   └── admin_restablecer.py # admin: set a temporary password
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── pages/               # Login, Register, Recuperar, Dashboard, Lecheria, Insumos, Obreros, Finanzas
│       ├── api.js               # API client (errors, timeouts, session expiry)
│       └── App.jsx              # routing + persisted session
├── .github/workflows/           # Firebase deploy, PR preview, keep-alive
└── firebase.json
```

---

## ⚙️ Local Setup

**Backend** (`backend/.env`, see `.env.example`):
```
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
JWT_SECRET=<long random string>
ENV=development
```
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8001
```

**Frontend** (in local mode it talks to `http://<host>:8001` automatically):
```bash
cd frontend
npm install
npm run dev
```

To test on a phone on the same Wi-Fi: run the backend with `--host 0.0.0.0`, the frontend with `npm run dev -- --host`, and open `http://<PC-IP>:5173`.

## ☁️ Deployment

- **Frontend:** push to `main` → GitHub Actions builds and deploys to Firebase Hosting.
- **Backend:** from Cloud Shell, `gcloud run deploy ganaderiapro-backend --source backend --region us-central1`.
  Environment variables on Cloud Run: `DATABASE_URL`, `JWT_SECRET`, `ENV=production`, `ALLOWED_ORIGINS`, `SMTP_USER`, `SMTP_PASSWORD`.
- **Admin password reset:** `python -m app.admin_restablecer user@email.com` (from `backend/`, with `.env`).

## 🗺 Roadmap

- Offline mode (installable PWA, records saved on the phone and synced when signal returns)
- Android app on Google Play (Capacitor), then iOS
- Pasture rotation alerts (paddocks 1–7)
- AI assistant to answer questions about the farm's data

---

## 👤 Author

**Oscar Quintero** — CS Student @ Malcolm X College, Chicago
GitHub: [@oquintero5](https://github.com/oquintero5)

## 📄 License

MIT
