import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# La URL de la base de datos SIEMPRE viene de la variable de entorno DATABASE_URL.
# Nunca escribir contraseñas en el código: este repositorio es público.
# Para Supabase desde Cloud Run usar el "Session pooler" (IPv4), por ejemplo:
#   postgresql://postgres.<ref>:<clave>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    raise RuntimeError("Falta la variable de entorno DATABASE_URL")

# Algunos proveedores usan "postgres://" pero SQLAlchemy necesita "postgresql://"
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,   # descarta conexiones muertas (p. ej. tras una pausa de Supabase)
    pool_recycle=300,
    connect_args={"connect_timeout": 10} if SQLALCHEMY_DATABASE_URL.startswith("postgresql") else {},
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
