from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from . import models
from .database import get_db
from .auth import crear_token, get_finca_id
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verificar_finca(finca_id_recurso: int, finca_id_token: int):
    if finca_id_recurso != finca_id_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")

# ── Schemas ──────────────────────────────────────────────────────────────────

class FincaCreate(BaseModel):
    nombre: str
    propietario: str
    correo: str
    celular: str
    pais: str
    departamento: str
    municipio: str
    vereda: str
    clave: str

class FincaLogin(BaseModel):
    nombre: str
    clave: str

class AnimalCreate(BaseModel):
    finca_id: int
    nombre: str
    chapeta: str
    edad: float
    peso: float
    sexo: str
    raza: str
    crias: Optional[int] = 0

class HistorialSaludCreate(BaseModel):
    animal_id: int
    fecha: str
    tipo: str
    producto: str
    dosis: Optional[str] = ""
    observaciones: Optional[str] = ""

class InsumoCreate(BaseModel):
    finca_id: int
    nombre: str
    categoria: str
    cantidad: float
    unidad: str
    precio: float
    proveedor: Optional[str] = ""

class FinanzaCreate(BaseModel):
    finca_id: int
    tipo: str
    categoria: str
    descripcion: Optional[str] = ""
    monto: float
    fecha: str

class RegistroLecheCreate(BaseModel):
    finca_id: int
    fecha: str
    litros: float
    precio_litro: float
    frecuencia_pago: Optional[str] = "Mensual"

class ObreroCreate(BaseModel):
    finca_id: int
    nombre: str
    dias_trabajados: float
    precio_jornal: float
    total_pagar: float
    fecha: str
    comentario: Optional[str] = ""
    pagado: bool = False

# ── Fincas (rutas públicas) ───────────────────────────────────────────────────

@router.post("/fincas/registro")
def registrar_finca(finca: FincaCreate, db: Session = Depends(get_db)):
    existe = db.query(models.Finca).filter(models.Finca.correo == finca.correo).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe una finca con ese correo")
    datos = finca.dict()
    datos["clave"] = pwd_context.hash(datos["clave"])
    nueva_finca = models.Finca(**datos)
    db.add(nueva_finca)
    db.commit()
    db.refresh(nueva_finca)
    token = crear_token(nueva_finca.id)
    return {"mensaje": "Finca registrada exitosamente", "finca_id": nueva_finca.id, "token": token}

@router.post("/fincas/login")
def login_finca(datos: FincaLogin, db: Session = Depends(get_db)):
    finca = db.query(models.Finca).filter(models.Finca.nombre == datos.nombre).first()
    if not finca:
        raise HTTPException(status_code=401, detail="Nombre de finca o clave incorrectos")

    clave_ok = False
    if finca.clave.startswith("$2b$") or finca.clave.startswith("$2a$"):
        clave_ok = pwd_context.verify(datos.clave, finca.clave)
    else:
        if finca.clave == datos.clave:
            finca.clave = pwd_context.hash(datos.clave)
            db.commit()
            clave_ok = True

    if not clave_ok:
        raise HTTPException(status_code=401, detail="Nombre de finca o clave incorrectos")

    token = crear_token(finca.id)
    return {"mensaje": "Login exitoso", "finca_id": finca.id, "nombre": finca.nombre, "token": token}

# ── Animales ─────────────────────────────────────────────────────────────────

