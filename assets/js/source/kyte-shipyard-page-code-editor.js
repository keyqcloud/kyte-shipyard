import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

// Configure Monaco with data URL workers to avoid CORS
window.MonacoEnvironment = {
    getWorker: function (moduleId, label) {
        const getWorkerBlob = (workerUrl) => {
            // Fetch worker code and create blob URL
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
            // Monaco will fall back to sync mode
            throw err;
        }
    }
};

console.log('✓ Monaco configured with blob-based workers');

var _ks; // Kyte SDK instance

var htmlEditor;
var jsEditor;
var cssEditor;
var pageData;
var iframe;
var libraries;

var isDirty = false;

var tblVersionHistory;

// Global variables for change summary functionality
let currentAction = '';
let pendingActionCallback = null;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    htmlEditor.editor.setTheme(colorMode);
    jsEditor.editor.setTheme(colorMode);
    cssEditor.editor.setTheme(colorMode);
});

function hasActualChanges() {
    // Compare current editor values with original page data
    const currentHtml = htmlEditor.getValue();
    const currentJs = jsEditor.getValue();
    const currentCss = cssEditor.getValue();
    const currentTitle = $("#setting-page-title").val();
    const currentDescription = $("#setting-page-description").val();
    
    // Get current form values
    const currentMainNav = parseInt($("#setting-main-navigation").val()) || 0;
    const currentSideNav = parseInt($("#setting-side-navigation").val()) || 0;
    const currentFooter = parseInt($("#setting-footer").val()) || 0;
    const currentWebComponentObj = $("#webcomponent_obj_name").val();
    const currentLang = $("#lang").val() === 'default' ? '' : $("#lang").val();
    const currentSitemapInclude = parseInt($("#setting-sitemap-include").val());
    const currentObfuscateJs = parseInt($("#setting-obfuscatejs").val());
    const currentIsJsModule = parseInt($("#setting-is_js_module").val());
    const currentUseContainer = parseInt($("#setting-use_container").val());
    const currentProtected = parseInt($("#setting-protected").val());
    
    // Get original values (handle null/undefined cases)
    const originalMainNav = pageData.page.main_navigation ? pageData.page.main_navigation.id : 0;
    const originalSideNav = pageData.page.side_navigation ? pageData.page.side_navigation.id : 0;
    const originalFooter = pageData.page.footer ? pageData.page.footer.id : 0;
    const originalWebComponentObj = pageData.page.webcomponent_obj_name || '';
    const originalLang = pageData.page.lang || '';
    const originalSitemapInclude = pageData.page.sitemap_include || 0;
    const originalObfuscateJs = pageData.page.obfuscate_js || 0;
    const originalIsJsModule = pageData.page.is_js_module || 0;
    const originalUseContainer = pageData.page.use_container || 0;
    const originalProtected = pageData.page.protected || 0;
    
    // Compare all values
    return (
        currentHtml !== pageData.html ||
        currentJs !== pageData.javascript ||
        currentCss !== pageData.stylesheet ||
        currentTitle !== pageData.page.title ||
        currentDescription !== pageData.page.description ||
        currentMainNav !== originalMainNav ||
        currentSideNav !== originalSideNav ||
        currentFooter !== originalFooter ||
        currentWebComponentObj !== originalWebComponentObj ||
        currentLang !== originalLang ||
        currentSitemapInclude !== originalSitemapInclude ||
        currentObfuscateJs !== originalObfuscateJs ||
        currentIsJsModule !== originalIsJsModule ||
        currentUseContainer !== originalUseContainer ||
        currentProtected !== originalProtected
    );
}

// key bindings for saving
document.addEventListener("keydown", function(event) {
    var isCtrlPressed = event.ctrlKey || event.metaKey;
    var isSPressed = event.key === "s";
    var isPPressed = event.key === "p";
    var isShiftOrAltPressed = event.altKey || event.shiftKey;

    // Handle modal keyboard shortcuts
    if (document.getElementById('changeSummaryModal') && 
        document.getElementById('changeSummaryModal').classList.contains('show')) {
        if (isCtrlPressed && event.key === 'Enter') {
            event.preventDefault();
            proceedWithAction();
        }
        return; // Don't process other shortcuts when modal is open
    }

    // Ctrl+S or Cmd+S to save
    if (isCtrlPressed && isSPressed) {
        event.preventDefault();
        if (isShiftOrAltPressed) {
            // Quick save - check for changes first
            if (hasActualChanges()) {
                savePageWithSummary('Manual save');
            } else {
                showNotification('info', 'No changes detected', 'Page is already up to date');
            }
        } else {
            // Normal Ctrl+S - check for changes first
            if (hasActualChanges()) {
                showChangeSummaryModal('save', savePageWithSummary);
            } else {
                showNotification('info', 'No changes to save', 'Page is already up to date');
            }
        }
    }

    // Ctrl+P or Cmd+P to publish
    if (isCtrlPressed && isPPressed) {
        event.preventDefault();
        if (isShiftOrAltPressed) {
            publishPageWithSummary('Manual publish');
        } else {
            showChangeSummaryModal('publish', publishPageWithSummary);
        }
    }

    if (event.ctrlKey || event.metaKey) {
        const tabMap = {
            '1': 'Page',
            '2': 'JavaScript', 
            '3': 'Stylesheet',
            '4': 'Preview'
        };
        
        if (tabMap[event.key]) {
            event.preventDefault();
            const targetTab = document.querySelector(`[data-target="${tabMap[event.key]}"]`);
            if (targetTab) {
                targetTab.click();
            }
        }
    }
});

function initializeIFrame() {
    var codeContainer = document.getElementById("pagePreview");
    // Create an iframe element
    iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    // Append the iframe to the code container
    codeContainer.innerHTML = "";
    codeContainer.appendChild(iframe);
}

function renderHtmlCode() {
    // Add safety checks
    if (!htmlEditor || !cssEditor || !iframe) {
        console.error('Required components not initialized:', {
            htmlEditor: !!htmlEditor,
            cssEditor: !!cssEditor,
            iframe: !!iframe
        });
        return;
    }

    try {
        // Get content from editors with error handling
        const htmlContent = htmlEditor.getValue() || '';
        const cssContent = cssEditor.getValue() || '';

        // Build the HTML document
        let code = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Kyte Shipyard - Page Preview</title>`;

        // Add library CSS links safely
        if (libraries && Array.isArray(libraries)) {
            libraries.forEach(library => {
                if (library && library.script_type === 'css' && library.link) {
                    code += `\n    <link rel="stylesheet" href="${library.link}">`;
                }
            });
        }

        // Add custom CSS
        if (cssContent.trim()) {
            code += `\n    <style>\n${cssContent}\n    </style>`;
        }

        code += `\n</head>
<body>
${htmlContent}
</body>
</html>`;

        console.log('Generated HTML preview:', code.substring(0, 200) + '...');

        // Create blob and update iframe
        const blob = new Blob([code], { type: 'text/html; charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        
        // Clean up previous blob URL to prevent memory leaks
        if (iframe.src && iframe.src.startsWith('blob:')) {
            URL.revokeObjectURL(iframe.src);
        }
        
        iframe.src = blobUrl;
        
        // Add load event listener for debugging
        iframe.onload = function() {
            console.log('Preview loaded successfully');
        };
        
        iframe.onerror = function(error) {
            console.error('Preview load error:', error);
        };

    } catch (error) {
        console.error('Error in renderHtmlCode:', error);
        
        // Fallback: create a simple error page
        const errorHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Preview Error</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .error { background: #ffebee; border: 1px solid #f44336; padding: 15px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="error">
        <h3>Preview Error</h3>
        <p>There was an error generating the preview: ${error.message}</p>
    </div>
</body>
</html>`;
        
        const errorBlob = new Blob([errorHtml], { type: 'text/html; charset=utf-8' });
        iframe.src = URL.createObjectURL(errorBlob);
    }
}

// Version history preview function
function previewVersion(versionData, _ks) {
    console.log(versionData);
    
    // Translation helper
    const t = (key, fallback, params = {}) => {
        if (window.kyteI18n) {
            let text = window.kyteI18n.t(key, params);
            return text === key ? fallback : text;
        }
        return fallback;
    };

    // Create modal with loading state immediately
    let previewContent = `
        <div class="modal fade" id="versionPreviewModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content" style="background: #1e1e1e; color: #d4d4d4; border: 1px solid #3e3e42;">
                    <div class="modal-header" style="background: #2d2d30; border-bottom: 1px solid #3e3e42; padding: 1.5rem;">
                        <div class="d-flex align-items-center gap-3">
                            <div class="version-badge px-3 py-2 rounded" style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; font-weight: 600; font-size: 0.9rem;">
                                Version ${versionData.version_number}
                            </div>
                            <div>
                                <h5 class="modal-title mb-1" style="color: #ffffff; font-weight: 600;">${t('ui.page_editor.version_modal.title', 'Version Preview')}</h5>
                                <div class="text-muted" style="font-size: 0.85rem;">
                                    ${new Date(versionData.date_created).toLocaleString()} • ${versionData.created_by?.name || 'Unknown'}
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" style="filter: invert(1);"></button>
                    </div>
                    <div class="modal-body p-0" style="height: calc(100vh - 200px); position: relative;">

                        <!-- Loading State -->
                        <div id="versionLoadingState" class="loading-overlay" style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: #1e1e1e;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            z-index: 1000;
                        ">
                            <div class="loading-spinner" style="
                                width: 60px;
                                height: 60px;
                                border: 3px solid #3e3e42;
                                border-top: 3px solid #ff6b35;
                                border-radius: 50%;
                                animation: spin 1s linear infinite;
                                margin-bottom: 2rem;
                            "></div>
                            <h6 style="color: #ffffff; font-weight: 600; margin-bottom: 0.5rem;">${t('ui.page_editor.version_modal.loading_title', 'Loading Version Content')}</h6>
                            <div style="color: #969696; font-size: 0.9rem;">${t('ui.page_editor.version_modal.loading_text', 'Fetching version details...', {version: versionData.version_number})}</div>
                            
                            <!-- Loading Progress Steps -->
                            <div class="loading-steps mt-4" style="display: flex; gap: 1rem; align-items: center;">
                                <div class="loading-step active" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                    padding: 0.5rem 1rem;
                                    background: #252526;
                                    border-radius: 20px;
                                    border: 1px solid #3e3e42;
                                    font-size: 0.8rem;
                                    color: #d4d4d4;
                                ">
                                    <div class="step-indicator" style="
                                        width: 12px;
                                        height: 12px;
                                        background: #ff6b35;
                                        border-radius: 50%;
                                        animation: pulse 1.5s infinite;
                                    "></div>
                                    ${t('ui.page_editor.version_modal.loading_step_retrieve', 'Retrieving')}
                                </div>
                                <div class="loading-step" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                    padding: 0.5rem 1rem;
                                    background: #252526;
                                    border-radius: 20px;
                                    border: 1px solid #3e3e42;
                                    font-size: 0.8rem;
                                    color: #969696;
                                ">
                                    <div class="step-indicator" style="
                                        width: 12px;
                                        height: 12px;
                                        background: #3e3e42;
                                        border-radius: 50%;
                                    "></div>
                                    ${t('ui.page_editor.version_modal.loading_step_process', 'Processing')}
                                </div>
                                <div class="loading-step" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                    padding: 0.5rem 1rem;
                                    background: #252526;
                                    border-radius: 20px;
                                    border: 1px solid #3e3e42;
                                    font-size: 0.8rem;
                                    color: #969696;
                                ">
                                    <div class="step-indicator" style="
                                        width: 12px;
                                        height: 12px;
                                        background: #3e3e42;
                                        border-radius: 50%;
                                    "></div>
                                    ${t('ui.page_editor.version_modal.loading_step_render', 'Rendering')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Main Content (initially hidden) -->
                        <div id="versionMainContent" style="height: 100%; display: none;">
                            <!-- Tab Navigation -->
                            <div class="preview-tabs d-flex border-bottom" style="background: #252526; border-color: #3e3e42 !important;">
                                <button class="preview-tab active" data-preview-target="html" style="padding: 1rem 2rem; background: none; border: none; color: #969696; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
                                    <i class="fab fa-html5 me-2" style="color: #e34c26;"></i>${t('ui.page_editor.version_modal.tab_html', 'HTML')}
                                </button>
                                <button class="preview-tab" data-preview-target="css" style="padding: 1rem 2rem; background: none; border: none; color: #969696; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
                                    <i class="fab fa-css3-alt me-2" style="color: #1572b6;"></i>${t('ui.page_editor.version_modal.tab_css', 'CSS')}
                                </button>
                                <button class="preview-tab" data-preview-target="javascript" style="padding: 1rem 2rem; background: none; border: none; color: #969696; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
                                    <i class="fab fa-js me-2" style="color: #f7df1e;"></i>${t('ui.page_editor.version_modal.tab_javascript', 'JavaScript')}
                                </button>
                                <button class="preview-tab" data-preview-target="diff" style="padding: 1rem 2rem; background: none; border: none; color: #969696; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
                                    <i class="fas fa-code-branch me-2" style="color: #ff6b35;"></i>${t('ui.page_editor.version_modal.tab_changes', 'Changes')}
                                </button>
                            </div>
                            
                            <!-- Tab Content Container -->
                            <div id="tabContentContainer" style="height: calc(100% - 60px); overflow: hidden;">
                                <!-- Content will be populated after loading -->
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="background: #2d2d30; border-top: 1px solid #3e3e42; padding: 1.5rem; gap: 1rem;">
                        <div class="d-flex w-100 justify-content-between align-items-center">
                            <div class="version-info" style="color: #969696; font-size: 0.85rem;">
                                <i class="fas fa-info-circle me-1"></i>
                                ${versionData.can_revert ? t('ui.page_editor.version_modal.can_restore', 'This version can be restored') : t('ui.page_editor.version_modal.current_version', 'This is the current version')}
                            </div>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn" data-bs-dismiss="modal" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; transition: all 0.2s ease;">
                                    <i class="fas fa-times me-2"></i>${t('ui.page_editor.version_modal.button_close', 'Close')}
                                </button>
                                ${versionData.can_revert ? `
                                <button type="button" id="restoreVersionBtn" class="btn" style="background: linear-gradient(135deg, #238636, #2ea043); border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; transition: all 0.2s ease;">
                                    <i class="fas fa-undo me-2"></i>${t('ui.page_editor.version_modal.button_restore', 'Restore This Version')}
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    $('#versionPreviewModal').remove();
    
    // Add modal to body and show immediately
    $('body').append(previewContent);
    $('#versionPreviewModal').modal('show');
    
    // Simulate loading steps
    setTimeout(() => {
        updateLoadingStep(1);
    }, 500);
    
    setTimeout(() => {
        updateLoadingStep(2);
    }, 1000);
    
    // Start the actual API call
    _ks.get("KytePageVersionContent", "content_hash", versionData['content_hash'], [], function(r) {
        if (r.data[0]) {
            let versionContent = r.data[0];
            
            // Complete loading
            updateLoadingStep(3);
            
            setTimeout(() => {
                populateVersionContent(versionContent, versionData, _ks);
                
                // Hide loading state and show content
                $('#versionLoadingState').fadeOut(300, function() {
                    $('#versionMainContent').fadeIn(300);
                });
            }, 500);
            
        } else {
            showLoadingError("No content found for this version");
        }
    }, function(err) {
        showLoadingError("Error loading version: " + err);
    });
}

