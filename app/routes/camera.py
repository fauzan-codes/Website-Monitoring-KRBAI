from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import cv2

router = APIRouter(prefix="/camera")

def generate_frames():
    cap = cv2.VideoCapture(0)

    while True:
        success, frame = cap.read()
        if not success:
            break

        _, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@router.get("/stream")
def stream():
    return StreamingResponse(generate_frames(),
        media_type='multipart/x-mixed-replace; boundary=frame')