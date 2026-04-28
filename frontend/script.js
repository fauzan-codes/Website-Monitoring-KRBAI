// frontend/script.js
let telemetrySocket = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded");
    setSystemStatus(true);

    const path = window.location.pathname;

    if (path === "/") {
        initDashboard();
    }

    if (path === "/thruster-control") {
        initThrusterControl();
    }

    initSidebarToggle();
    setActiveSidebar();

    window.addEventListener("resize", () => {
        const isCurrentlyOnline =
            document.getElementById("system-status")
            ?.classList.contains("online");

        setSystemStatus(isCurrentlyOnline);
    });
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

function setSystemStatus(isOnline) {
    const indicator = document.getElementById("system-status");
    const text = document.getElementById("status-text");

    if (!indicator || !text) return;

    const isMobile = window.innerWidth <= 900;

    if (isOnline) {
        indicator.classList.remove("offline");
        indicator.classList.add("online");

        text.textContent = isMobile
            ? "Online"
            : "System Online";

    } else {
        indicator.classList.remove("online");
        indicator.classList.add("offline");

        text.textContent = isMobile
            ? "Offline"
            : "System Offline";
    }
}






// ==================== DASHBOARD ====================
function initDashboard() {
    const baseURL = `${window.location.origin}/camera/stream`;

    Camera({
        imgId: "front-camera",
        placeholderId: "front-placeholder",
        toggleId: "front-toggle",
        badgeId: "front-badge",
        url: baseURL
    });

    Camera({
        imgId: "bottom-camera",
        placeholderId: "bottom-placeholder",
        toggleId: "bottom-toggle",
        badgeId: "bottom-badge",
        url: null
    });

    telemetry();
    timer();
}

// ==================== ThrusterControl ====================
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


// ==================== Camera ====================
function Camera({ imgId, placeholderId, toggleId, badgeId, url }) {
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


// ==================== Telemetry ====================
let reconnectCount = 0;
function telemetry() {
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

        setSystemStatus(true);
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
        setSystemStatus(false);

        if (reconnectCount < 10) {
            reconnectCount++;

            setTimeout(() => {
                telemetry();
            }, 2000);
        }
    };

    telemetrySocket.onerror = () => {
        console.log("WebSocket error");
        setSystemStatus(false);
    };
}




// ==================== update data dashboard ====================
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


// ==================== timer mision ====================
function timer() {
    const startBtn = document.getElementById("btn-start");
    const stopBtn = document.getElementById("btn-stop");
    const resetBtn = document.getElementById("btn-reset");
    const display = document.getElementById("time-display");

    if (!startBtn || !stopBtn || !resetBtn || !display) return;

    function formatTime(sec) {
        const h = String(Math.floor(sec / 3600)).padStart(2, "0");
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
        const s = String(sec % 60).padStart(2, "0");

        return `${h}:${m}:${s}`;
    }

    async function loadStatus() {
        try {
            const res = await fetch("/mission/status");
            const data = await res.json();

            display.textContent = formatTime(data.elapsed);

            if (data.is_running) {
                startBtn.style.display = "none";
                stopBtn.style.display = "block";
                resetBtn.style.display = "none";
            } else {
                if (data.elapsed > 0) {
                    startBtn.style.display = "none";
                    stopBtn.style.display = "none";
                    resetBtn.style.display = "block";
                } else {
                    startBtn.style.display = "block";
                    stopBtn.style.display = "none";
                    resetBtn.style.display = "none";
                }
            }
        } catch (err) {
            console.log("Timer status error:", err);
        }
    }

    async function sendAction(url) {
        try {
            await fetch(url, {
                method: "POST"
            })

            loadStatus()
        } catch (err) {
            console.log(err)
        }
    }

    startBtn.addEventListener("click", () => {
        sendAction("/mission/start")
    })

    stopBtn.addEventListener("click", () => {
        sendAction("/mission/stop")
    })

    resetBtn.addEventListener("click", () => {
        sendAction("/mission/reset")
    })

    // polling backend tiap 1 detik
    setInterval(loadStatus, 1000)

    loadStatus()
}