function updateLoadingStep(stepNumber) {
    const steps = $('.loading-step');
    
    steps.each(function(index) {
        const step = $(this);
        const indicator = step.find('.step-indicator');
        
        if (index < stepNumber - 1) {
            // Completed steps
            step.removeClass('active').addClass('completed');
            step.css('color', '#238636');
            indicator.css('background', '#238636');
        } else if (index === stepNumber - 1) {
            // Current active step
            step.addClass('active').removeClass('completed');
            step.css('color', '#ffffff');
            indicator.css('background', '#ff6b35');
        } else {
            // Future steps
            step.removeClass('active completed');
            step.css('color', '#969696');
            indicator.css('background', '#3e3e42');
        }
    });
}

function showLoadingError(message) {
    // Translation helper
    const t = (key, fallback, params = {}) => {
        if (window.kyteI18n) {
            let text = window.kyteI18n.t(key, params);
            return text === key ? fallback : text;
        }
        return fallback;
    };

    $('#versionLoadingState').html(`
        <div style="text-align: center;">
            <div class="error-icon" style="
                width: 60px;
                height: 60px;
                background: #f85149;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 2rem;
            ">
                <i class="fas fa-exclamation-triangle" style="color: white; font-size: 1.5rem;"></i>
            </div>
            <h6 style="color: #f85149; font-weight: 600; margin-bottom: 0.5rem;">${t('ui.page_editor.version_modal.loading_failed', 'Loading Failed')}</h6>
            <div style="color: #969696; font-size: 0.9rem; margin-bottom: 2rem;">${message}</div>
            <button class="btn" onclick="$('#versionPreviewModal').modal('hide');" style="
                background: #3c3c3c;
                border: 1px solid #5a5a5a;
                color: #d4d4d4;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                font-weight: 500;
            ">
                <i class="fas fa-times me-2"></i>${t('ui.page_editor.version_modal.button_close', 'Close')}
            </button>
        </div>
    `);
}

