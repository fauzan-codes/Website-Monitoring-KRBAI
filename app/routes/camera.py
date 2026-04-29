# app/routes/camera.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from datetime import datetime
import time
import cv2
import os
import threading

router = APIRouter(prefix="/camera")

cap = cv2.VideoCapture(0)
latest_frame = None

recording = False
video_writer = None
record_thread = None

SCREENSHOT_DIR = "data/screenshots/front"
RECORD_DIR = "data/recordings/front"

os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(RECORD_DIR, exist_ok=True)


def generate_frames():
    global latest_frame, recording, video_writer

    if not cap.isOpened():
        print("Camera gagal dibuka")
        return

    while True:
        success, frame = cap.read()

        if not success:
            print("Camera disconnected")

            if recording and video_writer:
                try:
                    video_writer.release()
                except:
                    pass

            recording = False
            video_writer = None
            break

        latest_frame = frame.copy()

        if recording and video_writer:
            video_writer.write(frame)

        _, buffer = cv2.imencode(".jpg", frame)
        frame_bytes = buffer.tobytes()

        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' +
            frame_bytes +
            b'\r\n'
        )

@router.get("/stream")
def stream_camera():
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


# ================= SCREENSHOT =================
@router.post("/screenshot")
def take_screenshot():
    global latest_frame

    if latest_frame is None:
        return {
            "success": False,
            "message": "Turn on camera first"
        }

    filename = f"front_screenshot_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.jpg"
    filepath = os.path.join(SCREENSHOT_DIR, filename)

    cv2.imwrite(filepath, latest_frame)

    return {
        "success": True,
        "message": "Screenshot saved",
        "file": filepath
    }


# ================= RECORD START =================
@router.post("/record/start")
def start_recording():
    global recording, video_writer, latest_frame

    if recording:
        return {
            "success": False,
            "message": "Already recording"
        }

    if latest_frame is None:
        return {
            "success": False,
            "message": "Turn on camera first"
        }

    height, width, _ = latest_frame.shape

    filename = f"front_recording_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.avi"
    filepath = os.path.join(RECORD_DIR, filename)

    fourcc = cv2.VideoWriter_fourcc(*'XVID')

    video_writer = cv2.VideoWriter(
        filepath,
        fourcc,
        20.0,
        (width, height)
    )

    recording = True

    return {
        "success": True,
        "message": "Recording started",
        "file": filepath
    }


# ================= RECORD STOP =================
@router.post("/record/stop")
def stop_recording():
    global recording, video_writer

    if not recording:
        return {
            "success": False,
            "message": "Recording not active"
        }

    recording = False

    if video_writer:
        try:
            video_writer.release()
        except:
            pass
        finally:
            video_writer = None

    return {
        "success": True,
        "message": "Recording stopped"
    }


@router.get("/record/status")
def record_status():
    return {
        "recording": recording
    }