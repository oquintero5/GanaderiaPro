import hashlib
import hmac
import logging
import secrets
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import bcrypt
from slowapi import Limiter
from slowapi.util import get_remote_address
from . import models
from .database import get_db
from .auth import crear_token, get_finca_id, SECRET_KEY
from .correo import correo_configurado, enviar_correo
from pydantic import AfterValidator, BaseModel, EmailStr, Field, field_validator
from typing import Annotated, Literal, Optional

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

def hash_clave(clave: str) -> str:
    try:
        return bcrypt.hashpw(clave.encode(), bcrypt.gensalt()).decode()
    except ValueError:
        raise HTTPException(status_code=400, detail="Clave inválida")

def verificar_clave(clave: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(clave.encode(), hashed.encode())
    except ValueError:
        return False

def normalizar_correo(correo: str) -> str:
    return correo.strip().lower()

def verificar_finca(finca_id_recurso: int, finca_id_token: int):
    if finca_id_recurso != finca_id_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

# ── Schemas ──────────────────────────────────────────────────────────────────

def texto_valido(texto: str) -> str:
    # PostgreSQL no admite NUL ni texto que no se pueda codificar en UTF-8
    try:
        texto.encode()
    except UnicodeEncodeError:
        raise ValueError("Texto inválido")
    if "\x00" in texto:
        raise ValueError("Texto inválido")
    return texto

TextoCorto = Annotated[str, Field(max_length=100), AfterValidator(texto_valido)]
TextoLargo = Annotated[str, Field(max_length=500), AfterValidator(texto_valido)]
def fecha_valida(fecha: str) -> str:
    try:
        date.fromisoformat(fecha)
    except ValueError:
        raise ValueError("La fecha debe tener el formato AAAA-MM-DD")
    return fecha

Fecha = Annotated[str, Field(pattern=r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"), AfterValidator(fecha_valida)]

# Los ids son columnas Integer de 32 bits
ID_MAXIMO = 2147483647
Id = Annotated[int, Field(ge=1, le=ID_MAXIMO)]
IdRuta = Annotated[int, Path(ge=1, le=ID_MAXIMO)]
Numero = Annotated[float, Field(ge=0, le=1e12, allow_inf_nan=False)]

class FincaCreate(BaseModel):
    nombre: TextoCorto
    propietario: TextoCorto
    correo: EmailStr = Field(max_length=254)
    celular: TextoCorto
    pais: TextoCorto
    departamento: TextoCorto
    municipio: TextoCorto
    vereda: TextoCorto
    clave: str

    @field_validator("clave")
    @classmethod
    def clave_entre_8_y_72_bytes(cls, clave: str) -> str:
        # bcrypt solo admite hasta 72 bytes; se cuentan bytes, no caracteres
        if not 8 <= len(clave.encode()) <= 72:
            raise ValueError("La clave debe tener entre 8 y 72 bytes")
        return clave

class PedirCodigo(BaseModel):
    correo: Annotated[str, Field(max_length=254), AfterValidator(texto_valido)]

class Restablecer(BaseModel):
    correo: Annotated[str, Field(max_length=254), AfterValidator(texto_valido)]
    codigo: Annotated[str, Field(pattern=r"^[0-9]{6}$")]
    clave_nueva: str

    @field_validator("clave_nueva")
    @classmethod
    def clave_entre_8_y_72_bytes(cls, clave: str) -> str:
        if not 8 <= len(clave.encode()) <= 72:
            raise ValueError("La clave debe tener entre 8 y 72 bytes")
        return clave

class FincaLogin(BaseModel):
    correo: Annotated[str, Field(max_length=254), AfterValidator(texto_valido)]
    clave: str

class AnimalCreate(BaseModel):
    finca_id: Id
    nombre: TextoCorto
    chapeta: TextoCorto
    edad: Numero
    peso: Numero
    sexo: Literal["Macho", "Hembra"]
    raza: TextoCorto
    crias: Optional[int] = Field(0, ge=0, le=1000)

class HistorialSaludCreate(BaseModel):
    animal_id: Id
    fecha: Fecha
    tipo: Literal["Vacuna", "Vitamina", "Purga", "Medicamento", "Otro"]
    producto: TextoCorto
    dosis: Optional[TextoCorto] = ""
    observaciones: Optional[TextoLargo] = ""

class InsumoCreate(BaseModel):
    finca_id: Id
    nombre: TextoCorto
    categoria: TextoCorto
    cantidad: Numero
    unidad: TextoCorto
    precio: Numero
    proveedor: Optional[TextoCorto] = ""

class FinanzaCreate(BaseModel):
    finca_id: Id
    tipo: Literal["Ingreso", "Gasto"]
    categoria: TextoCorto
    descripcion: Optional[TextoLargo] = ""
    monto: Numero
    fecha: Fecha

class RegistroLecheCreate(BaseModel):
    finca_id: Id
    fecha: Fecha
    litros: Numero
    # Opcional: si no se envía, se usa el precio ya registrado en esa quincena
    precio_litro: Optional[Numero] = None
    frecuencia_pago: Optional[TextoCorto] = "Quincenal"

class PrecioQuincena(BaseModel):
    finca_id: Id
    fecha: Fecha          # cualquier día de la quincena
    precio_litro: Numero

class ObreroCreate(BaseModel):
    finca_id: Id
    nombre: TextoCorto
    dias_trabajados: Numero
    precio_jornal: Numero
    fecha: Fecha
    comentario: Optional[TextoLargo] = ""
    pagado: bool = False

# ── Fincas (rutas públicas) ───────────────────────────────────────────────────

@router.post("/fincas/registro")
@limiter.limit("3/minute")
def registrar_finca(request: Request, finca: FincaCreate, db: Session = Depends(get_db)):
    correo = normalizar_correo(finca.correo)
    existe = db.query(models.Finca).filter(models.Finca.correo == correo).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe una finca con ese correo")
    datos = finca.dict()
    datos["correo"] = correo
    datos["clave"] = hash_clave(datos["clave"])
    nueva_finca = models.Finca(**datos)
    db.add(nueva_finca)
    db.commit()
    db.refresh(nueva_finca)
    token = crear_token(nueva_finca.id)
    return {"mensaje": "Finca registrada exitosamente", "finca_id": nueva_finca.id, "token": token}

@router.post("/fincas/login")
@limiter.limit("5/minute")
def login_finca(request: Request, datos: FincaLogin, db: Session = Depends(get_db)):
    finca = db.query(models.Finca).filter(models.Finca.correo == normalizar_correo(datos.correo)).first()
    if not finca or not verificar_clave(datos.clave, finca.clave):
        raise HTTPException(status_code=401, detail="Correo o clave incorrectos")

    token = crear_token(finca.id)
    return {"mensaje": "Login exitoso", "finca_id": finca.id, "nombre": finca.nombre, "token": token}

# ── Recuperar contraseña ─────────────────────────────────────────────────────
# 1) /fincas/recuperar envía un código de 6 dígitos al correo (vence en 15 min).
# 2) /fincas/restablecer valida el código (máx. 5 intentos) y guarda la clave nueva.
# La respuesta de (1) es la misma exista o no el correo, para no revelar quién está registrado.

log = logging.getLogger("agroganaderiapro")
MINUTOS_CODIGO = 15
INTENTOS_CODIGO = 5

def _hash_codigo(codigo: str) -> str:
    return hmac.new(SECRET_KEY.encode(), codigo.encode(), hashlib.sha256).hexdigest()

@router.post("/fincas/recuperar")
@limiter.limit("3/minute")
def pedir_codigo(request: Request, datos: PedirCodigo, db: Session = Depends(get_db)):
    if not correo_configurado():
        raise HTTPException(status_code=503, detail="La recuperación por correo no está disponible. Escríbele al administrador para restablecer tu clave.")
    respuesta = {"mensaje": "Si el correo está registrado, te llegará un código en unos minutos. Revisa también la carpeta de spam."}
    finca = db.query(models.Finca).filter(models.Finca.correo == normalizar_correo(datos.correo)).first()
    if not finca:
        return respuesta
    db.query(models.CodigoRecuperacion).filter(
        models.CodigoRecuperacion.finca_id == finca.id, models.CodigoRecuperacion.usado == False  # noqa: E712
    ).update({"usado": True})
    codigo = f"{secrets.randbelow(1_000_000):06d}"
    db.add(models.CodigoRecuperacion(
        finca_id=finca.id, codigo_hash=_hash_codigo(codigo),
        expira=datetime.utcnow() + timedelta(minutes=MINUTOS_CODIGO),
    ))
    db.commit()
    try:
        enviar_correo(
            finca.correo,
            f"Tu código de AgroGanaderíaPro: {codigo}",
            f"Hola {finca.propietario},\n\n"
            f"Tu código para restablecer la clave de la finca {finca.nombre} es: {codigo}\n\n"
            f"Vence en {MINUTOS_CODIGO} minutos. Si no pediste este código, ignora este correo.\n\n"
            "AgroGanaderíaPro",
        )
    except Exception as e:
        log.error("No se pudo enviar el correo de recuperación: %s", e)
        raise HTTPException(status_code=502, detail="No se pudo enviar el correo. Intenta más tarde o escríbele al administrador.")
    return respuesta

@router.post("/fincas/restablecer")
@limiter.limit("5/minute")
def restablecer_clave(request: Request, datos: Restablecer, db: Session = Depends(get_db)):
    invalido = HTTPException(status_code=400, detail="Código inválido o vencido. Pide uno nuevo.")
    finca = db.query(models.Finca).filter(models.Finca.correo == normalizar_correo(datos.correo)).first()
    if not finca:
        raise invalido
    registro = db.query(models.CodigoRecuperacion).filter(
        models.CodigoRecuperacion.finca_id == finca.id, models.CodigoRecuperacion.usado == False  # noqa: E712
    ).order_by(models.CodigoRecuperacion.id.desc()).first()
    if not registro or registro.expira < datetime.utcnow() or registro.intentos >= INTENTOS_CODIGO:
        raise invalido
    if not hmac.compare_digest(registro.codigo_hash, _hash_codigo(datos.codigo)):
        registro.intentos += 1
        db.commit()
        raise invalido
    registro.usado = True
    finca.clave = hash_clave(datos.clave_nueva)
    db.commit()
    return {"mensaje": "Clave actualizada", "finca_id": finca.id, "nombre": finca.nombre, "token": crear_token(finca.id)}

# ── Animales ─────────────────────────────────────────────────────────────────

@router.get("/animales/{finca_id}")
def listar_animales(finca_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(finca_id, token_finca_id)
    return db.query(models.Animal).filter(models.Animal.finca_id == finca_id).all()

@router.post("/animales")
def crear_animal(animal: AnimalCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(animal.finca_id, token_finca_id)
    nuevo = models.Animal(**animal.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Animal registrado exitosamente", "animal_id": nuevo.id}

@router.put("/animales/{animal_id}")
def actualizar_animal(animal_id: IdRuta, datos: AnimalCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    verificar_finca(animal.finca_id, token_finca_id)
    for key, value in datos.dict(exclude={"finca_id"}).items():
        setattr(animal, key, value)
    db.commit()
    db.refresh(animal)
    return {"mensaje": "Animal actualizado exitosamente"}

@router.delete("/animales/{animal_id}")
def eliminar_animal(animal_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    verificar_finca(animal.finca_id, token_finca_id)
    # El historial de salud del animal se borra con él
    try:
        db.query(models.HistorialSalud).filter(models.HistorialSalud.animal_id == animal_id).delete()
        db.delete(animal)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="No se puede eliminar el animal porque tiene registros asociados")
    return {"mensaje": "Animal eliminado exitosamente"}

# ── Historial Salud ──────────────────────────────────────────────────────────

@router.get("/historial/{animal_id}")
def listar_historial(animal_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    verificar_finca(animal.finca_id, token_finca_id)
    return db.query(models.HistorialSalud).filter(models.HistorialSalud.animal_id == animal_id).all()

@router.post("/historial")
def agregar_historial(registro: HistorialSaludCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    animal = db.query(models.Animal).filter(models.Animal.id == registro.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    verificar_finca(animal.finca_id, token_finca_id)
    nuevo = models.HistorialSalud(**registro.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Registro de salud agregado exitosamente", "id": nuevo.id}

@router.put("/historial/{registro_id}")
def actualizar_historial(registro_id: IdRuta, datos: HistorialSaludCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    registro = db.query(models.HistorialSalud).filter(models.HistorialSalud.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    animal = db.query(models.Animal).filter(models.Animal.id == registro.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    verificar_finca(animal.finca_id, token_finca_id)
    if datos.animal_id != registro.animal_id:
        nuevo_animal = db.query(models.Animal).filter(models.Animal.id == datos.animal_id).first()
        if not nuevo_animal:
            raise HTTPException(status_code=404, detail="Animal no encontrado")
        verificar_finca(nuevo_animal.finca_id, token_finca_id)
    for key, value in datos.dict().items():
        setattr(registro, key, value)
    db.commit()
    db.refresh(registro)
    return {"mensaje": "Registro actualizado exitosamente"}

# ── Insumos ──────────────────────────────────────────────────────────────────

@router.get("/insumos/{finca_id}")
def listar_insumos(finca_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(finca_id, token_finca_id)
    return db.query(models.Insumo).filter(models.Insumo.finca_id == finca_id).all()

@router.post("/insumos")
def crear_insumo(insumo: InsumoCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(insumo.finca_id, token_finca_id)
    nuevo = models.Insumo(**insumo.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Insumo agregado exitosamente", "insumo_id": nuevo.id}

@router.put("/insumos/{insumo_id}")
def actualizar_insumo(insumo_id: IdRuta, datos: InsumoCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    insumo = db.query(models.Insumo).filter(models.Insumo.id == insumo_id).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    verificar_finca(insumo.finca_id, token_finca_id)
    for key, value in datos.dict(exclude={"finca_id"}).items():
        setattr(insumo, key, value)
    db.commit()
    db.refresh(insumo)
    return {"mensaje": "Insumo actualizado exitosamente"}

# ── Finanzas ─────────────────────────────────────────────────────────────────

@router.get("/finanzas/{finca_id}")
def listar_finanzas(finca_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(finca_id, token_finca_id)
    # Recalcula los ingresos de leche de todas las quincenas (incluye registros anteriores a esta función)
    sincronizar_toda_la_leche(db, finca_id)
    db.commit()
    return db.query(models.Finanza).filter(models.Finanza.finca_id == finca_id).all()

@router.post("/finanzas")
def crear_finanza(finanza: FinanzaCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(finanza.finca_id, token_finca_id)
    nueva = models.Finanza(**finanza.dict())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"mensaje": "Registro financiero agregado exitosamente", "id": nueva.id}

@router.put("/finanzas/{finanza_id}")
def actualizar_finanza(finanza_id: IdRuta, datos: FinanzaCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    finanza = db.query(models.Finanza).filter(models.Finanza.id == finanza_id).first()
    if not finanza:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    verificar_finca(finanza.finca_id, token_finca_id)
    for key, value in datos.dict(exclude={"finca_id"}).items():
        setattr(finanza, key, value)
    db.commit()
    db.refresh(finanza)
    return {"mensaje": "Registro financiero actualizado exitosamente"}

# ── Lechería ─────────────────────────────────────────────────────────────────
# La leche se paga por quincena (1-15 y 16-fin de mes): el precio del litro es el
# mismo para toda la quincena, y cada quincena genera UN ingreso en Finanzas que
# se recalcula solo cada vez que se agrega, edita o borra un registro de leche.

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

def quincena_de(fecha: str):
    d = date.fromisoformat(fecha)
    if d.day <= 15:
        inicio, fin, nombre = d.replace(day=1), d.replace(day=15), "1.ª quincena"
    else:
        siguiente = (d.replace(day=28) + timedelta(days=4)).replace(day=1)
        inicio, fin, nombre = d.replace(day=16), siguiente - timedelta(days=1), "2.ª quincena"
    return inicio, fin, f"{nombre} de {MESES[d.month - 1]} {d.year}"

def registros_quincena(db: Session, finca_id: int, fecha: str):
    inicio, fin, _ = quincena_de(fecha)
    return db.query(models.RegistroLeche).filter(
        models.RegistroLeche.finca_id == finca_id,
        models.RegistroLeche.fecha >= inicio.isoformat(),
        models.RegistroLeche.fecha <= fin.isoformat(),
    )

def precio_de_quincena(db: Session, finca_id: int, fecha: str):
    ultimo = registros_quincena(db, finca_id, fecha).order_by(models.RegistroLeche.id.desc()).first()
    return ultimo.precio_litro if ultimo else None

def marca_leche(fecha: str) -> str:
    # No hay columna que enlace el ingreso con la quincena: se reconoce por esta marca
    return f"(leche {quincena_de(fecha)[0].isoformat()})"

def sincronizar_ingreso_leche(db: Session, finca_id: int, fecha: str):
    db.flush()
    _, fin, etiqueta = quincena_de(fecha)
    regs = registros_quincena(db, finca_id, fecha).all()
    litros = sum(r.litros or 0 for r in regs)
    total = sum((r.litros or 0) * (r.precio_litro or 0) for r in regs)
    marca = marca_leche(fecha)
    ingreso = db.query(models.Finanza).filter(
        models.Finanza.finca_id == finca_id,
        models.Finanza.tipo == "Ingreso",
        models.Finanza.categoria == "Venta de Leche",
        models.Finanza.descripcion.endswith(marca, autoescape=True),
    ).order_by(models.Finanza.id).first()
    if not regs:
        if ingreso:
            db.delete(ingreso)
        return
    if not ingreso:
        ingreso = models.Finanza(finca_id=finca_id, tipo="Ingreso", categoria="Venta de Leche")
        db.add(ingreso)
    ingreso.descripcion = f"Leche {etiqueta}: {litros:g} L (automático) {marca}"
    ingreso.monto = total
    ingreso.fecha = fin.isoformat()

def sincronizar_toda_la_leche(db: Session, finca_id: int):
    fechas = [f for (f,) in db.query(models.RegistroLeche.fecha).filter(models.RegistroLeche.finca_id == finca_id).all()]
    inicios = {quincena_de(f)[0].isoformat(): f for f in fechas if f}
    for fecha in inicios.values():
        sincronizar_ingreso_leche(db, finca_id, fecha)
    # Ingresos automáticos de quincenas que ya no tienen leche
    for ingreso in db.query(models.Finanza).filter(
        models.Finanza.finca_id == finca_id,
        models.Finanza.categoria == "Venta de Leche",
        models.Finanza.descripcion.like("%(leche %)"),
    ).all():
        inicio = ingreso.descripcion.rsplit("(leche ", 1)[-1].rstrip(")")
        if inicio not in inicios:
            db.delete(ingreso)

@router.get("/leche/{finca_id}")
def listar_leche(finca_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(finca_id, token_finca_id)
    return db.query(models.RegistroLeche).filter(models.RegistroLeche.finca_id == finca_id).all()

@router.post("/leche")
def crear_registro_leche(registro: RegistroLecheCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(registro.finca_id, token_finca_id)
    datos = registro.dict()
    if datos["precio_litro"] is None:
        datos["precio_litro"] = precio_de_quincena(db, registro.finca_id, registro.fecha)
        if datos["precio_litro"] is None:
            raise HTTPException(status_code=400, detail="Es el primer registro de esta quincena: ingresa el precio del litro")
    nuevo = models.RegistroLeche(**datos)
    db.add(nuevo)
    sincronizar_ingreso_leche(db, registro.finca_id, registro.fecha)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Registro de leche agregado exitosamente", "id": nuevo.id, "precio_litro": nuevo.precio_litro}

@router.put("/leche/precio-quincena")
def cambiar_precio_quincena(datos: PrecioQuincena, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(datos.finca_id, token_finca_id)
    regs = registros_quincena(db, datos.finca_id, datos.fecha).all()
    if not regs:
        raise HTTPException(status_code=404, detail="No hay registros de leche en esa quincena")
    for r in regs:
        r.precio_litro = datos.precio_litro
    sincronizar_ingreso_leche(db, datos.finca_id, datos.fecha)
    db.commit()
    return {"mensaje": f"Precio actualizado en {len(regs)} registros de la quincena"}

@router.put("/leche/{registro_id}")
def actualizar_leche(registro_id: IdRuta, datos: RegistroLecheCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    registro = db.query(models.RegistroLeche).filter(models.RegistroLeche.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    verificar_finca(registro.finca_id, token_finca_id)
    fecha_anterior = registro.fecha
    cambios = datos.dict(exclude={"finca_id"})
    if cambios["precio_litro"] is None:
        cambios.pop("precio_litro")
        # Si el registro pasa a otra quincena, toma el precio de esa quincena
        if quincena_de(fecha_anterior)[0] != quincena_de(datos.fecha)[0]:
            precio_destino = precio_de_quincena(db, registro.finca_id, datos.fecha)
            if precio_destino is not None:
                cambios["precio_litro"] = precio_destino
    for key, value in cambios.items():
        setattr(registro, key, value)
    sincronizar_ingreso_leche(db, registro.finca_id, registro.fecha)
    if quincena_de(fecha_anterior)[0] != quincena_de(registro.fecha)[0]:
        sincronizar_ingreso_leche(db, registro.finca_id, fecha_anterior)
    db.commit()
    db.refresh(registro)
    return {"mensaje": "Registro de leche actualizado exitosamente"}

# ── Obreros ──────────────────────────────────────────────────────────────────

@router.get("/obreros/{finca_id}")
def listar_obreros(finca_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(finca_id, token_finca_id)
    return db.query(models.Obrero).filter(models.Obrero.finca_id == finca_id).all()

def marca_pago(obrero: models.Obrero) -> str:
    # No hay columna que enlace el gasto con el obrero: se reconoce por esta marca al final de la descripción
    return f"(obrero #{obrero.id})"

def buscar_gasto_pago(db: Session, obrero: models.Obrero):
    return db.query(models.Finanza).filter(
        models.Finanza.finca_id == obrero.finca_id,
        models.Finanza.tipo == "Gasto",
        models.Finanza.categoria == "Mano de Obra",
        models.Finanza.descripcion.endswith(marca_pago(obrero), autoescape=True),
    ).order_by(models.Finanza.id).first()

def registrar_gasto_pago(db: Session, obrero: models.Obrero):
    # Si el gasto de este obrero ya existe se actualiza, para no duplicarlo
    marca = marca_pago(obrero)
    gasto = buscar_gasto_pago(db, obrero)
    if not gasto:
        gasto = models.Finanza(finca_id=obrero.finca_id, tipo="Gasto", categoria="Mano de Obra")
        db.add(gasto)
    gasto.descripcion = f"Pago a {obrero.nombre} - jornal del {obrero.fecha} {marca}"
    gasto.monto = obrero.total_pagar
    gasto.fecha = date.today().isoformat()

def borrar_gasto_pago(db: Session, obrero: models.Obrero):
    gasto = buscar_gasto_pago(db, obrero)
    if gasto:
        db.delete(gasto)

@router.post("/obreros")
def crear_obrero(obrero: ObreroCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(obrero.finca_id, token_finca_id)
    nuevo = models.Obrero(**obrero.dict(), total_pagar=obrero.dias_trabajados * obrero.precio_jornal)
    db.add(nuevo)
    if nuevo.pagado:
        db.flush()
        registrar_gasto_pago(db, nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Obrero registrado exitosamente", "id": nuevo.id}

@router.put("/obreros/{obrero_id}")
def actualizar_obrero(obrero_id: IdRuta, datos: ObreroCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    obrero = db.query(models.Obrero).filter(models.Obrero.id == obrero_id).first()
    if not obrero:
        raise HTTPException(status_code=404, detail="Obrero no encontrado")
    verificar_finca(obrero.finca_id, token_finca_id)
    # Ya verificada la finca, se relee la fila bloqueándola para que dos peticiones
    # simultáneas no registren el pago dos veces
    obrero = (
        db.query(models.Obrero).filter(models.Obrero.id == obrero_id)
        .with_for_update().populate_existing().one()
    )
    estaba_pagado = bool(obrero.pagado)
    for key, value in datos.dict(exclude={"finca_id"}).items():
        setattr(obrero, key, value)
    obrero.total_pagar = datos.dias_trabajados * datos.precio_jornal
    if obrero.pagado and not estaba_pagado:
        registrar_gasto_pago(db, obrero)
    elif estaba_pagado and not obrero.pagado:
        borrar_gasto_pago(db, obrero)
    db.commit()
    db.refresh(obrero)
    return {"mensaje": "Obrero actualizado exitosamente"}

# ── Eliminar registros ───────────────────────────────────────────────────────
# Cada borrado verifica que el registro pertenezca a la finca del token.

def _borrar(db: Session, registro, finca_id_token: int, mensaje: str):
    verificar_finca(registro.finca_id, finca_id_token)
    db.delete(registro)
    db.commit()
    return {"mensaje": mensaje}

@router.delete("/historial/{registro_id}")
def eliminar_historial(registro_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    registro = db.query(models.HistorialSalud).filter(models.HistorialSalud.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    animal = db.query(models.Animal).filter(models.Animal.id == registro.animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    verificar_finca(animal.finca_id, token_finca_id)
    db.delete(registro)
    db.commit()
    return {"mensaje": "Registro de salud eliminado"}

@router.delete("/insumos/{insumo_id}")
def eliminar_insumo(insumo_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    insumo = db.query(models.Insumo).filter(models.Insumo.id == insumo_id).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return _borrar(db, insumo, token_finca_id, "Insumo eliminado")

@router.delete("/finanzas/{finanza_id}")
def eliminar_finanza(finanza_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    finanza = db.query(models.Finanza).filter(models.Finanza.id == finanza_id).first()
    if not finanza:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return _borrar(db, finanza, token_finca_id, "Registro financiero eliminado")

@router.delete("/leche/{registro_id}")
def eliminar_leche(registro_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    registro = db.query(models.RegistroLeche).filter(models.RegistroLeche.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    verificar_finca(registro.finca_id, token_finca_id)
    finca_id, fecha = registro.finca_id, registro.fecha
    db.delete(registro)
    sincronizar_ingreso_leche(db, finca_id, fecha)
    db.commit()
    return {"mensaje": "Registro de leche eliminado"}

@router.delete("/obreros/{obrero_id}")
def eliminar_obrero(obrero_id: IdRuta, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    obrero = db.query(models.Obrero).filter(models.Obrero.id == obrero_id).first()
    if not obrero:
        raise HTTPException(status_code=404, detail="Obrero no encontrado")
    verificar_finca(obrero.finca_id, token_finca_id)
    # Si ya estaba pagado, su gasto en Finanzas se borra con él
    borrar_gasto_pago(db, obrero)
    db.delete(obrero)
    db.commit()
    return {"mensaje": "Obrero eliminado"}
