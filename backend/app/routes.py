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
@router.put("/animales/{animal_id}")
def actualizar_animal(animal_id: int, datos: AnimalCreate, db: Session = Depends(get_db)):
    animal = db.query(models.Animal).filter(models.Animal.id == animal_id).first()
    if not animal:
        raise HTTPException(status_code=404, detail="Animal no encontrado")
    for key, value in datos.dict().items():
        setattr(animal, key, value)
    db.commit()
    db.refresh(animal)
    return {"mensaje": "Animal actualizado exitosamente"}

@router.put("/historial/{registro_id}")
def actualizar_historial(registro_id: int, datos: HistorialSaludCreate, db: Session = Depends(get_db)):
    registro = db.query(models.HistorialSalud).filter(models.HistorialSalud.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    for key, value in datos.dict().items():
        setattr(registro, key, value)
    db.commit()
    db.refresh(registro)
    return {"mensaje": "Registro actualizado exitosamente"}

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

class RegistroLecheCreate(BaseModel):
    finca_id: int
    fecha: str
    litros: float
    precio_litro: float
    frecuencia_pago: Optional[str] = "Mensual"

@router.get("/leche/{finca_id}")
def listar_leche(finca_id: int, db: Session = Depends(get_db)):
    registros = db.query(models.RegistroLeche).filter(
        models.RegistroLeche.finca_id == finca_id
    ).all()
    return registros

@router.post("/leche")
def crear_registro_leche(registro: RegistroLecheCreate, db: Session = Depends(get_db)):
    nuevo_registro = models.RegistroLeche(**registro.dict())
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
class ObreroCreate(BaseModel):
    finca_id: int
    nombre: str
    dias_trabajados: float
    precio_jornal: float
    total_pagar: float
    fecha: str
    comentario: Optional[str] = ""
    pagado: bool = False

@router.get("/obreros/{finca_id}")
def listar_obreros(finca_id: int, db: Session = Depends(get_db)):
    obreros = db.query(models.Obrero).filter(models.Obrero.finca_id == finca_id).all()
    return obreros

@router.post("/obreros")
def crear_obrero(obrero: ObreroCreate, db: Session = Depends(get_db)):
    nuevo_obrero = models.Obrero(**obrero.dict())
    db.add(nuevo_obrero)
    db.commit()
    db.refresh(nuevo_obrero)
    return {"mensaje": "Obrero registrado exitosamente", "id": nuevo_obrero.id}

@router.put("/obreros/{obrero_id}")
def actualizar_pago_obrero(obrero_id: int, datos: ObreroCreate, db: Session = Depends(get_db)):
    obrero = db.query(models.Obrero).filter(models.Obrero.id == obrero_id).first()
    if not obrero:
        raise HTTPException(status_code=404, detail="Obrero no encontrado")
    for key, value in datos.dict().items():
        setattr(obrero, key, value)
    db.commit()
    db.refresh(obrero)
    return {"mensaje": "Obrero actualizado exitosamente"}
    # Pega estos endpoints en routes.py justo antes del último return de obreros

@router.put("/leche/{registro_id}")
def actualizar_leche(registro_id: int, datos: RegistroLecheCreate, db: Session = Depends(get_db)):
    registro = db.query(models.RegistroLeche).filter(models.RegistroLeche.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    for key, value in datos.dict().items():
        setattr(registro, key, value)
    db.commit()
    db.refresh(registro)
    return {"mensaje": "Registro de leche actualizado exitosamente"}

@router.put("/insumos/{insumo_id}")
def actualizar_insumo(insumo_id: int, datos: InsumoCreate, db: Session = Depends(get_db)):
    insumo = db.query(models.Insumo).filter(models.Insumo.id == insumo_id).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    for key, value in datos.dict().items():
        setattr(insumo, key, value)
    db.commit()
    db.refresh(insumo)
    return {"mensaje": "Insumo actualizado exitosamente"}

@router.put("/finanzas/{finanza_id}")
def actualizar_finanza(finanza_id: int, datos: FinanzaCreate, db: Session = Depends(get_db)):
    finanza = db.query(models.Finanza).filter(models.Finanza.id == finanza_id).first()
    if not finanza:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    for key, value in datos.dict().items():
        setattr(finanza, key, value)
    db.commit()
    db.refresh(finanza)
    return {"mensaje": "Registro financiero actualizado exitosamente"}
    return {"mensaje": "Registro de leche agregado exitosamente", "id": nuevo_registro.id}