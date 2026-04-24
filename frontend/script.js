// frontend/script.js
let telemetrySocket = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded");

    const baseURL = `${window.location.origin}/camera/stream`;
    initCamera({
        imgId: "front-camera",
        placeholderId: "front-placeholder",
        toggleId: "front-toggle",
        badgeId: "front-badge",
        url: baseURL
    });

    initCamera({
        imgId: "bottom-camera",
        placeholderId: "bottom-placeholder",
        toggleId: "bottom-toggle",
        badgeId: "bottom-badge",
        url: "link"
    });

    if (document.querySelector(".depth-value")) {
        initTelemetry();
    }
    
    initMissionTimer();
});


// ===== Camera =====
function initCamera({ imgId, placeholderId, toggleId, badgeId, url }) {
    const img = document.getElementById(imgId);
    const placeholder = document.getElementById(placeholderId);
    const toggle = document.getElementById(toggleId);
    const badge = document.getElementById(badgeId);

    if (!img || !toggle || !placeholder || !badge) {
        console.log("Invalid camera:", imgId);
        return;
    }

    let isLoading = false;
    let lock = false;
    let timeoutId = null;

    function setOfflineUI() {
        placeholder.style.display = "block";
        placeholder.querySelector("p").textContent = "Camera Offline";
        badge.textContent = "OFFLINE";
        badge.className = "live-badge offline";
        img.removeAttribute("src");
        img.style.display = "none";
        toggle.checked = false;
    }

    function setErrorUI() {
        placeholder.style.display = "block";
        placeholder.querySelector("p").textContent = "Invalid Camera";
        badge.textContent = "OFFLINE";
        badge.className = "live-badge offline";
        img.removeAttribute("src");
        img.style.display = "none";
        toggle.checked = false;
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
        if (!url) {
            console.log("Invalid URL camera: ", url);
            setErrorUI();
            return;
        }

        if (lock) {
            toggle.checked = true;
            return;
        }

        if (isLoading && !toggle.checked) {

            clearTimeout(timeoutId);
            isLoading = false;

            setOfflineUI();
            return;
        }

        if (!toggle.checked) {
            setOfflineUI();
            return;
        }

        isLoading = true;
        lock = true;

        setWaitingUI();
        img.src = url;

        setTimeout(() => {
            lock = false;
        }, 2000);

        timeoutId = setTimeout(() => {
            if (isLoading) {
                console.log("Timeout connecting camera");
                isLoading = false;
                toggle.checked = false;
                setOfflineUI();
            }
        }, 15000);

        img.onload = () => {
            clearTimeout(timeoutId);
            isLoading = false;
            setLiveUI();
        };

        img.onerror = () => {
            console.log("Camera error, Tolong cek lagi url atau kameranya");
            console.log("URL Camera: \"", url, "\"")
            clearTimeout(timeoutId);
            isLoading = false;
            setErrorUI;
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
        // console.log("Telemetry:", data);

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

    // start
    startBtn.addEventListener("click", () => {
        if (interval) return; 

        startBtn.style.display = "none";
        stopBtn.style.display = "block";
        resetBtn.style.display = "none";

        interval = setInterval(() => {
            sec++;
            updateDisplay();
        }, 1000);
    });

    // stop/pause
    stopBtn.addEventListener("click", () => {
        clearInterval(interval);

        startBtn.style.display = "none";
        stopBtn.style.display = "none";
        resetBtn.style.display = "block";

        interval = null;
    });

    // reset
    resetBtn.addEventListener("click", () => {
        clearInterval(interval);

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




