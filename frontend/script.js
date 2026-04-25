// frontend/script.js
let telemetrySocket = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded");

    const path = window.location.pathname;

    if (path === "/") {
        initDashboard();
    }

    if (path === "/thruster-control") {
        initThrusterControl();
    }

    initSidebarToggle();
    setActiveSidebar();
});


// ==== Side Bar System =====
function initSidebarToggle() {
    const sidebar = document.querySelector(".sidebar-icon-only");
    const logo = document.querySelector(".logo-top");
    const overlay = document.querySelector(".sidebar-overlay");

    if (!sidebar || !logo || !overlay) return;
    logo.addEventListener("click", (e) => {
        e.preventDefault();

        if (window.innerWidth <= 900) {
            sidebar.classList.add("active");
            overlay.classList.add("active");
        }
    });
    overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    });

    document.querySelectorAll(".sidebar-menu a").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 900) {
                sidebar.classList.remove("active");
                overlay.classList.remove("active");
            }
        });
    });
}






// ===== DASHBOARD =====
function initDashboard() {
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
        url: null
    });

    initTelemetry();
    initMissionTimer();
}

// ===== ThrusterControl =====
function initThrusterControl() {
    const sliders = document.querySelectorAll(".motor-slider");

    sliders.forEach(slider => {
        const valueText = slider
            .closest(".slider-container")
            .querySelector(".motor-value");

        slider.addEventListener("input", () => {
            valueText.textContent = `${slider.value}%`;
        });
    });

    console.log("Thruster control initialized");
}


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
        img.src = `${url}?t=${Date.now()}`;

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
            setErrorUI();
        };
    });

    setOfflineUI();
    toggle.checked = false;
}


// ===== Telemetry =====
let reconnectCount = 0;
function initTelemetry() {
    if (
        telemetrySocket &&
        (
            telemetrySocket.readyState === WebSocket.OPEN ||
            telemetrySocket.readyState === WebSocket.CONNECTING
        )
    ) {
        return;
    }
    
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

        const thrusters = data.thrusters;
        updateThruster("front-left", thrusters.front_left);
        updateThruster("front-right", thrusters.front_right);
        updateThruster("rear-left", thrusters.rear_left);
        updateThruster("rear-right", thrusters.rear_right);
        updateThruster("top", thrusters.top);
        updateThruster("bottom", thrusters.bottom);
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




// ===== update data dashboard =====
function updateText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
        element.textContent = value;
    }
}

function updateThruster(name, value) {
    const bar = document.querySelector(`.thruster-${name}`);
    const statusText = document.querySelector(`.${name}-text`);
    const valueText = document.querySelector(`.${name}-value`);

    if (!bar || !statusText || !valueText) return;

    // update bar
    bar.style.width = `${value}%`;

    let status = "Off";

    if (value > 0) {
        status = "Active";
    }

    // reset class
    statusText.classList.remove("active");

    if (value > 0) {
        statusText.classList.add("active");
    }

    // update UI
    statusText.textContent = status;
    valueText.textContent = value;

    updateActiveThrusters();
}

function updateActiveThrusters() {
    const bars = document.querySelectorAll(".thruster-list .progress");
    let activeCount = 0;

    bars.forEach(bar => {
        const width = parseInt(bar.style.width) || 0;

        if (width > 0) {
            activeCount++;
        }
    });

    const activeText = document.querySelector(".active-thrusters");

    if (activeText) {
        activeText.textContent = `Active Thrusters: ${activeCount} of 6`;
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
function setActiveSidebar() {
    const path = window.location.pathname;

    document.querySelectorAll(".sidebar-menu li").forEach(li => {
        li.classList.remove("active");
    });

    document.querySelectorAll(".sidebar-menu a").forEach(a => {
        if (a.getAttribute("href") === path) {
            a.parentElement.classList.add("active");
        }
    });
}




