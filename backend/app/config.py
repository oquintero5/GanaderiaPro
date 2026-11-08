import os
from pathlib import Path
from dotenv import load_dotenv

# Carga backend/.env. No pisa variables ya definidas en el entorno (p. ej. en Railway)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

def variable_requerida(nombre: str) -> str:
    valor = os.environ.get(nombre, "").strip()
    if not valor:
        raise RuntimeError(
            f"Falta la variable de entorno obligatoria {nombre}. "
            "Defínela en backend/.env (ver backend/.env.example) o en el entorno del servidor."
        )
    return valor

# ENV: "production"/"prod" o "development"/"dev". Sin definir se trata como entorno no confiable:
# la documentación de la API solo se publica en desarrollo
_entorno = os.environ.get("ENV", "").strip().lower()
EN_PRODUCCION = _entorno in ("production", "prod")
MOSTRAR_DOCS = _entorno in ("development", "dev")

def _origenes_permitidos() -> list[str]:
    # Orígenes separados por comas, p. ej. ALLOWED_ORIGINS=https://a.com,https://b.com
    origenes = [o.strip().rstrip("/") for o in os.environ.get("ALLOWED_ORIGINS", "").split(",")]
    origenes = [o for o in origenes if o]
    if "*" in origenes:
        raise RuntimeError('ALLOWED_ORIGINS no puede ser "*". Indica los orígenes exactos del frontend.')
    if not origenes:
        if EN_PRODUCCION:
            raise RuntimeError(
                "Falta la variable de entorno ALLOWED_ORIGINS, obligatoria en producción. "
                "Defínela con los orígenes del frontend separados por comas."
            )
        return ["http://localhost:5173"]
    return origenes

ALLOWED_ORIGINS = _origenes_permitidos()
