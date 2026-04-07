from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELOS DE DATOS ============

# Modelo para Transacciones Financieras
class TransactionCreate(BaseModel):
    tipo: Literal["ingreso", "gasto", "inversion"]
    monto: float
    moneda: Literal["PEN", "USD"]
    fecha: datetime
    cuenta_relacionada: Optional[str] = None
    notas: Optional[str] = None

class Transaction(BaseModel):
    id: str
    tipo: Literal["ingreso", "gasto", "inversion"]
    monto: float
    moneda: Literal["PEN", "USD"]
    fecha: datetime
    cuenta_relacionada: Optional[str] = None
    notas: Optional[str] = None
    created_at: datetime

# Modelo para Dashboard Financiero
class FinancialSummary(BaseModel):
    total_ingresos_pen: float
    total_ingresos_usd: float
    total_gastos_pen: float
    total_gastos_usd: float
    total_inversiones_pen: float
    total_inversiones_usd: float
    ganancia_neta_pen: float
    ganancia_neta_usd: float

# Modelo para Cuentas de Free Fire
class AccountCreate(BaseModel):
    titulo: str
    plataforma: Literal["Facebook", "Google", "VK", "Twitter", "Otro"]
    plataforma_otro: Optional[str] = None
    email: str
    password: str
    codigos_respaldo: Optional[str] = None
    foto_base64: Optional[str] = None  # Foto en base64
    estado: List[str] = []  # ["Email Confirmado", "Email Perdido", "En Proceso", "Vendida", "Disponible", "Reservada"]
    region: str = "USA"  # USA, South America, o custom
    notas: Optional[str] = None
    fecha_compra: Optional[datetime] = None
    fecha_venta: Optional[datetime] = None

class Account(BaseModel):
    id: str
    titulo: str
    plataforma: str
    plataforma_otro: Optional[str] = None
    email: str
    password: str
    codigos_respaldo: Optional[str] = None
    foto_base64: Optional[str] = None
    estado: List[str]
    region: str
    notas: Optional[str] = None
    fecha_compra: Optional[datetime] = None
    fecha_venta: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

# ============ ENDPOINTS DE TRANSACCIONES ============

@api_router.post("/transacciones", response_model=Transaction)
async def crear_transaccion(transaccion: TransactionCreate):
    """Crear nueva transacción financiera"""
    trans_dict = transaccion.dict()
    trans_dict["created_at"] = datetime.utcnow()
    
    result = await db.transacciones.insert_one(trans_dict)
    trans_dict["id"] = str(result.inserted_id)
    
    return Transaction(**trans_dict)

@api_router.get("/transacciones", response_model=List[Transaction])
async def obtener_transacciones():
    """Obtener todas las transacciones"""
    transacciones = await db.transacciones.find().sort("fecha", -1).to_list(1000)
    
    result = []
    for trans in transacciones:
        trans["id"] = str(trans.pop("_id"))
        result.append(Transaction(**trans))
    
    return result

@api_router.get("/transacciones/{transaction_id}", response_model=Transaction)
async def obtener_transaccion(transaction_id: str):
    """Obtener una transacción específica"""
    try:
        trans = await db.transacciones.find_one({"_id": ObjectId(transaction_id)})
        if not trans:
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
        trans["id"] = str(trans.pop("_id"))
        return Transaction(**trans)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/transacciones/{transaction_id}", response_model=Transaction)
