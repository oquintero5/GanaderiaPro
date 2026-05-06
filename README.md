# 🐄 AgroGanaderiaPro

**Full-stack farm management platform** for livestock operations — covering cattle tracking, dairy production, worker management, finances, and supply inventory. Built for Spanish-speaking cattle farmers in Colombia.

> ✅ Deployed to production on Google Cloud Run + Firebase Hosting with automated CI/CD via GitHub Actions.

🔗 **[View Live App](https://agroganaderiapro.web.app/)**

---

## 📋 Modules

| Module | Description |
|--------|-------------|
| 🐄 **Dashboard** | Central overview of farm operations and key metrics |
| 💰 **Finanzas** | Financial tracking — income, expenses, and farm profitability |
| 🥛 **Lechería** | Dairy production logging — milk output per animal per day |
| 👷 **Obreros** | Worker management — staff records, assignments, and payroll tracking |
| 📦 **Insumos** | Supply & inventory management — feed, medicine, and farm materials |
| 🔐 **Login / Register** | User authentication with secure access control |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (JSX), Vite, CSS |
| Backend | Python (FastAPI), SQLite |
| Containerization | Docker |
| Hosting | Firebase Hosting (frontend) + Google Cloud Run (backend) |
| CI/CD | GitHub Actions — automated deploy on push to `main` |

---

## 🚀 Architecture

```
GitHub Push
    │
    ├── GitHub Actions CI/CD
    │       │
    │       ├──▶ Firebase Hosting  →  React Frontend (agroganaderiapro.web.app)
    │       │
    │       └──▶ Google Cloud Run  →  Python/FastAPI Backend (Dockerized)
    │                                       │
    │                                  SQLite Database
    │
    └── Pull Request Preview (firebase-hosting-pull-request.yml)
```

- **10+ production deployments** with zero-downtime releases
- Separate preview deploys on every pull request
- Environment variables managed via GitHub Secrets

---

## 📁 Project Structure

```
agroganaderiapro/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app entry point
│       ├── routes.py        # API route definitions
│       ├── models.py        # Data models
│       └── database.py      # SQLite connection & queries
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Finanzas.jsx
│       │   ├── Lecheria.jsx
│       │   ├── Obreros.jsx
│       │   ├── Insumos.jsx
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       ├── api.js           # Backend API calls
│       └── App.jsx
│   ├── index.html
│   └── vite.config.js
│
├── .github/
│   └── workflows/
│       ├── firebase-hosting-merge.yml
│       └── firebase-hosting-pull-request.yml
│
├── .firebaserc
└── firebase.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.x
- Node.js + npm
- Docker (optional)
- Firebase CLI: `npm install -g firebase-tools`

### Run Backend Locally
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app/main.py
```

### Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
```

### Run Backend with Docker
```bash
cd backend
docker build -t agroganaderiapro-backend .
docker run -p 8000:8000 agroganaderiapro-backend
```

---

## 👤 Author

**Oscar Quintero** — CS Student @ Malcolm X College, Chicago  
GitHub: [@oquintero5](https://github.com/oquintero5)  
Email: oskar.ily19@gmail.com

---

## 📄 License

MIT