@router.get("/animales/{finca_id}")
def listar_animales(finca_id: int, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
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
def actualizar_animal(animal_id: int, datos: AnimalCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    verificar_finca(animal.finca_id, token_finca_id)
    for key, value in datos.dict().items():
        setattr(animal, key, value)
    db.commit()
    db.refresh(animal)
    return {"mensaje": "Animal actualizado exitosamente"}

@router.delete("/animales/{animal_id}")
def eliminar_animal(animal_id: int, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    verificar_finca(animal.finca_id, token_finca_id)
    db.delete(animal)
    db.commit()
    return {"mensaje": "Animal eliminado exitosamente"}

# ── Historial Salud ──────────────────────────────────────────────────────────

@router.get("/historial/{animal_id}")
def listar_historial(animal_id: int, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
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
def actualizar_historial(registro_id: int, datos: HistorialSaludCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    registro = db.query(models.HistorialSalud).filter(models.HistorialSalud.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    animal = db.query(models.Animal).filter(models.Animal.id == registro.animal_id).first()
    if animal:
        verificar_finca(animal.finca_id, token_finca_id)
    for key, value in datos.dict().items():
        setattr(registro, key, value)
    db.commit()
    db.refresh(registro)
    return {"mensaje": "Registro actualizado exitosamente"}

# ── Insumos ──────────────────────────────────────────────────────────────────

@router.get("/insumos/{finca_id}")
def listar_insumos(finca_id: int, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
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
def actualizar_insumo(insumo_id: int, datos: InsumoCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    insumo = db.query(models.Insumo).filter(models.Insumo.id == insumo_id).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    verificar_finca(insumo.finca_id, token_finca_id)
    for key, value in datos.dict().items():
        setattr(insumo, key, value)
    db.commit()
    db.refresh(insumo)
    return {"mensaje": "Insumo actualizado exitosamente"}

# ── Finanzas ─────────────────────────────────────────────────────────────────

@router.get("/finanzas/{finca_id}")
def listar_finanzas(finca_id: int, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(finca_id, token_finca_id)
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
def actualizar_finanza(finanza_id: int, datos: FinanzaCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    finanza = db.query(models.Finanza).filter(models.Finanza.id == finanza_id).first()
    if not finanza:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    verificar_finca(finanza.finca_id, token_finca_id)
    for key, value in datos.dict().items():
        setattr(finanza, key, value)
    db.commit()
    db.refresh(finanza)
    return {"mensaje": "Registro financiero actualizado exitosamente"}

# ── Lechería ─────────────────────────────────────────────────────────────────

@router.get("/leche/{finca_id}")
def listar_leche(finca_id: int, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(finca_id, token_finca_id)
    return db.query(models.RegistroLeche).filter(models.RegistroLeche.finca_id == finca_id).all()

@router.post("/leche")
def crear_registro_leche(registro: RegistroLecheCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(registro.finca_id, token_finca_id)
    nuevo = models.RegistroLeche(**registro.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Registro de leche agregado exitosamente", "id": nuevo.id}

@router.put("/leche/{registro_id}")
def actualizar_leche(registro_id: int, datos: RegistroLecheCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    registro = db.query(models.RegistroLeche).filter(models.RegistroLeche.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    verificar_finca(registro.finca_id, token_finca_id)
    for key, value in datos.dict().items():
        setattr(registro, key, value)
    db.commit()
    db.refresh(registro)
    return {"mensaje": "Registro de leche actualizado exitosamente"}

# ── Obreros ──────────────────────────────────────────────────────────────────

@router.get("/obreros/{finca_id}")
def listar_obreros(finca_id: int, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(finca_id, token_finca_id)
    return db.query(models.Obrero).filter(models.Obrero.finca_id == finca_id).all()

@router.post("/obreros")
def crear_obrero(obrero: ObreroCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    verificar_finca(obrero.finca_id, token_finca_id)
    nuevo = models.Obrero(**obrero.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Obrero registrado exitosamente", "id": nuevo.id}

@router.put("/obreros/{obrero_id}")
def actualizar_obrero(obrero_id: int, datos: ObreroCreate, db: Session = Depends(get_db), token_finca_id: int = Depends(get_finca_id)):
    obrero = db.query(models.Obrero).filter(models.Obrero.id == obrero_id).first()
    if not obrero:
        raise HTTPException(status_code=404, detail="Obrero no encontrado")
    verificar_finca(obrero.finca_id, token_finca_id)
    for key, value in datos.dict().items():
        setattr(obrero, key, value)
    db.commit()
    db.refresh(obrero)
    return {"mensaje": "Obrero actualizado exitosamente"}
