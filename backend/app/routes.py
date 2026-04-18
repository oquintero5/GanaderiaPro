from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models
from .database import get_db
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# Schemas
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

# Rutas Finca
@router.post("/fincas/registro")
def registrar_finca(finca: FincaCreate, db: Session = Depends(get_db)):
    existe = db.query(models.Finca).filter(models.Finca.correo == finca.correo).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe una finca con ese correo")
    nueva_finca = models.Finca(**finca.dict())
    db.add(nueva_finca)
    db.commit()
    db.refresh(nueva_finca)
    return {"mensaje": "Finca registrada exitosamente", "finca_id": nueva_finca.id}

@router.post("/fincas/login")
def login_finca(datos: FincaLogin, db: Session = Depends(get_db)):
    finca = db.query(models.Finca).filter(
        models.Finca.nombre == datos.nombre,
        models.Finca.clave == datos.clave
    ).first()
    if not finca:
        raise HTTPException(status_code=401, detail="Nombre de finca o clave incorrectos")
    return {"mensaje": "Login exitoso", "finca_id": finca.id, "nombre": finca.nombre}

# Rutas Animales
@router.get("/animales/{finca_id}")
def listar_animales(finca_id: int, db: Session = Depends(get_db)):
    animales = db.query(models.Animal).filter(models.Animal.finca_id == finca_id).all()
    return animales

@router.post("/animales")
def crear_animal(animal: AnimalCreate, db: Session = Depends(get_db)):
    nuevo_animal = models.Animal(**animal.dict())
    db.add(nuevo_animal)
    db.commit()
    db.refresh(nuevo_animal)
    return {"mensaje": "Animal registrado exitosamente", "animal_id": nuevo_animal.id}

@router.delete("/animales/{animal_id}")
def eliminar_animal(animal_id: int, db: Session = Depends(get_db)):
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    db.delete(animal)
    db.commit()
    return {"mensaje": "Animal eliminado exitosamente"}

# Rutas Historial Salud
@router.get("/historial/{animal_id}")
def listar_historial(animal_id: int, db: Session = Depends(get_db)):
    historial = db.query(models.HistorialSalud).filter(models.HistorialSalud.animal_id == animal_id).all()
    return historial

@router.post("/historial")
def agregar_historial(registro: HistorialSaludCreate, db: Session = Depends(get_db)):
    nuevo_registro = models.HistorialSalud(**registro.dict())
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return {"mensaje": "Registro de salud agregado exitosamente"}

# Rutas Insumos
@router.get("/insumos/{finca_id}")
def listar_insumos(finca_id: int, db: Session = Depends(get_db)):
    insumos = db.query(models.Insumo).filter(models.Insumo.finca_id == finca_id).all()
    return insumos

@router.post("/insumos")
def crear_insumo(insumo: InsumoCreate, db: Session = Depends(get_db)):
    nuevo_insumo = models.Insumo(**insumo.dict())
    db.add(nuevo_insumo)
    db.commit()
    db.refresh(nuevo_insumo)
    return {"mensaje": "Insumo agregado exitosamente", "insumo_id": nuevo_insumo.id}

# Rutas Finanzas
@router.get("/finanzas/{finca_id}")
def listar_finanzas(finca_id: int, db: Session = Depends(get_db)):
    finanzas = db.query(models.Finanza).filter(models.Finanza.finca_id == finca_id).all()
    return finanzas

@router.post("/finanzas")
def crear_finanza(finanza: FinanzaCreate, db: Session = Depends(get_db)):
    nueva_finanza = models.Finanza(**finanza.dict())
    db.add(nueva_finanza)
    db.commit()
    db.refresh(nueva_finanza)
    return {"mensaje": "Registro financiero agregado exitosamente"}