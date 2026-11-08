from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from sqlalchemy import text
from slowapi.errors import RateLimitExceeded
from .config import ALLOWED_ORIGINS, MOSTRAR_DOCS
from .database import crear_tablas, engine
from .routes import router, limiter

app = FastAPI(
    title="AgroGanaderíaPro API",
    docs_url="/docs" if MOSTRAR_DOCS else None,
    redoc_url="/redoc" if MOSTRAR_DOCS else None,
    openapi_url="/openapi.json" if MOSTRAR_DOCS else None,
)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
def limite_excedido(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Demasiados intentos. Intenta de nuevo en un minuto."})

@app.exception_handler(RequestValidationError)
def datos_invalidos(request: Request, exc: RequestValidationError):
    # Sin "input": no se devuelve la clave ni valores que no se pueden serializar (NaN, texto mal formado)
    errores = [{"loc": e["loc"], "msg": e["msg"], "type": e["type"]} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errores})

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

log = logging.getLogger("agroganaderiapro")

@app.on_event("startup")
def startup():
    # Si la base no responde (p. ej. Supabase pausado) el servidor igual arranca
    # y /health/db muestra el problema, en vez de que Cloud Run devuelva 503.
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
    # Consulta real: sirve para monitoreo y para mantener Supabase activo
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "db": "ok"}
    except Exception as e:
        log.error("Fallo /health/db: %s", e)
        return JSONResponse(status_code=503, content={"status": "error", "db": "sin conexión"})
