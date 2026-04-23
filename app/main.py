from fastapi import FastAPI

from app.routes import camera
from app.routes import telemetry
from app.routes import control


app = FastAPI()
    
app.include_router(camera.router)
app.include_router(telemetry.router)
app.include_router(control.router)

@app.get("/")
def root():
    return {"message": "API jalan!"}
    