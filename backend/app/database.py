from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import variable_requerida
from .models import Base

# La URL SIEMPRE viene de la variable de entorno DATABASE_URL (este repo es público).
# Para Supabase desde Cloud Run usar el "Session pooler" (IPv4):
#   postgresql://postgres.<ref>:<clave>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres
SQLALCHEMY_DATABASE_URL = variable_requerida("DATABASE_URL")

# El driver instalado es psycopg 3: SQLAlchemy lo necesita explícito en la URL
for prefijo in ("postgres://", "postgresql://"):
    if SQLALCHEMY_DATABASE_URL.startswith(prefijo):
        SQLALCHEMY_DATABASE_URL = "postgresql+psycopg://" + SQLALCHEMY_DATABASE_URL[len(prefijo):]
        break

es_postgres = SQLALCHEMY_DATABASE_URL.startswith("postgresql")
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,   # descarta conexiones muertas (p. ej. tras una pausa de Supabase)
    pool_recycle=300,
    connect_args={"connect_timeout": 10} if es_postgres else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def crear_tablas():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
