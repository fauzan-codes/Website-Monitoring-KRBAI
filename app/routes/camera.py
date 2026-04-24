# app/routes/camera.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import cv2

router = APIRouter(prefix="/camera")
off = True


def generate_frames():
    cap = cv2.VideoCapture(9)
    # if off:
    #     cap = cv2.VideoCapture(9)

    if not cap.isOpened():
        print("❌ Kamera gagal dibuka")
        return
    else:
        print("✅ Kamera berhasil dibuka")

    try:
        while True:
            success, frame = cap.read()

            if not success:
                print("❌ Gagal membaca frame")
                break

            _, buffer = cv2.imencode(".jpg", frame)
            frame_bytes = buffer.tobytes()

            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n'
                + frame_bytes +
                b'\r\n'
            )

    finally:
        cap.release()
        print("📷 Camera released")


@router.get("/stream")
def stream_camera():
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# @router.get("/test")
# def test_camera():
#     return {"message": "camera route working"}