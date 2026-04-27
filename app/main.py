# app/main.py
from fastapi import Request, FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from app.routes import camera
from app.routes import telemetry
from app.routes import control



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

@app.get("/")
def dashboard(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/dashboard.html"
        }
    )


@app.get("/thruster-control")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/thrustercontrol.html"
        }
    )


@app.get("/mission-planner")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/missionplaner.html"
        }
    )


@app.get("/sensor")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/sensorpid.html"
        }
    )


@app.get("/camera-settings")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/camerasettings.html"
        }
    )


@app.get("/connection")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/connection.html"
        }
    )


@app.get("/data-logging")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/datalogging.html"
        }
    )


@app.get("/system-setting")
def thruster_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "page": "pages/systemsettings.html"
        }
    )
    