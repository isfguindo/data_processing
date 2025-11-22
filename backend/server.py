from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import random
import base64
from PIL import Image
import io
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'agrofarm_db')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# AI Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-dAdBaF6947bCd95FfB')

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    full_name: str
    role: str = "employee"  # admin, manager, employee
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "employee"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str

class SensorData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sensor_id: Optional[str] = None  # Optional link to a physical sensor device
    sensor_type: str  # humidity, temperature, ph, wind, rain, sunlight, camera, drone
    value: float
    unit: str
    location: str = "Main Field"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SensorDevice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    sensor_type: str  # temperature_air, humidity_air, soil_moisture, sunlight, ph_soil, camera_pests, drone
    location: str = "Main Field"
    unit: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"  # active, inactive, maintenance
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IrrigationSchedule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    zone_name: str
    start_time: str
    duration_minutes: int
    water_amount_liters: float
    status: str = "scheduled"  # scheduled, running, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Plant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    plant_type: str
    location: str
    planting_date: str
    status: str = "healthy"  # healthy, sick, treated
    image_base64: Optional[str] = None
    last_inspection: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlantDiagnosis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plant_id: str
    diagnosis: str
    recommendations: str
    confidence: Optional[float] = None
    image_base64: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlantDiagnosisRequest(BaseModel):
    plant_id: str
    image_base64: str
    language: str = "fr"  # Default to French

