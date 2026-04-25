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
def camera_page(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "page": "pages/thrustercontrol.html"
        }
    )


# @app.get("/mission-planner")
# def data_page(request: Request):
#     return templates.TemplateResponse(
#         "index.html",
#         {
#             "request": request,
#             "page": "pages/missionplaner.html"
#         }
#     )


# @app.get("/sensor")
# def settings_page(request: Request):
#     return templates.TemplateResponse(
#         "index.html",
#         {
#             "request": request,
#             "page": "pages/sensorpid.html"
#         }
#     )


# @app.get("/camera-settings")
# def settings_page(request: Request):
#     return templates.TemplateResponse(
#         "index.html",
#         {
#             "request": request,
#             "page": "pages/camerasettings.html"
#         }
#     )


# @app.get("/connection")
# def settings_page(request: Request):
#     return templates.TemplateResponse(
#         "index.html",
#         {
#             "request": request,
#             "page": "pages/connection.html"
#         }
#     )



# @app.get("/data-logging")
# def settings_page(request: Request):
#     return templates.TemplateResponse(
#         "index.html",
#         {
#             "request": request,
#             "page": "pages/datalogging.html"
#         }
#     )



# @app.get("/system-setting")
# def settings_page(request: Request):
#     return templates.TemplateResponse(
#         "index.html",
#         {
#             "request": request,
#             "page": "pages/systemsetting.html"
#         }
#     )
    