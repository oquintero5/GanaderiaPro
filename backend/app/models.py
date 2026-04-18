from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Finca(Base):
    __tablename__ = "fincas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    propietario = Column(String, nullable=False)
    correo = Column(String, unique=True, nullable=False)
    celular = Column(String)
    pais = Column(String)
    departamento = Column(String)
    municipio = Column(String)
    vereda = Column(String)
    clave = Column(String, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow)

class Animal(Base):
    __tablename__ = "animales"
    id = Column(Integer, primary_key=True, index=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"))
    nombre = Column(String, nullable=False)
    chapeta = Column(String, nullable=False)
    edad = Column(Float)
    peso = Column(Float)
    sexo = Column(String)
    raza = Column(String)
    crias = Column(Integer, default=0)
    creado_en = Column(DateTime, default=datetime.utcnow)

class HistorialSalud(Base):
    __tablename__ = "historial_salud"
    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animales.id"))
    fecha = Column(String)
    tipo = Column(String)
    producto = Column(String)
    dosis = Column(String)
    observaciones = Column(String)
    creado_en = Column(DateTime, default=datetime.utcnow)

class Insumo(Base):
    __tablename__ = "insumos"
    id = Column(Integer, primary_key=True, index=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"))
    nombre = Column(String, nullable=False)
    categoria = Column(String)
    cantidad = Column(Float)
    unidad = Column(String)
    precio = Column(Float)
    proveedor = Column(String)
    creado_en = Column(DateTime, default=datetime.utcnow)

class Finanza(Base):
    __tablename__ = "finanzas"
    id = Column(Integer, primary_key=True, index=True)
    finca_id = Column(Integer, ForeignKey("fincas.id"))
    tipo = Column(String)
    categoria = Column(String)
    descripcion = Column(String)
    monto = Column(Float)
    fecha = Column(String)
    creado_en = Column(DateTime, default=datetime.utcnow)