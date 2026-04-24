# app/websocket/manager.py
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.clients = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.clients.append(ws)

    def disconnect(self, ws: WebSocket):
        self.clients.remove(ws)

    async def broadcast(self, data):
        disconnected = []

        for client in self.clients:
            try:
                await client.send_json(data)
            except:
                disconnected.append(client)

        for client in disconnected:
            self.clients.remove(client)

manager = ConnectionManager()