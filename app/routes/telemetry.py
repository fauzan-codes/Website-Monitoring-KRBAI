from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager
import asyncio
import random

router = APIRouter()

@router.websocket("/ws/telemetry")
async def telemetry_ws(ws: WebSocket):
    await manager.connect(ws)

    try:
        while True:
            # simulasi data sensor
            data = {
                "depth": round(random.uniform(0, 5), 2),
                "yaw": random.randint(0, 360),
                "pitch": random.randint(-10, 10),
                "roll": random.randint(-10, 10),
                "mode": "AUTO"
            }

            await manager.broadcast(data)
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        manager.disconnect(ws)