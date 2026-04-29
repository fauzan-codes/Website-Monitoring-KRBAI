# app/main.py
from fastapi import Request, FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from app.routes import camera
from app.routes import telemetry
from app.routes import control
from app.routes import mission_timer
from app.routes import orientation



app = FastAPI(
    # docs_url=None,
    # redoc_url=None,
    # openapi_url=None
)

templates = Jinja2Templates(directory="frontend")
app.mount("/static", StaticFiles(directory="frontend"), name="static")
    
app.include_router(camera.router)
app.include_router(telemetry.router)
app.include_router(control.router)
app.include_router(mission_timer.router)
app.include_router(orientation.router)

@app.get("/")
def dashboard(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/dashboard.html",
            "page_title": "Dashboard Monitoring"
        }
    )


@app.get("/thruster-control")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/thrustercontrol.html",
            "page_title": "Thruster Control"
        }
    )


@app.get("/mission-planner")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/missionplaner.html",
            "page_title": "Mission Planner"
        }
    )


@app.get("/sensor")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/sensorpid.html",
            "page_title": "Sensor & PID Tunning"
        }
    )


@app.get("/camera-settings")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/camerasettings.html",
            "page_title": "Camera Settings"
        }
    )


@app.get("/connection")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/connection.html",
            "page_title": "Connections"
        }
    )


@app.get("/data-logging")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/datalogging.html",
            "page_title": "Data Logging"
        }
    )


@app.get("/system-setting")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/systemsettings.html",
            "page_title": "System Settings"
        }
    )
    