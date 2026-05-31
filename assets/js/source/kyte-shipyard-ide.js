/**
 * Kyte Shipyard IDE - Unified Code Editor
 *
 * Provides a VS Code-like editing experience for all code file types:
 * - Pages (HTML, JS, CSS)
 * - Functions (PHP)
 * - Scripts (JS)
 * - Email Templates (HTML)
 * - Web Components (HTML, CSS, JSON)
 */

import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

// ============================================
// Monaco Worker Configuration
// ============================================

window.MonacoEnvironment = {
    getWorker: function (moduleId, label) {
        const getWorkerBlob = (workerUrl) => {
            const workerCode = `
                self.MonacoEnvironment = {
                    baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/esm/vs'
                };
                importScripts('${workerUrl}');
            `;
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            return URL.createObjectURL(blob);
        };

        const baseUrl = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/esm/vs';
        let workerUrl;

        if (label === 'json') {
            workerUrl = `${baseUrl}/language/json/json.worker.js`;
        } else if (label === 'css' || label === 'scss' || label === 'less') {
            workerUrl = `${baseUrl}/language/css/css.worker.js`;
        } else if (label === 'html' || label === 'handlebars' || label === 'razor') {
            workerUrl = `${baseUrl}/language/html/html.worker.js`;
        } else if (label === 'typescript' || label === 'javascript') {
            workerUrl = `${baseUrl}/language/typescript/ts.worker.js`;
        } else {
            workerUrl = `${baseUrl}/editor/editor.worker.js`;
        }

        try {
            return new Worker(getWorkerBlob(workerUrl));
        } catch (err) {
            console.warn('Worker creation failed for', label, ':', err);
            throw err;
        }
    }
};

// ============================================
// Constants & Configuration
// ============================================

// File type definitions
const FILE_TYPES = {
    PAGE: {
        id: 'page',
        label: 'Pages',
        icon: 'fas fa-file-code',
        iconClass: 'html',
        sectionIcon: 'fas fa-sitemap',
        model: 'KytePage',
        publishable: true,           // can be published to S3 (state=1 → publishPage)
        loadModel: 'KytePageData',   // Special loader: uses KytePageData to get content
        loadField: 'page',            // KytePageData is keyed by 'page' field
        listField: 'site',
        parts: [
            { key: 'html', label: 'HTML', language: 'html', field: 'html' },
            { key: 'javascript', label: 'JavaScript', language: 'javascript', field: 'javascript' },
            { key: 'stylesheet', label: 'CSS', language: 'css', field: 'stylesheet' }
        ],
        nameField: 'title',
        displayName: (item) => item.title || item.page_name || 'Untitled',
        extractContent: (item) => ({
            html: item.html || '',
            javascript: item.javascript || '',
            stylesheet: item.stylesheet || '',
            _pageData: item
        }),
        // Version control
        versioning: {
            versionModel: 'KytePageVersion',
            versionField: 'page',
            contentModel: 'KytePageVersionContent',
            contentParts: ['html', 'stylesheet', 'javascript']
        }
    },
    FUNCTION: {
        id: 'function',
        label: 'Functions',
        icon: 'fas fa-code',
        iconClass: 'php',
        sectionIcon: 'fas fa-layer-group',
        model: 'Function',
        listField: 'controller',
        parts: [
            { key: 'code', label: 'PHP', language: 'php', field: 'code' }
        ],
        nameField: 'type',
        displayName: (item) => {
            const type = item.type || 'Untitled';
            return item.name ? `${type} (${item.name})` : type;
        },
        versioning: {
            versionModel: 'KyteFunctionVersion',
            versionField: 'function',
            contentModel: 'KyteFunctionVersionContent',
            contentParts: ['code']
        }
    },
    SCRIPT: {
        id: 'script',
        label: 'Scripts',
        icon: 'fab fa-js',
        iconClass: 'js',
        sectionIcon: 'fas fa-scroll',
        model: 'KyteScript',
        publishable: true,           // can be published to S3 (state=1 → handleScriptPublication)
        listField: 'site',
        parts: [
            { key: 'content', label: 'JavaScript', language: 'javascript', field: 'content' }
        ],
        nameField: 'name',
        displayName: (item) => item.name || 'Untitled',
        versioning: {
            versionModel: 'KyteScriptVersion',
            versionField: 'script',
            contentModel: 'KyteScriptVersionContent',
            contentParts: ['content']
        }
    },
    EMAIL: {
        id: 'email',
        label: 'Email Templates',
        icon: 'fas fa-envelope',
        iconClass: 'email',
        sectionIcon: 'fas fa-envelope',
        model: 'EmailTemplate',
        listField: 'application',
        parts: [
            { key: 'html', label: 'HTML', language: 'html', field: 'html' }
        ],
        nameField: 'title',
        displayName: (item) => item.title || item.identifier || 'Untitled'
    },
    COMPONENT: {
        id: 'component',
        label: 'Web Components',
        icon: 'fas fa-puzzle-piece',
        iconClass: 'component',
        sectionIcon: 'fas fa-puzzle-piece',
        model: 'KyteWebComponent',
        listField: 'application',
        parts: [
            { key: 'html', label: 'HTML', language: 'html', field: 'html' },
            { key: 'stylesheet', label: 'CSS', language: 'css', field: 'stylesheet' },
            { key: 'sample_data', label: 'Data (JSON)', language: 'json', field: 'sample_data' }
        ],
        nameField: 'name',
        displayName: (item) => item.name || item.identifier || 'Untitled'
    }
};