class Stock(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_name: str
    category: str  # seeds, fertilizers, pesticides, harvested_products, tools
    quantity: float
    unit: str
    min_threshold: float
    price_per_unit: float
    currency: str = "USD"  # EUR, USD, XAF, GBP, MAD, etc.
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StockUpdate(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    min_threshold: Optional[float] = None
    price_per_unit: Optional[float] = None
    currency: Optional[str] = None

class Sale(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_name: str
    quantity: float
    unit: str
    price_per_unit: float
    total_amount: float
    customer_id: str
    sale_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    customer_type: str = "retailer"  # retailer, distributor, direct_consumer
    total_purchases: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    full_name: str
    email: str
    role: str
    tasks_completed: int = 0
    performance_score: float = 0.0

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    assigned_to: str  # employee ID
    priority: str = "medium"  # low, medium, high
    status: str = "pending"  # pending, in_progress, completed
    due_date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Report(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    report_type: str  # yield, costs, revenue, water_usage
    period: str
    data: Dict[str, Any]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AutoIrrigationSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    enabled: bool = False
    temperature_threshold: float = 30.0  # °C
    humidity_threshold: float = 40.0  # %
    recommended_temp_threshold: Optional[float] = None
    recommended_humidity_threshold: Optional[float] = None
    last_triggered: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AutoIrrigationSettingsUpdate(BaseModel):
    enabled: Optional[bool] = None
    temperature_threshold: Optional[float] = None
    humidity_threshold: Optional[float] = None

class AutoIrrigationTrigger(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    triggered_by: str  # "auto" or "manual"
    temperature: float
    humidity: float
    zones_irrigated: List[str]
    total_water_used: float
    ai_recommendation: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIRecommendation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recommendation_type: str  # irrigation, treatment, harvest
    title: str
    description: str
    priority: str = "medium"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    ai_provider: str = "openai"  # openai, anthropic, gemini
    ai_model: str = "gpt-4o"
    auto_irrigation: bool = True
    notifications_enabled: bool = True

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, str]:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def generate_sensor_data() -> List[SensorData]:
    """Generate simulated sensor data"""
    sensors = [
        {"type": "humidity", "unit": "%", "value": random.uniform(40, 80)},
        {"type": "temperature", "unit": "°C", "value": random.uniform(18, 35)},
        {"type": "ph", "unit": "pH", "value": random.uniform(5.5, 7.5)},
        {"type": "wind", "unit": "km/h", "value": random.uniform(0, 30)},
        {"type": "rain", "unit": "mm", "value": random.uniform(0, 10)},
        {"type": "sunlight", "unit": "W/m²", "value": random.uniform(200, 1000)},
    ]
    
    return [SensorData(sensor_type=s["type"], value=round(s["value"], 2), unit=s["unit"]) for s in sensors]

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    token = create_access_token(user.id, user.role)
    return {"token": token, "user": UserResponse(id=user.id, email=user.email, full_name=user.full_name, role=user.role)}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user['id'], user['role'])
    return {"token": token, "user": UserResponse(id=user['id'], email=user['email'], full_name=user['full_name'], role=user['role'])}

@api_router.get("/auth/me")
async def get_me(current_user: Dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ==================== SENSORS ROUTES ====================

@api_router.get("/sensors/current")
async def get_current_sensors(current_user: Dict = Depends(get_current_user)):
    """Generate basic simulated readings but also persist them as regular sensor_data entries.

    Les vrais appareils IoT utiliseront plutôt les routes /sensors/devices et /sensors/readings,
    mais cet endpoint reste utile pour la démo rapide et le rafraîchissement manuel côté UI.
    """
    sensor_data = generate_sensor_data()
    
    # Save to database
    for sensor in sensor_data:
        sensor_dict = sensor.model_dump()
        sensor_dict["timestamp"] = sensor_dict["timestamp"].isoformat()
        await db.sensor_data.insert_one(sensor_dict)
    
    return [s.model_dump() for s in sensor_data]

# ==================== SENSOR DEVICES & REAL DATA ROUTES ====================

@api_router.post("/sensors/devices")
async def create_sensor_device(device: SensorDevice, current_user: Dict = Depends(get_current_user)):
    device_dict = device.model_dump()
    device_dict["created_at"] = device_dict["created_at"].isoformat()
    await db.sensor_devices.insert_one(device_dict)
    device_dict.pop("_id", None)
    return device_dict


@api_router.get("/sensors/devices")
async def list_sensor_devices(current_user: Dict = Depends(get_current_user)):
    devices = await db.sensor_devices.find({}, {"_id": 0}).to_list(1000)
    return devices


class SensorReadingIn(BaseModel):
    sensor_id: str
    value: float
    timestamp: Optional[datetime] = None


@api_router.post("/sensors/readings")
async def ingest_sensor_reading(reading: SensorReadingIn, current_user: Dict = Depends(get_current_user)):
    # Find the corresponding device to infer type/unit/location
    device = await db.sensor_devices.find_one({"id": reading.sensor_id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=404, detail="Sensor device not found")

    sensor_data = SensorData(
        sensor_id=reading.sensor_id,
        sensor_type=device.get("sensor_type", "unknown"),
        value=reading.value,
        unit=device.get("unit", ""),
        location=device.get("location", "Main Field"),
        timestamp=reading.timestamp or datetime.now(timezone.utc)
    )

    sensor_dict = sensor_data.model_dump()
    sensor_dict["timestamp"] = sensor_dict["timestamp"].isoformat()
    await db.sensor_data.insert_one(sensor_dict)
    sensor_dict.pop("_id", None)
    return sensor_dict


@api_router.get("/sensors/readings/{sensor_id}")
async def get_sensor_readings(sensor_id: str, limit: int = 100, current_user: Dict = Depends(get_current_user)):
    readings = await db.sensor_data.find(
        {"sensor_id": sensor_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return readings


class SensorAIAnalysisRequest(BaseModel):
    language: str = "fr"


@api_router.post("/sensors/ai-analysis")
async def get_sensor_ai_analysis(request: SensorAIAnalysisRequest, current_user: Dict = Depends(get_current_user)):
    """Provide AI-based recommendations and indices based on recent real sensor data."""
    # Fetch recent readings grouped by type
    recent_readings = await db.sensor_data.find({}, {"_id": 0}).sort("timestamp", -1).limit(50).to_list(50)

    if not recent_readings:
        msg = "Aucune donnée de capteur disponible pour l'analyse" if request.language == "fr" else "No sensor data available for analysis"
        return {"message": msg, "recommendations": None}

    # Build a compact summary by type
    summary_by_type: Dict[str, list] = {}
    for r in recent_readings:
        t = r.get("sensor_type", "unknown")
        summary_by_type.setdefault(t, []).append(r.get("value"))

    sensor_summary_lines = []
    for t, values in summary_by_type.items():
        if not values:
            continue
        avg = sum(values) / len(values)
        sensor_summary_lines.append(f"{t}: moyenne {avg:.2f} ({len(values)} mesures)")

    sensor_summary = "\n".join(sensor_summary_lines)

    language_name = "French" if request.language == "fr" else "English"

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"sensor-ai-analysis-{uuid.uuid4()}",
        system_message=(
            "You are an agricultural IoT assistant. You analyze multi-sensor data "
            "(air temperature & humidity, soil moisture, soil pH, sunlight, cameras, drones) "
            "and provide both numerical risk indices and textual recommendations."
        ),
    ).with_model("openai", "gpt-4o")

    message = UserMessage(
        text=(
            f"Analyze the following aggregated sensor data and provide both: \n"
            f"1) Numerical indices between 0 and 100 for: water_stress, disease_risk, nutrient_issue_risk, pest_pressure.\n"
            f"2) Concise textual recommendations for irrigation, fertilization and pest/animal control.\n"
            f"Respond in {language_name}.\n\n"
            f"Sensor summary (by type and average value):\n{sensor_summary}"
        )
    )

    ai_response = await chat.send_message(message)

    return {
        "summary": sensor_summary,
        "analysis": ai_response,
    }

@api_router.get("/sensors/history")
async def get_sensor_history(sensor_type: str, limit: int = 100, current_user: Dict = Depends(get_current_user)):
    sensors = await db.sensor_data.find(
        {"sensor_type": sensor_type},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return sensors

# ==================== IRRIGATION ROUTES ====================

class AIRecommendationRequest(BaseModel):
    language: str = "fr"

# Specific routes MUST come before routes with path parameters
@api_router.post("/irrigation/ai-recommend")
async def get_ai_irrigation_recommendation(request: AIRecommendationRequest = AIRecommendationRequest(), current_user: Dict = Depends(get_current_user)):
    # Get latest sensor data
    sensors = await db.sensor_data.find({}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
    
    # Prepare data for AI
    sensor_summary = "\n".join([f"{s['sensor_type']}: {s['value']} {s['unit']}" for s in sensors[:6]])
    
    # Language-specific prompt
    language_name = "French" if request.language == "fr" else "English"
    
    # Get AI recommendation
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"irrigation-{uuid.uuid4()}",
        system_message=f"You are an agricultural AI assistant. Provide irrigation recommendations based on sensor data. Always respond in {language_name}."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(
        text=f"Based on these sensor readings, provide irrigation recommendations:\n{sensor_summary}\n\nProvide specific water amount (liters) and duration (minutes) recommendations. Respond in {language_name}."
    )
    
    response = await chat.send_message(message)
    
    return {"recommendation": response}

@api_router.get("/irrigation/auto-settings")
async def get_auto_irrigation_settings(current_user: Dict = Depends(get_current_user)):
    settings = await db.auto_irrigation_settings.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    
    if not settings:
        # Create default settings with AI recommendations
        default_settings = AutoIrrigationSettings(user_id=current_user['user_id'])
        settings_dict = default_settings.model_dump()
        settings_dict['created_at'] = settings_dict['created_at'].isoformat()
        if settings_dict.get('last_triggered'):
            settings_dict['last_triggered'] = settings_dict['last_triggered'].isoformat()
        
        # Get AI recommendations for thresholds
        sensors = await db.sensor_data.find({}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
        plants = await db.plants.find({}, {"_id": 0}).to_list(100)
        
        sensor_summary = ", ".join([f"{s['sensor_type']}: {s['value']}{s['unit']}" for s in sensors[:6]])
        plants_summary = f"{len(plants)} plants ({sum(1 for p in plants if p['status'] == 'healthy')} healthy)"
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"auto-irrigation-recommend-{uuid.uuid4()}",
            system_message="You are an agricultural AI assistant. Recommend optimal irrigation thresholds."
        ).with_model("openai", "gpt-4o")
        
        message = UserMessage(
            text=f"Based on current conditions: {sensor_summary} and {plants_summary}, recommend optimal thresholds for automatic irrigation. Provide only two numbers: temperature threshold in °C and humidity threshold in %. Format: 'Temperature: X°C, Humidity: Y%'"
        )
        
        ai_response = await chat.send_message(message)
        
        # Parse AI response to extract thresholds
        try:
            import re
            temp_match = re.search(r'Temperature:\s*(\d+\.?\d*)', ai_response)
            humidity_match = re.search(r'Humidity:\s*(\d+\.?\d*)', ai_response)
            if temp_match:
                settings_dict['recommended_temp_threshold'] = float(temp_match.group(1))
            if humidity_match:
                settings_dict['recommended_humidity_threshold'] = float(humidity_match.group(1))
        except:
            settings_dict['recommended_temp_threshold'] = 30.0
            settings_dict['recommended_humidity_threshold'] = 40.0
        
        await db.auto_irrigation_settings.insert_one(settings_dict)
        settings_dict.pop('_id', None)
        return settings_dict
    
    return settings

@api_router.put("/irrigation/auto-settings")
async def update_auto_irrigation_settings(settings: AutoIrrigationSettingsUpdate, current_user: Dict = Depends(get_current_user)):
    # Only update provided fields
    update_dict = {k: v for k, v in settings.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.auto_irrigation_settings.update_one(
        {"user_id": current_user['user_id']},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0 and result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    # Return updated settings
    updated = await db.auto_irrigation_settings.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    return updated

@api_router.post("/irrigation/trigger-auto")
async def trigger_auto_irrigation(request: AIRecommendationRequest = AIRecommendationRequest(), current_user: Dict = Depends(get_current_user)):
    # Get current sensor data
    sensors = await db.sensor_data.find({}, {"_id": 0}).sort("timestamp", -1).limit(10).to_list(10)
    
    # Find temperature and humidity
    temperature = next((s['value'] for s in sensors if s['sensor_type'] == 'temperature'), 25.0)
    humidity = next((s['value'] for s in sensors if s['sensor_type'] == 'humidity'), 50.0)
    
    # Get auto settings
    settings = await db.auto_irrigation_settings.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    
    if not settings:
        raise HTTPException(status_code=404, detail="Auto irrigation settings not found. Please configure first.")
    
    # Check if conditions require irrigation
    should_irrigate = False
    reasons = []
    
    if temperature > settings['temperature_threshold']:
        should_irrigate = True
        reasons.append(f"Temperature ({temperature}°C) exceeds threshold ({settings['temperature_threshold']}°C)")
    
    if humidity < settings['humidity_threshold']:
        should_irrigate = True
        reasons.append(f"Humidity ({humidity}%) below threshold ({settings['humidity_threshold']}%)")
    
    if not should_irrigate:
        return {
            "triggered": False,
            "message": "Conditions do not require irrigation",
            "temperature": temperature,
            "humidity": humidity,
            "thresholds": {
                "temperature": settings['temperature_threshold'],
                "humidity": settings['humidity_threshold']
            }
        }
    
    # Get plants for AI analysis
    plants = await db.plants.find({}, {"_id": 0}).to_list(100)
    
    # Group plants by type and status
    plant_summary = {}
    for plant in plants:
        key = f"{plant['plant_type']}_{plant['status']}"
        plant_summary[key] = plant_summary.get(key, 0) + 1
    
    plants_info = ", ".join([f"{count} {ptype}" for ptype, count in plant_summary.items()])
    
    # Get AI recommendation for water amount
    language_name = "French" if request.language == "fr" else "English"
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"auto-irrigation-trigger-{uuid.uuid4()}",
        system_message=f"You are an agricultural AI assistant. Calculate optimal irrigation amounts based on plant types, conditions, and growth stages. Always respond in {language_name}."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(
        text=f"Auto-irrigation triggered. Conditions: Temperature {temperature}°C, Humidity {humidity}%. Plants: {plants_info}. Recommend specific water amounts (in liters) for each zone/plant type, considering their growth stage and current health status. Format your response with clear zones and amounts."
    )
    
    ai_recommendation = await chat.send_message(message)
    
    # Parse AI response to create irrigation schedules (simplified - extract numbers)
    import re
    water_amounts = re.findall(r'(\d+\.?\d*)\s*(?:L|liters|litres)', ai_recommendation)
    zones_irrigated = []
    total_water = 0
    
    # Create irrigation schedules for each zone
    zone_names = ["Zone A", "Zone B", "Zone C"]
    for idx, zone in enumerate(zone_names[:len(water_amounts)]):
        water_amount = float(water_amounts[idx]) if idx < len(water_amounts) else 150.0
        total_water += water_amount
        zones_irrigated.append(zone)
        
        # Create irrigation schedule
        schedule = IrrigationSchedule(
            zone_name=zone,
            start_time=datetime.now(timezone.utc).strftime("%H:%M"),
            duration_minutes=int(water_amount / 5),  # Assume 5L per minute
            water_amount_liters=water_amount,
            status="scheduled"
        )
        
        schedule_dict = schedule.model_dump()
        schedule_dict['created_at'] = schedule_dict['created_at'].isoformat()
        await db.irrigation.insert_one(schedule_dict)

# ==================== STOCK AI ALERTS ROUTE ====================

class StockAIAlertsRequest(BaseModel):
    language: str = "fr"


@api_router.post("/stock/ai-alerts")
async def get_stock_ai_alerts(request: StockAIAlertsRequest, current_user: Dict = Depends(get_current_user)):
    """Analyse le stock pour détecter les niveaux critiques et générer des recommandations IA.

    - Critique: quantity <= min_threshold
    - Pré-alerte: quantity <= 1.2 * min_threshold (mais > min_threshold)
    """
    # Récupérer tout le stock
    items = await db.stock.find({}, {"_id": 0}).to_list(1000)

    critical_items = []
    warning_items = []

    for item in items:
        qty = float(item.get("quantity", 0))
        threshold = float(item.get("min_threshold", 0))
        if threshold <= 0:
            continue
        if qty <= threshold:
            critical_items.append(item)
        elif qty <= threshold * 1.2:
            warning_items.append(item)

    language_name = "French" if request.language == "fr" else "English"

    # Si aucun problème, message simple sans appel IA
    if not critical_items and not warning_items:
        msg = (
            "Tous les niveaux de stock sont au-dessus des seuils définis. Aucun risque immédiat de rupture." 
            if request.language == "fr" 
            else "All stock levels are above defined thresholds. No immediate stock-out risk."
        )
        return {
            "critical_items": [],
            "warning_items": [],
            "summary": msg,
            "recommendations": "",
        }

    # Construire un résumé texte pour l'IA
    def summarize_items(items_list):
        lines = []
        for it in items_list[:20]:  # limiter pour garder le prompt compact
            lines.append(
                f"- {it['item_name']} ({it['category']}): {it['quantity']} {it['unit']} (seuil {it['min_threshold']})"
            )
        return "\n".join(lines)

    critical_summary = summarize_items(critical_items)
    warning_summary = summarize_items(warning_items)

    prompt = (
        f"You are an AI assistant specialized in farm inventory management. "
        f"Analyze the following stock situation and provide:")
    if request.language == "fr":
        prompt = (
            "Tu es un assistant IA spécialisé en gestion de stock agricole. "
            "Analyse la situation suivante et fournis: \n"
            "1) Un court résumé des risques de rupture de stock. \n"
            "2) Des recommandations concrètes: quels produits réapprovisionner en priorité, "
            "quelles quantités approximatives, et d'éventuelles substitutions. Réponds en Français.\n\n"
        )
    else:
        prompt = (
            "You are an AI assistant specialized in farm inventory management. "
            "Analyze the following situation and provide: \n"
            "1) A short summary of stock-out risks. \n"
            "2) Concrete recommendations: which products to restock first, approximate quantities, "
            "and possible substitutions. Respond in English.\n\n"
        )

    prompt += "CRITICAL ITEMS (below minimum threshold):\n" + (critical_summary or "None") + "\n\n"
    prompt += "WARNING ITEMS (close to minimum threshold):\n" + (warning_summary or "None")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"stock-ai-alerts-{uuid.uuid4()}",
        system_message=(
            "You are an AI assistant helping a farm manager keep stock at safe levels while minimizing waste."
        ),
    ).with_model("openai", "gpt-4o")

    message = UserMessage(text=prompt)
    ai_response = await chat.send_message(message)

    return {
        "critical_items": critical_items,
        "warning_items": warning_items,
        "summary": "",
        "recommendations": ai_response,
    }


        await db.irrigation.insert_one(schedule_dict)
    
    # Record trigger
    trigger = AutoIrrigationTrigger(
        triggered_by="auto" if settings.get('enabled') else "manual",
        temperature=temperature,
        humidity=humidity,
        zones_irrigated=zones_irrigated,
        total_water_used=total_water,
        ai_recommendation=ai_recommendation
    )
    
    trigger_dict = trigger.model_dump()
    trigger_dict['timestamp'] = trigger_dict['timestamp'].isoformat()
    await db.auto_irrigation_triggers.insert_one(trigger_dict)
    
    # Update last triggered timestamp
    await db.auto_irrigation_settings.update_one(
        {"user_id": current_user['user_id']},
        {"$set": {"last_triggered": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "triggered": True,
        "reasons": reasons,
        "zones_irrigated": zones_irrigated,
        "total_water_used": total_water,
        "ai_recommendation": ai_recommendation,
        "temperature": temperature,
        "humidity": humidity
    }

@api_router.get("/irrigation/auto-history")
async def get_auto_irrigation_history(limit: int = 10, current_user: Dict = Depends(get_current_user)):
    history = await db.auto_irrigation_triggers.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return history

# Generic irrigation routes (MUST be after specific routes to avoid conflicts)
@api_router.get("/irrigation")
async def get_irrigation_schedules(current_user: Dict = Depends(get_current_user)):
    schedules = await db.irrigation.find({}, {"_id": 0}).to_list(1000)
    return schedules

@api_router.post("/irrigation")
async def create_irrigation_schedule(schedule: IrrigationSchedule, current_user: Dict = Depends(get_current_user)):
    schedule_dict = schedule.model_dump()
    schedule_dict['created_at'] = schedule_dict['created_at'].isoformat()
    result = await db.irrigation.insert_one(schedule_dict)
    # Return the schedule without MongoDB's _id
    schedule_dict.pop('_id', None)
    return schedule_dict

@api_router.put("/irrigation/{schedule_id}")
async def update_irrigation_schedule(schedule_id: str, status: str, current_user: Dict = Depends(get_current_user)):
    await db.irrigation.update_one({"id": schedule_id}, {"$set": {"status": status}})
    return {"message": "Schedule updated"}

# ==================== PLANTS ROUTES ====================

@api_router.get("/plants")
async def get_plants(current_user: Dict = Depends(get_current_user)):
    plants = await db.plants.find({}, {"_id": 0}).to_list(1000)
    return plants

@api_router.post("/plants")
async def create_plant(plant: Plant, current_user: Dict = Depends(get_current_user)):
    plant_dict = plant.model_dump()
    plant_dict['created_at'] = plant_dict['created_at'].isoformat()
    if plant_dict.get('last_inspection'):
        plant_dict['last_inspection'] = plant_dict['last_inspection'].isoformat()
    result = await db.plants.insert_one(plant_dict)
    plant_dict.pop('_id', None)
    return plant_dict

@api_router.post("/plants/diagnose")
async def diagnose_plant(request: PlantDiagnosisRequest, current_user: Dict = Depends(get_current_user)):
    plant_id = request.plant_id
    image_base64 = request.image_base64
    # Get user settings for AI provider
    settings = await db.settings.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    provider = settings.get('ai_provider', 'openai') if settings else 'openai'
    model = settings.get('ai_model', 'gpt-4o') if settings else 'gpt-4o'
    
    # Create AI chat session
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"plant-diagnosis-{uuid.uuid4()}",
        system_message="You are an expert agricultural botanist. Analyze plant images and provide detailed diagnosis including diseases, pests, nutritional deficiencies, and treatment recommendations."
    ).with_model(provider, model)
    
    # Create image content
    image_content = ImageContent(image_base64=image_base64)
    
    # Get language-specific prompt
    language_name = "French" if request.language == "fr" else "English"
    
    message = UserMessage(
        text=f"Analyze this plant image quickly and respond in {language_name}. Provide: 1) Health status (1-2 sentences), 2) Visible diseases/pests if any, 3) Nutrient issues if any, 4) 2-3 specific treatment recommendations, 5) 1-2 preventive tips. Be concise but practical.",
        file_contents=[image_content]
    )
    
    response = await chat.send_message(message)
    
    # Save diagnosis
    diagnosis = PlantDiagnosis(
        plant_id=plant_id,
        diagnosis=response,
        recommendations=response,
        image_base64=image_base64
    )
    
    diagnosis_dict = diagnosis.model_dump()
    diagnosis_dict['created_at'] = diagnosis_dict['created_at'].isoformat()
    result = await db.plant_diagnoses.insert_one(diagnosis_dict)
    
    # Update plant status
    await db.plants.update_one(
        {"id": plant_id},
        {"$set": {"last_inspection": datetime.now(timezone.utc).isoformat()}}
    )
    
    diagnosis_dict.pop('_id', None)
    return diagnosis_dict

@api_router.get("/plants/{plant_id}/diagnoses")
async def get_plant_diagnoses(plant_id: str, current_user: Dict = Depends(get_current_user)):
    diagnoses = await db.plant_diagnoses.find({"plant_id": plant_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return diagnoses

# ==================== STOCK ROUTES ====================

@api_router.get("/stock")
async def get_stock(current_user: Dict = Depends(get_current_user)):
    stock = await db.stock.find({}, {"_id": 0}).to_list(1000)
    return stock

@api_router.post("/stock")
async def create_stock_item(item: Stock, current_user: Dict = Depends(get_current_user)):
    item_dict = item.model_dump()
    item_dict['last_updated'] = item_dict['last_updated'].isoformat()
    result = await db.stock.insert_one(item_dict)
    item_dict.pop('_id', None)
    return item_dict

@api_router.put("/stock/{item_id}")
async def update_stock_item(item_id: str, update_data: StockUpdate, current_user: Dict = Depends(get_current_user)):
    # Prepare update dict with only provided fields
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Add last_updated timestamp
    update_dict['last_updated'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.stock.update_one(
        {"id": item_id},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    # Return updated item
    updated_item = await db.stock.find_one({"id": item_id}, {"_id": 0})
    return updated_item

@api_router.delete("/stock/{item_id}")
async def delete_stock_item(item_id: str, current_user: Dict = Depends(get_current_user)):
    await db.stock.delete_one({"id": item_id})
    return {"message": "Stock item deleted"}

# ==================== SALES ROUTES ====================

@api_router.get("/sales")
async def get_sales(current_user: Dict = Depends(get_current_user)):
    sales = await db.sales.find({}, {"_id": 0}).sort("sale_date", -1).to_list(1000)
    return sales

@api_router.post("/sales")
async def create_sale(sale: Sale, current_user: Dict = Depends(get_current_user)):
    sale_dict = sale.model_dump()
    sale_dict['sale_date'] = sale_dict['sale_date'].isoformat()
    result = await db.sales.insert_one(sale_dict)
    
    # Update customer total purchases
    await db.customers.update_one(
        {"id": sale.customer_id},
        {"$inc": {"total_purchases": sale.total_amount}}
    )
    
    sale_dict.pop('_id', None)
    return sale_dict

@api_router.post("/sales/forecast")
async def get_sales_forecast(request: AIRecommendationRequest = AIRecommendationRequest(), current_user: Dict = Depends(get_current_user)):
    # Get recent sales data
    sales = await db.sales.find({}, {"_id": 0}).sort("sale_date", -1).limit(30).to_list(30)
    
    language_name = "French" if request.language == "fr" else "English"
    
    if not sales:
        no_data_msg = "Aucune donnée de vente disponible pour les prévisions" if request.language == "fr" else "No sales data available for forecasting"
        return {"forecast": no_data_msg}
    
    sales_summary = f"Total sales: {len(sales)}, Total revenue: ${sum(s['total_amount'] for s in sales):.2f}"
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"sales-forecast-{uuid.uuid4()}",
        system_message=f"You are a sales forecasting AI. Analyze sales data and provide predictions. Always respond in {language_name}."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(
        text=f"Based on this sales summary, provide a forecast for next month: {sales_summary}. Include expected demand trends and recommendations. Respond in {language_name}."
    )
    
    response = await chat.send_message(message)
    
    return {"forecast": response}

# ==================== CUSTOMERS ROUTES ====================

@api_router.get("/customers")
async def get_customers(current_user: Dict = Depends(get_current_user)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    return customers

@api_router.post("/customers")
async def create_customer(customer: Customer, current_user: Dict = Depends(get_current_user)):
    customer_dict = customer.model_dump()
    customer_dict['created_at'] = customer_dict['created_at'].isoformat()
    result = await db.customers.insert_one(customer_dict)
    customer_dict.pop('_id', None)
    return customer_dict

@api_router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, customer: Customer, current_user: Dict = Depends(get_current_user)):
    customer_dict = customer.model_dump()
    customer_dict['created_at'] = customer_dict['created_at'].isoformat()
    await db.customers.update_one({"id": customer_id}, {"$set": customer_dict})
    return customer_dict

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, current_user: Dict = Depends(get_current_user)):
    await db.customers.delete_one({"id": customer_id})
    return {"message": "Customer deleted"}

# ==================== EMPLOYEES ROUTES ====================

@api_router.get("/employees")
async def get_employees(current_user: Dict = Depends(get_current_user)):
    # Inclure tous les rôles pertinents (admin, manager, employee) pour peupler la liste du personnel
    employees = await db.users.find(
        {"role": {"$in": ["admin", "manager", "employee"]}},
        {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    
    # Calculer quelques statistiques simples pour l'affichage
    for emp in employees:
        tasks = await db.tasks.count_documents({"assigned_to": emp['id'], "status": "completed"})
        emp['tasks_completed'] = tasks
        emp['performance_score'] = round(random.uniform(3.5, 5.0), 1)
    
    return employees

# ==================== TASKS ROUTES ====================

@api_router.get("/tasks")
async def get_tasks(current_user: Dict = Depends(get_current_user)):
    if current_user['role'] == 'employee':
        tasks = await db.tasks.find({"assigned_to": current_user['user_id']}, {"_id": 0}).to_list(1000)
    else:
        tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    return tasks

@api_router.post("/tasks")
async def create_task(task: Task, current_user: Dict = Depends(get_current_user)):
    task_dict = task.model_dump()
    task_dict['created_at'] = task_dict['created_at'].isoformat()
    result = await db.tasks.insert_one(task_dict)
    task_dict.pop('_id', None)
    return task_dict

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, status: str, current_user: Dict = Depends(get_current_user)):
    await db.tasks.update_one({"id": task_id}, {"$set": {"status": status}})
    return {"message": "Task updated"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: Dict = Depends(get_current_user)):
    await db.tasks.delete_one({"id": task_id})
    return {"message": "Task deleted"}

# ==================== REPORTS & ANALYTICS ====================

@api_router.get("/reports/dashboard")
async def get_dashboard_stats(current_user: Dict = Depends(get_current_user)):
    # Get various stats
    total_plants = await db.plants.count_documents({})
    healthy_plants = await db.plants.count_documents({"status": "healthy"})
    total_stock_items = await db.stock.count_documents({})
    low_stock_items = await db.stock.count_documents({"$expr": {"$lte": ["$quantity", "$min_threshold"]}})
    
    total_sales = await db.sales.count_documents({})
    sales = await db.sales.find({}, {"_id": 0}).to_list(1000)
    total_revenue = sum(s['total_amount'] for s in sales)
    
    total_customers = await db.customers.count_documents({})
    pending_tasks = await db.tasks.count_documents({"status": "pending"})
    
    # Recent sensor data
    recent_sensors = await db.sensor_data.find({}, {"_id": 0}).sort("timestamp", -1).limit(6).to_list(6)
    
    return {
        "total_plants": total_plants,
        "healthy_plants": healthy_plants,
        "plant_health_rate": round((healthy_plants / total_plants * 100) if total_plants > 0 else 0, 1),
        "total_stock_items": total_stock_items,
        "low_stock_items": low_stock_items,
        "total_sales": total_sales,
        "total_revenue": round(total_revenue, 2),
        "total_customers": total_customers,
        "pending_tasks": pending_tasks,
        "recent_sensors": recent_sensors
    }

@api_router.get("/reports/yield")
async def get_yield_report(current_user: Dict = Depends(get_current_user)):
    # Get harvested products from stock
    products = await db.stock.find({"category": "harvested_products"}, {"_id": 0}).to_list(1000)
    return {"products": products, "total_yield": sum(p['quantity'] for p in products)}

# ==================== AI RECOMMENDATIONS ====================

@api_router.get("/ai/recommendations")
async def get_ai_recommendations(current_user: Dict = Depends(get_current_user)):
    recommendations = await db.recommendations.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    return recommendations

@api_router.post("/ai/generate-recommendations")
async def generate_recommendations(request: AIRecommendationRequest = AIRecommendationRequest(), current_user: Dict = Depends(get_current_user)):
    # Get various data
    sensors = await db.sensor_data.find({}, {"_id": 0}).sort("timestamp", -1).limit(6).to_list(6)
    stock = await db.stock.find({"$expr": {"$lte": ["$quantity", "$min_threshold"]}}, {"_id": 0}).to_list(10)
    
    sensor_summary = ", ".join([f"{s['sensor_type']}: {s['value']}{s['unit']}" for s in sensors])
    low_stock_summary = ", ".join([f"{s['item_name']} ({s['quantity']}{s['unit']})" for s in stock[:5]])
    
    language_name = "French" if request.language == "fr" else "English"
    
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"recommendations-{uuid.uuid4()}",
        system_message=f"You are an AI farm management assistant. Provide actionable recommendations. Always respond in {language_name}."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(
        text=f"Generate 3 prioritized farm management recommendations based on:\nSensors: {sensor_summary}\nLow stock items: {low_stock_summary or 'None'}\n\nFormat: Priority (high/medium/low), Title (short), Description (1-2 sentences). Respond in {language_name}."
    )
    
    response = await chat.send_message(message)
    
    # Parse and save recommendations
    rec = AIRecommendation(
        recommendation_type="general",
        title="AI-Generated Recommendations",
        description=response,
        priority="medium"
    )
    
    rec_dict = rec.model_dump()
    rec_dict['created_at'] = rec_dict['created_at'].isoformat()
    result = await db.recommendations.insert_one(rec_dict)
    
    rec_dict.pop('_id', None)
    return rec_dict

# ==================== SETTINGS ====================

@api_router.get("/settings")
async def get_settings(current_user: Dict = Depends(get_current_user)):
    settings = await db.settings.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = Settings(user_id=current_user['user_id'])
        settings_dict = default_settings.model_dump()
        await db.settings.insert_one(settings_dict)
        return settings_dict
    return settings

@api_router.put("/settings")
async def update_settings(settings: Settings, current_user: Dict = Depends(get_current_user)):
    settings_dict = settings.model_dump()
    settings_dict['user_id'] = current_user['user_id']
    await db.settings.update_one(
        {"user_id": current_user['user_id']},
        {"$set": settings_dict},
        upsert=True
    )
    return settings_dict

# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "AgroFarm API v1.0", "status": "operational"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()