function populateVersionContent(versionContent, versionData, _ks) {
    // Translation helper
    const t = (key, fallback, params = {}) => {
        if (window.kyteI18n) {
            let text = window.kyteI18n.t(key, params);
            return text === key ? fallback : text;
        }
        return fallback;
    };

    const tabContent = `
        <!-- HTML Content -->
        <div class="preview-content active" id="preview-html" style="height: 100%; display: flex; flex-direction: column;">
            <div class="content-header p-3" style="background: #252526; border-bottom: 1px solid #3e3e42; flex-shrink: 0;">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0" style="color: #ffffff; font-weight: 600;">${t('ui.page_editor.version_modal.tab_html', 'HTML')}</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm copy-content" data-content-type="html" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-copy me-1"></i>${t('ui.page_editor.version_modal.button_copy', 'Copy')}
                        </button>
                        <button class="btn btn-sm format-content" data-content-type="html" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-code me-1"></i>${t('ui.page_editor.version_modal.button_format', 'Format')}
                        </button>
                    </div>
                </div>
            </div>
            <div class="code-container" style="flex: 1; overflow: auto; font-family: 'JetBrains Mono', monospace; background: #1e1e1e;">
                <pre style="margin: 0; padding: 2rem; color: #d4d4d4; line-height: 1.6; white-space: pre-wrap; word-break: break-word;"><code id="html-code" class="language-html">${escapeHtml(versionContent.html)}</code></pre>
            </div>
        </div>
        
        <!-- CSS Content -->
        <div class="preview-content" id="preview-css" style="height: 100%; display: none; flex-direction: column;">
            <div class="content-header p-3" style="background: #252526; border-bottom: 1px solid #3e3e42; flex-shrink: 0;">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0" style="color: #ffffff; font-weight: 600;">${t('ui.page_editor.version_modal.tab_css', 'CSS')}</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm copy-content" data-content-type="css" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-copy me-1"></i>${t('ui.page_editor.version_modal.button_copy', 'Copy')}
                        </button>
                        <button class="btn btn-sm format-content" data-content-type="css" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-code me-1"></i>${t('ui.page_editor.version_modal.button_format', 'Format')}
                        </button>
                    </div>
                </div>
            </div>
            <div class="code-container" style="flex: 1; overflow: auto; font-family: 'JetBrains Mono', monospace; background: #1e1e1e;">
                <pre style="margin: 0; padding: 2rem; color: #d4d4d4; line-height: 1.6; white-space: pre-wrap; word-break: break-word;"><code id="css-code" class="language-css">${escapeHtml(versionContent.stylesheet)}</code></pre>
            </div>
        </div>
        
        <!-- JavaScript Content -->
        <div class="preview-content" id="preview-javascript" style="height: 100%; display: none; flex-direction: column;">
            <div class="content-header p-3" style="background: #252526; border-bottom: 1px solid #3e3e42; flex-shrink: 0;">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0" style="color: #ffffff; font-weight: 600;">${t('ui.page_editor.version_modal.tab_javascript', 'JavaScript')}</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm copy-content" data-content-type="javascript" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-copy me-1"></i>${t('ui.page_editor.version_modal.button_copy', 'Copy')}
                        </button>
                        <button class="btn btn-sm format-content" data-content-type="javascript" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-code me-1"></i>${t('ui.page_editor.version_modal.button_format', 'Format')}
                        </button>
                    </div>
                </div>
            </div>
            <div class="code-container" style="flex: 1; overflow: auto; font-family: 'JetBrains Mono', monospace; background: #1e1e1e;">
                <pre style="margin: 0; padding: 2rem; color: #d4d4d4; line-height: 1.6; white-space: pre-wrap; word-break: break-word;"><code id="js-code" class="language-javascript">${escapeHtml(versionContent.javascript)}</code></pre>
            </div>
        </div>
        
        <!-- Changes/Diff Content -->
        <div class="preview-content" id="preview-diff" style="height: 100%; display: none; flex-direction: column;">
            <div class="content-header p-3" style="background: #252526; border-bottom: 1px solid #3e3e42; flex-shrink: 0;">
                <h6 class="mb-0" style="color: #ffffff; font-weight: 600;">${t('ui.page_editor.version_modal.change_summary', 'Change Summary')}</h6>
            </div>
            <div class="changes-container p-4" style="flex: 1; overflow: auto; background: #1e1e1e;">
                <div class="change-summary mb-4 p-3 rounded" style="background: #252526; border: 1px solid #3e3e42;">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <div class="change-icon" style="width: 40px; height: 40px; background: linear-gradient(135deg, #ff6b35, #f7931e); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-edit" style="color: white; font-size: 0.9rem;"></i>
                        </div>
                        <div>
                            <h6 class="mb-1" style="color: #ffffff;">${versionData.change_summary || 'No summary provided'}</h6>
                            <div style="color: #969696; font-size: 0.85rem;">
                                Version ${versionData.version_number} • ${new Date(versionData.date_created).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="version-stats">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="stat-card p-3 rounded" style="background: #252526; border: 1px solid #3e3e42; text-align: center;">
                                <div class="stat-value" style="font-size: 1.5rem; font-weight: 600; color: #e34c26;">${(versionContent.html || '').split('\n').length}</div>
                                <div class="stat-label" style="color: #969696; font-size: 0.85rem;">HTML Lines</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="stat-card p-3 rounded" style="background: #252526; border: 1px solid #3e3e42; text-align: center;">
                                <div class="stat-value" style="font-size: 1.5rem; font-weight: 600; color: #1572b6;">${(versionContent.stylesheet || '').split('\n').length}</div>
                                <div class="stat-label" style="color: #969696; font-size: 0.85rem;">CSS Lines</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="stat-card p-3 rounded" style="background: #252526; border: 1px solid #3e3e42; text-align: center;">
                                <div class="stat-value" style="font-size: 1.5rem; font-weight: 600; color: #f7df1e;">${(versionContent.javascript || '').split('\n').length}</div>
                                <div class="stat-label" style="color: #969696; font-size: 0.85rem;">JS Lines</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#tabContentContainer').html(tabContent);
    
    // Bind all event handlers
    bindVersionPreviewEvents(versionContent, versionData, _ks);
}

function bindVersionPreviewEvents(versionContent, versionData, _ks) {
    // Tab switching
    $('#versionPreviewModal .preview-tab').on('click', function() {
        const target = $(this).data('preview-target');
        
        $('#versionPreviewModal .preview-tab').removeClass('active');
        $(this).addClass('active');
        
        $('#versionPreviewModal .preview-content').hide().removeClass('active');
        $(`#preview-${target}`).show().addClass('active').css('display', 'flex');
    });
    
    // Copy functionality
    $('#versionPreviewModal .copy-content').on('click', function() {
        const contentType = $(this).data('content-type');
        let content = '';
        
        switch(contentType) {
            case 'html':
                content = versionContent.html;
                break;
            case 'css':
                content = versionContent.stylesheet;
                break;
            case 'javascript':
                content = versionContent.javascript;
                break;
        }
        
        navigator.clipboard.writeText(content).then(() => {
            const btn = $(this);
            const originalHtml = btn.html();
            btn.html(`<i class="fas fa-check me-1"></i>${t('ui.page_editor.version_modal.button_copied', 'Copied!')}`);
            btn.css('background', '#238636');

            setTimeout(() => {
                btn.html(originalHtml);
                btn.css('background', '#3c3c3c');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy content: ', err);
        });
    });
    
    // Format functionality
    $('#versionPreviewModal .format-content').on('click', function() {
        const contentType = $(this).data('content-type');
        const codeElement = $(`#${contentType}-code`);
        
        let content = codeElement.text();
        
        if (contentType === 'html') {
            content = content.replace(/></g, '>\n<');
        } else if (contentType === 'css') {
            content = content.replace(/;/g, ';\n').replace(/{/g, '{\n').replace(/}/g, '\n}\n');
        } else if (contentType === 'javascript') {
            content = content.replace(/;/g, ';\n').replace(/{/g, '{\n').replace(/}/g, '\n}\n');
        }
        
        codeElement.text(content);
    });
    
    // Restore version functionality
    $('#restoreVersionBtn').on('click', function() {
        restoreVersion(versionData, _ks);
        $('#versionPreviewModal').modal('hide');
    });
}

// Initialize the restore progress modal HTML
function initializeRestoreProgressModal() {
    if (!document.getElementById('restoreProgressModal')) {
        const modalHTML = `
            <div class="modal fade restore-progress-modal" id="restoreProgressModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" style="color: #ffffff; font-weight: 600;">
                                <i class="fas fa-undo me-2"></i>
                                Restoring Version
                            </h5>
                        </div>
                        <div class="modal-body">
                            <div id="restoreVersionInfo" class="mb-4 p-3 rounded" style="background: #252526; border: 1px solid #3e3e42;">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="version-badge px-3 py-2 rounded" style="background: linear-gradient(135deg, #0969da, #0860ca); color: white; font-weight: 600; font-size: 0.9rem;">
                                        Version <span id="restoreVersionNumber">--</span>
                                    </div>
                                    <div>
                                        <h6 class="mb-1" style="color: #ffffff;">Restoring to Previous Version</h6>
                                        <div class="text-muted" style="font-size: 0.85rem;">
                                            <span id="restoreVersionDate">--</span> • <span id="restoreVersionAuthor">--</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-3" style="color: #d4d4d4; font-size: 0.9rem;">
                                    <strong>Change Summary:</strong> <span id="restoreVersionSummary">--</span>
                                </div>
                            </div>

                            <div class="restore-progress">
                                <div class="restore-step pending" id="step-fetch">
                                    <div class="restore-step-icon">
                                        <i class="fas fa-download"></i>
                                    </div>
                                    <div class="restore-step-content">
                                        <h6>Fetching Version Content</h6>
                                        <p>Retrieving HTML, CSS, and JavaScript from version archive</p>
                                    </div>
                                </div>

                                <div class="restore-step pending" id="step-update">
                                    <div class="restore-step-icon">
                                        <i class="fas fa-edit"></i>
                                    </div>
                                    <div class="restore-step-content">
                                        <h6>Updating Editors</h6>
                                        <p>Loading restored content into Monaco editors</p>
                                    </div>
                                </div>

                                <div class="restore-step pending" id="step-save">
                                    <div class="restore-step-icon">
                                        <i class="fas fa-save"></i>
                                    </div>
                                    <div class="restore-step-content">
                                        <h6>Saving Restored Version</h6>
                                        <p>Creating new version with restored content</p>
                                    </div>
                                </div>

                                <div class="restore-step pending" id="step-complete">
                                    <div class="restore-step-icon">
                                        <i class="fas fa-check"></i>
                                    </div>
                                    <div class="restore-step-content">
                                        <h6>Restoration Complete</h6>
                                        <p>Version has been restored and saved as draft</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer" style="background: #2d2d30; border-top: 1px solid #3e3e42;">
                            <div id="restoreActions" style="display: none;" class="w-100 d-flex justify-content-between align-items-center">
                                <div class="restore-info" style="color: #969696; font-size: 0.85rem;">
                                    <i class="fas fa-info-circle me-1"></i>
                                    Version restored as draft. Publish to make changes live.
                                </div>
                                <div class="d-flex gap-2">
                                    <button type="button" class="btn" onclick="closeRestoreModal()" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500;">
                                        <i class="fas fa-times me-2"></i>Close
                                    </button>
                                    <button type="button" class="btn" onclick="publishAfterRestore()" style="background: linear-gradient(135deg, #238636, #2ea043); border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500;">
                                        <i class="fas fa-upload me-2"></i>Publish Now
                                    </button>
                                </div>
                            </div>
                            <div id="restoreProgress" class="w-100 text-center">
                                <div class="restore-spinner"></div>
                                <span style="color: #969696;">Processing restoration...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Update restore step status
function updateRestoreStep(stepId, status) {
    const step = document.getElementById(stepId);
    if (!step) return;
    
    // Remove all status classes
    step.classList.remove('pending', 'active', 'completed');
    
    // Add new status class
    step.classList.add(status);
    
    // Update icon based on status
    const icon = step.querySelector('.restore-step-icon i');
    if (status === 'active') {
        // Keep original icon but add loading state
    } else if (status === 'completed') {
        icon.className = 'fas fa-check';
    }
}

// Close restore modal
function closeRestoreModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('restoreProgressModal'));
    if (modal) {
        modal.hide();
    }
}

// Publish after restore
function publishAfterRestore() {
    closeRestoreModal();
    // Use existing publish functionality
    showChangeSummaryModal('publish', publishPageWithSummary);
}

// Make functions global for onclick handlers
window.closeRestoreModal = closeRestoreModal;
window.publishAfterRestore = publishAfterRestore;

// Complete restoreVersion function
function restoreVersion(versionData, _ks) {
    if (versionData.can_revert != true) {
        alert("This is already the current version.");
        return;
    }

    if (!confirm("Are you sure you want to restore this version? Current unsaved changes will be lost.")) {
        return;
    }

    // Initialize and show the restore progress modal
    initializeRestoreProgressModal();
    
    // Populate version info
    document.getElementById('restoreVersionNumber').textContent = versionData.version_number;
    document.getElementById('restoreVersionDate').textContent = new Date(versionData.date_created).toLocaleString();
    document.getElementById('restoreVersionAuthor').textContent = versionData.created_by?.name || 'Unknown';
    document.getElementById('restoreVersionSummary').textContent = versionData.change_summary || 'No summary provided';
    
    // Reset all steps to pending
    ['step-fetch', 'step-update', 'step-save', 'step-complete'].forEach(stepId => {
        updateRestoreStep(stepId, 'pending');
    });
    
    // Hide actions, show progress
    document.getElementById('restoreActions').style.display = 'none';
    document.getElementById('restoreProgress').style.display = 'block';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('restoreProgressModal'));
    modal.show();
    
    // Step 1: Fetch version content
    updateRestoreStep('step-fetch', 'active');
    
    _ks.get("KytePageVersionContent", "content_hash", versionData['content_hash'], [], function(r) {
        if (!r.data[0]) {
            alert("Error: Could not retrieve version content.");
            closeRestoreModal();
            return;
        }
        
        const versionContent = r.data[0];
        
        // Complete step 1
        updateRestoreStep('step-fetch', 'completed');
        
        // Step 2: Update editors
        updateRestoreStep('step-update', 'active');
        
        setTimeout(() => {
            try {
                // Update Monaco editors with restored content
                htmlEditor.setValue(versionContent.html || '');
                jsEditor.setValue(versionContent.javascript || '');
                cssEditor.setValue(versionContent.stylesheet || '');
                
                // Complete step 2
                updateRestoreStep('step-update', 'completed');
                
                // Step 3: Save restored version
                updateRestoreStep('step-save', 'active');
                
                // Create change summary for the restore operation
                const changeSummary = `Restored to version ${versionData.version_number} (${versionData.change_summary || 'No summary'})`;
                
                // Use existing save functionality but without showing the change summary modal
                let rawJS = jsEditor.getValue();
                let obfuscatedJS = JavaScriptObfuscator.obfuscate(rawJS, {
                    compact: true,
                    controlFlowFlattening: true,
                    controlFlowFlatteningThreshold: 1,
                    numbersToExpressions: true,
                    simplify: true,
                    stringArrayEncoding: ['base64'],
                    stringArrayShuffle: true,
                    splitStrings: true,
                    stringArrayWrappersType: 'variable',
                    stringArrayThreshold: 1
                });

                let payload = {
                    'change_summary': changeSummary,
                    'html': htmlEditor.getValue(),
                    'javascript': rawJS,
                    'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
                    'stylesheet': cssEditor.getValue(),
                    'main_navigation': $("#setting-main-navigation").val(),
                    'side_navigation': $("#setting-side-navigation").val(),
                    'footer': $("#setting-footer").val(),
                    'title': $("#setting-page-title").val(),
                    'description': $("#setting-page-description").val(),
                    'lang': $("#lang").val() == 'default' ? null : $("#lang").val(),
                    'webcomponent_obj_name': $("#webcomponent_obj_name").val(),
                    'sitemap_include': $("#setting-sitemap-include").val(),
                    'obfuscate_js': $("#setting-obfuscatejs").val(),
                    'is_js_module': $("#setting-is_js_module").val(),
                    'use_container': $("#setting-use_container").val(),
                    'page_type': pageData.page.page_type == 'block' ? 'custom': pageData.page.page_type,
                    'protected': $("#setting-protected").val(),
                };
                
                _ks.put('KytePage', 'id', pageData.page.id, payload, null, [], function(r) {
                    // Complete step 3
                    updateRestoreStep('step-save', 'completed');
                    
                    // Step 4: Complete
                    updateRestoreStep('step-complete', 'active');
                    
                    setTimeout(() => {
                        updateRestoreStep('step-complete', 'completed');
                        
                        // Update state
                        isDirty = false;
                        syncPageDataWithCurrentState();
                        
                        // Refresh version history table
                        if (tblVersionHistory && tblVersionHistory.table) {
                            tblVersionHistory.table.ajax.reload();
                        }
                        
                        // Show completion actions
                        document.getElementById('restoreProgress').style.display = 'none';
                        document.getElementById('restoreActions').style.display = 'flex';
                        
                        // Show success notification
                        showNotification('success', 'Version Restored Successfully!', 
                            `Restored to version ${versionData.version_number}. Remember to publish to make changes live.`);
                        
                    }, 500);
                    
                }, function(err) {
                    alert("Error saving restored version: " + err);
                    console.error(err);
                    closeRestoreModal();
                });
                
            } catch (error) {
                alert("Error updating editors: " + error.message);
                console.error(error);
                closeRestoreModal();
            }
        }, 800); // Small delay for visual feedback
        
    }, function(err) {
        alert("Error fetching version content: " + err);
        console.error(err);
        closeRestoreModal();
    });
}

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Initialize change summary modal
function initializeChangeSummaryModal() {
    // Translation helper
    const t = (key, fallback) => {
        if (window.kyteI18n) {
            let text = window.kyteI18n.t(key);
            return text === key ? fallback : text;
        }
        return fallback;
    };

    // Add modal HTML to the page if it doesn't exist
    if (!document.getElementById('changeSummaryModal')) {
        const modalHTML = `
            <div class="modal fade" id="changeSummaryModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog">
                    <div class="modal-content" style="background: #2d2d30; border: 1px solid #3e3e42; color: #d4d4d4;">
                        <div class="modal-header" style="background: #252526; border-bottom: 1px solid #3e3e42;">
                            <h5 class="modal-title" style="color: #ffffff; font-weight: 600;">
                                <i class="fas fa-edit me-2"></i>
                                ${t('ui.page_editor.change_modal.title', 'Add Change Summary')}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="actionTypeBadge" class="mb-3" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                                <i class="fas fa-save"></i>
                                <span>${t('ui.page_editor.change_modal.badge_save', 'Saving Changes')}</span>
                            </div>

                            <div class="mb-3">
                                <label for="changeSummaryInput" class="form-label" style="color: #cccccc; font-weight: 500;">
                                    ${t('ui.page_editor.change_modal.label', 'What changed in this version?')}
                                </label>
                                <textarea
                                    class="form-control"
                                    id="changeSummaryInput"
                                    rows="3"
                                    placeholder="${t('ui.page_editor.change_modal.placeholder', 'Briefly describe your changes (optional)...')}"
                                    maxlength="500"
                                    style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; border-radius: 6px;"
                                ></textarea>
                                <div style="color: #969696; font-size: 0.85rem; margin-top: 0.5rem;">
                                    ${t('ui.page_editor.change_modal.help_text', 'Leave empty to use default summary.')} <code style="background: #252526; padding: 0.2rem 0.4rem; border-radius: 4px; color: #ff6b35;">Ctrl+Enter</code> ${t('ui.page_editor.change_modal.help_shortcut', 'to save quickly.')}
                                    <br><small style="color: #666666;">${t('ui.page_editor.change_modal.help_note', 'Note: No version will be created if no changes are detected.')}</small>
                                </div>
                            </div>

                            <div>
                                <label class="form-label" style="color: #cccccc; font-weight: 500;">${t('ui.page_editor.change_modal.quick_options', 'Quick Options')}</label>
                                <div class="quick-options" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                                    <span class="quick-option" onclick="setSummary('${t('ui.page_editor.change_modal.quick_styling', 'Fixed styling issues')}')">${t('ui.page_editor.change_modal.quick_styling', 'Fixed styling issues')}</span>
                                    <span class="quick-option" onclick="setSummary('${t('ui.page_editor.change_modal.quick_content', 'Updated content')}')">${t('ui.page_editor.change_modal.quick_content', 'Updated content')}</span>
                                    <span class="quick-option" onclick="setSummary('${t('ui.page_editor.change_modal.quick_features', 'Added new features')}')">${t('ui.page_editor.change_modal.quick_features', 'Added new features')}</span>
                                    <span class="quick-option" onclick="setSummary('${t('ui.page_editor.change_modal.quick_bugs', 'Bug fixes')}')">${t('ui.page_editor.change_modal.quick_bugs', 'Bug fixes')}</span>
                                    <span class="quick-option" onclick="setSummary('${t('ui.page_editor.change_modal.quick_performance', 'Performance improvements')}')">${t('ui.page_editor.change_modal.quick_performance', 'Performance improvements')}</span>
                                    <span class="quick-option" onclick="setSummary('${t('ui.page_editor.change_modal.quick_refactor', 'Code refactoring')}')">${t('ui.page_editor.change_modal.quick_refactor', 'Code refactoring')}</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer" style="background: #2d2d30; border-top: 1px solid #3e3e42;">
                            <button type="button" class="btn-editor btn-editor-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i>
                                ${t('ui.page_editor.change_modal.button_cancel', 'Cancel')}
                            </button>
                            <button type="button" class="btn-editor btn-editor-secondary" onclick="window.proceedWithAction('')">
                                <i class="fas fa-forward"></i>
                                ${t('ui.page_editor.change_modal.button_skip', 'Skip Summary')}
                            </button>
                            <button type="button" id="confirmActionBtn" class="btn-editor btn-editor-primary" onclick="window.proceedWithAction()">
                                <i class="fas fa-save"></i>
                                ${t('ui.page_editor.change_modal.button_save', 'Save with Summary')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add CSS for quick options
        if (!document.getElementById('changeSummaryStyles')) {
            const styles = document.createElement('style');
            styles.id = 'changeSummaryStyles';
            styles.textContent = `
                .quick-option {
                    background: #252526;
                    border: 1px solid #3e3e42;
                    color: #cccccc;
                    padding: 0.4rem 0.8rem;
                    border-radius: 16px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .quick-option:hover {
                    background: #ff6b35;
                    border-color: #ff6b35;
                    color: white;
                }
                .action-type-save {
                    background: linear-gradient(135deg, #fb8500, #e76f00);
                    color: white;
                }
                .action-type-publish {
                    background: linear-gradient(135deg, #0969da, #0860ca);
                    color: white;
                }
                #changeSummaryInput:focus {
                    background: #404040 !important;
                    border-color: #ff6b35 !important;
                    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2) !important;
                    color: #ffffff !important;
                    outline: none !important;
                }
                #changeSummaryInput::placeholder {
                    color: #969696 !important;
                }
            `;
            document.head.appendChild(styles);
        }
    }
}

// Show change summary modal
function showChangeSummaryModal(action, callback) {
    currentAction = action;
    pendingActionCallback = callback;

    // Translation helper
    const t = (key, fallback) => {
        if (window.kyteI18n) {
            let text = window.kyteI18n.t(key);
            return text === key ? fallback : text;
        }
        return fallback;
    };

    // Translate modal title
    const modalTitle = document.querySelector('#changeSummaryModal .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = `<i class="fas fa-edit me-2"></i>${t('ui.page_editor.change_modal.title', 'Add Change Summary')}`;
    }

    // Translate label
    const label = document.querySelector('#changeSummaryModal label[for="changeSummaryInput"]');
    if (label) {
        label.textContent = t('ui.page_editor.change_modal.label', 'What changed in this version?');
    }

    // Translate placeholder
    const textarea = document.getElementById('changeSummaryInput');
    if (textarea) {
        textarea.placeholder = t('ui.page_editor.change_modal.placeholder', 'Briefly describe your changes (optional)...');
    }

    // Translate help text
    const helpTextDiv = document.querySelector('#changeSummaryModal .modal-body > div:nth-child(2) > div');
    if (helpTextDiv) {
        helpTextDiv.innerHTML = `${t('ui.page_editor.change_modal.help_text', 'Leave empty to use default summary.')} <code style="background: #252526; padding: 0.2rem 0.4rem; border-radius: 4px; color: #ff6b35;">Ctrl+Enter</code> ${t('ui.page_editor.change_modal.help_shortcut', 'to save quickly.')}<br><small style="color: #666666;">${t('ui.page_editor.change_modal.help_note', 'Note: No version will be created if no changes are detected.')}</small>`;
    }

    // Translate quick options label
    const quickOptionsLabel = document.querySelector('#changeSummaryModal .modal-body > div:nth-child(3) > label');
    if (quickOptionsLabel) {
        quickOptionsLabel.textContent = t('ui.page_editor.change_modal.quick_options', 'Quick Options');
    }

    // Translate quick option buttons
    const quickOptions = document.querySelectorAll('#changeSummaryModal .quick-option');
    const quickOptionKeys = [
        { key: 'ui.page_editor.change_modal.quick_styling', fallback: 'Fixed styling issues' },
        { key: 'ui.page_editor.change_modal.quick_content', fallback: 'Updated content' },
        { key: 'ui.page_editor.change_modal.quick_features', fallback: 'Added new features' },
        { key: 'ui.page_editor.change_modal.quick_bugs', fallback: 'Bug fixes' },
        { key: 'ui.page_editor.change_modal.quick_performance', fallback: 'Performance improvements' },
        { key: 'ui.page_editor.change_modal.quick_refactor', fallback: 'Code refactoring' }
    ];
    quickOptions.forEach((option, index) => {
        if (quickOptionKeys[index]) {
            const translatedText = t(quickOptionKeys[index].key, quickOptionKeys[index].fallback);
            option.textContent = translatedText;
            option.setAttribute('onclick', `setSummary('${translatedText}')`);
        }
    });

    // Translate footer buttons
    const cancelBtn = document.querySelector('#changeSummaryModal .modal-footer .btn-editor-secondary[data-bs-dismiss="modal"]');
    if (cancelBtn) {
        cancelBtn.innerHTML = `<i class="fas fa-times"></i>${t('ui.page_editor.change_modal.button_cancel', 'Cancel')}`;
    }

    const skipBtn = document.querySelector('#changeSummaryModal .modal-footer .btn-editor-secondary[onclick*="proceedWithAction"]');
    if (skipBtn) {
        skipBtn.innerHTML = `<i class="fas fa-forward"></i>${t('ui.page_editor.change_modal.button_skip', 'Skip Summary')}`;
    }

    const badge = document.getElementById('actionTypeBadge');
    const confirmBtn = document.getElementById('confirmActionBtn');

    if (action === 'save') {
        badge.innerHTML = `<i class="fas fa-save"></i><span>${t('ui.page_editor.change_modal.badge_save', 'Saving Changes')}</span>`;
        badge.className = 'action-type-badge action-type-save mb-3';
        confirmBtn.innerHTML = `<i class="fas fa-save"></i>${t('ui.page_editor.change_modal.button_save', 'Save with Summary')}`;
        confirmBtn.className = 'btn-editor btn-editor-success';
    } else {
        badge.innerHTML = `<i class="fas fa-upload"></i><span>${t('ui.page_editor.change_modal.badge_publish', 'Publishing Page')}</span>`;
        badge.className = 'action-type-badge action-type-publish mb-3';
        confirmBtn.innerHTML = `<i class="fas fa-upload"></i>${t('ui.page_editor.change_modal.button_publish', 'Publish with Summary')}`;
        confirmBtn.className = 'btn-editor btn-editor-primary';
    }

    // Clear previous input and show modal
    document.getElementById('changeSummaryInput').value = '';
    const modal = new bootstrap.Modal(document.getElementById('changeSummaryModal'));
    modal.show();

    // Focus the textarea after modal is shown
    $('#changeSummaryModal').on('shown.bs.modal', function() {
        document.getElementById('changeSummaryInput').focus();
    });
}

// Set summary from quick options
function setSummary(text) {
    document.getElementById('changeSummaryInput').value = text;
}

window.setSummary = setSummary;

// Proceed with the action
function proceedWithAction(customSummary = null) {
    const summary = customSummary !== null ? customSummary : 
                   document.getElementById('changeSummaryInput').value.trim();
    
    // Hide modal immediately and remove backdrop
    const modalElement = document.getElementById('changeSummaryModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
        // Force remove the backdrop and modal-open class
        setTimeout(() => {
            document.body.classList.remove('modal-open');
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
        }, 100);
    }
    
    // Execute the callback with the summary
    if (pendingActionCallback) {
        const finalSummary = summary || (currentAction === 'save' ? 'Manual save' : 'Manual publish');
        pendingActionCallback(finalSummary);
        pendingActionCallback = null;
    }
}

window.proceedWithAction = proceedWithAction;

// Save function that uses the modal
function savePageWithSummary(changeSummary) {
    $('#pageLoaderModal').modal('show');
    
    try {
        let rawJS = jsEditor.getValue();
        let obfuscatedJS = JavaScriptObfuscator.obfuscate(rawJS, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayEncoding: ['base64'],
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayWrappersType: 'variable',
            stringArrayThreshold: 1
        });

        let payload = {
            'change_summary': changeSummary,
            'html': htmlEditor.getValue(),
            'javascript': rawJS,
            'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
            'stylesheet': cssEditor.getValue(),
            'main_navigation': $("#setting-main-navigation").val(),
            'side_navigation': $("#setting-side-navigation").val(),
            'footer': $("#setting-footer").val(),
            'title': $("#setting-page-title").val(),
            'description': $("#setting-page-description").val(),
            'lang': $("#lang").val() == 'default' ? null : $("#lang").val(),
            'webcomponent_obj_name': $("#webcomponent_obj_name").val(),
            'sitemap_include': $("#setting-sitemap-include").val(),
            'obfuscate_js': $("#setting-obfuscatejs").val(),
            'is_js_module': $("#setting-is_js_module").val(),
            'use_container': $("#setting-use_container").val(),
            'page_type': pageData.page.page_type == 'block' ? 'custom': pageData.page.page_type,
            'protected': $("#setting-protected").val(),
        };
        
        _ks.put('KytePage', 'id', pageData.page.id, payload, null, [], function(r) {
            $('#pageLoaderModal').modal('hide');

            isDirty = false;
            
            // Update pageData to reflect current saved state
            syncPageDataWithCurrentState();

            if (tblVersionHistory && tblVersionHistory.table) {
                tblVersionHistory.table.ajax.reload();
            }
            
            // Show success notification (optional)
            showNotification('success', 'Page saved successfully!', changeSummary);
        }, function(err) {
            alert(err);
            console.error(err);
            $('#pageLoaderModal').modal('hide');
        });

    } catch (error) {
        alert("An error occurred: " + error.message);
        console.error(error.message);
        $('#pageLoaderModal').modal('hide');
    }
}

// Helper function to sync pageData with current editor/form state
// Helper function to sync pageData with current editor/form state
function syncPageDataWithCurrentState() {
    // Update the pageData object with current values
    pageData.html = htmlEditor.getValue();
    pageData.javascript = jsEditor.getValue();
    pageData.stylesheet = cssEditor.getValue();
    pageData.page.title = $("#setting-page-title").val();
    pageData.page.description = $("#setting-page-description").val();
    
    // Update navigation references
    const mainNavId = parseInt($("#setting-main-navigation").val());
    pageData.page.main_navigation = mainNavId > 0 ? { id: mainNavId } : null;
    
    const sideNavId = parseInt($("#setting-side-navigation").val());
    pageData.page.side_navigation = sideNavId > 0 ? { id: sideNavId } : null;
    
    const footerId = parseInt($("#setting-footer").val());
    pageData.page.footer = footerId > 0 ? { id: footerId } : null;
    
    // Update additional form fields
    pageData.page.webcomponent_obj_name = $("#webcomponent_obj_name").val();
    pageData.page.lang = $("#lang").val() === 'default' ? '' : $("#lang").val();
    pageData.page.sitemap_include = parseInt($("#setting-sitemap-include").val());
    pageData.page.obfuscate_js = parseInt($("#setting-obfuscatejs").val());
    pageData.page.is_js_module = parseInt($("#setting-is_js_module").val());
    pageData.page.use_container = parseInt($("#setting-use_container").val());
    pageData.page.protected = parseInt($("#setting-protected").val());
}

// Publish function that uses the modal
function publishPageWithSummary(changeSummary) {
    $('#pageLoaderModal').modal('show');

    try {
        let rawJS = jsEditor.getValue();
        let obfuscatedJS = JavaScriptObfuscator.obfuscate(rawJS, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayEncoding: ['base64'],
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayWrappersType: 'variable',
            stringArrayThreshold: 1
        });

        let payload = {
            'change_summary': changeSummary,
            'html': htmlEditor.getValue(),
            'javascript': rawJS,
            'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
            'stylesheet': cssEditor.getValue(),
            'main_navigation': $("#setting-main-navigation").val(),
            'side_navigation': $("#setting-side-navigation").val(),
            'footer': $("#setting-footer").val(),
            'title': $("#setting-page-title").val(),
            'description': $("#setting-page-description").val(),
            'lang': $("#lang").val() == 'default' ? null : $("#lang").val(),
            'webcomponent_obj_name': $("#webcomponent_obj_name").val(),
            'sitemap_include': $("#setting-sitemap-include").val(),
            'obfuscate_js': $("#setting-obfuscatejs").val(),
            'is_js_module': $("#setting-is_js_module").val(),
            'use_container': $("#setting-use_container").val(),
            'page_type': pageData.page.page_type == 'block' ? 'custom' : pageData.page.page_type,
            'state': 1,
            'protected': $("#setting-protected").val(),
        };
        
        _ks.put('KytePage', 'id', pageData.page.id, payload, null, [], function(r) {
            $('#pageLoaderModal').modal('hide');
            
            isDirty = false;
            
            // Update pageData to reflect current saved state
            syncPageDataWithCurrentState();

            if (tblVersionHistory && tblVersionHistory.table) {
                tblVersionHistory.table.ajax.reload();
            }
            
            // Show success notification (optional)
            showNotification('success', 'Page published successfully!', changeSummary);
        }, function(err) {
            alert(err);
            console.error(err);
            $('#pageLoaderModal').modal('hide');
        });

    } catch (error) {
        alert("An error occurred: " + error.message);
        console.error(error.message);
        $('#pageLoaderModal').modal('hide');
    }
}

