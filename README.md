# 🚀 Website-Monitoring-KRBAI

## 📌 Deskripsi Projepyct

Project ini adalah sistem **website monitoring untuk robot bawah air (AUV)** yang berjalan secara **lokal (tanpa internet)** menggunakan **koneksi LAN (Ethernet)**.

Website ini digunakan untuk:

- 🎥 Monitoring kamera robot secara real-time  
- 📡 Monitoring data sensor (telemetry)  
- 🎮 Mengontrol robot
- 📊 Merekam data trial/percobaan
- 🚨 Monitoring log & error  

⚠️ Sistem ini **tidak untuk public / deploy internet**, hanya digunakan dalam jaringan lokal.

---

## 🧠 Konsep Utama Sistem

Website ini adalah:

👉 **Control + Monitoring Dashboard untuk Robot AUV**

Arsitektur:

```
[AUV Robot (Jetson / Mini PC)]
        ↓ (LAN Cable)
[FastAPI Backend Server]
        ↓
[Frontend Dashboard (HTML/CSS/JS)]
```

---

## ⚙️ Teknologi yang Digunakan

### Backend
- FastAPI (Python)
- WebSocket (Realtime)
- OpenCV (Camera Streaming)
- Uvicorn (Server)

### Frontend
- HTML
- CSS
- JavaScript (Fetch + WebSocket)

### Database (Rekomendasi)
- SQLite (ringan & lokal)

---

## 📦 1. PERSIAPAN AWAL

### 1.1 Install Python
```bash
python --version
```

---

### 1.2 Buat Folder Project
```bash
mkdir Website-Monitoring-KRBAI
cd Website-Monitoring-KRBAI
```

---

### 1.3 Buat Virtual Environment
```bash
python -m venv venv
```

Aktifkan:

**Windows**
```bash
venv\Scripts\activate
```

**Linux / Mac**
```bash
source venv/bin/activate
```

---

### 1.4 Install Dependencies
```bash
pip install fastapi uvicorn websockets opencv-python python-multipart sqlalchemy
```

---

## 📁 2. STRUKTUR PROJECT

```
auv-monitoring/
│
├── app/
│   ├── main.py
│   │
│   ├── routes/
│   │   ├── camera.py
│   │   ├── telemetry.py
│   │   ├── control.py
│   │   ├── logs.py
│   │   ├── trial.py
│   │   ├── pid.py
│   │
│   ├── websocket/
│   │   ├── manager.py
│   │
│   ├── services/
│   │   ├── robot_connection.py
│   │   ├── data_logger.py
│   │
│   ├── database/
│   │   ├── db.py
│   │   ├── models.py
│
├── data/
│   ├── trials/
│
├── frontend/
│   ├── index.html
│
├── requirements.txt
└── README.md
```

---

## 🚀 3. FITUR UTAMA SISTEM

### 🔴 LIVE MONITORING (WAJIB)

#### 🎥 Live Camera
- Endpoint: `/camera/stream`
- Format: MJPEG
- Teknologi: OpenCV + StreamingResponse

---

#### 📡 Telemetry Realtime
- WebSocket: `/ws/telemetry`

Contoh:
```json
{
  "depth": 1.2,
  "yaw": 120,
  "pitch": 5,
  "roll": 2,
  "mode": "AUTO"
}
```

---

#### 🎮 Control Robot
Endpoint:
```
POST /control/command
```

Contoh:
```json
{
  "action": "MOVE_FORWARD"
}
```

---

### 🟡 STATUS SYSTEM

- Connection status (Robot ↔ Backend ↔ Frontend)
- Status program robot (RUN1.PY, dll)
- Log monitoring realtime

Endpoint log:
```
GET /logs
```

---

### 🔵 DATA TRIAL

#### Data Logging
Menyimpan:
- Telemetry
- Command
- Timestamp

---

#### Trial Management
```
POST /trial/start
POST /trial/stop
GET /trial/list
```

---

### 🟣 CONFIG

#### PID Tuning
```
POST /pid/update
```

---

## 🗄️ 4. DATABASE (SQLITE)

File: `app/database/db.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./auv.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
```

---

### Struktur Table

#### trials
- id
- name
- start_time
- end_time
- notes

#### telemetry
- id
- trial_id
- timestamp
- depth
- yaw
- pitch
- roll

#### commands
- id
- trial_id
- timestamp
- command

#### logs
- id
- timestamp
- level
- message

---

## 🔄 5. FLOW SISTEM

```
Robot (Jetson)
   ↓
Kirim data (Socket / HTTP / Serial)
   ↓
Backend (FastAPI)
   ↓
- Simpan data
- Broadcast WebSocket
   ↓
Frontend
   ↓
Realtime display
```

---

## 🎥 6. IMPLEMENTASI CAMERA

```python
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
```

---

## 📡 7. WEBSOCKET TELEMETRY

```python
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.clients = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.clients.append(ws)

    def disconnect(self, ws):
        self.clients.remove(ws)

    async def broadcast(self, data):
        for client in self.clients:
            await client.send_json(data)
```

---

## 🎮 8. CONTROL ROBOT

```python
import socket

def send_command(cmd):
    HOST = "192.168.1.10"
    PORT = 5000

    s = socket.socket()
    s.connect((HOST, PORT))
    s.send(cmd.encode())
    s.close()
```

---

## 💾 9. DATA LOGGING (SIMPLE)

```python
import json
from datetime import datetime

def save_log(data):
    with open("data/trials/log.json", "a") as f:
        json.dump({
            "time": str(datetime.now()),
            "data": data
        }, f)
        f.write("\n")
```

---

## ▶️ 10. MENJALANKAN SERVER

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 🌐 11. AKSES WEBSITE (LAN)

```
http://192.168.x.x:8000
```

---

## 🖥️ 12. FRONTEND CONNECT

### WebSocket
```javascript
const ws = new WebSocket("ws://192.168.x.x:8000/ws/telemetry");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

---

### Camera
```html
<img src="http://192.168.x.x:8000/camera/stream">
```

---

## 🔌 13. SETUP LAN

- Gunakan kabel Ethernet
- Set IP robot static (contoh: 192.168.1.10)
- Backend jalan di laptop / PC
- Pastikan satu subnet

---

## ✅ 14. FITUR FINAL

- ✅ Live Camera
- ✅ Telemetry Realtime (WebSocket)
- ✅ Control Robot
- ✅ Connection Status
- ✅ Log Monitoring
- ✅ Trial Recording
- ✅ Data Storage (SQLite / JSON)

---

## ➕ OPSIONAL

- PID tuning UI
- Grafik realtime
- Video recording
- Multi camera

---

## 🎯 KESIMPULAN

Sistem ini adalah:

👉 Realtime Control System  
👉 Monitoring Dashboard  
👉 Data Recording Tool  

Keunggulan:

- ⚡ Real-time
- 🧠 Python native
- 🔌 LAN only (tanpa internet)
- 💡 Simple & powerful

---

## 🚀 STATUS

✔ READY FOR DEVELOPMENT  
✔ SIAP UNTUK MONITORING AUV  
✔ LOCAL NETWORK ONLY  