// ============================================
// State
// ============================================

let _ks = null;            // Kyte SDK instance
let appId = null;          // Current application ID
let encodedRequest = null; // URL request param

let editor = null;         // Monaco editor instance
let openTabs = [];         // Array of open tab objects
let activeTabId = null;    // Currently active tab ID
let activeSubTab = null;   // Currently active sub-tab key (for multi-part files)

// Map of fileId -> { original: {partKey: content}, current: {partKey: content} }
let fileBuffers = {};

// Version history state
let historyPanelOpen = false;

// Explorer data cache
let explorerData = {
    sites: [],
    controllers: [],
    loaded: false
};

// Color mode
let colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? 'vs-dark' : 'vs';
    if (editor) {
        monaco.editor.setTheme(colorMode);
    }
});

// ============================================
// Utility Functions
// ============================================

function generateFileId(fileType, itemId) {
    return `${fileType.id}:${itemId}`;
}

function parseFileId(fileId) {
    const [typeId, itemId] = fileId.split(':');
    const fileType = Object.values(FILE_TYPES).find(ft => ft.id === typeId);
    return { fileType, itemId: parseInt(itemId) };
}

function notify(type, message) {
    const container = document.getElementById('notification-container');
    const el = document.createElement('div');
    el.className = `ide-notification ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function isFileDirty(fileId) {
    const buf = fileBuffers[fileId];
    if (!buf) return false;
    const { fileType } = parseFileId(fileId);
    return fileType.parts.some(part => buf.current[part.key] !== buf.original[part.key]);
}

function updateDirtyIndicators(fileId) {
    const dirty = isFileDirty(fileId);
    // Update tab
    const tabEl = document.querySelector(`.editor-tab[data-file-id="${fileId}"]`);
    if (tabEl) {
        const dirtyEl = tabEl.querySelector('.tab-dirty');
        if (dirtyEl) dirtyEl.classList.toggle('visible', dirty);
    }
    // Update tree item
    const treeEl = document.querySelector(`.tree-item[data-file-id="${fileId}"]`);
    if (treeEl) {
        const dirtyEl = treeEl.querySelector('.dirty-indicator');
        if (dirtyEl) dirtyEl.classList.toggle('visible', dirty);
    }
    // Update status bar
    const statusBar = document.getElementById('status-bar');
    if (activeTabId === fileId) {
        statusBar.classList.toggle('dirty', dirty);
    }
}

// ============================================
// File Explorer
// ============================================

function initExplorerSkeleton() {
    const tree = document.getElementById('explorer-tree');
    tree.innerHTML = [
        renderSectionSkeleton('pages', 'Pages', FILE_TYPES.PAGE.sectionIcon),
        renderSectionSkeleton('functions', 'Functions', FILE_TYPES.FUNCTION.sectionIcon),
        renderSectionSkeleton('scripts', 'Scripts', FILE_TYPES.SCRIPT.sectionIcon),
        renderSectionSkeleton('emails', 'Email Templates', FILE_TYPES.EMAIL.sectionIcon),
        renderSectionSkeleton('components', 'Web Components', FILE_TYPES.COMPONENT.sectionIcon)
    ].join('');
}

function renderSectionSkeleton(id, label, icon) {
    return `
        <div class="tree-section" data-section="${id}">
            <div class="tree-section-header" onclick="window.kyteIDE.toggleSection('${id}')">
                <span class="chevron"><i class="fas fa-chevron-down"></i></span>
                <i class="section-icon ${icon}"></i>
                <span>${escapeHtml(label)}</span>
                <span class="section-count"><i class="fas fa-circle-notch fa-spin" style="font-size:0.6rem;color:#969696;"></i></span>
            </div>
            <div class="tree-section-items" data-section-items="${id}">
                <div class="explorer-loading" style="padding: 0.5rem 1.75rem; font-size: 0.75rem;">
                    <span style="color:#969696;">Loading...</span>
                </div>
            </div>
        </div>
    `;
}

function updateSectionContent(sectionId, count, itemsHtml) {
    // Update count
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (section) {
        const countEl = section.querySelector('.section-count');
        if (countEl) countEl.textContent = count;
    }
    // Update items
    const itemsEl = document.querySelector(`[data-section-items="${sectionId}"]`);
    if (itemsEl) {
        itemsEl.innerHTML = itemsHtml || '<div class="explorer-empty" style="padding:0.5rem 1.75rem;font-size:0.75rem;color:#969696;">No files</div>';
    }
}

function loadExplorerProgressively() {
    // Show skeleton immediately
    initExplorerSkeleton();

    // --- EMAIL TEMPLATES (flat, fast) ---
    _ks.get('EmailTemplate', 'application', appId, [], function(r) {
        explorerData.emails = (r.data || []).filter(e => !e.deleted);
        updateSectionContent('emails', explorerData.emails.length,
            explorerData.emails.map(email => `
                <div class="tree-item" data-file-id="${generateFileId(FILE_TYPES.EMAIL, email.id)}" onclick="window.kyteIDE.openFile('${generateFileId(FILE_TYPES.EMAIL, email.id)}')">
                    <i class="file-icon ${FILE_TYPES.EMAIL.iconClass} ${FILE_TYPES.EMAIL.icon}"></i>
                    <span class="file-name">${escapeHtml(FILE_TYPES.EMAIL.displayName(email))}</span>
                    <span class="dirty-indicator"></span>
                </div>
            `).join('')
        );
    }, function() { updateSectionContent('emails', 0, ''); });

    // --- WEB COMPONENTS (flat, fast) ---
    _ks.get('KyteWebComponent', 'application', appId, [], function(r) {
        explorerData.components = (r.data || []).filter(c => !c.deleted);
        updateSectionContent('components', explorerData.components.length,
            explorerData.components.map(comp => `
                <div class="tree-item" data-file-id="${generateFileId(FILE_TYPES.COMPONENT, comp.id)}" onclick="window.kyteIDE.openFile('${generateFileId(FILE_TYPES.COMPONENT, comp.id)}')">
                    <i class="file-icon ${FILE_TYPES.COMPONENT.iconClass} ${FILE_TYPES.COMPONENT.icon}"></i>
                    <span class="file-name">${escapeHtml(FILE_TYPES.COMPONENT.displayName(comp))}</span>
                    <span class="dirty-indicator"></span>
                </div>
            `).join('')
        );
    }, function() { updateSectionContent('components', 0, ''); });

    // --- CONTROLLERS → FUNCTIONS (two-level) ---
    _ks.get('Controller', 'application', appId, [], function(r) {
        explorerData.controllers = (r.data || []).filter(c => !c.deleted);

        if (explorerData.controllers.length === 0) {
            updateSectionContent('functions', 0, '');
            return;
        }

        let pendingCtrl = explorerData.controllers.length;

        explorerData.controllers.forEach(ctrl => {
            ctrl._functions = [];
            _ks.get('Function', 'controller', ctrl.id, [], function(fr) {
                ctrl._functions = (fr.data || []).filter(f => !f.deleted);
                pendingCtrl--;
                if (pendingCtrl === 0) renderFunctionsSection();
            }, function() {
                pendingCtrl--;
                if (pendingCtrl === 0) renderFunctionsSection();
            });
        });
    }, function() { updateSectionContent('functions', 0, ''); });

    // --- SITES → PAGES + SCRIPTS (two-level) ---
    _ks.get('KyteSite', 'application', appId, [], function(r) {
        explorerData.sites = (r.data || []).filter(s => !s.deleted);

        if (explorerData.sites.length === 0) {
            updateSectionContent('pages', 0, '');
            updateSectionContent('scripts', 0, '');
            return;
        }

        let pendingPages = explorerData.sites.length;
        let pendingScripts = explorerData.sites.length;

        explorerData.sites.forEach(site => {
            site._pages = [];
            site._scripts = [];

            _ks.get('KytePage', 'site', site.id, [], function(pr) {
                site._pages = (pr.data || []).filter(p => !p.deleted);
                pendingPages--;
                if (pendingPages === 0) renderPagesSection();
            }, function() {
                pendingPages--;
                if (pendingPages === 0) renderPagesSection();
            });

            _ks.get('KyteScript', 'site', site.id, [], function(sr) {
                site._scripts = (sr.data || []).filter(s => !s.deleted);
                pendingScripts--;
                if (pendingScripts === 0) renderScriptsSection();
            }, function() {
                pendingScripts--;
                if (pendingScripts === 0) renderScriptsSection();
            });
        });
    }, function() {
        updateSectionContent('pages', 0, '');
        updateSectionContent('scripts', 0, '');
    });
}

function renderPagesSection() {
    const totalPages = explorerData.sites.reduce((sum, s) => sum + s._pages.length, 0);
    let html = '';
    explorerData.sites.forEach(site => {
        if (site._pages.length === 0) return;
        html += renderGroup(site.name || 'Unnamed Site', 'fas fa-globe', site._pages.map(page => ({
            fileId: generateFileId(FILE_TYPES.PAGE, page.id),
            name: FILE_TYPES.PAGE.displayName(page),
            iconClass: FILE_TYPES.PAGE.iconClass,
            icon: FILE_TYPES.PAGE.icon
        })));
    });
    updateSectionContent('pages', totalPages, html);
}

function renderFunctionsSection() {
    const totalFunctions = explorerData.controllers.reduce((sum, c) => sum + c._functions.length, 0);
    let html = '';
    explorerData.controllers.forEach(ctrl => {
        if (ctrl._functions.length === 0) return;
        html += renderGroup(ctrl.name || 'Unnamed Controller', 'fas fa-layer-group', ctrl._functions.map(fn => ({
            fileId: generateFileId(FILE_TYPES.FUNCTION, fn.id),
            name: FILE_TYPES.FUNCTION.displayName(fn),
            iconClass: FILE_TYPES.FUNCTION.iconClass,
            icon: FILE_TYPES.FUNCTION.icon
        })));
    });
    updateSectionContent('functions', totalFunctions, html);
}

function renderScriptsSection() {
    const totalScripts = explorerData.sites.reduce((sum, s) => sum + s._scripts.length, 0);
    let html = '';
    explorerData.sites.forEach(site => {
        if (site._scripts.length === 0) return;
        html += renderGroup(site.name || 'Unnamed Site', 'fas fa-globe', site._scripts.map(script => {
            const isCss = script.script_type === 'css';
            return {
                fileId: generateFileId(FILE_TYPES.SCRIPT, script.id),
                name: FILE_TYPES.SCRIPT.displayName(script),
                iconClass: isCss ? 'css' : 'js',
                icon: isCss ? 'fab fa-css3-alt' : 'fab fa-js'
            };
        }));
    });
    updateSectionContent('scripts', totalScripts, html);
}

function renderSection(id, label, icon, count, contentFn) {
    const content = contentFn();
    return `
        <div class="tree-section" data-section="${id}">
            <div class="tree-section-header" onclick="window.kyteIDE.toggleSection('${id}')">
                <span class="chevron"><i class="fas fa-chevron-down"></i></span>
                <i class="section-icon ${icon}"></i>
                <span>${escapeHtml(label)}</span>
                <span class="section-count">${count}</span>
            </div>
            <div class="tree-section-items" data-section-items="${id}">
                ${content}
            </div>
        </div>
    `;
}

function renderGroup(label, icon, items) {
    const groupId = 'grp-' + label.replace(/[^a-zA-Z0-9]/g, '_');
    return `
        <div class="tree-group">
            <div class="tree-group-header" onclick="window.kyteIDE.toggleGroup(this)">
                <span class="chevron"><i class="fas fa-chevron-down"></i></span>
                <i class="group-icon ${icon}"></i>
                <span>${escapeHtml(label)}</span>
            </div>
            <div class="tree-group-items">
                ${items.map(item => `
                    <div class="tree-item nested" data-file-id="${item.fileId}" onclick="window.kyteIDE.openFile('${item.fileId}')">
                        <i class="file-icon ${item.iconClass} ${item.icon}"></i>
                        <span class="file-name">${escapeHtml(item.name)}</span>
                        <span class="dirty-indicator"></span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function bindExplorerEvents() {
    // Highlight active tree item
    updateActiveTreeItem();
}

function updateActiveTreeItem() {
    document.querySelectorAll('.tree-item').forEach(el => {
        el.classList.toggle('active', el.dataset.fileId === activeTabId);
    });
}

// ============================================
// Tab Management
// ============================================

function openFile(fileId) {
    // Check if tab already open
    const existing = openTabs.find(t => t.fileId === fileId);
    if (existing) {
        activateTab(fileId);
        return;
    }

    const { fileType, itemId } = parseFileId(fileId);

    // Show loading
    notify('info', 'Loading file...');

    // Determine load model — Pages use KytePageData, others use their main model
    const loadModel = fileType.loadModel || fileType.model;
    const loadField = fileType.loadField || 'id';

    _ks.get(loadModel, loadField, itemId, [], function(r) {
        if (!r.data || r.data.length === 0) {
            notify('error', 'File not found');
            return;
        }

        const item = r.data[0];

        // Initialize buffer — Pages extract content from KytePageData structure
        const original = {};
        const current = {};
        let displayName;

        if (fileType.extractContent) {
            // Pages: KytePageData returns {html, javascript, stylesheet, page: {...}}
            const extracted = fileType.extractContent(item);
            fileType.parts.forEach(part => {
                const val = extracted[part.key] || '';
                original[part.key] = val;
                current[part.key] = val;
            });
            displayName = item.page ? (item.page.title || item.page.page_name || 'Untitled') : 'Untitled';
        } else {
            fileType.parts.forEach(part => {
                const val = item[part.field] || '';
                original[part.key] = val;
                current[part.key] = val;
            });
            displayName = fileType.displayName(item);
        }

        fileBuffers[fileId] = { original, current, item };

        // Add tab
        const tab = {
            fileId,
            fileType,
            itemId,
            label: displayName,
            item
        };
        openTabs.push(tab);
        renderTabs();
        activateTab(fileId);
        notify('success', `Opened ${displayName}`);
    }, function(err) {
        notify('error', 'Failed to load file: ' + err);
    });
}

function closeTab(fileId, force) {
    if (!force && isFileDirty(fileId)) {
        showUnsavedDialog(fileId, function(action) {
            if (action === 'save') {
                saveFile(fileId, function() {
                    closeTab(fileId, true);
                });
            } else if (action === 'discard') {
                closeTab(fileId, true);
            }
            // 'cancel' — do nothing
        });
        return;
    }

    const idx = openTabs.findIndex(t => t.fileId === fileId);
    if (idx === -1) return;

    openTabs.splice(idx, 1);
    delete fileBuffers[fileId];

    // If we closed the active tab, activate an adjacent one
    if (activeTabId === fileId) {
        if (openTabs.length > 0) {
            const newIdx = Math.min(idx, openTabs.length - 1);
            activateTab(openTabs[newIdx].fileId);
        } else {
            activeTabId = null;
            activeSubTab = null;
            showWelcomeScreen();
        }
    }

    renderTabs();
    updateActiveTreeItem();
}

function activateTab(fileId) {
    activeTabId = fileId;
    const tab = openTabs.find(t => t.fileId === fileId);
    if (!tab) return;

    // Determine the sub-tab
    if (tab.fileType.parts.length > 1) {
        // Multi-part file: show sub-tabs
        if (!activeSubTab || !tab.fileType.parts.find(p => p.key === activeSubTab)) {
            activeSubTab = tab.fileType.parts[0].key;
        }
        renderSubTabs(tab);
    } else {
        activeSubTab = tab.fileType.parts[0].key;
        hideSubTabs();
    }

    // Load content into Monaco
    loadEditorContent(fileId);

    // Update UI
    renderTabs();
    updateActiveTreeItem();
    updateStatusBar(tab);
    showEditor();

    // Refresh version history if panel is open
    if (historyPanelOpen) {
        if (tab.fileType.versioning) {
            loadVersionHistory(fileId);
        } else {
            // No versioning for this file type — show empty state
            document.getElementById('history-content').innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-info-circle" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                    <p>Version history not available for this file type</p>
                </div>
            `;
        }
    }
}