// Show success notification
function showNotification(type, message, summary) {
    // Create a toast notification (optional enhancement)
    const toastHtml = `
        <div class="toast align-items-center border-0 show" style="background: ${type === 'success' ? '#238636' : '#f85149'}; color: white; position: fixed; top: 2rem; right: 2rem; z-index: 9999;">
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${message}</strong>
                    ${summary ? `<br><small>${summary}</small>` : ''}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        const toasts = document.querySelectorAll('.toast');
        if (toasts.length > 0) {
            toasts[toasts.length - 1].remove();
        }
    }, 4000);
}

// Navigation functionality
document.querySelectorAll('[data-target]').forEach(button => {
    button.addEventListener('click', function() {
        const target = this.dataset.target;
        
        // Update active nav item
        document.querySelectorAll('[data-target]').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Update active tab
        document.querySelectorAll('.editor-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.editor-tab[data-target="' + target + '"]').forEach(tab => tab.classList.add('active'));
        
        // Show corresponding content
        document.querySelectorAll('.editor-container, .secondary-content').forEach(container => {
            container.classList.remove('active');
        });
        document.getElementById(target).classList.add('active');

        if (target === 'Preview') {
            renderHtmlCode();
        }
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidenav').classList.remove('show');
        }
    });
});

// Mobile sidebar toggle
document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidenav').classList.add('show');
});

document.getElementById('closeSidebar')?.addEventListener('click', function() {
    document.getElementById('sidenav').classList.remove('show');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidenav');
    const toggle = document.getElementById('sidebarToggle');
    
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !toggle.contains(e.target) && 
        sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
    }
});

// Open documentation in popup window
const openDocsBtn = document.getElementById('openDocsInWindow');
if (openDocsBtn) {
    openDocsBtn.addEventListener('click', function(e) {
        e.preventDefault();

        // Get the documentation content
        const docContent = document.getElementById('Documentation');
        if (!docContent) return;

        // Create a new window with appropriate size
        const width = 1200;
        const height = 800;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;

        const popupWindow = window.open(
            '',
            'KyteAPIJSDocs',
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        if (popupWindow) {
            // Build the popup HTML with all necessary styles
            popupWindow.document.write(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Kyte API JS Documentation</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.12.0/css/all.css">
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
                    <style>
                        body {
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background: #1e1e1e;
                            color: #d4d4d4;
                            margin: 0;
                            padding: 2rem;
                            line-height: 1.6;
                        }
                        h4, h5, h6 {
                            color: #ffffff;
                        }
                        .text-muted {
                            color: #969696 !important;
                        }
                        .text-primary {
                            color: #4299e1 !important;
                        }
                        .text-secondary {
                            color: #a0aec0 !important;
                        }
                        code {
                            background: #252526;
                            padding: 0.2rem 0.4rem;
                            border-radius: 4px;
                            color: #ff6b35;
                            font-family: 'JetBrains Mono', monospace;
                        }
                        pre {
                            background: #252526;
                            border: 1px solid #3e3e42;
                            border-radius: 4px;
                            padding: 1rem;
                            overflow-x: auto;
                        }
                        pre code {
                            background: transparent;
                            padding: 0;
                            color: #d4d4d4;
                        }
                        ul, ol {
                            margin-left: 1.5rem;
                        }
                        li {
                            margin-bottom: 0.5rem;
                        }
                        .mb-2 { margin-bottom: 0.5rem; }
                        .mb-3 { margin-bottom: 1rem; }
                        .mb-4 { margin-bottom: 1.5rem; }
                        .mb-5 { margin-bottom: 3rem; }
                        .mt-2 { margin-top: 0.5rem; }
                        .mt-3 { margin-top: 1rem; }
                        .me-2 { margin-right: 0.5rem; }
                    </style>
                </head>
                <body>
                    ${docContent.innerHTML}
                </body>
                </html>
            `);
            popupWindow.document.close();
        }
    });
}

