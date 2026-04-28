from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

mission_state = {
    "is_running": False,
    "start_time": None,
    "elapsed": 0,
    "last_access": None
}

AUTO_STOP_SECONDS = 5   # DEBUG MODE
# AUTO_STOP_SECONDS = 300


def get_current_elapsed():
    if mission_state["is_running"]:
        now = datetime.now()

        idle_time = (
            now - mission_state["last_access"]
        ).total_seconds()

        # auto stop jika website ditutup/tidak akses
        if idle_time >= AUTO_STOP_SECONDS:
            mission_state["elapsed"] += (
                mission_state["last_access"] - mission_state["start_time"]
            ).total_seconds()

            mission_state["is_running"] = False
            mission_state["start_time"] = None

        else:
            return int(
                mission_state["elapsed"] +
                (now - mission_state["start_time"]).total_seconds()
            )

    return int(mission_state["elapsed"])


@router.post("/mission/start")
def start_mission():
    if not mission_state["is_running"]:
        mission_state["start_time"] = datetime.now()
        mission_state["is_running"] = True

    mission_state["last_access"] = datetime.now()

    return {
        "message": "Mission started"
    }


@router.post("/mission/stop")
def stop_mission():
    if mission_state["is_running"]:
        mission_state["elapsed"] += (
            datetime.now() - mission_state["start_time"]
        ).total_seconds()

        mission_state["is_running"] = False
        mission_state["start_time"] = None

    mission_state["last_access"] = datetime.now()

    return {
        "message": "Mission stopped"
    }


@router.post("/mission/reset")
def reset_mission():
    mission_state["is_running"] = False
    mission_state["start_time"] = None
    mission_state["elapsed"] = 0
    mission_state["last_access"] = datetime.now()

    return {
        "message": "Mission reset"
    }


@router.get("/mission/status")
def mission_status():
    mission_state["last_access"] = datetime.now()

    return {
        "is_running": mission_state["is_running"],
        "elapsed": get_current_elapsed()
    }