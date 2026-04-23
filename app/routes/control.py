from fastapi import APIRouter
import socket

router = APIRouter(prefix="/control")

def send_command(cmd: str):
    HOST = "192.168.1.10"  # IP robot (ubah nanti)
    PORT = 5000

    try:
        s = socket.socket()
        s.connect((HOST, PORT))
        s.send(cmd.encode())
        s.close()
    except Exception as e:
        print("Error kirim command:", e)

@router.post("/command")
def control_robot(data: dict):
    cmd = data.get("action")

    send_command(cmd)

    return {"status": "sent", "command": cmd}