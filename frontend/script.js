// frontend/script.js
let telemetrySocket = null;
let reconnectCount = 0;

// ==================== GLOBAL CONFIG ====================
const BASE_CAMERA_URL = `${window.location.origin}`;

const CAMERA_CONFIG = {
    front: `${BASE_CAMERA_URL}/camera/front/stream`,
    bottom: `${BASE_CAMERA_URL}/camera/bottom/stream`,
    side: `${BASE_CAMERA_URL}/camera/side/stream`
};

document.addEventListener("DOMContentLoaded", () => {
    setSystemStatus(true);

    const path = window.location.pathname;

    if (path === "/") {
        initDashboard();
    }

    if (path === "/thruster-control") {
        initThrusterControl();
    }

    if (path === "/camera-settings") {
        initCameraSelection();
        initCameraSettingsActions();
        initCameraAdjustment();
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


// ==================== SideBar System ====================
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
    let currentPath = window.location.pathname.replace(/\/$/, "") || "/";

    document.querySelectorAll(".sidebar-menu li").forEach(li => {
        li.classList.remove("active");
    });

    document.querySelectorAll(".sidebar-menu a").forEach(link => {
        let linkPath = link.getAttribute("href").replace(/\/$/, "") || "/";

        if (currentPath === linkPath) {
            link.parentElement.classList.add("active");
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






// ==================== HALAMAN DASHBOARD ====================
function initDashboard() {
    Camera({
        imgId: "front-camera",
        placeholderId: "front-placeholder",
        toggleId: "front-toggle",
        badgeId: "front-badge",
        url: CAMERA_CONFIG.front
    });

    Camera({
        imgId: "bottom-camera",
        placeholderId: "bottom-placeholder",
        toggleId: "bottom-toggle",
        badgeId: "bottom-badge",
        url: CAMERA_CONFIG.bottom
    });

    setupCameraActions();
    setupOrientationReset();
    telemetry();
    timer();

    console.log("Dashboard initialized");
}

// ==================== ThrusterControl ====================
function initThrusterControl() {
    const sliders = document.querySelectorAll(".motor-slider");

    ModeSwitchButton();

    setupKeyboardControl();
    setupGamepadControl();
    setupVirtualJoystick();

    MotorSlider();
    EmergencyStop();
    loadThrusterConfig();


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
    let cameraState = "offline";

    function setOfflineUI() {
        toggle.dataset.state = "offline";
        placeholder.style.display = "block";
        placeholder.querySelector("p").textContent = "Camera Offline";
        badge.textContent = "OFFLINE";
        badge.className = "live-badge offline";
        img.removeAttribute("src");
        img.style.display = "none";
        toggle.checked = false;
    }

    function setErrorUI() {
        toggle.dataset.state = "offline";   
        placeholder.style.display = "block";
        placeholder.querySelector("p").textContent = "Camera Not Available";
        badge.textContent = "OFFLINE";
        badge.className = "live-badge offline";
        img.removeAttribute("src");
        img.style.display = "none";
        toggle.checked = false;
    }

    function setWaitingUI() {
        toggle.dataset.state = "connecting";
        placeholder.style.display = "block";
        placeholder.querySelector("p").textContent = "Waiting for robot camera...";
        badge.textContent = "CONNECTING";
        badge.className = "live-badge connecting";
        img.style.display = "none";
    }

    function setLiveUI() {
        toggle.dataset.state = "live";
        placeholder.style.display = "none";
        badge.textContent = "LIVE";
        badge.className = "live-badge live";
        img.style.display = "block";
    }

    toggle.addEventListener("change", () => {
        if (!url || url === "null") {
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
            console.log("camera online")
            setLiveUI();
        };

        img.onerror = () => {
            console.log("Camera error, Tolong cek lagi url atau kameranya\nURL Camera: \"url\"");
            clearTimeout(timeoutId);
            isLoading = false;

            if (isRecording) {
                safeStopRecording();
            }

            document.dispatchEvent(new CustomEvent("camera-lost", {
                detail: { camera: imgId }
            }));

            setErrorUI();
        };
    });

    setOfflineUI();
    toggle.checked = false;
}


function setupCameraActions() {
    setupSingleCameraActions({
        captureBtnId: "front-capture-btn",
        recordBtnId: "front-record-btn",
        toggleId: "front-toggle",
        cameraName: "front"
    });

    setupSingleCameraActions({
        captureBtnId: "bottom-capture-btn",
        recordBtnId: "bottom-record-btn",
        toggleId: "bottom-toggle",
        cameraName: "bottom"
    });

    setupSingleCameraActions({
        captureBtnId: "side-capture-btn",
        recordBtnId: "side-record-btn",
        toggleId: "side-toggle",
        cameraName: "side"
    });
}


/* reusable camera action */
function setupSingleCameraActions({
    captureBtnId,
    recordBtnId,
    toggleId,
    cameraName
}) {

    const captureBtn = document.getElementById(captureBtnId);
    const recordBtn = document.getElementById(recordBtnId);
    const toggle = document.getElementById(toggleId);

    if (!captureBtn || !recordBtn || !toggle) return;

    let isRecording = false;
    let recordCooldown = false;
    let cameraState = "offline";

    function getEndpoints() {
        return {
            capture: `/camera/capture/${cameraName}`,
            start: `/camera/record/start/${cameraName}`,
            stop: `/camera/record/stop/${cameraName}`
        };
    }

    function cameraIsNotReady() {
        return toggle.dataset.state !== "live";
    }

    function updateActionButtons() {
        const disabled = cameraIsNotReady();

        captureBtn.disabled = disabled;
        recordBtn.disabled = disabled;

        if (disabled && isRecording) {
            console.log("Camera lost while recording");
            isRecording = false;
            safeStopRecording();
        }
    }

    function updateRecordUI() {
        if (isRecording) {
            recordBtn.innerHTML = `
                <i class="fas fa-stop"></i>
            `;

            recordBtn.classList.add("recording-active");
            recordBtn.title = "Stop Recording";
        } else {
            recordBtn.innerHTML = `
                <i class="fas fa-video"></i>
            `;

            recordBtn.classList.remove("recording-active");
            recordBtn.title = "Start Recording";
        }
    }

    async function safeStopRecording() {
        const { stop } = getEndpoints();

        try {
            await fetch(stop, { method: "POST" });
        } catch (err) {
            console.log(err);
        }

        isRecording = false;
        updateRecordUI();
    }

    // capture
    captureBtn.addEventListener("click", async () => {
        if (cameraIsNotReady()) return;

        const { capture } = getEndpoints();

        captureBtn.classList.add("click-effect");
        setTimeout(() => captureBtn.classList.remove("click-effect"), 100);

        try {
            const res = await fetch(capture, { method: "POST" });
            const data = await res.json();
            console.log(data.message);
        } catch (err) {
            console.log(err);
        }
    });

    // record
    recordBtn.addEventListener("click", async () => {
        if (cameraIsNotReady() || recordCooldown) return;

        const { start, stop } = getEndpoints();

        recordCooldown = true;
        recordBtn.disabled = true;

        setTimeout(() => {
            recordCooldown = false;
            updateActionButtons();
        }, 1000);

        try {
            const endpoint = isRecording ? stop : start;
            const res = await fetch(endpoint, {
                method: "POST"
            });

            const data = await res.json();

            if (data.success) {
                isRecording = !isRecording;
                updateRecordUI();
            }

            console.log(data.message);

        } catch (err) {
            console.log(err);
        }
    });

    document.addEventListener("camera-lost", (e) => {
        if (isRecording) {
            console.log("Camera lost event → stopping recording");

            safeStopRecording();
        }
    });

    const observer = new MutationObserver(updateActionButtons);
    observer.observe(toggle, {
        attributes: true,
        attributeFilter: ["data-state"]
    });

    updateRecordUI();
    updateActionButtons();
}


// ==================== Telemetry ====================
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
            }, 3000);
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

    bar.style.width = `${value}%`;

    let status = "Off";

    if (value > 0) {
        status = "Active";
    }

    statusText.classList.remove("active");

    if (value > 0) {
        statusText.classList.add("active");
    }

    statusText.textContent = status;
    valueText.textContent = value;

    updateActiveThrusters();
}

function updateActiveThrusters() { //thruster in dashboard
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

    setInterval(loadStatus, 1000)

    loadStatus()
}


// ==================== Orientation Reset ====================
function setupOrientationReset() {
    const resetBtn = document.getElementById("orientation-reset-btn");

    if (!resetBtn) return;

    let cooldown = false;

    resetBtn.addEventListener("click", async () => {
        if (cooldown) return;

        cooldown = true;
        resetBtn.disabled = true;

        const originalHTML = resetBtn.innerHTML;

        resetBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i> Resetting...
        `;

        try {
            const res = await fetch("/orientation/reset", {
                method: "POST"
            });

            const data = await res.json();

            console.log(data.message);

        } catch (err) {
            console.log("Orientation reset error:", err);
        }

        setTimeout(() => {
            resetBtn.disabled = false;
            resetBtn.innerHTML = originalHTML;
            cooldown = false;
        }, 2000);
    });
}







// ==================== HALAMAN THRUSTER CONTROL ====================
let lastCommand = null;
let lastSentTime = 0;

let currentControlMode = "keyboard";
let joystickInterval = null;
let joystickCommand = "STOP";

function sendThrusterCommand(command, value = null) {
    const now = Date.now();

    if (
        command === lastCommand &&
        now - lastSentTime < 100
    ) {
        return;
    }

    lastCommand = command;
    lastSentTime = now;

    fetch("/control/command", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: command,
            value: value
        })
    })
    .catch(err => console.log(err));
}



function ModeSwitchButton() {
    const buttons = document.querySelectorAll(".mode-btn");
    const panels = document.querySelectorAll(".control-panel");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            panels.forEach(p => p.classList.remove("active-panel"));

            btn.classList.add("active");

            const mode = btn.dataset.mode;

            currentControlMode = mode;
            sendThrusterCommand("STOP");

            document
                .getElementById(`${mode}-panel`)
                .classList.add("active-panel");
        });
    });
}


function setupKeyboardControl() {
    const map = {
        w: "FORWARD",
        a: "LEFT",
        s: "BACKWARD",
        d: "RIGHT",
        q: "UP",
        e: "DOWN"
    };

    let activeKey = null;

    const buttons = document.querySelectorAll("#keyboard-panel .control-btn");

    function setActiveButton(command) {
        buttons.forEach(btn => {
            if (btn.dataset.command === command) {
                btn.classList.add("active-press");
            }
        });
    }

    function clearActiveButtons() {
        buttons.forEach(btn => {
            btn.classList.remove("active-press");
        });
    }

    // keyboard press
    document.addEventListener("keydown", (e) => {
        if (currentControlMode !== "keyboard") return;

        const key = e.key.toLowerCase();
        const cmd = map[key];

        if (!cmd) return;
        if (activeKey === key) return;

        activeKey = key;

        clearActiveButtons();
        setActiveButton(cmd);

        console.log("Send :", cmd)
        sendThrusterCommand(cmd);
    });

    document.addEventListener("keyup", (e) => {
        if (currentControlMode !== "keyboard") return;

        const key = e.key.toLowerCase();
        if (key === activeKey) {
            activeKey = null;

            clearActiveButtons();

            console.log("Send : STOP")
            sendThrusterCommand("STOP");
        }
    });

    // click mouse
    buttons.forEach(btn => {
        btn.addEventListener("mousedown", () => {
            if (currentControlMode !== "keyboard") return;

            clearActiveButtons();
            btn.classList.add("active-press");

            console.log("Send :", btn.dataset.command)
            sendThrusterCommand(btn.dataset.command);
        });

        btn.addEventListener("mouseup", () => {
            if (currentControlMode !== "keyboard") return;
            btn.classList.remove("active-press");

            console.log("Send : STOP")
            sendThrusterCommand("STOP");
        });

        btn.addEventListener("mouseleave", () => {
            btn.classList.remove("active-press");
        });
    });
}


function setupGamepadControl() {
    window.addEventListener("gamepadconnected", () => {
        const status = document.getElementById("gamepad-status");
        status.className = "gamepad-status connected";
        status.innerHTML = `
            <i class="fas fa-circle"></i> Gamepad Connected
        `;
    });

    window.addEventListener("gamepaddisconnected", () => {
        const status = document.getElementById("gamepad-status");
        status.className = "gamepad-status disconnected";
        status.innerHTML = `
            <i class="fas fa-circle"></i> No Gamepad
        `;
    });

    setInterval(() => {
        const gamepad = navigator.getGamepads()[0];
        if (!gamepad) return;

        const lx = gamepad.axes[0];
        const ly = gamepad.axes[1];

        if (ly < -0.5) sendThrusterCommand("FORWARD");
        else if (ly > 0.5) sendThrusterCommand("BACKWARD");
    }, 150);
}


function setupVirtualJoystick() {
    const stick = document.getElementById("joystick-stick");
    const base = document.getElementById("joystick-base");

    if (!stick || !base) return;

    let dragging = false;
    const maxDistance = 65;

    function getCommand(x, y) {
        const deadzone = 20;

        if (y < -deadzone) return "FORWARD";
        if (y > deadzone) return "BACKWARD";
        if (x < -deadzone) return "LEFT";
        if (x > deadzone) return "RIGHT";

        return "STOP";
    }

    function moveJoystick(clientX, clientY) {
        if (currentControlMode !== "joystick") return;

        const rect = base.getBoundingClientRect();

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        let x = clientX - rect.left - centerX;
        let y = clientY - rect.top - centerY;

        const distance = Math.sqrt(x * x + y * y);

        if (distance > maxDistance) {
            const angle = Math.atan2(y, x);
            x = Math.cos(angle) * maxDistance;
            y = Math.sin(angle) * maxDistance;
        }

        stick.style.left = `${x + centerX}px`;
        stick.style.top = `${y + centerY}px`;

        joystickCommand = getCommand(x, y);
    }

    function startSending() {
        if (joystickInterval) return;

        joystickInterval = setInterval(() => {
            if (currentControlMode !== "joystick") return;

            if (joystickCommand) {
                console.log("JoyStick command: ", joystickCommand)
                sendThrusterCommand(joystickCommand);
            }
        }, 120); 
    }

    function stopSending() {
        clearInterval(joystickInterval);
        joystickInterval = null;
    }

    stick.addEventListener("pointerdown", (e) => {
        dragging = true;
        stick.setPointerCapture(e.pointerId);
        stick.style.cursor = "grabbing";

        startSending();
    });

    stick.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        moveJoystick(e.clientX, e.clientY);
    });

    function resetJoystick() {
        dragging = false;

        stick.style.left = "50%";
        stick.style.top = "50%";
        stick.style.transform = "translate(-50%, -50%)";
        stick.style.cursor = "grab";

        joystickCommand = "STOP";

        console.log("JoyStick command: STOP")
        sendThrusterCommand("STOP");

        stopSending();
    }

    stick.addEventListener("pointerup", resetJoystick);
    stick.addEventListener("pointercancel", resetJoystick);
}


function MotorSlider() {
    const sliders = document.querySelectorAll(".motor-slider");
    const startBtn = document.getElementById("start-thruster-test");

    sliders.forEach(slider => {
        const valueText = slider
            .closest(".motor-control")
            .querySelector(".motor-value");

        slider.addEventListener("input", () => {
            valueText.textContent = `${slider.value}%`;
        });
    });

    if (startBtn) {
        startBtn.addEventListener("click", async () => {

            startBtn.disabled = true;
            startBtn.classList.add("loading");

            const originalHTML = startBtn.innerHTML;
            startBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Running
            `;

            const values = {};

            sliders.forEach(slider => {
                const label = slider
                    .closest(".motor-control")
                    .querySelector("label")
                    .textContent
                    .toLowerCase()
                    .replaceAll(" ", "_");

                values[label] = parseInt(slider.value);
            });

            console.log("SEND TO BACKEND:", values);

            try {
                const res = await fetch("/control/thruster-test", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(values)
                });

                const data = await res.json();
                console.log(data.message);

            } catch (err) {
                console.log(err);
            }

            setTimeout(() => {
                startBtn.disabled = false;
                startBtn.classList.remove("loading");
                startBtn.innerHTML = originalHTML;
            }, 2000);
        });
    }
}


function EmergencyStop() {
    const btn = document.getElementById("emergency-stop");

    btn.addEventListener("click", async () => {
        const originalHTML = btn.innerHTML;

        btn.disabled = true;
        btn.classList.add("loading");
        btn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Stop
        `;

        sendThrusterCommand("EMERGENCY_STOP");

        // reset UI
        const sliders = document.querySelectorAll(".motor-slider");

        sliders.forEach(slider => {
            slider.value = 0;

            const valueText = slider
                .closest(".motor-control")
                .querySelector(".motor-value");

            valueText.textContent = "0%";
        });

        setTimeout(() => {
            loadThrusterConfig();

            btn.disabled = false;
            btn.classList.remove("loading");
            btn.innerHTML = originalHTML;
        }, 1000);
    });
}


async function loadThrusterConfig() {
    try {
        const res = await fetch("/control/thruster-config");
        const data = await res.json();

        console.log("LOAD CONFIG:", data);

        const sliders = document.querySelectorAll(".motor-slider");

        sliders.forEach(slider => {
            const label = slider
                .closest(".motor-control")
                .querySelector("label")
                .textContent
                .toLowerCase()
                .replaceAll(" ", "_");

            if (data[label] !== undefined) {
                slider.value = data[label];

                const valueText = slider
                    .closest(".motor-control")
                    .querySelector(".motor-value");

                valueText.textContent = `${data[label]}%`;
            }
        });

    } catch (err) {
        console.log("Failed load config:", err);
    }
}







// ==================== HALAMAN MISSION PLANNER ====================
// ==================== HALAMAN SENSOR & PID TUNNING ====================



// ==================== HALAMAN CAMERA SETTINGS ====================
function sendCameraSettingsCommand(command, value = null) { 
    const now = Date.now();

    if (
        command === lastCommand && 
        now - lastSentTime < 100
    ) {
        return;
    }

    lastCommand = command;
    lastSentTime = now;

    fetch("/control/command", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            action: command,
            value: value
        })
    })
    .catch(err => console.log(err));
}



function initCameraSelection() {

    const options = document.querySelectorAll(".camera-option");
    const img = document.getElementById("settings-camera-stream");
    const placeholder = document.querySelector(".camera-placeholder");

    window.activeCamera = "front";

    const cameraMap = CAMERA_CONFIG;

    CheckCameraStatus();
    setInterval(CheckCameraStatus, 3000);

    function setCamera(cameraKey) {
        const url = cameraMap[cameraKey];

        window.activeCamera = cameraKey;
        img.src = "";

        img.style.display = "none";
        placeholder.style.display = "flex";
        placeholder.querySelector("p").textContent = "Connecting...";

        if (!url) {
            placeholder.querySelector("p").textContent = "Camera Not Available";
            return;
        }

        setTimeout(() => {
            img.src = url;
        }, 200);

        setTimeout(() => {
            if (typeof updateCameraReady === "function") {
                updateCameraReady();
            }
        }, 300);

        img.onload = () => {
            img.style.display = "block";
            placeholder.style.display = "none";
        };

        img.onerror = () => {
            placeholder.querySelector("p").textContent = "Camera Offline";
        };
    }

    function updateStatus(activeKey, state) {
        options.forEach(opt => {
            const badge = opt.querySelector(".status-badge");
            const key = opt.dataset.camera;
            setBadge(badge, "connecting");

            if (key === activeKey) {
                badge.classList.remove("online", "offline");
                badge.classList.add(state);
                badge.textContent = state.toUpperCase();
            }
        });
    }

    options.forEach(option => {
        option.addEventListener("click", () => {
            options.forEach(o => o.classList.remove("active"));
            option.classList.add("active");

            setCamera(option.dataset.camera);
        });
    });

    setCamera(window.activeCamera);
}

function initCameraSettingsActions() {
    const captureBtn = document.getElementById("settings-capture-btn");
    const recordBtn = document.getElementById("settings-record-btn");

    let isRecording = false;
    let cooldown = false;
    let cameraReady = false; 

    function getEndpoints() {
        const cam = window.activeCamera;
        return {
            capture: `/camera/capture/${cam}`,
            start: `/camera/record/start/${cam}`,
            stop: `/camera/record/stop/${cam}`
        };
    }

    async function updateCameraReady() {
        const cam = window.activeCamera;

        try {
            const res = await fetch(`/camera/status/${cam}`);
            const data = await res.json();

            cameraReady = data.streaming === true;

        } catch {
            cameraReady = false;
        }

        updateButtons();
    }

    function updateButtons() {
        captureBtn.disabled = !cameraReady;
        recordBtn.disabled = !cameraReady;

        if (!cameraReady && isRecording) {
            isRecording = false;
            updateRecordUI();
        }
    }

    function updateRecordUI() {
        if (isRecording) {
            recordBtn.innerHTML = `<i class="fas fa-stop"></i>`;
            recordBtn.classList.add("recording-active");
        } else {
            recordBtn.innerHTML = `<i class="fas fa-video"></i>`;
            recordBtn.classList.remove("recording-active");
        }
    }

    // ================= CAPTURE =================
    captureBtn.addEventListener("click", async () => {
        if (!cameraReady) return;

        const { capture } = getEndpoints();

        captureBtn.classList.add("click-effect");
        setTimeout(() => {
            captureBtn.classList.remove("click-effect");
        }, 100);

        try {
            const res = await fetch(capture, { method: "POST" });
            const data = await res.json();
            console.log(data.message);
        } catch (err) {
            console.log(err);
        }
    });

    // ================= RECORD =================
    recordBtn.addEventListener("click", async () => {
        if (!cameraReady || cooldown) return;

        cooldown = true;
        setTimeout(() => (cooldown = false), 800);

        const { start, stop } = getEndpoints();
        const endpoint = isRecording ? stop : start;

        try {
            const res = await fetch(endpoint, { method: "POST" });
            const data = await res.json();

            if (data.success) {
                isRecording = !isRecording;
                updateRecordUI();
            }

        } catch (err) {
            console.log(err);
        }
    });

    setInterval(updateCameraReady, 2000);

    updateRecordUI();
    updateButtons(); 
}

async function CheckCameraStatus() {
    const options = document.querySelectorAll(".camera-option");

    for (const opt of options) {
        const badge = opt.querySelector(".status-badge");
        const cam = opt.dataset.camera;

        try {
            const res = await fetch(`/camera/status/${cam}`);
            const data = await res.json();
            // console.log("CHECK:", cam, CAMERA_CONFIG[cam]);

            if (!CAMERA_CONFIG[cam]) {
                setBadge(badge, "offline");
                continue;
            }

            if (data.streaming) {
                setBadge(badge, "online");
            } else if (data.device) {
                setBadge(badge, "connecting");
            } else {
                setBadge(badge, "offline");
            }

        } catch {
            setBadge(badge, "offline");
        }
    }
}


function setBadge(badge, state) {
    if (badge.classList.contains(state)) return;

    badge.classList.remove("online", "offline", "connecting");
    badge.classList.add(state);
    badge.textContent = state.toUpperCase();
}


function initCameraAdjustment() {
    const sliders = document.querySelectorAll(".adjust-slider");

    sliders.forEach(slider => {
        const parent = slider.closest(".adjust-item"); // FIX DISINI
        if (!parent) return; // biar gak crash

        const valueText = parent.querySelector(".adjust-value");

        function update() {
            if (valueText) {
                valueText.textContent = slider.value + "%";
            }

            slider.style.background = `linear-gradient(
                to right,
                var(--accent-primary) 0%,
                var(--accent-primary) ${slider.value}%,
                #374151 ${slider.value}%,
                #374151 100%
            )`;
        }

        slider.addEventListener("input", update);
        update();
    });
}











































// ==================== HALAMAN CONNECTION ====================
// ==================== HALAMAN DATA LOGGING ====================
// ==================== HALAMAN SYSTEM SETTINGS ====================









