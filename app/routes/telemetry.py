# app/routes/telemetry.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager
import asyncio
import random

router = APIRouter()

@router.websocket("/ws/telemetry")
async def telemetry_ws(ws: WebSocket):
    await manager.connect(ws)

    print("Client telemetry connected")

    try:
        while True:
            data = {
                "depth": round(random.uniform(0, 20), 2),
                "yaw": random.randint(0, 360),
                "pitch": random.randint(-90, 90),
                "roll": random.randint(-180, 180),
                "battery": round(random.uniform(40, 100), 1),
                "movement": random.choice([
                    "Forward",
                    "Backward",
                    "Hovering",
                    "Descending"
                ]),

                "thrusters": {
                    "front_left": random.randint(0, 100),
                    "front_right": random.randint(0, 100),
                    "rear_left": random.randint(0, 100),
                    "rear_right": random.randint(0, 100),
                    "top": random.randint(0, 100),
                    "bottom": random.randint(0, 100)
                }
            }

            await ws.send_json(data)
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("Client disconnected")

    except Exception as e:
        print("Telemetry error:", e)

    finally:
        manager.disconnect(ws)