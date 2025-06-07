class WindowManager {
    constructor(desktop, taskbar) {
        this.desktop = desktop;
        this.taskbar = taskbar;
        this.windows = new Map(); // windowId -> { element, state }
        this.activeWindow = null;
        this.highestZIndex = 100;
        this.openWindows = new Map(); // appId -> windowId
        this.fileSystem = {};

        // UI Elements
        this.lockScreen = document.getElementById('lock-screen');
        this.loginForm = document.getElementById('login-form');
        this.passwordInput = document.getElementById('password-input');
        this.mainEnvironment = document.getElementById('main-environment');
        this.desktopIconsContainer = document.getElementById('desktop-icons-container');
        this.notificationContainer = document.getElementById('notification-container');
        this.startButton = document.getElementById('start-button');
        this.startMenu = document.getElementById('start-menu');
        this.startMenuApps = document.getElementById('start-menu-apps');
        this.desktopContextMenu = document.getElementById('context-menu-desktop');
        this.iconContextMenu = document.getElementById('context-menu-icon');
        this.lockButton = document.getElementById('lock-button');
        
        // Application registry
        this.appRegistry = {
            'notepad': { title: 'Notepad', icon: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>', content: '<textarea class="app-content" placeholder="Start typing..."></textarea>', isDeletable: false },
            'terminal': { title: 'Terminal', icon: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>', content: '<div class="app-content font-mono text-green-400"><div>User@WebOS:~$ <span class="cursor-blink">|</span></div></div>', isDeletable: false },
            'settings': { title: 'Settings', icon: '<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>', content: `<div class="app-content settings-app"><h3 class="settings-title">Appearance</h3><div class="setting-item"><label for="wallpaper-input">Desktop Wallpaper URL:</label><div class="input-group"><input type="text" id="wallpaper-input" class="settings-input" placeholder="Enter image URL..."><button id="wallpaper-button" class="settings-button">Apply</button></div></div><h3 class="settings-title">System</h3><div class="setting-item"><button id="notification-button" class="settings-button">Show Test Notification</button></div></div>`, isDeletable: false },
            'calculator': { title: 'Calculator', icon: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm0 3h.008v.008H8.25v-.008Zm3-6h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm3-6h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h3.375c.621 0 1.125.504 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-3.375a1.125 1.125 0 0 1-1.125-1.125v-3.375Z" /></svg>', content: `<div class="app-content calculator"><div class="calc-display">0</div><div class="calc-buttons"><button>C</button><button>(</button><button>)</button><button>/</button><button>7</button><button>8</button><button>9</button><button>*</button><button>4</button><button>5</button><button>6</button><button>-</button><button>1</button><button>2</button><button>3</button><button>+</button><button>0</button><button>.</button><button>DEL</button><button>=</button></div></div>`, isDeletable: false },
            'file-explorer': { title: 'File Explorer', icon: '<i class="ri-folder-line"></i>', content: `<div class="app-content file-explorer-app"></div>`, isDeletable: false },
            'folder': { title: 'New Folder', icon: '<i class="ri-folder-fill"></i>', isApp: false, isDeletable: true, isRenamable: true }
        };

        this.init();
    }

    init() {
        this.initLogin();
    }

    initLogin() {
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.passwordInput.value === 'password') {
                this.unlockSystem();
            } else {
                const loginBox = this.loginForm.parentElement;
                loginBox.classList.add('error');
                this.passwordInput.value = '';
                setTimeout(() => loginBox.classList.remove('error'), 500);
            }
        });
    }
    
    unlockSystem() {
        this.lockScreen.classList.add('hidden');
        this.mainEnvironment.classList.remove('hidden');
        if (!this.desktopInitialized) {
            this.initializeDesktop();
            this.desktopInitialized = true;
        }
    }
    
    lockSystem() {
        this.passwordInput.value = '';
        this.lockScreen.classList.remove('hidden');
        this.mainEnvironment.classList.add('hidden');
    }

    initializeDesktop() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        this.initStartMenu();
        this.initContextMenu();
        this.initFileSystem();
        this.loadWallpaper();
        this.loadWindowState();
        this.showNotification('Welcome back, Guest User!', 'info');
        window.addEventListener('beforeunload', () => {
            this.saveWindowState();
            this.saveFileSystem();
        });
    }

    initStartMenu() {
        this.startMenuApps.innerHTML = '';
        for (const appId in this.appRegistry) {
            const app = this.appRegistry[appId];
            if (app.isApp !== false) {
                const button = document.createElement('button');
                button.innerHTML = `${app.icon}<span>${app.title}</span>`;
                button.classList.add('start-menu-item');
                button.onclick = () => { this.createWindow(appId); this.toggleStartMenu(false); };
                this.startMenuApps.appendChild(button);
            }
        }
        this.startButton.addEventListener('click', (e) => { e.stopPropagation(); this.toggleStartMenu(); });
        this.lockButton.addEventListener('click', () => this.lockSystem());
    }

    initContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.hideContextMenus();
            const targetIcon = e.target.closest('.desktop-icon');
            if (targetIcon) {
                this.showIconContextMenu(e.clientX, e.clientY, targetIcon);
            } else {
                this.showDesktopContextMenu(e.clientX, e.clientY);
            }
        });

        document.addEventListener('click', (e) => {
            this.hideContextMenus();
            if (!this.startMenu.contains(e.target) && !this.startButton.contains(e.target)) {
                this.toggleStartMenu(false);
            }
        });
    }

    hideContextMenus() {
        this.desktopContextMenu.classList.add('hidden');
        this.iconContextMenu.classList.add('hidden');
    }

    showDesktopContextMenu(x, y) {
        this.desktopContextMenu.style.top = `${y}px`;
        this.desktopContextMenu.style.left = `${x}px`;
        this.desktopContextMenu.classList.remove('hidden');
        this.desktopContextMenu.onclick = (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if(action) this.handleDesktopContextMenuAction(action);
            this.hideContextMenus();
        };
    }
    
    showIconContextMenu(x, y, icon) {
        this.iconContextMenu.style.top = `${y}px`;
        this.iconContextMenu.style.left = `${x}px`;
        this.iconContextMenu.classList.remove('hidden');
        
        const appId = icon.dataset.appId;
        const appConfig = this.appRegistry[appId];
        
        this.iconContextMenu.querySelector('[data-action="delete"]').classList.toggle('disabled', !appConfig.isDeletable);
        this.iconContextMenu.querySelector('[data-action="rename"]').classList.toggle('disabled', !appConfig.isRenamable);

        this.iconContextMenu.onclick = (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if(action && !e.target.closest('.context-menu-item').classList.contains('disabled')) {
                this.handleIconContextMenuAction(action, icon);
            }
            this.hideContextMenus();
        };
    }

    handleDesktopContextMenuAction(action) {
        switch(action) {
            case 'change-wallpaper': this.createWindow('settings'); break;
            case 'new-folder': this.createNewDesktopIcon('folder', { x: parseInt(this.desktopContextMenu.style.left), y: parseInt(this.desktopContextMenu.style.top) }); break;
            case 'refresh': document.body.style.opacity = 0.9; setTimeout(() => document.body.style.opacity = 1, 100); break;
        }
    }

    handleIconContextMenuAction(action, icon) {
        const appId = icon.dataset.appId;
        switch(action) {
            case 'open':
                if(this.appRegistry[appId].isApp !== false) this.createWindow(appId);
                else this.createWindow('file-explorer');
                break;
            case 'rename':
                this.renameIcon(icon);
                break;
            case 'delete':
                if (this.appRegistry[appId].isDeletable) {
                    delete this.fileSystem.desktop[icon.id];
                    icon.remove();
                    this.saveFileSystem();
                }
                break;
        }
    }

    renameIcon(icon) {
        const span = icon.querySelector('span');
        const currentName = span.textContent;
        const input = document.createElement('input');
        input.type = 'text'; input.value = currentName; input.className = 'icon-title-input';
        icon.replaceChild(input, span);
        input.focus(); input.select();
        const finishRename = () => {
            const newName = input.value.trim() || currentName;
            span.textContent = newName;
            this.fileSystem.desktop[icon.id].title = newName;
            icon.replaceChild(span, input);
            this.saveFileSystem();
        };
        input.addEventListener('blur', finishRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') { input.value = currentName; input.blur(); }
        });
    }

    toggleStartMenu(forceState) {
        const isHidden = this.startMenu.classList.contains('hidden');
        if (forceState === true || (forceState === undefined && isHidden)) {
            this.startMenu.classList.remove('hidden'); this.startButton.classList.add('active');
        } else {
            this.startMenu.classList.add('hidden'); this.startButton.classList.remove('active');
        }
    }

    updateClock() {
        const clockEl = document.getElementById('clock');
        if (clockEl) {
            clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
    }
    
    showNotification(message, type = 'info') {
        const iconMap = {
            info: 'ri-information-line',
            success: 'ri-checkbox-circle-line',
            error: 'ri-error-warning-line',
        };
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="icon ${iconMap[type]}"></i>
            <span>${message}</span>
        `;
        this.notificationContainer.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            notification.addEventListener('animationend', () => notification.remove());
        }, 4000);
    }

    createWindow(appId, state = {}) {
        if (this.openWindows.has(appId) && !state.id) {
            const windowId = this.openWindows.get(appId);
            const { element } = this.windows.get(windowId);
            if (element.classList.contains('minimized')) this.toggleMinimize(windowId);
            this.focusWindow(windowId);
            return;
        }

        const appConfig = this.appRegistry[appId];
        if (!appConfig || appConfig.isApp === false) { console.error(`Application not found: ${appId}`); return; }

        const windowId = state.id || `window-${Date.now()}`;
        const windowEl = document.createElement('div');
        windowEl.id = windowId; windowEl.className = 'window'; windowEl.dataset.appId = appId;
        
        windowEl.style.zIndex = state.zIndex || this.highestZIndex++;
        const offsetX = (this.windows.size % 10) * 20; const offsetY = (this.windows.size % 10) * 20;
        windowEl.style.left = state.left || `${100 + offsetX}px`;
        windowEl.style.top = state.top || `${100 + offsetY}px`;
        windowEl.style.width = state.width || '500px';
        windowEl.style.height = state.height || '350px';

        const titleBar = this.createTitleBar(appId, appConfig.title, windowId);
        const content = document.createElement('div'); content.className = 'window-content'; content.innerHTML = appConfig.content;

        const resizeHandles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
        resizeHandles.forEach(dir => { const handle = document.createElement('div'); handle.className = `resize-handle ${dir}`; windowEl.appendChild(handle); });
        
        windowEl.appendChild(titleBar); windowEl.appendChild(content);

        this.desktop.appendChild(windowEl);
        this.windows.set(windowId, { element: windowEl, state: {} });
        this.openWindows.set(appId, windowId);
        
        this.makeDraggable(windowEl); this.makeResizable(windowEl);

        if (appId === 'calculator') this.attachCalculatorLogic(windowEl);
        if (appId === 'settings') this.attachSettingsLogic(windowEl);
        if (appId === 'file-explorer') this.attachFileExplorerLogic(windowEl);


        this.updateTaskbar();
        if (!state.minimized) this.focusWindow(windowId);

        windowEl.addEventListener('mousedown', () => this.focusWindow(windowId), true);
    }
    
    createTitleBar(appId, title, windowId) {
        const titleBar = document.createElement('div'); titleBar.className = 'title-bar';
        const titleText = document.createElement('span'); titleText.textContent = title;
        const buttons = document.createElement('div'); buttons.className = 'title-bar-buttons';
        const minimizeBtn = document.createElement('button'); minimizeBtn.className = 'minimize-btn';
        minimizeBtn.onclick = (e) => { e.stopPropagation(); this.toggleMinimize(windowId); };
        const maximizeBtn = document.createElement('button'); maximizeBtn.className = 'maximize-btn';
        maximizeBtn.onclick = (e) => { e.stopPropagation(); this.toggleMaximize(windowId); };
        const closeBtn = document.createElement('button'); closeBtn.className = 'close-btn';
        closeBtn.onclick = (e) => { e.stopPropagation(); this.closeWindow(windowId, appId); };
        buttons.appendChild(minimizeBtn); buttons.appendChild(maximizeBtn); buttons.appendChild(closeBtn);
        titleBar.appendChild(titleText); titleBar.appendChild(buttons);
        return titleBar;
    }

    closeWindow(windowId, appId) {
        const windowData = this.windows.get(windowId);
        if (windowData) {
            windowData.element.remove();
            this.windows.delete(windowId);
            this.openWindows.delete(appId);
            this.updateTaskbar();
        }
    }

    toggleMinimize(windowId) {
        const { element } = this.windows.get(windowId);
        if (element) {
            const isMinimized = element.classList.toggle('minimized');
            if (isMinimized) { if (this.activeWindow === element) this.activeWindow = null; } 
            else { this.focusWindow(windowId); }
            this.updateTaskbar();
        }
    }
    
    toggleMaximize(windowId) {
        const { element, state } = this.windows.get(windowId);
        if (!element) return;
        const taskbarHeight = document.querySelector('.taskbar').offsetHeight;
        const isMaximized = element.classList.toggle('maximized');
        if (isMaximized) {
            state.preMaximizeState = { left: element.style.left, top: element.style.top, width: element.style.width, height: element.style.height };
            element.style.left = '0px'; element.style.top = '0px'; element.style.width = '100vw'; element.style.height = `calc(100vh - ${taskbarHeight}px)`;
        } else {
            const oldState = state.preMaximizeState;
            if (oldState) {
                element.style.left = oldState.left; element.style.top = oldState.top;
                element.style.width = oldState.width; element.style.height = oldState.height;
            }
        }
    }

    focusWindow(windowId) {
        if (!this.windows.has(windowId)) return;
        const { element } = this.windows.get(windowId);
        if (this.activeWindow === element) return;
        this.activeWindow = element;
        this.activeWindow.style.zIndex = this.highestZIndex++;
        this.updateTaskbar();
    }
    
    updateTaskbar() {
        const taskbarAppsContainer = document.getElementById('taskbar-apps');
        taskbarAppsContainer.innerHTML = ''; 
        this.windows.forEach(({ element }, windowId) => {
            const appId = element.dataset.appId;
            const appConfig = this.appRegistry[appId];
            const button = document.createElement('button');
            button.dataset.windowId = windowId; button.textContent = appConfig.title;
            if (this.activeWindow === element && !element.classList.contains('minimized')) button.classList.add('active');
            button.onclick = () => {
                const isMinimized = element.classList.contains('minimized');
                if (this.activeWindow === element && !isMinimized) this.toggleMinimize(windowId);
                else { if (isMinimized) this.toggleMinimize(windowId); this.focusWindow(windowId); }
            };
            taskbarAppsContainer.appendChild(button);
        });
    }

    makeDraggable(element) {
        let p1=0, p2=0, p3=0, p4=0; const titleBar = element.querySelector('.title-bar');
        const drag = (e) => {
            if (e.target.tagName === 'BUTTON' || element.classList.contains('maximized')) return;
            e.preventDefault(); p3=e.clientX; p4=e.clientY; this.focusWindow(element.id);
            document.onmouseup=stop; document.onmousemove=move;
        };
        const move = (e) => { e.preventDefault(); p1=p3-e.clientX; p2=p4-e.clientY; p3=e.clientX; p4=e.clientY; element.style.top=`${element.offsetTop-p2}px`; element.style.left=`${element.offsetLeft-p1}px`; };
        const stop = () => { document.onmouseup=null; document.onmousemove=null; };
        if (titleBar) titleBar.onmousedown = drag;
    }

    makeResizable(element) {
        const handles = element.querySelectorAll('.resize-handle'); let initialRect, initialMouseX, initialMouseY;
        const resize = (e) => {
            const dx=e.clientX-initialMouseX, dy=e.clientY-initialMouseY, dir=e.target.classList[1];
            let w=initialRect.width, h=initialRect.height, l=initialRect.left, t=initialRect.top;
            if (dir.includes('e')) w=initialRect.width+dx; if (dir.includes('w')) { w=initialRect.width-dx; l=initialRect.left+dx; }
            if (dir.includes('s')) h=initialRect.height+dy; if (dir.includes('n')) { h=initialRect.height-dy; t=initialRect.top+dy; }
            if(w>300) { element.style.width=`${w}px`; element.style.left=`${l}px`; }
            if(h>200) { element.style.height=`${h}px`; element.style.top=`${t}px`; }
        };
        const stop = () => { window.removeEventListener('mousemove',resize); window.removeEventListener('mouseup',stop); };
        handles.forEach(h => {
            h.addEventListener('mousedown', (e) => {
                if (element.classList.contains('maximized')) return;
                e.preventDefault(); initialRect=element.getBoundingClientRect(); initialMouseX=e.clientX; initialMouseY=e.clientY;
                this.focusWindow(element.id); window.addEventListener('mousemove',resize); window.addEventListener('mouseup',stop);
            });
        });
    }

    attachCalculatorLogic(el) {
        const d=el.querySelector('.calc-display'), b=el.querySelector('.calc-buttons'); let i='0';
        b.addEventListener('click', (e) => {
            if (e.target.tagName!=='BUTTON') return; const v=e.target.innerText;
            if (v==='C') i='0'; else if (v==='DEL') i=i.slice(0,-1)||'0';
            else if (v==='=') { try { i=String(eval(i.replace(/[^-()\d/*+.]/g, ''))); } catch { i='Error'; } }
            else { if (i==='0'||i==='Error') i=v; else i+=v; }
            d.innerText=i;
        });
    }

    attachSettingsLogic(el) {
        const i=el.querySelector('#wallpaper-input'), b=el.querySelector('#wallpaper-button');
        const notifBtn = el.querySelector('#notification-button');
        i.value = localStorage.getItem('desktopWallpaper') || '';
        b.addEventListener('click', () => { this.changeWallpaper(i.value); });
        notifBtn.addEventListener('click', () => this.showNotification('This is a test notification!', 'info'));
    }

    attachFileExplorerLogic(windowEl) {
        const container = windowEl.querySelector('.file-explorer-app');
        container.innerHTML = '';
        const desktopItems = this.fileSystem.desktop || {};
        for (const id in desktopItems) {
            const itemData = desktopItems[id];
            const appConfig = this.appRegistry[itemData.appId];
            const itemEl = document.createElement('div');
            itemEl.className = 'file-item';
            itemEl.innerHTML = `${appConfig.icon}<span>${itemData.title}</span>`;
            itemEl.addEventListener('dblclick', () => {
                this.createWindow(itemData.appId);
            });
            container.appendChild(itemEl);
        }
    }
    
    changeWallpaper(url) { if (url) { this.desktop.style.backgroundImage = `url('${url}')`; localStorage.setItem('desktopWallpaper', url); } }
    loadWallpaper() { const url = localStorage.getItem('desktopWallpaper'); if (url) this.desktop.style.backgroundImage = `url('${url}')`; }

    // File System and Desktop Icon Management
    initFileSystem() {
        const savedFS = localStorage.getItem('fileSystem');
        if (savedFS) {
            this.fileSystem = JSON.parse(savedFS);
        } else {
            this.fileSystem = {
                'desktop': {
                    'icon-notepad': { appId: 'notepad', title: 'Notepad', top: 32, left: 32 },
                    'icon-terminal': { appId: 'terminal', title: 'Terminal', top: 128, left: 32 },
                    'icon-settings': { appId: 'settings', title: 'Settings', top: 224, left: 32 },
                    'icon-calculator': { appId: 'calculator', title: 'Calculator', top: 320, left: 32 },
                    'icon-file-explorer': { appId: 'file-explorer', title: 'File Explorer', top: 416, left: 32 }
                }
            };
        }
        this.loadDesktop();
    }

    loadDesktop() {
        this.desktopIconsContainer.innerHTML = '';
        const desktopItems = this.fileSystem.desktop || {};
        for (const id in desktopItems) {
            const item = desktopItems[id];
            this.createNewDesktopIcon(item.appId, { x: item.left, y: item.top }, id, item.title);
        }
    }
    
    createNewDesktopIcon(appId, pos, id, title) {
        const iconId = id || `icon-${Date.now()}`;
        const appConfig = this.appRegistry[appId];
        const iconEl = document.createElement('div');
        iconEl.className = 'desktop-icon'; iconEl.id = iconId; iconEl.dataset.appId = appId;
        iconEl.style.left = `${pos.x}px`; iconEl.style.top = `${pos.y}px`;

        const iconTitle = title || appConfig.title;
        iconEl.innerHTML = `${appConfig.icon}<span>${iconTitle}</span>`;

        if (appConfig.isApp !== false) iconEl.addEventListener('dblclick', () => this.createWindow(appId));
        else iconEl.addEventListener('dblclick', () => this.createWindow('file-explorer'));
        
        this.desktopIconsContainer.appendChild(iconEl);
        this.makeIconDraggable(iconEl);

        if (!id) {
            this.fileSystem.desktop[iconId] = { appId, title: iconTitle, top: pos.y, left: pos.x };
            this.saveFileSystem();
        }
        return iconEl;
    }

    makeIconDraggable(element) {
        let p1=0, p2=0, p3=0, p4=0;
        const drag = (e) => {
            if (e.button !== 0 || e.target.tagName === 'INPUT') return;
            e.preventDefault(); p3=e.clientX; p4=e.clientY;
            element.classList.add('dragging');
            document.onmouseup=stop; document.onmousemove=move;
        };
        const move = (e) => {
            e.preventDefault(); p1=p3-e.clientX; p2=p4-e.clientY; p3=e.clientX; p4=e.clientY;
            element.style.top=`${element.offsetTop-p2}px`; element.style.left=`${element.offsetLeft-p1}px`;
        };
        const stop = () => {
            element.classList.remove('dragging');
            document.onmouseup=null; document.onmousemove=null;
            this.fileSystem.desktop[element.id].left = parseInt(element.style.left);
            this.fileSystem.desktop[element.id].top = parseInt(element.style.top);
            this.saveFileSystem();
        };
        element.onmousedown = drag;
    }

    // State Persistence
    saveFileSystem() {
        localStorage.setItem('fileSystem', JSON.stringify(this.fileSystem));
    }

    saveWindowState() {
        const data = [];
        this.windows.forEach(({ element, state }, id) => {
            let s = { id, appId: element.dataset.appId, zIndex: element.style.zIndex };
            if (element.classList.contains('maximized')) Object.assign(s, state.preMaximizeState);
            else Object.assign(s, { left: element.style.left, top: element.style.top, width: element.style.width, height: element.style.height });
            data.push(s);
        });
        localStorage.setItem('windowManager', JSON.stringify(data));
    }

    loadWindowState() {
        const saved = localStorage.getItem('windowManager');
        if (saved) {
            const states = JSON.parse(saved);
            states.sort((a,b)=>a.zIndex-b.zIndex);
            states.forEach(s => {
                if(s.zIndex >= this.highestZIndex) this.highestZIndex = parseInt(s.zIndex) + 1;
                this.createWindow(s.appId, s);
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const desktop = document.getElementById('desktop');
    const taskbar = document.getElementById('taskbar-apps');
    new WindowManager(desktop, taskbar);
});
