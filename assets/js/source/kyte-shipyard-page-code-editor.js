import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

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
                                <h5 class="modal-title mb-1" style="color: #ffffff; font-weight: 600;">Version Preview</h5>
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
                            <h6 style="color: #ffffff; font-weight: 600; margin-bottom: 0.5rem;">Loading Version Content</h6>
                            <div style="color: #969696; font-size: 0.9rem;">Fetching version ${versionData.version_number} details...</div>
                            
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
                                    Retrieving content
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
                                    Processing data
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
                                    Rendering preview
                                </div>
                            </div>
                        </div>
                        
                        <!-- Main Content (initially hidden) -->
                        <div id="versionMainContent" style="height: 100%; display: none;">
                            <!-- Tab Navigation -->
                            <div class="preview-tabs d-flex border-bottom" style="background: #252526; border-color: #3e3e42 !important;">
                                <button class="preview-tab active" data-preview-target="html" style="padding: 1rem 2rem; background: none; border: none; color: #969696; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
                                    <i class="fab fa-html5 me-2" style="color: #e34c26;"></i>HTML
                                </button>
                                <button class="preview-tab" data-preview-target="css" style="padding: 1rem 2rem; background: none; border: none; color: #969696; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
                                    <i class="fab fa-css3-alt me-2" style="color: #1572b6;"></i>CSS
                                </button>
                                <button class="preview-tab" data-preview-target="javascript" style="padding: 1rem 2rem; background: none; border: none; color: #969696; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
                                    <i class="fab fa-js me-2" style="color: #f7df1e;"></i>JavaScript
                                </button>
                                <button class="preview-tab" data-preview-target="diff" style="padding: 1rem 2rem; background: none; border: none; color: #969696; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
                                    <i class="fas fa-code-branch me-2" style="color: #ff6b35;"></i>Changes
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
                                ${versionData.can_revert ? 'This version can be restored' : 'This is the current version'}
                            </div>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn" data-bs-dismiss="modal" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; transition: all 0.2s ease;">
                                    <i class="fas fa-times me-2"></i>Close
                                </button>
                                ${versionData.can_revert ? `
                                <button type="button" id="restoreVersionBtn" class="btn" style="background: linear-gradient(135deg, #238636, #2ea043); border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; transition: all 0.2s ease;">
                                    <i class="fas fa-undo me-2"></i>Restore This Version
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
            <h6 style="color: #f85149; font-weight: 600; margin-bottom: 0.5rem;">Loading Failed</h6>
            <div style="color: #969696; font-size: 0.9rem; margin-bottom: 2rem;">${message}</div>
            <button class="btn" onclick="$('#versionPreviewModal').modal('hide');" style="
                background: #3c3c3c;
                border: 1px solid #5a5a5a;
                color: #d4d4d4;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                font-weight: 500;
            ">
                <i class="fas fa-times me-2"></i>Close
            </button>
        </div>
    `);
}