function getTabIcon(tab) {
    // CSS scripts need a different icon/class than the default JS
    if (tab.fileType.id === 'script') {
        const buf = fileBuffers[tab.fileId];
        if (buf && buf.item && buf.item.script_type === 'css') {
            return { iconClass: 'css', icon: 'fab fa-css3-alt' };
        }
    }
    return { iconClass: tab.fileType.iconClass, icon: tab.fileType.icon };
}

function renderTabs() {
    const tabBar = document.getElementById('tab-bar');
    const tabsHtml = openTabs.map(tab => {
        const isActive = tab.fileId === activeTabId;
        const dirty = isFileDirty(tab.fileId);
        const { iconClass, icon } = getTabIcon(tab);
        return `
            <div class="editor-tab ${isActive ? 'active' : ''}" data-file-id="${tab.fileId}" onclick="window.kyteIDE.activateTab('${tab.fileId}')">
                <i class="tab-icon ${iconClass} ${icon}"></i>
                <span class="tab-label">${escapeHtml(tab.label)}</span>
                <span class="tab-dirty ${dirty ? 'visible' : ''}"></span>
                <button class="tab-close" onclick="event.stopPropagation(); window.kyteIDE.closeTab('${tab.fileId}')" title="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');

    // Show history toggle only for versioned file types
    const activeTab = openTabs.find(t => t.fileId === activeTabId);
    const hasVersioning = activeTab && activeTab.fileType.versioning;
    const historyBtnHtml = `
        <button class="history-toggle-btn ${historyPanelOpen ? 'active' : ''} ${hasVersioning ? '' : 'hidden'}"
                onclick="window.kyteIDE.toggleHistory()" title="Version History">
            <i class="fas fa-history"></i>
        </button>
    `;

    // Show a Publish button only for publishable file types (pages, scripts → S3)
    const isPublishable = activeTab && activeTab.fileType.publishable;
    const publishBtnHtml = `
        <button class="history-toggle-btn ide-publish-btn ${isPublishable ? '' : 'hidden'}"
                onclick="window.kyteIDE.publishActiveFile()" title="Publish to live site (Ctrl+Shift+S)">
            <i class="fas fa-rocket" style="color:#34c759;"></i>
        </button>
    `;

    tabBar.innerHTML = tabsHtml + publishBtnHtml + historyBtnHtml;
}

function renderSubTabs(tab) {
    const subTabBar = document.getElementById('sub-tab-bar');
    subTabBar.className = 'visible';
    subTabBar.innerHTML = tab.fileType.parts.map(part => {
        const isActive = part.key === activeSubTab;
        return `
            <button class="sub-tab ${isActive ? 'active' : ''}" onclick="window.kyteIDE.switchSubTab('${part.key}')">
                ${escapeHtml(part.label)}
            </button>
        `;
    }).join('');
}

function hideSubTabs() {
    const subTabBar = document.getElementById('sub-tab-bar');
    subTabBar.className = '';
    subTabBar.innerHTML = '';
}

function switchSubTab(partKey) {
    if (!activeTabId) return;

    // Save current editor content to buffer before switching
    saveEditorToBuffer();

    activeSubTab = partKey;
    loadEditorContent(activeTabId);

    // Update sub-tab active state
    const tab = openTabs.find(t => t.fileId === activeTabId);
    if (tab) {
        renderSubTabs(tab);
        updateStatusBar(tab);
    }
}

// ============================================
// Monaco Editor
// ============================================

function initializeEditor() {
    const container = document.getElementById('monaco-container');
    editor = monaco.editor.create(container, {
        value: '',
        language: 'html',
        theme: colorMode,
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        scrollBeyondLastLine: false,
        wordWrap: 'off',
        tabSize: 4,
        insertSpaces: true,
        formatOnPaste: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        scrollbar: {
            vertical: 'auto',
            horizontal: 'auto'
        }
    });

    // Track cursor position for status bar
    editor.onDidChangeCursorPosition(e => {
        const pos = e.position;
        document.querySelector('#status-position span').textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
    });

    // Track content changes — update buffer
    editor.onDidChangeModelContent(() => {
        if (activeTabId && activeSubTab) {
            const buf = fileBuffers[activeTabId];
            if (buf) {
                buf.current[activeSubTab] = editor.getValue();
                updateDirtyIndicators(activeTabId);
            }
        }
    });
}

function loadEditorContent(fileId) {
    const buf = fileBuffers[fileId];
    if (!buf) return;

    const { fileType } = parseFileId(fileId);
    const part = fileType.parts.find(p => p.key === activeSubTab);
    if (!part) return;

    const content = buf.current[activeSubTab] || '';

    // Resolve language — scripts can be JS or CSS based on script_type
    let language = part.language;
    if (fileType.id === 'script' && buf.item && buf.item.script_type === 'css') {
        language = 'css';
    }

    // Set model with correct language
    const model = monaco.editor.createModel(content, language);
    const oldModel = editor.getModel();
    editor.setModel(model);
    if (oldModel) {
        oldModel.dispose();
    }
}

function saveEditorToBuffer() {
    if (!activeTabId || !activeSubTab || !editor) return;
    const buf = fileBuffers[activeTabId];
    if (buf) {
        buf.current[activeSubTab] = editor.getValue();
    }
}

function showEditor() {
    document.getElementById('monaco-container').style.display = 'block';
    document.getElementById('welcome-screen').style.display = 'none';
    editor.layout();
}

function showWelcomeScreen() {
    document.getElementById('monaco-container').style.display = 'none';
    document.getElementById('welcome-screen').style.display = '';
    hideSubTabs();
}

function updateStatusBar(tab) {
    const part = tab.fileType.parts.find(p => p.key === activeSubTab);
    document.querySelector('#status-file-type span').textContent = tab.label;
    // Show correct language for CSS scripts
    let langLabel = part ? part.label : '-';
    const buf = fileBuffers[tab.fileId];
    if (tab.fileType.id === 'script' && buf && buf.item && buf.item.script_type === 'css') {
        langLabel = 'CSS';
    }
    document.querySelector('#status-language span').textContent = langLabel;
    const statusBar = document.getElementById('status-bar');
    statusBar.classList.toggle('dirty', isFileDirty(tab.fileId));
}

// ============================================
// Save Logic
// ============================================

function saveFile(fileId, callback) {
    const buf = fileBuffers[fileId];
    if (!buf) return;

    if (!isFileDirty(fileId)) {
        notify('info', 'No changes to save');
        if (callback) callback();
        return;
    }

    const { fileType, itemId } = parseFileId(fileId);

    // Save current editor content to buffer
    if (activeTabId === fileId) {
        saveEditorToBuffer();
    }

    // If file type supports versioning, show change summary modal
    if (fileType.versioning) {
        showChangeSummaryModal(function(action, summary) {
            if (action === 'cancel') {
                // User cancelled — do nothing
                return;
            }
            // action is 'save' (with summary) or 'skip' (no summary)
            const changeSummary = action === 'save' ? summary : '';
            performSave(fileId, fileType, itemId, buf, changeSummary, callback);
        });
    } else {
        performSave(fileId, fileType, itemId, buf, null, callback);
    }
}

function performSave(fileId, fileType, itemId, buf, changeSummary, callback, publish) {
    // Build update data
    const data = {};
    fileType.parts.forEach(part => {
        data[part.field] = buf.current[part.key];
    });

    // Attach change summary if provided (versioned file types)
    if (changeSummary !== null && changeSummary !== undefined) {
        data.change_summary = changeSummary;
    }

    // Publish: state=1 triggers the backend publish (page → S3 via publishPage,
    // script → S3 via handleScriptPublication). Save without it just persists.
    if (publish) {
        data.state = 1;
    }

    // For Pages, the save target is KytePage and the ID is from the nested page object
    const saveModel = fileType.model;
    const saveId = (fileType.id === 'page' && buf.item && buf.item.page)
        ? buf.item.page.id
        : itemId;

    notify('info', publish ? 'Publishing...' : 'Saving...');

    _ks.put(saveModel, 'id', saveId, data, null, [], function(r) {
        // Update original to match current (no longer dirty)
        fileType.parts.forEach(part => {
            buf.original[part.key] = buf.current[part.key];
        });

        updateDirtyIndicators(fileId);
        renderTabs();
        notify('success', publish ? 'Published successfully' : 'Saved successfully');

        // Refresh version history if panel is open
        if (historyPanelOpen && activeTabId === fileId) {
            loadVersionHistory(fileId);
        }

        if (callback) callback();
    }, function(err) {
        notify('error', (publish ? 'Publish failed: ' : 'Save failed: ') + err);
    });
}

function saveActiveFile() {
    if (activeTabId) {
        saveFile(activeTabId);
    }
}

// Publish the active file to its live site (pages/scripts → S3). Unlike save,
// publishing is allowed even when not dirty (re-deploy current content). It also
// persists any pending edits in the same request (state=1 + content). See KYTE-#189.
function publishActiveFile() {
    if (activeTabId) {
        publishFile(activeTabId);
    }
}

function publishFile(fileId, callback) {
    const buf = fileBuffers[fileId];
    if (!buf) return;

    const { fileType, itemId } = parseFileId(fileId);

    if (!fileType.publishable) {
        notify('info', 'This file type deploys automatically on save — no separate publish.');
        return;
    }

    // Flush current editor content to buffer
    if (activeTabId === fileId) {
        saveEditorToBuffer();
    }

    // Versioned types capture a change summary (publish also creates a version)
    if (fileType.versioning) {
        showChangeSummaryModal(function(action, summary) {
            if (action === 'cancel') {
                return;
            }
            const changeSummary = action === 'save' ? summary : '';
            performSave(fileId, fileType, itemId, buf, changeSummary, callback, true);
        });
    } else {
        performSave(fileId, fileType, itemId, buf, null, callback, true);
    }
}

// ============================================
// Change Summary Modal
// ============================================

function showChangeSummaryModal(callback) {
    const modal = document.getElementById('change-summary-modal');
    const input = document.getElementById('change-summary-input');
    input.value = '';
    modal.style.display = 'flex';
    input.focus();

    // Quick summary buttons
    const quickBtns = modal.querySelectorAll('.quick-summary-btn');
    const quickHandler = function(e) {
        input.value = e.target.dataset.summary;
    };
    quickBtns.forEach(btn => btn.addEventListener('click', quickHandler));

    // Action buttons
    const actionBtns = modal.querySelectorAll('[data-action]');
    const cleanup = function() {
        modal.style.display = 'none';
        quickBtns.forEach(btn => btn.removeEventListener('click', quickHandler));
        actionBtns.forEach(btn => btn.removeEventListener('click', actionHandler));
        document.removeEventListener('keydown', keyHandler);
    };

    const actionHandler = function(e) {
        const action = e.target.closest('[data-action]').dataset.action;
        cleanup();
        callback(action, input.value.trim());
    };
    actionBtns.forEach(btn => btn.addEventListener('click', actionHandler));

    // Keyboard: Enter to save, Escape to cancel
    const keyHandler = function(e) {
        if (e.key === 'Escape') {
            cleanup();
            callback('cancel', '');
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            cleanup();
            callback('save', input.value.trim());
        }
    };
    document.addEventListener('keydown', keyHandler);
}

// ============================================
// Version History
// ============================================

function toggleHistory() {
    historyPanelOpen = !historyPanelOpen;
    const panel = document.getElementById('history-panel');
    panel.classList.toggle('open', historyPanelOpen);

    // Re-render tabs to update the toggle button state
    renderTabs();

    if (historyPanelOpen && activeTabId) {
        loadVersionHistory(activeTabId);
    }

    // Re-layout Monaco editor to fill remaining space
    if (editor) {
        setTimeout(() => editor.layout(), 300);
    }
}

function closeHistory() {
    historyPanelOpen = false;
    const panel = document.getElementById('history-panel');
    panel.classList.remove('open');
    renderTabs();
    if (editor) {
        setTimeout(() => editor.layout(), 300);
    }
}

function loadVersionHistory(fileId) {
    const { fileType, itemId } = parseFileId(fileId);
    if (!fileType.versioning) return;

    const historyContent = document.getElementById('history-content');
    historyContent.innerHTML = '<div class="history-loading"><i class="fas fa-circle-notch fa-spin"></i> Loading history...</div>';

    const ver = fileType.versioning;
    _ks.get(ver.versionModel, ver.versionField, itemId, [], function(r) {
        const versions = (r.data || []).filter(v => !v.deleted);
        // Sort by version_number descending (most recent first)
        versions.sort((a, b) => (b.version_number || 0) - (a.version_number || 0));
        renderVersionHistory(fileId, versions);
    }, function(err) {
        historyContent.innerHTML = '<div class="history-empty"><i class="fas fa-exclamation-circle" style="font-size:1.5rem;margin-bottom:0.5rem;color:#ff6b35;"></i><p>Failed to load history</p></div>';
    });
}

function renderVersionHistory(fileId, versions) {
    const historyContent = document.getElementById('history-content');

    if (versions.length === 0) {
        historyContent.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-clock" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                <p>No version history available</p>
            </div>
        `;
        return;
    }

    historyContent.innerHTML = versions.map((version, idx) => {
        const date = version.date_created
            ? new Date(version.date_created * 1000).toLocaleString()
            : 'Unknown date';
        const author = version.created_by_obj
            ? (version.created_by_obj.email || 'Unknown')
            : 'Unknown';
        const summary = version.change_summary || '';
        const versionNum = version.version_number || (versions.length - idx);
        const isCurrent = idx === 0;
        const canRevert = version.can_revert !== 0;

        return `
            <div class="version-item ${isCurrent ? 'current' : ''}" data-version-id="${version.id}">
                <div class="version-header">
                    <span class="version-number">v${versionNum}</span>
                    ${isCurrent ? '<span class="version-badge current">Current</span>' : ''}
                </div>
                <div class="version-meta">
                    <span class="version-date"><i class="fas fa-clock"></i> ${escapeHtml(date)}</span>
                    <span class="version-author"><i class="fas fa-user"></i> ${escapeHtml(author)}</span>
                </div>
                ${summary ? `<div class="version-summary">${escapeHtml(summary)}</div>` : ''}
                ${!isCurrent && canRevert ? `
                    <div class="version-actions">
                        <button class="version-restore-btn" onclick="window.kyteIDE.restoreVersion('${fileId}', ${version.id})" title="Restore this version as unsaved changes">
                            <i class="fas fa-undo"></i> Restore
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function restoreVersion(fileId, versionId) {
    const { fileType } = parseFileId(fileId);
    if (!fileType.versioning) return;

    const v = fileType.versioning;

    // First, get the version record to find the content_hash
    _ks.get(v.versionModel, 'id', versionId, [], function(r) {
        if (!r.data || r.data.length === 0) {
            notify('error', 'Version not found');
            return;
        }

        const version = r.data[0];
        const contentHash = version.content_hash;

        if (!contentHash) {
            notify('error', 'Version content not available');
            return;
        }

        // Now fetch the content using the content hash
        _ks.get(v.contentModel, 'content_hash', contentHash, [], function(cr) {
            if (!cr.data || cr.data.length === 0) {
                notify('error', 'Version content not found');
                return;
            }

            const content = cr.data[0];
            const buf = fileBuffers[fileId];
            if (!buf) return;

            // Load the version content into the current buffer (as unsaved changes)
            v.contentParts.forEach(partKey => {
                if (content[partKey] !== undefined) {
                    buf.current[partKey] = content[partKey] || '';
                }
            });

            // If this file is currently active, reload the editor
            if (activeTabId === fileId) {
                loadEditorContent(fileId);
            }

            updateDirtyIndicators(fileId);
            renderTabs();
            notify('info', `Restored v${version.version_number || '?'} as unsaved changes`);
        }, function(err) {
            notify('error', 'Failed to load version content');
        });
    }, function(err) {
        notify('error', 'Failed to load version');
    });
}

// ============================================
// Unsaved Changes Dialog
// ============================================

function showUnsavedDialog(fileId, callback) {
    const tab = openTabs.find(t => t.fileId === fileId);
    const name = tab ? tab.label : 'this file';

    const overlay = document.createElement('div');
    overlay.className = 'unsaved-dialog-overlay';
    overlay.innerHTML = `
        <div class="unsaved-dialog">
            <h4>Unsaved Changes</h4>
            <p>Do you want to save the changes you made to <strong>${escapeHtml(name)}</strong>?</p>
            <div class="unsaved-dialog-actions">
                <button class="btn-dialog btn-dialog-secondary" data-action="cancel">Cancel</button>
                <button class="btn-dialog btn-dialog-danger" data-action="discard">Don't Save</button>
                <button class="btn-dialog btn-dialog-primary" data-action="save">Save</button>
            </div>
        </div>
    `;

    overlay.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            overlay.remove();
            callback(btn.dataset.action);
        });
    });

    document.body.appendChild(overlay);
}