async def actualizar_transaccion(transaction_id: str, transaccion: TransactionCreate):
    """Actualizar una transacción"""
    try:
        trans_dict = transaccion.dict()
        
        result = await db.transacciones.update_one(
            {"_id": ObjectId(transaction_id)},
            {"$set": trans_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
        trans = await db.transacciones.find_one({"_id": ObjectId(transaction_id)})
        trans["id"] = str(trans.pop("_id"))
        
        return Transaction(**trans)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/transacciones/{transaction_id}")
async def eliminar_transaccion(transaction_id: str):
    """Eliminar una transacción"""
    try:
        result = await db.transacciones.delete_one({"_id": ObjectId(transaction_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
        return {"mensaje": "Transacción eliminada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/dashboard/financiero", response_model=FinancialSummary)
async def obtener_resumen_financiero():
    """Obtener resumen financiero completo"""
    transacciones = await db.transacciones.find().to_list(1000)
    
    # Inicializar totales
    totales = {
        "total_ingresos_pen": 0.0,
        "total_ingresos_usd": 0.0,
        "total_gastos_pen": 0.0,
        "total_gastos_usd": 0.0,
        "total_inversiones_pen": 0.0,
        "total_inversiones_usd": 0.0,
    }
    
    # Calcular totales
    for trans in transacciones:
        tipo = trans["tipo"]
        moneda = trans["moneda"]
        monto = trans["monto"]
        
        if tipo == "ingreso":
            if moneda == "PEN":
                totales["total_ingresos_pen"] += monto
            else:
                totales["total_ingresos_usd"] += monto
        elif tipo == "gasto":
            if moneda == "PEN":
                totales["total_gastos_pen"] += monto
            else:
                totales["total_gastos_usd"] += monto
        elif tipo == "inversion":
            if moneda == "PEN":
                totales["total_inversiones_pen"] += monto
            else:
                totales["total_inversiones_usd"] += monto
    
    # Calcular ganancia neta
    totales["ganancia_neta_pen"] = totales["total_ingresos_pen"] - totales["total_gastos_pen"]
    totales["ganancia_neta_usd"] = totales["total_ingresos_usd"] - totales["total_gastos_usd"]
    
    return FinancialSummary(**totales)

# ============ ENDPOINTS DE CUENTAS ============

@api_router.post("/cuentas", response_model=Account)
async def crear_cuenta(cuenta: AccountCreate):
    """Crear nueva cuenta de Free Fire"""
    cuenta_dict = cuenta.dict()
    cuenta_dict["created_at"] = datetime.utcnow()
    cuenta_dict["updated_at"] = datetime.utcnow()
    
    result = await db.cuentas.insert_one(cuenta_dict)
    cuenta_dict["id"] = str(result.inserted_id)
    
    return Account(**cuenta_dict)

@api_router.get("/cuentas", response_model=List[Account])
async def obtener_cuentas():
    """Obtener todas las cuentas"""
    cuentas = await db.cuentas.find().sort("created_at", -1).to_list(1000)
    
    result = []
    for cuenta in cuentas:
        cuenta["id"] = str(cuenta.pop("_id"))
        result.append(Account(**cuenta))
    
    return result

@api_router.get("/cuentas/{account_id}", response_model=Account)
async def obtener_cuenta(account_id: str):
    """Obtener una cuenta específica"""
    try:
        cuenta = await db.cuentas.find_one({"_id": ObjectId(account_id)})
        if not cuenta:
            raise HTTPException(status_code=404, detail="Cuenta no encontrada")
        
        cuenta["id"] = str(cuenta.pop("_id"))
        return Account(**cuenta)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/cuentas/{account_id}", response_model=Account)
async def actualizar_cuenta(account_id: str, cuenta: AccountCreate):
    """Actualizar una cuenta"""
    try:
        cuenta_dict = cuenta.dict()
        cuenta_dict["updated_at"] = datetime.utcnow()
        
        result = await db.cuentas.update_one(
            {"_id": ObjectId(account_id)},
            {"$set": cuenta_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Cuenta no encontrada")
        
        cuenta = await db.cuentas.find_one({"_id": ObjectId(account_id)})
        cuenta["id"] = str(cuenta.pop("_id"))
        
        return Account(**cuenta)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/cuentas/{account_id}")
async def eliminar_cuenta(account_id: str):
    """Eliminar una cuenta"""
    try:
        result = await db.cuentas.delete_one({"_id": ObjectId(account_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Cuenta no encontrada")
        
        return {"mensaje": "Cuenta eliminada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/cuentas/buscar/{query}")
async def buscar_cuentas(query: str):
    """Buscar cuentas por título, email, notas, etc."""
    cuentas = await db.cuentas.find({
        "$or": [
            {"titulo": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}},
            {"notas": {"$regex": query, "$options": "i"}},
            {"plataforma": {"$regex": query, "$options": "i"}},
        ]
    }).to_list(100)
    
    result = []
    for cuenta in cuentas:
        cuenta["id"] = str(cuenta.pop("_id"))
        result.append(Account(**cuenta))
    
    return result

# ============ RUTAS BÁSICAS ============

@api_router.get("/")
async def root():
    return {"mensaje": "API de Gestión de Cuentas Free Fire"}

@api_router.get("/health")
async def health_check():
    return {"estado": "ok", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
