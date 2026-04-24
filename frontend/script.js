// frontend/script.js


let telemetrySocket = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded");

    if (document.getElementById("front-camera")) {
        initCamera();
    }

    if (document.querySelector(".depth-value")) {
        initTelemetry();
    }

    if (document.getElementById("mission-btn")) {
        initMissionTimer();
    }

});


// ===== Camera =====
function initCamera() {
    const img = document.getElementById("front-camera");
    const placeholder = document.getElementById("camera-placeholder");

    if (!img) {
        console.log("❌ front-camera tidak ditemukan");
        return;
    }

    const cameraURL = `${window.location.origin}/camera/stream`;
    console.log("Connecting to camera:", cameraURL);

    img.src = cameraURL;

    img.onload = () => {
        console.log("✅ Camera stream tampil");
        if (placeholder) placeholder.style.display = "none";
    };

    img.onerror = () => {
        console.log("❌ Kamera gagal tampil");
        const placeholder = document.getElementById("camera-placeholder");
        if (placeholder) placeholder.style.display = "block";
    };
}


// ===== Telemetry =====
let reconnectCount = 0;
function initTelemetry() {
    if (telemetrySocket && telemetrySocket.readyState === WebSocket.OPEN) {
        return;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsURL = `${protocol}://${window.location.host}/ws/telemetry`;

    telemetrySocket = new WebSocket(wsURL);

    telemetrySocket.onopen = () => {
        console.log("Telemetry connected");
        reconnectCount = 0;
    };

    telemetrySocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Telemetry:", data);

        updateText(".depth-value", `${data.depth} m`);
        updateText(".yaw-value", `${data.yaw}°`);
        updateText(".pitch-value", `${data.pitch}°`);
        updateText(".roll-value", `${data.roll}°`);
        updateText(".battery-value", `${data.battery}%`);
        updateText(".movement-value", data.movement);

        const batteryBar = document.querySelector(".battery-progress");
        if (batteryBar) batteryBar.style.width = `${data.battery}%`;
    };

    telemetrySocket.onclose = () => {
        console.log("Telemetry closed");

        if (reconnectCount < 10) {
            reconnectCount++;

            setTimeout(() => {
                initTelemetry();
            }, 2000);
        }
    };

    telemetrySocket.onerror = () => {
        console.log("WebSocket error");
    };
}


// ===== update text =====
function updateText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
        element.textContent = value;
    }
}


// ===== timer mision =====
function initMissionTimer() {
    const btn = document.getElementById("mission-btn");
    const display = document.getElementById("time-display");

    if (!btn || !display) return;

    let sec = 0;
    let running = false;
    let interval;

    btn.addEventListener("click", () => {
        if (!running) {
            running = true;

            btn.innerHTML = `
                <i class="fas fa-stop"></i>
                <span>Stop Mission</span>
            `;

            interval = setInterval(() => {
                sec++;

                const h = String(
                    Math.floor(sec / 3600)
                ).padStart(2, "0");

                const m = String(
                    Math.floor((sec % 3600) / 60)
                ).padStart(2, "0");

                const s = String(
                    sec % 60
                ).padStart(2, "0");

                display.textContent =
                    `${h}:${m}:${s}`;
            }, 1000);

        } else {
            running = false;

            clearInterval(interval);

            sec = 0;

            display.textContent = "00:00:00";

            btn.innerHTML = `
                <i class="fas fa-play"></i>
                <span>Start Mission</span>
            `;
        }
    });
}


// ===== page active =====
const path = window.location.pathname;

document.querySelectorAll(".sidebar-menu a").forEach(a => {
    if (a.getAttribute("href") === path) {
        a.parentElement.classList.add("active");
    }
});




