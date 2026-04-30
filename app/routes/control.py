# app/routes/control.py
import socket
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.db import SessionLocal
from app.database.models import ThrusterConfig

router = APIRouter(prefix="/control")

class ControlCommand(BaseModel):
    action: str
    value: int | None = None

from pydantic import BaseModel

class ThrusterTest(BaseModel):
    front_left: int
    front_right: int
    rear_left: int
    rear_right: int
    top: int
    bottom: int

def clamp(value: int):
    return max(-100, min(100, value))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()












@router.post("/thruster-test")
async def thruster_test(data: ThrusterTest, db: Session = Depends(get_db)):

    # clamp
    data.front_left = clamp(data.front_left)
    data.front_right = clamp(data.front_right)
    data.rear_left = clamp(data.rear_left)
    data.rear_right = clamp(data.rear_right)
    data.top = clamp(data.top)
    data.bottom = clamp(data.bottom)

    config = db.query(ThrusterConfig).first()

    if not config:
        config = ThrusterConfig(id=1)
        db.add(config)
        db.commit()
        db.refresh(config)

    config.front_left = data.front_left
    config.front_right = data.front_right
    config.rear_left = data.rear_left
    config.rear_right = data.rear_right
    config.top = data.top
    config.bottom = data.bottom

    db.add(config)
    db.commit()

    print("CONFIG SAVED ✅")

    return {
        "success": True,
        "message": "Thruster config saved & test started"
    }


@router.get("/thruster-config")
def get_thruster_config(db: Session = Depends(get_db)):

    config = db.query(ThrusterConfig).first()

    if not config:
        config = ThrusterConfig()
        db.add(config)
        db.commit()
        db.refresh(config)

    return {
        "front_left": config.front_left,
        "front_right": config.front_right,
        "rear_left": config.rear_left,
        "rear_right": config.rear_right,
        "top": config.top,
        "bottom": config.bottom
    }



@router.post("/command")
async def control_command(data: ControlCommand, db: Session = Depends(get_db)):
    print("\n \033[92m", "Command:", data.action, "\033[0m")
    print(" \033[92m", "Value:", data.value, "\033[0m \n")

    if data.action == "EMERGENCY_STOP":
        config = db.query(ThrusterConfig).first()

        if not config:
            config = ThrusterConfig(id=1)
            db.add(config)
            db.commit()
            db.refresh(config)

        # 🔥 reset semua ke 0
        config.front_left = 0
        config.front_right = 0
        config.rear_left = 0
        config.rear_right = 0
        config.top = 0
        config.bottom = 0

        db.commit()

        print("🚨 EMERGENCY STOP → CONFIG RESET TO 0")

    return {
        "success": True,
        "message": f"{data.action} executed"
    }