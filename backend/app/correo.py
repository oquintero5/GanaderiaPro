"""Envío de correos por SMTP (por defecto Gmail con una 'contraseña de aplicación').

Variables de entorno:
  SMTP_USER       correo que envía, p. ej. agroganaderiapro@gmail.com
  SMTP_PASSWORD   contraseña de aplicación de Gmail (16 letras), NO la clave normal
  SMTP_HOST       opcional, por defecto smtp.gmail.com
  SMTP_PORT       opcional, por defecto 587
"""
import os
import smtplib
from email.message import EmailMessage

def correo_configurado() -> bool:
    return bool(os.environ.get("SMTP_USER", "").strip() and os.environ.get("SMTP_PASSWORD", "").strip())

def enviar_correo(destino: str, asunto: str, texto: str) -> None:
    usuario = os.environ["SMTP_USER"].strip()
    clave = os.environ["SMTP_PASSWORD"].replace(" ", "").strip()
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
    puerto = int(os.environ.get("SMTP_PORT", "587"))
    msg = EmailMessage()
    msg["From"] = f"AgroGanaderíaPro <{usuario}>"
    msg["To"] = destino
    msg["Subject"] = asunto
    msg.set_content(texto)
    with smtplib.SMTP(host, puerto, timeout=15) as smtp:
        smtp.starttls()
        smtp.login(usuario, clave)
        smtp.send_message(msg)
