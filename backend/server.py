from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Project Aegis API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class AttackRunCreate(BaseModel):
    duration_ticks: int
    peak_spot_price: float
    twap_final: float
    vulnerable_final_balance: float
    secure_final_balance: float
    circuit_breaker_tripped: bool
    variance_pct: float
    vulnerable_status: Literal["DRAINED", "SAFE"]
    secure_status: Literal["DEFENDED", "COMPROMISED"]
    logs_vulnerable: List[str] = Field(default_factory=list)
    logs_secure: List[str] = Field(default_factory=list)


class AttackRun(AttackRunCreate):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AttackStats(BaseModel):
    total_runs: int
    attacks_defended: int
    total_value_saved: float
    total_value_lost_in_vulnerable: float


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Project Aegis API online", "service": "aegis-oracle-router"}


@api_router.post("/attack-runs", response_model=AttackRun)
async def create_attack_run(payload: AttackRunCreate):
    run = AttackRun(**payload.model_dump())
    doc = run.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.attack_runs.insert_one(doc)
    return run


@api_router.get("/attack-runs", response_model=List[AttackRun])
async def list_attack_runs(limit: int = 20):
    cursor = db.attack_runs.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    runs = await cursor.to_list(length=limit)
    for r in runs:
        if isinstance(r.get('created_at'), str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return runs


@api_router.get("/attack-runs/stats", response_model=AttackStats)
async def get_stats():
    runs = await db.attack_runs.find({}, {"_id": 0}).to_list(length=1000)
    total = len(runs)
    defended = sum(1 for r in runs if r.get('secure_status') == 'DEFENDED')
    value_saved = sum(r.get('secure_final_balance', 0) for r in runs)
    value_lost = sum(20_000_000 - r.get('vulnerable_final_balance', 0) for r in runs)
    return AttackStats(
        total_runs=total,
        attacks_defended=defended,
        total_value_saved=value_saved,
        total_value_lost_in_vulnerable=value_lost,
    )


@api_router.get("/attack-runs/{run_id}", response_model=AttackRun)
async def get_attack_run(run_id: str):
    doc = await db.attack_runs.find_one({"id": run_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Attack run not found")
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    return doc


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


