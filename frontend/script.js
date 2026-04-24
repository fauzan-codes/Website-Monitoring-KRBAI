// frontend/script.js
let telemetrySocket = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded");

    if (document.getElementById("front-camera")) {
        initFrontCamera();
    } 

    if (document.querySelector(".depth-value")) {
        initTelemetry();
    }
    
    initMissionTimer();
    

});


// ===== Camera =====
function initFrontCamera() {
    const img = document.getElementById("front-camera");
    const placeholder = document.getElementById("front-placeholder");
    const toggle = document.getElementById("front-toggle");
    const badge = document.getElementById("front-badge");

    if (!img || !toggle || !placeholder || !badge) {
        console.log("❌ element ada yang gak ketemu");
        return;
    }

    const cameraURL = `${window.location.origin}/camera/stream`;

    let isLoading = false;

    function setOfflineUI() {
        placeholder.style.display = "block";
        placeholder.querySelector("p").textContent = "Camera Offline";

        badge.textContent = "OFFLINE";
        badge.className = "live-badge offline";

        img.removeAttribute("src");
        img.style.display = "none";
    }

    function setWaitingUI() {
        placeholder.style.display = "block";
        placeholder.querySelector("p").textContent = "Waiting for robot camera...";

        badge.textContent = "CONNECTING";
        badge.className = "live-badge connecting";

        img.style.display = "none";
    }

    function setLiveUI() {
        placeholder.style.display = "none";

        badge.textContent = "LIVE";
        badge.className = "live-badge live";

        img.style.display = "block";
    }

    toggle.addEventListener("change", () => {
        if (isLoading) {
            console.log("⏳ Masih connecting, tunggu 5 detik...");
            toggle.checked = true; 
            return;
        }

        if (!toggle.checked) {
            setOfflineUI();
            return;
        }

        isLoading = true;
        toggle.disabled = true; 
        setWaitingUI();
        img.src = cameraURL;

        timeoutId = setTimeout(() => {
            if (isLoading) {
                console.log("⏰ Timeout connecting");

                isLoading = false;
                toggle.disabled = false;
            }
        }, 2000);

        img.onload = () => {
            console.log("✅ Camera live");

            clearTimeout(timeoutId);

            setLiveUI();

            isLoading = false;
            toggle.disabled = false;
        };

        img.onerror = () => {
            console.log("❌ Camera error");

            clearTimeout(timeoutId);
            setOfflineUI();
            isLoading = false;
            toggle.disabled = false;
            toggle.checked = false;
        };
    });
    setOfflineUI();
    toggle.checked = false;
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
    console.log("INIT TIMER JALAN");
    const startBtn = document.getElementById("btn-start");
    const stopBtn = document.getElementById("btn-stop");
    const resetBtn = document.getElementById("btn-reset");
    const display = document.getElementById("time-display");

    if (!startBtn || !stopBtn || !resetBtn) return;

    let sec = 0;
    let interval = null;

    function updateDisplay() {
        const h = String(Math.floor(sec / 3600)).padStart(2, "0");
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
        const s = String(sec % 60).padStart(2, "0");

        display.textContent = `${h}:${m}:${s}`;
    }

    // ===== START =====
    startBtn.addEventListener("click", () => {
        if (interval) return; 
        console.log("start click")

        startBtn.style.display = "none";
        stopBtn.style.display = "block";
        resetBtn.style.display = "none";

        interval = setInterval(() => {
            sec++;
            updateDisplay();
        }, 1000);
    });

    // ===== STOP (PAUSE) =====
    stopBtn.addEventListener("click", () => {
        clearInterval(interval);
        console.log("stop click")

        startBtn.style.display = "none";
        stopBtn.style.display = "none";
        resetBtn.style.display = "block";

        interval = null;
    });

    // ===== RESET =====
    resetBtn.addEventListener("click", () => {
        clearInterval(interval);
        console.log("reset click")

        startBtn.style.display = "block";
        stopBtn.style.display = "none";
        resetBtn.style.display = "none";

        interval = null;
        sec = 0;
        updateDisplay();
    });
}


// ===== page active =====
const path = window.location.pathname;

document.querySelectorAll(".sidebar-menu a").forEach(a => {
    if (a.getAttribute("href") === path) {
        a.parentElement.classList.add("active");
    }
});




