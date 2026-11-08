import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from .database import crear_tablas, engine
from .routes import router

log = logging.getLogger("agroganaderiapro")

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

@app.on_event("startup")
def startup():
    # Si la base de datos no responde (p. ej. Supabase pausado), el servidor
    # igual arranca y /health/db muestra el problema, en vez de que el
    # contenedor se caiga y Cloud Run devuelva 503 sin explicación.
    try:
        crear_tablas()
    except Exception as e:
        log.error("No se pudo conectar a la base de datos al arrancar: %s", e)

app.include_router(router)

@app.get("/")
def root():
    return {"mensaje": "Bienvenido a AgroGanaderíaPro API"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/health/db")
def health_db():
    # Hace una consulta real: sirve para el monitoreo y para mantener Supabase activo.
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception as e:
        log.error("Fallo /health/db: %s", e)
        return JSONResponse(status_code=503, content={"status": "error", "db": "sin conexión"})