// ============================================
// Explorer Resize Handle
// ============================================

function initResizeHandle() {
    const handle = document.getElementById('explorer-resize-handle');
    const explorer = document.getElementById('file-explorer');
    let isResizing = false;
    let startX, startWidth;

    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = explorer.offsetWidth;
        handle.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const delta = e.clientX - startX;
        const newWidth = Math.max(200, Math.min(450, startWidth + delta));
        explorer.style.width = newWidth + 'px';
        if (editor) editor.layout();
    });

    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false;
        handle.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}

// ============================================
// Keyboard Shortcuts
// ============================================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        const isCtrl = e.ctrlKey || e.metaKey;

        // Ctrl+Shift+S — Publish
        if (isCtrl && e.shiftKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            publishActiveFile();
            return;
        }

        // Ctrl+S — Save
        if (isCtrl && !e.shiftKey && e.key === 's') {
            e.preventDefault();
            saveActiveFile();
        }

        // Ctrl+W — Close tab
        if (isCtrl && e.key === 'w') {
            e.preventDefault();
            if (activeTabId) {
                closeTab(activeTabId);
            }
        }

        // Ctrl+Tab — Next tab
        if (isCtrl && e.key === 'Tab') {
            e.preventDefault();
            if (openTabs.length > 1) {
                const idx = openTabs.findIndex(t => t.fileId === activeTabId);
                const nextIdx = e.shiftKey
                    ? (idx - 1 + openTabs.length) % openTabs.length
                    : (idx + 1) % openTabs.length;
                activateTab(openTabs[nextIdx].fileId);
            }
        }
    });
}