function populateVersionContent(versionContent, versionData, _ks) {
    const tabContent = `
        <!-- HTML Content -->
        <div class="preview-content active" id="preview-html" style="height: 100%; display: flex; flex-direction: column;">
            <div class="content-header p-3" style="background: #252526; border-bottom: 1px solid #3e3e42; flex-shrink: 0;">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0" style="color: #ffffff; font-weight: 600;">HTML Content</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm copy-content" data-content-type="html" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-copy me-1"></i>Copy
                        </button>
                        <button class="btn btn-sm format-content" data-content-type="html" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-code me-1"></i>Format
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
                    <h6 class="mb-0" style="color: #ffffff; font-weight: 600;">CSS Content</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm copy-content" data-content-type="css" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-copy me-1"></i>Copy
                        </button>
                        <button class="btn btn-sm format-content" data-content-type="css" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-code me-1"></i>Format
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
                    <h6 class="mb-0" style="color: #ffffff; font-weight: 600;">JavaScript Content</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm copy-content" data-content-type="javascript" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-copy me-1"></i>Copy
                        </button>
                        <button class="btn btn-sm format-content" data-content-type="javascript" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-code me-1"></i>Format
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
                <h6 class="mb-0" style="color: #ffffff; font-weight: 600;">Changes Summary</h6>
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
            btn.html('<i class="fas fa-check me-1"></i>Copied!');
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
    // Add modal HTML to the page if it doesn't exist
    if (!document.getElementById('changeSummaryModal')) {
        const modalHTML = `
            <div class="modal fade" id="changeSummaryModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog">
                    <div class="modal-content" style="background: #2d2d30; border: 1px solid #3e3e42; color: #d4d4d4;">
                        <div class="modal-header" style="background: #252526; border-bottom: 1px solid #3e3e42;">
                            <h5 class="modal-title" style="color: #ffffff; font-weight: 600;">
                                <i class="fas fa-edit me-2"></i>
                                Add Change Summary
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="actionTypeBadge" class="mb-3" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                                <i class="fas fa-save"></i>
                                <span>Saving Changes</span>
                            </div>
                            
                            <div class="mb-3">
                                <label for="changeSummaryInput" class="form-label" style="color: #cccccc; font-weight: 500;">
                                    What changed in this version?
                                </label>
                                <textarea 
                                    class="form-control" 
                                    id="changeSummaryInput" 
                                    rows="3" 
                                    placeholder="Briefly describe your changes (optional)..."
                                    maxlength="500"
                                    style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; border-radius: 6px;"
                                ></textarea>
                                <div style="color: #969696; font-size: 0.85rem; margin-top: 0.5rem;">
                                    Leave empty to use default summary. <code style="background: #252526; padding: 0.2rem 0.4rem; border-radius: 4px; color: #ff6b35;">Ctrl+Enter</code> to save quickly.
                                    <br><small style="color: #666666;">Note: No version will be created if no changes are detected.</small>
                                </div>
                            </div>
                            
                            <div>
                                <label class="form-label" style="color: #cccccc; font-weight: 500;">Quick Options</label>
                                <div class="quick-options" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                                    <span class="quick-option" onclick="setSummary('Fixed styling issues')">Fixed styling issues</span>
                                    <span class="quick-option" onclick="setSummary('Updated content')">Updated content</span>
                                    <span class="quick-option" onclick="setSummary('Added new features')">Added new features</span>
                                    <span class="quick-option" onclick="setSummary('Bug fixes')">Bug fixes</span>
                                    <span class="quick-option" onclick="setSummary('Performance improvements')">Performance improvements</span>
                                    <span class="quick-option" onclick="setSummary('Code refactoring')">Code refactoring</span>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer" style="background: #2d2d30; border-top: 1px solid #3e3e42;">
                            <button type="button" class="btn-editor btn-editor-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                            <button type="button" class="btn-editor btn-editor-secondary" onclick="window.proceedWithAction('')">
                                <i class="fas fa-forward"></i>
                                Skip Summary
                            </button>
                            <button type="button" id="confirmActionBtn" class="btn-editor btn-editor-primary" onclick="window.proceedWithAction()">
                                <i class="fas fa-save"></i>
                                Save with Summary
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
    
    const badge = document.getElementById('actionTypeBadge');
    const confirmBtn = document.getElementById('confirmActionBtn');
    
    if (action === 'save') {
        badge.innerHTML = '<i class="fas fa-save"></i><span>Saving Changes</span>';
        badge.className = 'action-type-badge action-type-save mb-3';
        confirmBtn.innerHTML = '<i class="fas fa-save"></i>Save with Summary';
        confirmBtn.className = 'btn-editor btn-editor-success';
    } else {
        badge.innerHTML = '<i class="fas fa-upload"></i><span>Publishing Page</span>';
        badge.className = 'action-type-badge action-type-publish mb-3';
        confirmBtn.innerHTML = '<i class="fas fa-upload"></i>Publish with Summary';
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

document.addEventListener('KyteInitialized', function(e) {
    _ks = e.detail._ks;

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

                htmlEditor = monaco.editor.create(document.getElementById("htmlEditor"), {
                    value: pageData.html,
                    theme: colorMode,
                    language: "html",
                    automaticLayout: true,
                    wordWrap: true,
                    // wordWrapColumn: 40,
                    // Set this to false to not auto word wrap minified files
                    wordWrapMinified: true,
                    // try "same", "indent" or "none"
                    wrappingIndent: 'indent'
                });

                jsEditor = monaco.editor.create(document.getElementById("jsEditor"), {
                    value: pageData.javascript,
                    theme: colorMode,
                    language: "javascript",
                    automaticLayout: true,
                    wordWrap: true,
                    // wordWrapColumn: 40,
                    // Set this to false to not auto word wrap minified files
                    wordWrapMinified: true,
                    // try "same", "indent" or "none"
                    wrappingIndent: 'indent'
                });

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
                var frmScript = new KyteForm(_ks, $("#modalFormScripts"), 'KyteScriptAssignment', hiddenScriptAssignment, fldsScripts, 'Script Assignment', tblScripts, true, $("#addScript"));
                frmScript.init();
                tblScripts.bindEdit(frmScript);
                // global scripts
                var tblGlobalScripts = new KyteTable(_ks, $("#global-scripts-table"), {'name':"KyteScriptGlobalAssignment",'field':"page",'value':pageData.page.id}, colDefScripts, true, [0,"asc"], false, false);
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
                var frmLibrary = new KyteForm(_ks, $("#modalFormLibraries"), 'KyteLibraryAssignment', hiddenScriptAssignment, fldsLibraries, 'Script Assignment', tblLibraries, true, $("#addLibrary"));
                frmLibrary.init();
                tblLibraries.bindEdit(frmLibrary);
                // global libraries
                var tblGlobalLibraries = new KyteTable(_ks, $("#global-libraries-table"), {'name':"KyteLibraryGlobalAssignment",'field':"page",'value':pageData.page.id}, colDefLibraries, true, [0,"asc"], false, false);
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
                var frmComponent = new KyteForm(_ks, $("#modalFormComponent"), 'KytePageWebComponent', hiddenComponent, fldsComponent, 'Web Component', tblComponents, true, $("#addComponent"));
                frmComponent.init();
                tblComponents.bindEdit(frmComponent);

                // Version History table
                let colDefVersionHistory = [
                    {'targets': 0, 'data': 'version_number', 'label': 'Version'},
                    {'targets': 1, 'data': 'date_created', 'label': 'Date'},
                    {'targets': 2, 'data': 'change_summary', 'label': 'Summary'},
                    {'targets': 3, 'data': 'created_by.name', 'label': 'Author', render: function(data, type, row, meta) { return data ? data : ''; }},
                    {'targets': 4, 'data': 'can_revert', 'label': 'Current Version', render: function(data, type, row, meta) { return data == false ? '<i class="fas fa-check text-success"></i> Yes' : '<i class="fas fa-times text-danger"></i> No'; }},
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
                        'label':'Preview',
                        'faicon': 'fas fa-eye', // optional
                        'callback': function(data, model, row) {
                            previewVersion(data, _ks);
                        }
                    },
                    {
                        'className':'restoreVersion',
                        'label':'Restore',
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