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
        for client in self.clients:
            await client.send_json(data)

manager = ConnectionManager()