document.addEventListener('KyteInitialized', function(e) {
    _ks = e.detail._ks;

    // Initialize i18n system with user's language preference
    if (typeof window.kyteI18n === 'undefined') {
        // Priority order: localStorage > sessionStorage > user profile > browser > default
        let cachedLanguage = localStorage.getItem('kyte_user_language') || sessionStorage.getItem('kyte_language');

        if (cachedLanguage) {
            // Use cached language immediately
            window.kyteI18n = new KyteI18n(cachedLanguage, '/assets/i18n/');
            window.kyteI18n.init(cachedLanguage).then(() => {
                window.kyteI18n.translateDOM();
                console.log(`i18n initialized with cached language: ${cachedLanguage}`);
            }).catch(err => {
                console.error('Failed to initialize i18n:', err);
            });
        } else {
            // Fetch user profile to get language preference
            const userId = _ks.getCookie('accountIdx');
            if (userId && userId !== '0') {
                _ks.sign((signature) => {
                    _ks.get('KyteUser', 'id', userId, [], function(response) {
                        const userLanguage = response.data[0]?.language || 'en';

                        window.kyteI18n = new KyteI18n(userLanguage, '/assets/i18n/');
                        window.kyteI18n.init(userLanguage).then(() => {
                            window.kyteI18n.translateDOM();
                            console.log(`i18n initialized with user profile language: ${userLanguage}`);

                            // Cache for future use
                            localStorage.setItem('kyte_user_language', userLanguage);
                        }).catch(err => {
                            console.error('Failed to initialize i18n:', err);
                        });
                    }, function(error) {
                        console.error('Failed to fetch user profile:', error);
                        // Fall back to browser language
                        initializeI18nFallback();
                    });
                }, (error) => {
                    console.error('Failed to sign request:', error);
                    initializeI18nFallback();
                });
            } else {
                // No user logged in, use browser language
                initializeI18nFallback();
            }
        }

        // Listen for language changes from other components (like navigation language selector)
        window.addEventListener('kyteLanguageSelectorChanged', function(e) {
            const newLanguage = e.detail.language;
            if (window.kyteI18n && window.kyteI18n.getCurrentLanguage() !== newLanguage) {
                window.kyteI18n.setLanguage(newLanguage).then(() => {
                    console.log(`Page editor language updated to: ${newLanguage}`);
                }).catch(err => {
                    console.error('Failed to update language:', err);
                });
            }
        });
    }

    // Helper function to initialize with fallback (browser language)
    function initializeI18nFallback() {
        window.kyteI18n = new KyteI18n('en', '/assets/i18n/');
        window.kyteI18n.init().then(() => {
            window.kyteI18n.translateDOM();
            console.log(`i18n initialized with browser/fallback language: ${window.kyteI18n.getCurrentLanguage()}`);
        }).catch(err => {
            console.error('Failed to initialize i18n:', err);
        });
    }

    $('#pageLoaderModal').modal('show');

    initializeChangeSummaryModal();

    let hash = location.hash;
    hash = hash == "" ? '#Page' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        // check if we are explicitly asked to use code editor even if page was made using block
        let forceCodeEditor = _ks.getUrlParameter('mode') == 'code';

        _ks.get("KytePageData", "page", idx, [], function(r) {
            if (r.data[0]) {
                pageData = r.data[0];

                _ks.get('KyteLibrary', 'site', pageData.site, [], function(r) {
                    libraries = r.data;
                }, function(e) {
                    console.error(e);
                    alert(e);
                });

                // display page title in window
                document.title = document.title + " - " + pageData.page.title;
                // set page title and description
                $("#setting-page-title").val(pageData.page.title);
                $("#setting-page-description").val(pageData.page.description);
                $("#webcomponent_obj_name").val(pageData.page.webcomponent_obj_name);
                $("#lang").val(pageData.page.lang.length == 0 ? 'default' : pageData.page.lang);
                
                // if block editor, redirect to block editor page.
                if (pageData.page.page_type == 'block' && !forceCodeEditor) {
                    // redirect to block editor....
                    let obj = {'model': 'KytePage', 'idx':idx};
                    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    window.location = '/app/page/blockeditor.html?request='+encoded;
                }

                $("#setting-protected").val(pageData.page.protected);
                if (pageData.page.protected == 0) {
                    $("#sitemap-option-wrapper").removeClass('d-none');
                    $('#setting-sitemap-include').val(pageData.page.sitemap_include);
                }

                $("#setting-obfuscatejs").val(pageData.page.obfuscate_js);
                $("#setting-is_js_module").val(pageData.page.is_js_module);
                $("#setting-use_container").val(pageData.page.use_container);

                // Configure Monaco for better IntelliSense before creating editors
                monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ES2020,
                    allowNonTsExtensions: true,
                    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                    module: monaco.languages.typescript.ModuleKind.CommonJS,
                    noEmit: true,
                    typeRoots: ["node_modules/@types"]
                });

                monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                    noSemanticValidation: false,
                    noSyntaxValidation: false
                });

                monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

                // Define Kyte API types
                const kyteApiDefs = `
/**
 * Kyte API JS Library v1.2.24
 * Main API client for Kyte backend communication
 *
 * IMPORTANT: In published pages, the Kyte instance is automatically created as a global variable named 'k'.
 * Usage: k.get(), k.post(), k.isSession(), etc.
 */

/**
 * Main Kyte API client class
 */
declare class Kyte {
    /**
     * Backend API endpoint URL
     */
    url: string;

    /**
     * API public key
     */
    access_key: string;

    /**
     * API identifier
     */
    identifier: string;

    /**
     * Account number
     */
    account_number: string;

    /**
     * Transaction token (rotates per request)
     */
    txToken: string;

    /**
     * User session token
     */
    sessionToken: string;

    /**
     * Optional application ID for context switching
     */
    applicationId: string;

    /**
     * Creates a new Kyte API instance
     * @param url Backend API endpoint
     * @param access_key API public key
     * @param identifier API identifier
     * @param account_number Account number
     */
    constructor(url: string, access_key: string, identifier: string, account_number: string);

    /**
     * Initialize Kyte instance by loading credentials from cookies
     */
    init(): void;

    /**
     * Get API version
     * @param callback Success callback
     * @param error Error callback
     */
    apiVersion(callback: (response: any) => void, error?: (error: any) => void): void;

    /**
     * Generate HMAC signature for authenticated requests
     * @param callback Success callback with signature
     * @param error Error callback
     */
    sign(callback: (signature: string) => void, error?: (error: any) => void): void;

    /**
     * Send data to the backend (internal method)
     * @param method HTTP method (GET, POST, PUT, DELETE)
     * @param model Model name
     * @param field Field name
     * @param value Field value
     * @param data Request data
     * @param formdata FormData object
     * @param headers Additional headers
     * @param callback Success callback
     * @param error Error callback
     */
    sendData(method: string, model: string, field?: string, value?: any, data?: any, formdata?: FormData, headers?: any[], callback?: (response: any) => void, error?: (error: any) => void): void;

    /**
     * Create new record in the backend
     * @param model Model name
     * @param data Record data
     * @param formdata Optional FormData for file uploads
     * @param headers Additional headers
     * @param callback Success callback
     * @param error Error callback
     */
    post(model: string, data?: any, formdata?: FormData, headers?: any[], callback?: (response: any) => void, error?: (error: any) => void): void;

    /**
     * Update existing record in the backend
     * @param model Model name
     * @param field Field to match
     * @param value Value to match
     * @param data Update data
     * @param formdata Optional FormData
     * @param headers Additional headers
     * @param callback Success callback
     * @param error Error callback
     */
    put(model: string, field?: string, value?: any, data?: any, formdata?: FormData, headers?: any[], callback?: (response: any) => void, error?: (error: any) => void): void;

    /**
     * Retrieve records from the backend
     * @param model Model name
     * @param field Field to match
     * @param value Value to match
     * @param headers Additional headers
     * @param callback Success callback
     * @param error Error callback
     */
    get(model: string, field?: string, value?: any, headers?: any[], callback?: (response: any) => void, error?: (error: any) => void): void;

    /**
     * Delete records from the backend (soft delete)
     * @param model Model name
     * @param field Field to match
     * @param value Value to match
     * @param callback Success callback
     * @param error Error callback
     */
    delete(model: string, field?: string, value?: any, callback?: (response: any) => void, error?: (error: any) => void): void;

    /**
     * Set a browser cookie
     * @param name Cookie name
     * @param value Cookie value
     * @param minutes Expiration time in minutes (default: 60)
     * @param crossDomain Whether to allow cross-domain cookies
     */
    setCookie(name: string, value: string, minutes?: number, crossDomain?: boolean): void;

    /**
     * Get a browser cookie value
     * @param name Cookie name
     * @returns Cookie value or empty string
     */
    getCookie(name: string): string;

    /**
     * Get URL query parameter value
     * @param name Parameter name
     * @returns Parameter value
     */
    getUrlParameter(name: string): string;

    /**
     * Get decoded page request object from URL
     * @returns Decoded request object
     */
    getPageRequest(): any;

    /**
     * Create encoded page request URL
     * @param model Model name
     * @param value ID value
     * @returns Encoded request URL parameter
     */
    setPageRequest(model: string, value: any): string;

    /**
     * Create a new user session (login)
     * @param identity Login credentials object {username, password}
     * @param callback Success callback
     * @param error Error callback
     * @param sessionController Optional custom session controller name
     */
    sessionCreate(identity: {username: string, password: string}, callback: (response: any) => void, error?: (error: any) => void, sessionController?: string): void;

    /**
     * Check if session exists in cookies
     * @returns True if session cookie exists
     */
    checkSession(): boolean;

    /**
     * Redirect to login page
     */
    redirectToLogin(): void;

    /**
     * Check if a valid session exists
     * @param periodic Enable periodic checking
     * @param redir Redirect to login if no session
     * @param interval Check interval in milliseconds (default: 30000)
     * @returns True if session exists
     */
    isSession(periodic?: boolean, redir?: boolean, interval?: number): boolean;

    /**
     * Destroy the current session (logout)
     * @param error Error callback
     */
    sessionDestroy(error?: (error: any) => void): void;

    /**
     * Display a SweetAlert2 alert dialog
     * @param title Alert title
     * @param message Alert message
     * @param callback Callback when alert is dismissed
     * @param dismiss Whether alert can be dismissed
     */
    alert(title: string, message: string, callback?: () => void, dismiss?: boolean): void;

    /**
     * Display a SweetAlert2 confirmation dialog
     * @param title Confirmation title
     * @param message Confirmation message
     * @param callback Callback when confirmed
     * @param cancel Callback when cancelled
     */
    confirm(title: string, message: string, callback?: () => void, cancel?: () => void): void;

    /**
     * Validate a form element (checks required fields)
     * @param form Form element to validate
     * @returns True if form is valid
     */
    validateForm(form: HTMLFormElement): boolean;

    /**
     * Get nested object property using dot notation
     * @param obj Object to query
     * @param path Property path (e.g., 'user.profile.name')
     * @returns Property value or undefined
     */
    getNestedValue(obj: any, path: string): any;
}

/**
 * DataTables integration with Kyte backend
 */
declare class KyteTable {
    /**
     * Create a server-side DataTable with Kyte backend integration
     * @param kyte Kyte instance
     * @param selector Table element selector
     * @param model Model name
     * @param columnDefs Column definitions
     * @param sortable Enable sorting
     * @param orderBy Default order [[column, direction]]
     * @param editable Show edit button
     * @param clickable Enable row click navigation
     * @param idField ID field name
     * @param detailUrl Detail page URL
     */
    constructor(
        kyte: Kyte,
        selector: string,
        model: string,
        columnDefs: any[],
        sortable: boolean,
        orderBy: any[],
        editable: boolean,
        clickable: boolean,
        idField: string,
        detailUrl: string
    );

    /**
     * Refresh table data
     */
    refresh(): void;
}

/**
 * Field definition for KyteForm
 */
interface KyteFormField {
    field: string;
    type: 'text' | 'password' | 'textarea' | 'select' | 'file' | 'date' | 'checkbox' | 'radio';
    label: string;
    placeholder?: string;
    required?: boolean;
    col?: number;
    option?: {
        ajax?: boolean;
        data_model_name?: string;
        data_model_field?: string;
        data_model_value?: string;
        data?: any[];
    };
}

/**
 * Dynamic form builder with validation
 */
declare class KyteForm {
    /**
     * Create a dynamic form with validation and automatic CRUD operations
     * @param kyte Kyte instance
     * @param selector Form container selector
     * @param model Model name
     * @param hiddenFields Hidden field values
     * @param elements Field definitions
     * @param title Form title
     * @param table Optional KyteTable to refresh after submission
     * @param modal Optional modal selector
     * @param trigger Optional trigger button selector
     */
    constructor(
        kyte: Kyte,
        selector: string,
        model: string,
        hiddenFields: any,
        elements: KyteFormField[],
        title: string,
        table?: KyteTable,
        modal?: string,
        trigger?: string
    );

    /**
     * Populate form for editing
     * @param data Record data
     */
    populate(data: any): void;

    /**
     * Reset form
     */
    reset(): void;
}

/**
 * Menu item definition
 */
interface MenuItem {
    label: string;
    url?: string;
    hash?: string;
    icon?: string;
    children?: MenuItem[];
}

/**
 * Bootstrap 5 navigation bar
 */
declare class KyteNav {
    /**
     * Create a Bootstrap 5 navigation bar
     * @param selector Navigation container selector
     * @param menuArray Menu items
     * @param logoutCallback Logout callback function
     * @param brandHTML Brand HTML content
     */
    constructor(
        selector: string,
        menuArray: MenuItem[],
        logoutCallback: () => void,
        brandHTML: string
    );
}

/**
 * Hash-based sidebar navigation
 */
declare class KyteSidenav {
    /**
     * Create a hash-based sidebar navigation
     * @param selector Sidebar container selector
     * @param menuArray Menu items
     * @param callback Navigation callback
     */
    constructor(
        selector: string,
        menuArray: MenuItem[],
        callback: (hash: string) => void
    );
}

/**
 * Custom calendar with date range selection
 */
declare class KyteCalendar {
    /**
     * Create a custom calendar with date range selection
     * @param selector Container selector
     * @param rows Number of rows (months)
     * @param cols Number of columns
     * @param onChange Callback when date range is selected
     */
    constructor(
        selector: string,
        rows: number,
        cols: number,
        onChange: (startDate: Date, endDate: Date) => void
    );
}

/**
 * Password requirement configuration
 */
interface PasswordRequirements {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumber?: boolean;
    requireSpecial?: boolean;
}

/**
 * Real-time password validation with visual feedback
 */
declare class KytePasswordRequirement {
    /**
     * Create real-time password validation
     * @param selector Password input selector
     * @param requirements Password requirements configuration
     */
    constructor(
        selector: string,
        requirements: PasswordRequirements
    );
}

/**
 * Simple mustache-style template engine
 */
declare class KyteWebComponent {
    /**
     * Create a template-based web component
     * @param selector Container selector
     * @param data Data to render in template
     * @param mutator Optional function to transform data before rendering
     */
    constructor(
        selector: string,
        data: any,
        mutator?: (data: any) => any
    );

    /**
     * Update component data and re-render
     * @param data New data
     */
    update(data: any): void;
}

/**
 * Global Kyte instance - automatically initialized in published pages
 * @type {Kyte}
 */
declare var k: Kyte;
`;

                // Don't add types yet - wait for editor to be created first

                // Create HTML Editor
                htmlEditor = monaco.editor.create(document.getElementById("htmlEditor"), {
                    value: pageData.html,
                    theme: colorMode,
                    language: "html",
                    automaticLayout: true,
                    wordWrap: true,
                    wordWrapMinified: true,
                    wrappingIndent: 'indent'
                });

                // Create JavaScript Editor with IntelliSense enabled
                jsEditor = monaco.editor.create(document.getElementById("jsEditor"), {
                    value: pageData.javascript,
                    theme: colorMode,
                    language: "javascript",
                    automaticLayout: true,
                    wordWrap: true,
                    wordWrapMinified: true,
                    wrappingIndent: 'indent',
                    // Enable IntelliSense features
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: false
                    },
                    quickSuggestionsDelay: 100,
                    parameterHints: {
                        enabled: true,
                        cycle: true
                    },
                    suggest: {
                        snippetsPreventQuickSuggestions: false,
                        showMethods: true,
                        showFunctions: true,
                        showConstructors: true,
                        showFields: true,
                        showVariables: true,
                        showClasses: true,
                        showStructs: true,
                        showInterfaces: true,
                        showModules: true,
                        showProperties: true,
                        showEvents: true,
                        showOperators: true,
                        showUnits: true,
                        showValues: true,
                        showConstants: true,
                        showEnums: true,
                        showEnumMembers: true,
                        showKeywords: true,
                        showWords: true,
                        showColors: true,
                        showFiles: true,
                        showReferences: true,
                        showFolders: true,
                        showTypeParameters: true,
                        showSnippets: true
                    },
                    acceptSuggestionOnCommitCharacter: true,
                    acceptSuggestionOnEnter: 'on',
                    tabCompletion: 'on'
                });

                // NOW add the type definitions AFTER editor is created
                console.log('Adding Kyte API type definitions...');

                // Add types first
                monaco.languages.typescript.javascriptDefaults.addExtraLib(kyteApiDefs, 'file:///kyte-api.d.ts');

                // Add simple global k declaration
                monaco.languages.typescript.javascriptDefaults.addExtraLib(`
/**
 * Global Kyte API instance - automatically initialized in published pages
 */
declare var k: Kyte;
`, 'file:///globals.d.ts');

                console.log('✓ Type definitions added');
                console.log('Extra Libs:', monaco.languages.typescript.javascriptDefaults.getExtraLibs());

                // Add a keybinding to manually trigger suggestions
                jsEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
                    jsEditor.trigger('keyboard', 'editor.action.triggerSuggest', {});
                });

                // Register custom completion provider for Kyte API (no workers needed!)
                monaco.languages.registerCompletionItemProvider('javascript', {
                    triggerCharacters: ['.'],
                    provideCompletionItems: function (model, position) {
                        const textUntilPosition = model.getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn: 1,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column
                        });

                        // Check if we're after "k."
                        const match = textUntilPosition.match(/k\.(\w*)$/);
                        if (!match) {
                            return { suggestions: [] };
                        }

                        const word = model.getWordUntilPosition(position);
                        const range = {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn: word.startColumn,
                            endColumn: word.endColumn
                        };

                        // Kyte API method completions
                        const suggestions = [
                            {
                                label: 'get',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'get(${1:model}, ${2:field}, ${3:value}, [], ${4:(response) => {\n\t$0\n}}, ${5:(error) => {\n\tconsole.error(error);\n}})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Retrieve records from the backend\n\nExample:\nk.get("User", "email", "user@example.com", [],\n  (response) => { console.log(response); },\n  (error) => { console.error(error); }\n);',
                                range: range
                            },
                            {
                                label: 'post',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'post(${1:model}, ${2:data}, null, [], ${3:(response) => {\n\t$0\n}}, ${4:(error) => {\n\tconsole.error(error);\n}})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Create new records in the backend\n\nExample:\nk.post("User", { name: "John", email: "john@example.com" }, null, [],\n  (response) => { console.log(response); },\n  (error) => { console.error(error); }\n);',
                                range: range
                            },
                            {
                                label: 'put',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'put(${1:model}, ${2:field}, ${3:value}, ${4:data}, null, [], ${5:(response) => {\n\t$0\n}}, ${6:(error) => {\n\tconsole.error(error);\n}})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Update existing records in the backend\n\nExample:\nk.put("User", "id", "123", { name: "Jane" }, null, [],\n  (response) => { console.log(response); },\n  (error) => { console.error(error); }\n);',
                                range: range
                            },
                            {
                                label: 'delete',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'delete(${1:model}, ${2:field}, ${3:value}, ${4:(response) => {\n\t$0\n}}, ${5:(error) => {\n\tconsole.error(error);\n}})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Delete records from the backend (soft delete)\n\nExample:\nk.delete("User", "id", "123",\n  (response) => { console.log(response); },\n  (error) => { console.error(error); }\n);',
                                range: range
                            },
                            {
                                label: 'sessionCreate',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'sessionCreate({ username: ${1:"user@example.com"}, password: ${2:"password"} }, ${3:(response) => {\n\t$0\n}}, ${4:(error) => {\n\tconsole.error(error);\n}})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Create a new user session (login)',
                                range: range
                            },
                            {
                                label: 'sessionDestroy',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'sessionDestroy(${1:(error) => {\n\tif (error) console.error(error);\n\telse window.location.href = "/login.html";\n}})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Destroy the current session (logout)',
                                range: range
                            },
                            {
                                label: 'isSession',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'isSession(${1:false}, ${2:false})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Check if a valid session exists\n\nParameters:\n- periodic: Enable periodic checking (default: false)\n- redir: Redirect to login if no session (default: false)\n- interval: Check interval in ms (default: 30000)\n\nExample:\nif (!k.isSession(false, false)) {\n  window.location.href = "/login.html";\n}',
                                range: range
                            },
                            {
                                label: 'checkSession',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'checkSession()',
                                documentation: 'Check if session cookie exists',
                                range: range
                            },
                            {
                                label: 'init',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'init()',
                                documentation: 'Initialize Kyte instance by loading credentials from cookies (called automatically)',
                                range: range
                            },
                            {
                                label: 'sign',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'sign(${1:(signature) => {\n\t$0\n}}, ${2:(error) => {\n\tconsole.error(error);\n}})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Generate HMAC signature for authenticated requests',
                                range: range
                            },
                            {
                                label: 'setCookie',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'setCookie(${1:"name"}, ${2:"value"}, ${3:60})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Set a browser cookie\n\nParameters:\n- name: Cookie name\n- value: Cookie value\n- minutes: Expiration time in minutes (default: 60)',
                                range: range
                            },
                            {
                                label: 'getCookie',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'getCookie(${1:"name"})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Get a browser cookie value',
                                range: range
                            },
                            {
                                label: 'getUrlParameter',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'getUrlParameter(${1:"paramName"})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Get URL query parameter value',
                                range: range
                            },
                            {
                                label: 'getPageRequest',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'getPageRequest()',
                                documentation: 'Get decoded page request object from URL',
                                range: range
                            },
                            {
                                label: 'setPageRequest',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'setPageRequest(${1:"model"}, ${2:id})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Create encoded page request URL',
                                range: range
                            },
                            {
                                label: 'alert',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'alert(${1:"title"}, ${2:"message"}, ${3:() => {\n\t$0\n}})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Display a SweetAlert2 alert dialog',
                                range: range
                            },
                            {
                                label: 'confirm',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'confirm(${1:"title"}, ${2:"message"}, ${3:() => {\n\t// Confirmed\n\t$0\n}}, ${4:() => {\n\t// Cancelled\n}})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Display a SweetAlert2 confirmation dialog',
                                range: range
                            },
                            {
                                label: 'validateForm',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'validateForm(${1:formElement})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Validate a form element (checks required fields)',
                                range: range
                            },
                            {
                                label: 'getNestedValue',
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: 'getNestedValue(${1:obj}, ${2:"path.to.property"})',
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                documentation: 'Get nested object property using dot notation',
                                range: range
                            }
                        ];

                        return { suggestions: suggestions };
                    }
                });

                // Register signature help provider for parameter hints
                monaco.languages.registerSignatureHelpProvider('javascript', {
                    signatureHelpTriggerCharacters: ['(', ','],
                    provideSignatureHelp: function (model, position) {
                        const textUntilPosition = model.getValueInRange({
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column
                        });

                        // Define signatures for Kyte methods
                        const signatures = {
                            'k.get': {
                                label: 'k.get(model, field, value, headers, callback, error)',
                                documentation: 'Retrieve records from the backend',
                                parameters: [
                                    { label: 'model', documentation: 'Model name (e.g., "User")' },
                                    { label: 'field', documentation: 'Field to match (e.g., "email")' },
                                    { label: 'value', documentation: 'Value to match (e.g., "user@example.com")' },
                                    { label: 'headers', documentation: 'Additional headers array (usually [])' },
                                    { label: 'callback', documentation: 'Success callback function(response) {}' },
                                    { label: 'error', documentation: 'Error callback function(error) {}' }
                                ]
                            },
                            'k.post': {
                                label: 'k.post(model, data, formdata, headers, callback, error)',
                                documentation: 'Create new records in the backend',
                                parameters: [
                                    { label: 'model', documentation: 'Model name' },
                                    { label: 'data', documentation: 'Object with field values { name: "John", email: "john@example.com" }' },
                                    { label: 'formdata', documentation: 'FormData object (for file uploads) or null' },
                                    { label: 'headers', documentation: 'Additional headers array (usually [])' },
                                    { label: 'callback', documentation: 'Success callback function(response) {}' },
                                    { label: 'error', documentation: 'Error callback function(error) {}' }
                                ]
                            },
                            'k.put': {
                                label: 'k.put(model, field, value, data, formdata, headers, callback, error)',
                                documentation: 'Update existing records in the backend',
                                parameters: [
                                    { label: 'model', documentation: 'Model name' },
                                    { label: 'field', documentation: 'Field to match (e.g., "id")' },
                                    { label: 'value', documentation: 'Value to match (e.g., "123")' },
                                    { label: 'data', documentation: 'Object with fields to update { name: "Jane" }' },
                                    { label: 'formdata', documentation: 'FormData object or null' },
                                    { label: 'headers', documentation: 'Additional headers array (usually [])' },
                                    { label: 'callback', documentation: 'Success callback function(response) {}' },
                                    { label: 'error', documentation: 'Error callback function(error) {}' }
                                ]
                            },
                            'k.delete': {
                                label: 'k.delete(model, field, value, callback, error)',
                                documentation: 'Delete records from the backend (soft delete)',
                                parameters: [
                                    { label: 'model', documentation: 'Model name' },
                                    { label: 'field', documentation: 'Field to match (e.g., "id")' },
                                    { label: 'value', documentation: 'Value to match (e.g., "123")' },
                                    { label: 'callback', documentation: 'Success callback function(response) {}' },
                                    { label: 'error', documentation: 'Error callback function(error) {}' }
                                ]
                            },
                            'k.sessionCreate': {
                                label: 'k.sessionCreate(identity, callback, error, sessionController)',
                                documentation: 'Create a new user session (login)',
                                parameters: [
                                    { label: 'identity', documentation: 'Login credentials { username: "user@example.com", password: "password" }' },
                                    { label: 'callback', documentation: 'Success callback function(response) {}' },
                                    { label: 'error', documentation: 'Error callback function(error) {}' },
                                    { label: 'sessionController', documentation: 'Optional custom session controller name' }
                                ]
                            },
                            'k.sessionDestroy': {
                                label: 'k.sessionDestroy(error)',
                                documentation: 'Destroy the current session (logout)',
                                parameters: [
                                    { label: 'error', documentation: 'Error callback function(error) {}' }
                                ]
                            },
                            'k.isSession': {
                                label: 'k.isSession(periodic, redir, interval)',
                                documentation: 'Check if a valid session exists',
                                parameters: [
                                    { label: 'periodic', documentation: 'Enable periodic checking (default: false)' },
                                    { label: 'redir', documentation: 'Redirect to login if no session (default: false)' },
                                    { label: 'interval', documentation: 'Check interval in milliseconds (default: 30000)' }
                                ]
                            },
                            'k.setCookie': {
                                label: 'k.setCookie(name, value, minutes, crossDomain)',
                                documentation: 'Set a browser cookie',
                                parameters: [
                                    { label: 'name', documentation: 'Cookie name' },
                                    { label: 'value', documentation: 'Cookie value' },
                                    { label: 'minutes', documentation: 'Expiration time in minutes (default: 60)' },
                                    { label: 'crossDomain', documentation: 'Allow cross-domain cookies (default: false)' }
                                ]
                            },
                            'k.alert': {
                                label: 'k.alert(title, message, callback, dismiss)',
                                documentation: 'Display a SweetAlert2 alert dialog',
                                parameters: [
                                    { label: 'title', documentation: 'Alert title' },
                                    { label: 'message', documentation: 'Alert message' },
                                    { label: 'callback', documentation: 'Callback when dismissed function() {}' },
                                    { label: 'dismiss', documentation: 'Allow dismissing (default: true)' }
                                ]
                            },
                            'k.confirm': {
                                label: 'k.confirm(title, message, callback, cancel)',
                                documentation: 'Display a SweetAlert2 confirmation dialog',
                                parameters: [
                                    { label: 'title', documentation: 'Confirmation title' },
                                    { label: 'message', documentation: 'Confirmation message' },
                                    { label: 'callback', documentation: 'Callback when confirmed function() {}' },
                                    { label: 'cancel', documentation: 'Callback when cancelled function() {}' }
                                ]
                            }
                        };

                        // Find which Kyte method is being called
                        let matchedMethod = null;
                        let parameterIndex = 0;

                        for (const method in signatures) {
                            const regex = new RegExp(method.replace('.', '\\.') + '\\s*\\(([^)]*)$');
                            const match = textUntilPosition.match(regex);
                            if (match) {
                                matchedMethod = method;
                                // Count commas to determine which parameter we're on
                                parameterIndex = (match[1].match(/,/g) || []).length;
                                break;
                            }
                        }

                        if (!matchedMethod) {
                            return null;
                        }

                        const sig = signatures[matchedMethod];
                        return {
                            value: {
                                signatures: [{
                                    label: sig.label,
                                    documentation: sig.documentation,
                                    parameters: sig.parameters
                                }],
                                activeSignature: 0,
                                activeParameter: parameterIndex
                            },
                            dispose: () => {}
                        };
                    }
                });

                console.log('✓ Custom Kyte API completion provider registered (no workers needed!)');
                console.log('✓ Signature help provider registered for parameter hints');
                console.log('✓ JavaScript editor ready with IntelliSense');
                console.log('TIP: Type "k." to see Kyte API methods, or press Ctrl+Space (Cmd+Space on Mac)');

                // Create CSS Editor
                cssEditor = monaco.editor.create(document.getElementById("cssEditor"), {
                    value: pageData.stylesheet,
                    theme: colorMode,
                    language: "css",
                    automaticLayout: true,
                    wordWrap: true,
                    // wordWrapColumn: 40,
                    // Set this to false to not auto word wrap minified files
                    wordWrapMinified: true,
                    // try "same", "indent" or "none"
                    wrappingIndent: 'indent'
                });

                htmlEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });
                jsEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });
                cssEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });

                initializeIFrame();

                let obj = {'model': 'KyteSite', 'idx':pageData.page.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request='+encoded+'#Pages');

                $("#page-title").html(pageData.page.title);
                $("#page-path").html(pageData.page.s3key);
                $(".viewPage").attr('href','https://'+(pageData.page.site.aliasDomain ? pageData.page.site.aliasDomain : pageData.page.site.cfDomain)+'/'+pageData.page.s3key);

                _ks.get('Navigation', 'site', pageData.page.site.id, [], function (r) {
                    let main_navigation = pageData.page.main_navigation ? pageData.page.main_navigation.id : 0;
                    r.data.forEach(function(data) {
                        $("#setting-main-navigation").append('<option value="' + data.id + '"' + (main_navigation == data.id ? ' selected' : '') + '>' + data.name + '</option>');
                    });
                });
                

                _ks.get('SideNav', 'site', pageData.page.site.id, [], function (r) {
                    let side_navigation = pageData.page.side_navigation ? pageData.page.side_navigation.id : 0;
                    r.data.forEach(function(data) {
                        $("#setting-side-navigation").append('<option value="' + data.id + '"' + (side_navigation == data.id ? ' selected' : '') + '>' + data.name + '</option>');
                    });
                });

                let KyteSectionTemplateCond = btoa(JSON.stringify([{ 'field': 'category', 'value': 'footer' }]));
                _ks.get('KyteSectionTemplate', 'site', pageData.page.site.id, [{ 'name': 'x-kyte-query-conditions', 'value': KyteSectionTemplateCond }], function (r) {
                    let section = pageData.page.footer ? pageData.page.footer.id : 0;
                    r.data.forEach(function(data) {
                        $("#setting-footer").append('<option value="' + data.id + '"' + (section == data.id ? ' selected' : '') + '>' + data.title + '</option>');
                    });
                });

                // page assignment table and form
                let hiddenScriptAssignment = [
                    {
                        'name': 'site',
                        'value': pageData.page.site.id
                    },
                    {
                        'name': 'page',
                        'value': pageData.page.id
                    }
                ];
                let fldsScripts = [
                    [
                        {
                            'field':'script',
                            'type':'select',
                            'label':'Script',
                            'required':false,
                            'option': {
                                'ajax': true,
                                'data_model_name': 'KyteScript',
                                'data_model_field': 'site',
                                'data_model_value': pageData.page.site.id,
                                'data_model_attributes': ['name', 's3key'],
                                'data_model_default_field': 'id',
                                // 'data_model_default_value': 1,
                            }
                        },
                    ],
                ];
                let colDefScripts = [
                    {'targets':0,'data':'script.name','label':'Script'},
                    {'targets':1,'data':'script.script_type','label':'Type', render: function(data, type, row, meta) { if (data == 'css') { return 'Stylesheet'; } else if (data == 'js') { return 'JavaScript'+(row.script.is_js_module ? ' (module)' : ''); } else { return 'Unknown'; } }},
                    {'targets':2,'data':'script.s3key','label':'path'},
                ];
                var tblScripts = new KyteTable(_ks, $("#scripts-table"), {'name':"KyteScriptAssignment",'field':"page",'value':pageData.page.id}, colDefScripts, true, [0,"asc"], false, true);
                tblScripts.init();
                var frmScript = new KyteForm(_ks, $("#modalFormScripts"), 'KyteScriptAssignment', hiddenScriptAssignment, fldsScripts, window.kyteI18n ? window.kyteI18n.t('ui.page_editor.modal_script.title_add') : 'Script Assignment', tblScripts, true, $("#addScript"));
                frmScript.init();
                tblScripts.bindEdit(frmScript);
                // global scripts
                let colDefScriptsGlobal = [
                    {'targets':0,'data':'script.name','label':'Script'},
                    {'targets':1,'data':'script.script_type','label':'Type', render: function(data, type, row, meta) { if (data == 'css') { return 'Stylesheet'; } else if (data == 'js') { return 'JavaScript'+(row.script.is_js_module ? ' (module)' : ''); } else { return 'Unknown'; } }},
                    {'targets':2,'data':'script.s3key','label':'path'},
                ];
                var tblGlobalScripts = new KyteTable(_ks, $("#global-scripts-table"), {'name':"KyteScriptGlobalAssignment",'field':"page",'value':pageData.page.id}, colDefScriptsGlobal, true, [0,"asc"], false, false);
                tblGlobalScripts.init();

                // Custom library assignment table and form
                let fldsLibraries = [
                    [
                        {
                            'field':'library',
                            'type':'select',
                            'label':'Library',
                            'required':false,
                            'option': {
                                'ajax': true,
                                'data_model_name': 'KyteLibrary',
                                'data_model_field': 'site',
                                'data_model_value': pageData.page.site.id,
                                'data_model_attributes': ['name', 'link'],
                                'data_model_default_field': 'id',
                                // 'data_model_default_value': 1,
                            }
                        },
                    ],
                ];
                let colDefLibraries = [
                    {'targets':0,'data':'library.name','label':'Script'},
                    {'targets':1,'data':'library.script_type','label':'Type', render: function(data, type, row, meta) { if (data == 'css') { return 'Stylesheet'; } else if (data == 'js') { return 'JavaScript'; } else { return 'Unknown'; } }},
                    {'targets':2,'data':'library.link','label':'path'},
                ];
                var tblLibraries = new KyteTable(_ks, $("#libraries-table"), {'name':"KyteLibraryAssignment",'field':"page",'value':pageData.page.id}, colDefLibraries, true, [0,"asc"], false, true);
                tblLibraries.init();
                var frmLibrary = new KyteForm(_ks, $("#modalFormLibraries"), 'KyteLibraryAssignment', hiddenScriptAssignment, fldsLibraries, window.kyteI18n ? window.kyteI18n.t('ui.page_editor.modal_library.title_add') : 'Library Assignment', tblLibraries, true, $("#addLibrary"));
                frmLibrary.init();
                tblLibraries.bindEdit(frmLibrary);
                // global libraries
                let colDefLibrariesGlobal = [
                    {'targets':0,'data':'library.name','label':'Script'},
                    {'targets':1,'data':'library.script_type','label':'Type', render: function(data, type, row, meta) { if (data == 'css') { return 'Stylesheet'; } else if (data == 'js') { return 'JavaScript'; } else { return 'Unknown'; } }},
                    {'targets':2,'data':'library.link','label':'path'},
                ];
                var tblGlobalLibraries = new KyteTable(_ks, $("#global-libraries-table"), {'name':"KyteLibraryGlobalAssignment",'field':"page",'value':pageData.page.id}, colDefLibrariesGlobal, true, [0,"asc"], false, false);
                tblGlobalLibraries.init();

                // web components assignment table and form
                let hiddenComponent = [
                    {
                        'name': 'page',
                        'value': pageData.page.id
                    }
                ];
                let fldsComponent = [
                    [
                        {
                            'field':'component',
                            'type':'select',
                            'label':'Web Component',
                            'required':false,
                            'option': {
                                'ajax': true,
                                'data_model_name': 'KyteWebComponent',
                                'data_model_field': 'application',
                                'data_model_value': pageData.page.site.application.id,
                                'data_model_attributes': ['name', 'identifier'],
                                'data_model_default_field': 'id',
                                // 'data_model_default_value': 1,
                            }
                        },
                    ],
                ];
                let colDefComponents = [
                    {'targets':0,'data':'component.name','label':'Web Component'},
                    {'targets':1,'data':'component.identifier','label':'Identifier'},
                    {'targets':2,'data':'component.description','label':'Description'},
                ];
                var tblComponents = new KyteTable(_ks, $("#components-table"), {'name':"KytePageWebComponent",'field':"page",'value':pageData.page.id}, colDefComponents, true, [0,"asc"], true, true);
                tblComponents.init();
                var frmComponent = new KyteForm(_ks, $("#modalFormComponent"), 'KytePageWebComponent', hiddenComponent, fldsComponent, window.kyteI18n ? window.kyteI18n.t('ui.page_editor.modal_component.title_add') : 'Web Component', tblComponents, true, $("#addComponent"));
                frmComponent.init();
                tblComponents.bindEdit(frmComponent);

                // Version History table
                const t = (key, fallback) => window.kyteI18n ? window.kyteI18n.t(key, fallback) : fallback;
                let colDefVersionHistory = [
                    {'targets': 0, 'data': 'version_number', 'label': t('ui.page_editor.version_table.column_version', 'Version')},
                    {'targets': 1, 'data': 'date_created', 'label': t('ui.page_editor.version_table.column_date', 'Date')},
                    {'targets': 2, 'data': 'change_summary', 'label': t('ui.page_editor.version_table.column_summary', 'Summary')},
                    {'targets': 3, 'data': 'created_by.name', 'label': t('ui.page_editor.version_table.column_author', 'Author'), render: function(data, type, row, meta) { return data ? data : ''; }},
                    {'targets': 4, 'data': 'can_revert', 'label': t('ui.page_editor.version_table.column_current', 'Current Version'), render: function(data, type, row, meta) {
                        const yesText = window.kyteI18n ? window.kyteI18n.t('ui.page_editor.version_table.yes', 'Yes') : 'Yes';
                        const noText = window.kyteI18n ? window.kyteI18n.t('ui.page_editor.version_table.no', 'No') : 'No';
                        return data == false ? `<i class="fas fa-check text-success"></i> ${yesText}` : `<i class="fas fa-times text-danger"></i> ${noText}`;
                    }},
                ];

                tblVersionHistory = new KyteTable(_ks, $("#version-history-table"), 
                    {'name': "KytePageVersion", 'field': "page", 'value': pageData.page.id}, 
                    colDefVersionHistory, 
                    true,
                    [1, "desc"], // sort by date descending
                    false,
                    false
                );
                tblVersionHistory.customActionButton = [
                    {
                        'className':'previewVersion',
                        'label': window.kyteI18n ? window.kyteI18n.t('ui.page_editor.version_table.button_preview', 'Preview') : 'Preview',
                        'faicon': 'fas fa-eye', // optional
                        'callback': function(data, model, row) {
                            previewVersion(data, _ks);
                        }
                    },
                    {
                        'className':'restoreVersion',
                        'label': window.kyteI18n ? window.kyteI18n.t('ui.page_editor.version_table.button_restore', 'Restore') : 'Restore',
                        'faicon': 'fas fa-undo', // optional
                        'callback': function(data, model, row) {
                            restoreVersion(data, _ks);
                        }
                    }
                ];
                tblVersionHistory.init();

                // Save handler
                $("#saveCode").on('click', function() {
                    if (hasActualChanges()) {
                        showChangeSummaryModal('save', savePageWithSummary);
                    } else {
                        showNotification('info', 'No changes to save', 'Page is already up to date');
                    }
                });

                // Publish handler  
                $("#publishPage").on('click', function() {
                    showChangeSummaryModal('publish', publishPageWithSummary);
                });
            } else {
                alert("ERROR");
            }
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }

    $("#downloadPage").click(function(e) {
        e.preventDefault();

        fetch(pageData.download_link).then(res => res.blob()).then(file => {
            const pathnameParts = pageData.page.s3key.split('/');
            const filenameWithExtension = pathnameParts[pathnameParts.length - 1];

            let tempUrl = URL.createObjectURL(file);
            const aTag = document.createElement("a");
            aTag.href = tempUrl;
            console.log(filenameWithExtension);
            aTag.download = filenameWithExtension;
            document.body.appendChild(aTag);
            aTag.click();
            URL.revokeObjectURL(tempUrl);
            aTag.remove();
        }).catch((e) => {
            alert("Failed to download file!"+e);
        });
    });

    $('.page-tab-link').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
    
        $('.page-tab-link').removeClass('active');
        $(this).addClass('active');
    
       $('.tab-page').addClass('d-none');
       let pageSelector = $(this).data('targetPage');
       $('#'+pageSelector).removeClass('d-none');
    });
});

window.onbeforeunload = function() {
    if (isDirty) {
        return "You have unsaved changes. Are you sure you want to leave?";
    }
};