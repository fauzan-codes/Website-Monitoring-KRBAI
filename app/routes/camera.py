# app/routes/camera.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from datetime import datetime
import threading
import atexit
import time
import cv2
import os
import re

router = APIRouter(prefix="/camera")

record_thread = None
frame_lock = threading.Lock()
last_frame_time = 0

CAPTURE_DIRS = {
    "front": "data/captures/front",
    "side": "data/captures/side",
    "bottom": "data/captures/bottom"
}

RECORD_DIRS = {
    "front": "data/recordings/front",
    "side": "data/recordings/side",
    "bottom": "data/recordings/bottom"
}

for d in CAPTURE_DIRS.values():
    os.makedirs(d, exist_ok=True)

for d in RECORD_DIRS.values():
    os.makedirs(d, exist_ok=True)


cameras = {
    "front": {
        "cap": cv2.VideoCapture(5),
        "latest_frame": None,
        "recording": False,
        "video_writer": None,
        "last_frame_time": 0
    },
    "bottom": {
        "cap": cv2.VideoCapture(0),  
        "latest_frame": None,
        "recording": False,
        "video_writer": None,
        "last_frame_time": 0
    },
    "side": {
        "cap": None,
        "latest_frame": None,
        "recording": False,
        "video_writer": None,
        "last_frame_time": 0
    }
    
}

camera_running = True
def camera_loop(name):
    cam = cameras[name]

    while camera_running:
        cap = cam["cap"]

        if cap is None or not cap.isOpened():
            with frame_lock:
                cam["latest_frame"] = None
            time.sleep(1)
            continue

        success, frame = cap.read()

        if not success:
            with frame_lock:
                cam["latest_frame"] = None
            time.sleep(1)
            continue

        with frame_lock:
            cam["latest_frame"] = frame.copy()
            cam["last_frame_time"] = time.time()

            if cam["recording"] and cam["video_writer"]:
                cam["video_writer"].write(frame)

        time.sleep(0.03)


def generate_frames(camera_name: str):
    try:
        while camera_running:
            cam = cameras[camera_name]

            with frame_lock:
                frame = cam["latest_frame"]

            if frame is None:
                time.sleep(0.1)
                continue

            _, buffer = cv2.imencode(".jpg", frame)

            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' +
                buffer.tobytes() +
                b'\r\n'
            )

    except GeneratorExit:
        print(f"[CLIENT DISCONNECTED] {camera_name}")

    

def get_next_index(folder_path: str, base_prefix: str, ext: str):

    pattern = re.compile(
        rf"{base_prefix}_\d{{4}}-\d{{2}}-\d{{2}}_(\d+)\.{ext}$"
    )
    max_index = 0

    for filename in os.listdir(folder_path):
        match = pattern.match(filename)
        if match:
            try:
                num = int(match.group(1))
                if num > max_index:
                    max_index = num
            except:
                pass

    return max_index + 1


def generate_filename(camera_name: str, mode: str, ext: str, folder: str):
    date_str = datetime.now().strftime("%Y-%m-%d")
    base_prefix = f"{camera_name}_{mode}_{date_str}"
    next_index = get_next_index(folder, f"{camera_name}_{mode}", ext)
    index_str = str(next_index).zfill(3)
    filename = f"{base_prefix}_{index_str}.{ext}"

    return os.path.join(folder, filename)

def release_camera():
    global camera_running
    camera_running = False 

    time.sleep(0.5) 

    for cam in cameras.values():
        if cam["cap"] and cam["cap"].isOpened():
            cam["cap"].release()
















@router.get("/front/stream")
def stream_front():
    return StreamingResponse(
        generate_frames("front"),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/bottom/stream")
def stream_bottom():
    return StreamingResponse(
        generate_frames("bottom"),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/side/stream")
def stream_side():
    return StreamingResponse(
        generate_frames("side"),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


# ================= CAPTURE =================
@router.post("/capture/{camera_name}")
def take_capture(camera_name: str):
    cam = cameras.get(camera_name)

    if not cam:
        return {"success": False, "message": "Invalid camera"}

    frame = cam["latest_frame"]

    if frame is None:
        return {"success": False, "message": "Camera not ready"}

    folder = f"data/captures/{camera_name}"
    os.makedirs(folder, exist_ok=True)

    with frame_lock:
        path = generate_filename(
            camera_name,
            "capture",
            "jpg",
            folder
        )
        cv2.imwrite(path, frame)

    return {"success": True, "file": path}


# ================= RECORD START =================
@router.post("/record/start/{camera_name}")
def start_record(camera_name: str):
    cam = cameras.get(camera_name)

    if not cam or cam["latest_frame"] is None:
        return {"success": False}

    h, w, _ = cam["latest_frame"].shape

    folder = f"data/recordings/{camera_name}"
    os.makedirs(folder, exist_ok=True)

    with frame_lock:
        path = generate_filename(
            camera_name,
            "recording",
            "avi",
            folder
        )

    cam["video_writer"] = cv2.VideoWriter(
        path,
        cv2.VideoWriter_fourcc(*'XVID'),
        20,
        (w, h)
    )

    if not cam["video_writer"].isOpened():
        return {"success": False, "message": "Failed to start recording"}

    cam["recording"] = True
    return {"success": True, "message": "Start Recording"}


# ================= RECORD STOP =================
@router.post("/record/stop/{camera_name}")
def stop_record(camera_name: str):
    cam = cameras.get(camera_name)

    if not cam or not cam["recording"]:
        return {"success": False}

    cam["recording"] = False

    if cam["video_writer"]:
        cam["video_writer"].release()
        cam["video_writer"] = None

    return {"success": True}


@router.get("/record/status/{camera_name}")
def record_status(camera_name: str):
    cam = cameras.get(camera_name)

    if not cam:
        return {"success": False}

    return {
        "recording": cam["recording"]
    }


@router.get("/status/{camera_name}")
def camera_status(camera_name: str):
    cam = cameras.get(camera_name)

    if not cam:
        return {"device": False, "streaming": False}

    now = time.time()

    device = (
        cam["cap"] is not None and
        cam["cap"].isOpened()
    )

    streaming = (
        device and
        cam["latest_frame"] is not None and
        (now - cam["last_frame_time"]) < 2
    )

    return {
        "device": device,
        "streaming": streaming
    }




for name in cameras:
    threading.Thread(target=camera_loop, args=(name,), daemon=True).start()
atexit.register(release_camera)