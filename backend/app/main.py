from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import crear_tablas
from .routes import router

app = FastAPI(title="AgroGanaderíaPro API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://agroganaderiapro.web.app",
        "https://agroganaderiapro.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

crear_tablas()

app.include_router(router)

@app.get("/")
def root():
    return {"mensaje": "Bienvenido a AgroGanaderíaPro API"}

@app.get("/health")
def health():
    return {"status": "ok"}