// ============================================
// Explorer Toggle Functions
// ============================================

function toggleSection(sectionId) {
    const items = document.querySelector(`[data-section-items="${sectionId}"]`);
    const chevron = document.querySelector(`[data-section="${sectionId}"] .chevron`);
    if (items && chevron) {
        items.classList.toggle('collapsed');
        chevron.classList.toggle('collapsed');
    }
}

function toggleGroup(headerEl) {
    const items = headerEl.nextElementSibling;
    const chevron = headerEl.querySelector('.chevron');
    if (items && chevron) {
        items.classList.toggle('collapsed');
        chevron.classList.toggle('collapsed');
    }
}

function collapseAll() {
    document.querySelectorAll('.tree-section-items').forEach(el => el.classList.add('collapsed'));
    document.querySelectorAll('.tree-group-items').forEach(el => el.classList.add('collapsed'));
    document.querySelectorAll('.tree-section-header .chevron, .tree-group-header .chevron').forEach(el => el.classList.add('collapsed'));
}

// ============================================
// Initialization
// ============================================

document.addEventListener('KyteInitialized', function(e) {
    _ks = e.detail._ks;

    if (!_ks.isSession()) {
        window.location.href = '/';
        return;
    }

    // Parse request parameter
    const urlParams = new URLSearchParams(window.location.search);
    encodedRequest = urlParams.get('request');
    if (!encodedRequest) {
        notify('error', 'No application context');
        return;
    }

    try {
        const decoded = JSON.parse(atob(decodeURIComponent(encodedRequest)));
        appId = decoded.idx;
    } catch (ex) {
        notify('error', 'Invalid request parameter');
        return;
    }

    // Set up back button
    document.getElementById('back-to-app').href = '/app/dashboard/?request=' + encodedRequest;

    // Fetch app name
    _ks.get('Application', 'id', appId, [], function(r) {
        if (r.data && r.data.length > 0) {
            document.getElementById('app-name').textContent = r.data[0].name;
        }
    }, function() {});

    // Initialize Monaco editor
    initializeEditor();

    // Initialize resize handle
    initResizeHandle();

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

    // Load explorer data progressively (sections appear as they load)
    loadExplorerProgressively();
    $('#pageLoaderModal').modal('hide');

    // Refresh button
    document.getElementById('btn-refresh-explorer').addEventListener('click', function() {
        explorerData = { sites: [], controllers: [], emails: [], components: [], loaded: false };
        loadExplorerProgressively();
    });

    // Collapse all button
    document.getElementById('btn-collapse-all').addEventListener('click', collapseAll);

    // Close history panel button
    document.getElementById('btn-close-history').addEventListener('click', closeHistory);

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', function(e) {
        const hasUnsaved = openTabs.some(t => isFileDirty(t.fileId));
        if (hasUnsaved) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.getElementById('file-explorer').classList.toggle('mobile-open');
        });
    }
});

// ============================================
// Public API (for onclick handlers in HTML)
// ============================================

window.kyteIDE = {
    openFile,
    closeTab,
    activateTab,
    switchSubTab,
    toggleSection,
    toggleGroup,
    saveActiveFile,
    publishActiveFile,
    collapseAll,
    toggleHistory,
    restoreVersion
};
