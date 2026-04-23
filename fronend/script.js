
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const pageTitle = document.querySelector('.top-bar-title h2');
    // const pageTitleContainer = document.querySelector();
    const menuLinks = document.querySelectorAll('.sidebar-menu a[data-page]');

async function loadPage(pageName) {
    try {
        const response = await fetch(`pages/${pageName}.html`);
        if (!response.ok) {
            throw new Error(`Halaman tidak ditemukan: ${pageName}.html`);
        }
        mainContent.innerHTML = await response.text();

        const pageTitleElement = document.getElementById('page-title');
        const activeLink = document.querySelector(`.sidebar-menu a[data-page="${pageName}"]`);
        pageTitleElement.textContent = activeLink.getAttribute('title');
        const pageStatusContainer = document.getElementById('page-status-container');
        let statusHTML = '';
        switch (pageName) {
            case 'thrustercontrol':
                statusHTML = `<div class="status-indicator-alt"><i class="fas fa-gamepad"></i> No Gamepad</div>`;
                break;
            case 'sensorpid':
                statusHTML = `<div class="status-indicator-alt">PID Idle</div>`;
                break;
            case 'camerasettings':
                statusHTML = `<div class="status-indicator-alt">Standby</div>`;
                break;
            case 'connection':
                statusHTML = `<div class="status-indicator online"><span class="status-dot"></span> Connected</div>`;
                break;
            case 'datalogging':
                statusHTML = `<div id="logging-status-badge" class="status-badge stopped">Stopped</div>`;
                break;
            case 'systemsettings':
                statusHTML = `<div class="status-indicator-alt">Version 1.2.3</div>`;
                break;
        }

        pageStatusContainer.innerHTML = statusHTML;
        initializeWidgets(pageName);

    } catch (error) {
        console.error('Gagal memuat halaman:', error);
        mainContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

    function initializeWidgets(pageName) {
        if (pageName === 'dashboard') {
            initializeMissionTimer();
        } else if (pageName === 'thrustercontrol') {
            initializeThrusterControls();
        } else if (pageName === 'sensorpid') {
            initializeSensorPidControls();
        } else if (pageName === 'camerasettings') {
            initializeCameraSettings();
        } else if (pageName === 'connection') {
            initializeConnectionSettings();
        } else if (pageName === 'missionplanner') {
            initializeMissionPlanner();
        } else if (pageName === 'datalogging') {
            initializeDataLogging();
        } else if (pageName === 'systemsettings') {
            initializeSystemSettings();
        }
    }

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.getAttribute('data-page');
            menuLinks.forEach(l => l.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
            loadPage(pageName);
        });
    });
    
    loadPage('dashboard');

    function initializeMenuToggle() {
        const toggleTriggers = document.querySelectorAll('.menu-toggle-trigger');
        toggleTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                document.body.classList.toggle('menu-open');
            });
        });
    }

    function initializePageLoader() {
        menuLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const pageName = this.getAttribute('data-page');
                
                if (pageName) {
                    loadPage(pageName);
                    document.querySelector('.sidebar-menu li.active')?.classList.remove('active');
                    this.parentElement.classList.add('active');
                }
            });
        });
    }

    function initializeMissionTimer() {
        const timeDisplay = document.getElementById('time-display');
        const missionBtn = document.getElementById('mission-btn');
        if (!missionBtn || !timeDisplay) return;

        const missionBtnIcon = missionBtn.querySelector('i');
        const missionBtnText = missionBtn.querySelector('span');
        
        let seconds = 0;
        let timerInterval = null;
        let missionState = 0;

        function formatTime(totalSeconds) {
            const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const s = String(totalSeconds % 60).padStart(2, '0');
            return `${h}:${m}:${s}`;
        }

        function handleMission() {
            if (missionState === 0) {
                timerInterval = setInterval(() => {
                    seconds++;
                    timeDisplay.textContent = formatTime(seconds);
                }, 1000);
                missionBtn.className = 'mission-btn stop';
                missionBtnIcon.className = 'fas fa-stop';
                missionBtnText.textContent = 'Stop Mission';
                missionState = 1;
            } else if (missionState === 1) {
                clearInterval(timerInterval);
                missionBtn.className = 'mission-btn reset';
                missionBtnIcon.className = 'fas fa-redo';
                missionBtnText.textContent = 'Reset Mission';
                missionState = 2;
            } else {
                seconds = 0;
                timeDisplay.textContent = '00:00:00';
                missionBtn.className = 'mission-btn start';
                missionBtnIcon.className = 'fas fa-play';
                missionBtnText.textContent = 'Start Mission';
                missionState = 0;
            }
        }
        missionBtn.addEventListener('click', handleMission);
    }

    function initializeThrusterControls() {
        console.log("Halaman Thruster Control dimuat!");

        const testButtons = document.querySelectorAll('.btn-motor-test');
        testButtons.forEach(button => {
            button.addEventListener('click', function() {
                const isStopping = this.classList.contains('stop');

                if (isStopping) {
                    this.innerHTML = '<i class="fas fa-play"></i> Start Test';
                    this.classList.remove('stop');
                } else {
                    this.innerHTML = '<i class="fas fa-stop"></i> Stop Test';
                    this.classList.add('stop');
                }
            });
        });
    }

    function initializeSensorPidControls() {
        console.log("Halaman Sensor & PID Tuning dimuat!");
        const dropdowns = document.querySelectorAll('.custom-select');

        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.custom-select-trigger');
            const options = dropdown.querySelectorAll('.custom-option');

            if (trigger) {
                trigger.addEventListener('click', () => {
                    dropdown.classList.toggle('open');
                });
            }

            options.forEach(option => {
                option.addEventListener('click', function() {
                    this.parentElement.querySelectorAll('.custom-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    this.classList.add('selected');
                    if (trigger) {
                        trigger.querySelector('span').textContent = this.textContent;
                    }
                    dropdown.classList.remove('open');
                });
            });
        });
    }

    function initializeCameraSettings() {
        console.log("Halaman Camera Settings dimuat!");
        const presetDropdown = document.querySelector('.preset-select .custom-select');

        if (presetDropdown) {
            const trigger = presetDropdown.querySelector('.custom-select-trigger');
            const options = presetDropdown.querySelectorAll('.custom-option');

            if (trigger) {
                trigger.addEventListener('click', () => {
                    presetDropdown.classList.toggle('open');
                });
            }

            options.forEach(option => {
                option.addEventListener('click', function() {
                    this.parentElement.querySelectorAll('.custom-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    this.classList.add('selected');

                    if (trigger) {
                        trigger.querySelector('span').textContent = this.textContent;
                    }
                    presetDropdown.classList.remove('open');
                });
            });
            document.addEventListener('click', function(e) {
                if (!presetDropdown.contains(e.target)) {
                    presetDropdown.classList.remove('open');
                }
            });
        }
    }

    function initializeConnectionSettings() {
        console.log("Halaman Connection Settings dimuat!");

        const customSelect = document.querySelector('.custom-select');
        if (customSelect) {
            const trigger = customSelect.querySelector('.custom-select-trigger');
            const options = customSelect.querySelectorAll('.custom-option');
            
            const wifiSettings = document.getElementById('wifi-settings');
            const lanSettings = document.getElementById('lan-settings');

            trigger.addEventListener('click', () => {
                customSelect.classList.toggle('open');
            });

            options.forEach(option => {
                option.addEventListener('click', function() {
                    options.forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                    trigger.innerHTML = this.innerHTML + '<i class="fas fa-chevron-down arrow"></i>';
                    customSelect.classList.remove('open');

                    const selectedValue = this.getAttribute('data-value');

                    if (selectedValue === 'lan') {
                        wifiSettings.style.display = 'none';
                        lanSettings.style.display = 'block';
                    } else {
                        wifiSettings.style.display = 'block';
                        lanSettings.style.display = 'none';
                    }
                });
            });
        }

        const connectionBtn = document.getElementById('connection-btn');
        if (connectionBtn) {
        }
    }

    function initializeMissionPlanner() {
        console.log("Halaman Mission Planner dimuat!");

        const customSelect = document.querySelector('.add-step-form .custom-select');
        if (customSelect) {
            const trigger = customSelect.querySelector('.custom-select-trigger');
            const options = customSelect.querySelectorAll('.custom-option');

            trigger.addEventListener('click', () => {
                customSelect.classList.toggle('open');
            });

            options.forEach(option => {
                option.addEventListener('click', function() {
                    trigger.querySelector('span').textContent = this.textContent;
                    customSelect.classList.remove('open');
                });
            });
        }
    }

    function initializeDataLogging() {
        console.log("Halaman Data Logging dimuat!");

        const loggingStatusBadge = document.getElementById('logging-status-badge');
        const startStopBtn = document.getElementById('start-stop-logging-btn');
        const sessionEntries = document.getElementById('session-entries');
        const sessionDuration = document.getElementById('session-duration');
        const sessionSize = document.getElementById('session-size');

        if (!startStopBtn) return;
        let isLogging = false;
        let loggingInterval = null;
        let seconds = 0;
        let entries = 0;

        function handleLogging() {
            isLogging = !isLogging;

            if (isLogging) {
                startStopBtn.innerHTML = '<i class="fas fa-stop-circle"></i> <span>Stop Logging</span>';
                startStopBtn.classList.remove('btn-primary');
                startStopBtn.classList.add('stop');
                loggingStatusIndicator.textContent = 'Recording';
                loggingStatusIndicator.classList.remove('stopped');
                loggingStatusIndicator.classList.add('recording');

                loggingInterval = setInterval(() => {
                    seconds++;
                    entries += Math.floor(Math.random() * 5) + 1;
                    const sizeInBytes = entries * 128;

                    sessionDuration.textContent = `${seconds}s`;
                    sessionEntries.textContent = entries;
                    sessionSize.textContent = `${sizeInBytes} B`;

                }, 1000);

            } else {
                clearInterval(loggingInterval);
                startStopBtn.innerHTML = '<i class="fas fa-play-circle"></i> <span>Start Logging</span>';
                startStopBtn.classList.remove('stop');
                startStopBtn.classList.add('btn-primary');
                loggingStatusIndicator.textContent = 'Stopped';
                loggingStatusIndicator.classList.remove('recording');
                loggingStatusIndicator.classList.add('stopped');
            }
        }

        startStopBtn.addEventListener('click', handleLogging);
    }

    function initializeSystemSettings() {
        console.log("Halaman System Settings dimuat!");
        const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');

        if (themeToggleCheckbox) {
            themeToggleCheckbox.checked = !document.body.classList.contains('light-mode');
            themeToggleCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    document.body.classList.remove('light-mode');
                } else {
                    document.body.classList.add('light-mode');
                }
            });
        }
    }

    initializeMenuToggle();
    initializePageLoader();
    loadPage('dashboard');

});