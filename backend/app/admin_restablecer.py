"""Respaldo para el administrador: pone una clave temporal a una finca.

Uso (desde la carpeta backend, con el .env que apunta a Supabase):
    python -m app.admin_restablecer correo@ejemplo.com

Muestra una clave temporal; dásela al usuario por WhatsApp y pídele que la cambie
con "¿Olvidaste tu clave?" o entrando con ella.
"""
import secrets
import string
import sys

from .database import SessionLocal
from . import models
from .routes import hash_clave, normalizar_correo

def main():
    if len(sys.argv) != 2:
        print("Uso: python -m app.admin_restablecer correo@ejemplo.com")
        sys.exit(1)
    correo = normalizar_correo(sys.argv[1])
    db = SessionLocal()
    try:
        finca = db.query(models.Finca).filter(models.Finca.correo == correo).first()
        if not finca:
            print(f"No hay ninguna finca registrada con el correo {correo}")
            sys.exit(1)
        alfabeto = string.ascii_letters + string.digits
        while True:
            temporal = "".join(secrets.choice(alfabeto) for _ in range(10))
            if any(c.isdigit() for c in temporal) and any(c.isalpha() for c in temporal):
                break
        finca.clave = hash_clave(temporal)
        db.commit()
        print(f"Finca: {finca.nombre} ({finca.propietario})")
        print(f"Clave temporal: {temporal}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
