import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

var _ks; // Kyte SDK instance
var scriptEditor;
var script;
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
    if (scriptEditor) {
        scriptEditor.setTheme(colorMode);
    }
});

// Check if there are actual changes
function hasActualChanges() {
    if (!script || !scriptEditor) return false;
    
    const currentContent = scriptEditor.getValue();
    const currentName = $("#setting-script-name").val();
    const currentIncludeAll = $("#setting-include-all").val();
    const currentDescription = $("#setting-script-description").val();
    const currentObfuscate = parseInt($("#setting-obfuscatejs").val()) || 0;
    const currentModule = parseInt($("#setting-jsmodule").val()) || 0;
    
    return (
        currentContent !== script.content ||
        currentName !== script.name ||
        currentIncludeAll !== script.include_all ||
        currentDescription !== script.description ||
        currentObfuscate !== (script.obfuscate_js || 0) ||
        currentModule !== (script.is_js_module || 0)
    );
}

// Key bindings for saving
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
                saveScriptWithSummary('Manual save');
            } else {
                showNotification('info', 'No changes detected', 'Script is already up to date');
            }
        } else {
            // Normal Ctrl+S - check for changes first
            if (hasActualChanges()) {
                showChangeSummaryModal('save', saveScriptWithSummary);
            } else {
                showNotification('info', 'No changes to save', 'Script is already up to date');
            }
        }
    }

    // Ctrl+P or Cmd+P to publish
    if (isCtrlPressed && isPPressed) {
        event.preventDefault();
        if (isShiftOrAltPressed) {
            publishScriptWithSummary('Manual publish');
        } else {
            showChangeSummaryModal('publish', publishScriptWithSummary);
        }
    }

    // Ctrl+1, Ctrl+2, Ctrl+3, Ctrl+4 for tab switching
    if (event.ctrlKey || event.metaKey) {
        const tabMap = {
            '1': 'Content',
            '2': 'Pages', 
            '3': 'History',
            '4': 'Settings'
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
                                    <span class="quick-option" onclick="setSummary('Bug fixes')">Bug fixes</span>
                                    <span class="quick-option" onclick="setSummary('Feature updates')">Feature updates</span>
                                    <span class="quick-option" onclick="setSummary('Performance improvements')">Performance improvements</span>
                                    <span class="quick-option" onclick="setSummary('Code refactoring')">Code refactoring</span>
                                    <span class="quick-option" onclick="setSummary('Documentation updates')">Documentation updates</span>
                                    <span class="quick-option" onclick="setSummary('Style improvements')">Style improvements</span>
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
        badge.innerHTML = '<i class="fas fa-upload"></i><span>Publishing Script</span>';
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
                                <h5 class="modal-title mb-1" style="color: #ffffff; font-weight: 600;">Script Version Preview</h5>
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
                        </div>
                        
                        <!-- Main Content (initially hidden) -->
                        <div id="versionMainContent" style="height: 100%; display: none;">
                            <!-- Tab Navigation -->
                            <div class="preview-tabs d-flex border-bottom" style="background: #252526; border-color: #3e3e42 !important;">
                                <button class="preview-tab active" data-preview-target="content" style="padding: 1rem 2rem; background: none; border: none; color: #969696; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
                                    <i class="${script.script_type === 'js' ? 'fab fa-js' : 'fab fa-css3-alt'} me-2" style="color: ${script.script_type === 'js' ? '#f7df1e' : '#1572b6'};"></i>${script.script_type === 'js' ? 'JavaScript' : 'CSS'}
                                </button>
                                <button class="preview-tab" data-preview-target="changes" style="padding: 1rem 2rem; background: none; border: none; color: #969696; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.2s ease; font-weight: 500;">
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
    
    // Start the actual API call
    _ks.get("KyteScriptVersionContent", "content_hash", versionData['content_hash'], [], function(r) {
        if (r.data[0]) {
            let versionContent = r.data[0];
            
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
        <!-- Script Content -->
        <div class="preview-content active" id="preview-content" style="height: 100%; display: flex; flex-direction: column;">
            <div class="content-header p-3" style="background: #252526; border-bottom: 1px solid #3e3e42; flex-shrink: 0;">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0" style="color: #ffffff; font-weight: 600;">${script.script_type === 'js' ? 'JavaScript' : 'CSS'} Content</h6>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm copy-content" data-content-type="content" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-copy me-1"></i>Copy
                        </button>
                        <button class="btn btn-sm format-content" data-content-type="content" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                            <i class="fas fa-code me-1"></i>Format
                        </button>
                    </div>
                </div>
            </div>
            <div class="code-container" style="flex: 1; overflow: auto; font-family: 'JetBrains Mono', monospace; background: #1e1e1e;">
                <pre style="margin: 0; padding: 2rem; color: #d4d4d4; line-height: 1.6; white-space: pre-wrap; word-break: break-word;"><code id="content-code" class="language-${script.script_type === 'js' ? 'javascript' : 'css'}">${escapeHtml(versionContent.content)}</code></pre>
            </div>
        </div>
        
        <!-- Changes/Diff Content -->
        <div class="preview-content" id="preview-changes" style="height: 100%; display: none; flex-direction: column;">
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
                        <div class="col-md-6">
                            <div class="stat-card p-3 rounded" style="background: #252526; border: 1px solid #3e3e42; text-align: center;">
                                <div class="stat-value" style="font-size: 1.5rem; font-weight: 600; color: ${script.script_type === 'js' ? '#f7df1e' : '#1572b6'};">${(versionContent.content || '').split('\n').length}</div>
                                <div class="stat-label" style="color: #969696; font-size: 0.85rem;">${script.script_type === 'js' ? 'JavaScript' : 'CSS'} Lines</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="stat-card p-3 rounded" style="background: #252526; border: 1px solid #3e3e42; text-align: center;">
                                <div class="stat-value" style="font-size: 1.5rem; font-weight: 600; color: #969696;">${(versionContent.content || '').length}</div>
                                <div class="stat-label" style="color: #969696; font-size: 0.85rem;">Characters</div>
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
        const content = versionContent.content;
        
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
        const codeElement = $('#content-code');
        let content = codeElement.text();
        
        if (script.script_type === 'js') {
            content = content.replace(/;/g, ';\n').replace(/{/g, '{\n').replace(/}/g, '\n}\n');
        } else if (script.script_type === 'css') {
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

// Restore version functionality
function restoreVersion(versionData, _ks) {
    if (versionData.can_revert != true) {
        alert("This is already the current version.");
        return;
    }

    if (!confirm("Are you sure you want to restore this version? Current unsaved changes will be lost.")) {
        return;
    }

    $('#pageLoaderModal').modal('show');
    
    // Get version content
    _ks.get("KyteScriptVersionContent", "content_hash", versionData['content_hash'], [], function(r) {
        if (!r.data[0]) {
            alert("Error: Could not retrieve version content.");
            $('#pageLoaderModal').modal('hide');
            return;
        }
        
        const versionContent = r.data[0];
        
        try {
            // Update Monaco editor with restored content
            scriptEditor.setValue(versionContent.content || '');
            
            // Create change summary for the restore operation
            const changeSummary = `Restored to version ${versionData.version_number} (${versionData.change_summary || 'No summary'})`;
            
            // Save the restored version
            saveScriptWithSummary(changeSummary);
            
        } catch (error) {
            alert("Error updating editor: " + error.message);
            console.error(error);
            $('#pageLoaderModal').modal('hide');
        }
        
    }, function(err) {
        alert("Error fetching version content: " + err);
        console.error(err);
        $('#pageLoaderModal').modal('hide');
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

// Helper function to sync script object with current editor/form state
function syncScriptWithCurrentState() {
    script.content = scriptEditor.getValue();
    script.name = $("#setting-script-name").val();
    script.include_all = $("#setting-include-all").val();
    script.description = $("#setting-script-description").val();
    script.obfuscate_js = parseInt($("#setting-obfuscatejs").val());
    script.is_js_module = parseInt($("#setting-jsmodule").val());
}

// Navigation functionality
document.querySelectorAll('[data-target]').forEach(button => {
    button.addEventListener('click', function() {
        const target = this.dataset.target;
        
        // Update active nav item
        document.querySelectorAll('[data-target]').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding content
        document.querySelectorAll('.editor-container, .secondary-content').forEach(container => {
            container.classList.remove('active');
        });
        document.getElementById(target).classList.add('active');
        
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

// Show notification function
function showNotification(type, message, summary) {
    const toastHtml = `
        <div class="toast align-items-center border-0 show" style="background: ${type === 'success' ? '#238636' : type === 'info' ? '#0969da' : '#f85149'}; color: white; position: fixed; top: 2rem; right: 2rem; z-index: 9999;">
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

// Save function that uses the modal
function saveScriptWithSummary(changeSummary) {
    $('#pageLoaderModal').modal('show');
    
    try {
        let obfuscatedJS = script.script_type == 'js' ? JavaScriptObfuscator.obfuscate(scriptEditor.getValue(), {
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
        }).getObfuscatedCode() : '';

        let payload = {
            'change_summary': changeSummary,
            'content': scriptEditor.getValue(),
            'content_js_obfuscated': obfuscatedJS,
            'name': $("#setting-script-name").val(),
            'include_all': $("#setting-include-all").val(),
            'description': $("#setting-script-description").val(),
            'obfuscate_js': $("#setting-obfuscatejs").val(),
            'is_js_module': $("#setting-jsmodule").val(),
        };

        _ks.put('KyteScript', 'id', script.id, payload, null, [], function(r) {
            $('#pageLoaderModal').modal('hide');
            isDirty = false;
            
            // Update script object to reflect current saved state
            syncScriptWithCurrentState();

            if (tblVersionHistory && tblVersionHistory.table) {
                tblVersionHistory.table.ajax.reload();
            }
            
            showNotification('success', 'Script saved successfully!', changeSummary);
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

// Publish function that uses the modal
function publishScriptWithSummary(changeSummary) {
    $('#pageLoaderModal').modal('show');

    try {
        let obfuscatedJS = script.script_type == 'js' ? JavaScriptObfuscator.obfuscate(scriptEditor.getValue(), {
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
        }).getObfuscatedCode() : '';

        let payload = {
            'change_summary': changeSummary,
            'content': scriptEditor.getValue(),
            'content_js_obfuscated': obfuscatedJS,
            'name': $("#setting-script-name").val(),
            'include_all': $("#setting-include-all").val(),
            'description': $("#setting-script-description").val(),
            'obfuscate_js': $("#setting-obfuscatejs").val(),
            'is_js_module': $("#setting-jsmodule").val(),
            'state': 1,
        };

        _ks.put('KyteScript', 'id', script.id, payload, null, [], function(r) {
            $('#pageLoaderModal').modal('hide');
            isDirty = false;
            
            // Update script object to reflect current saved state
            syncScriptWithCurrentState();

            if (tblVersionHistory && tblVersionHistory.table) {
                tblVersionHistory.table.ajax.reload();
            }
            
            showNotification('success', 'Script published successfully!', changeSummary);
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

document.addEventListener('KyteInitialized', function(e) {
    _ks = e.detail._ks;

    $('#pageLoaderModal').modal('show');

    initializeChangeSummaryModal();

    if (_ks.isSession()) {
        // Get URL param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        _ks.get("KyteScript", "id", idx, [], function(r) {
            if (r.data[0]) {
                script = r.data[0];

                // Display script title in window
                document.title = document.title + " - " + script.name;
                
                // Set script info in header
                $("#script-name").html(script.name);
                $("#script-type").html(script.script_type === 'js' ? 'JavaScript' : 'CSS');
                
                // Set form values
                $("#setting-script-name").val(script.name);
                $("#setting-include-all").val(script.include_all);
                $("#setting-script-description").val(script.description);
                
                if (script.script_type == 'js') {
                    $("#setting-obfuscatejs").val(script.obfuscate_js || 0);
                    $('#obfuscatejs-option-wrapper').removeClass('d-none');
                    
                    $("#setting-jsmodule").val(script.is_js_module || 0);
                    $("#jsmodule-option-wrapper").removeClass('d-none');
                }

                // Create Monaco editor
                scriptEditor = monaco.editor.create(document.getElementById("scriptEditor"), {
                    value: script.content,
                    theme: colorMode,
                    language: script.script_type == 'js' ? 'javascript' : 'css',
                    automaticLayout: true,
                    wordWrap: true,
                    wordWrapMinified: true,
                    wrappingIndent: 'indent'
                });

                scriptEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });

                // Set up back to site link
                let obj = {'model': 'KyteSite', 'idx': script.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request=' + encoded + '#Scripts');

                // Page assignment table and form
                let hiddenScriptAssignment = [
                    {
                        'name': 'site',
                        'value': script.site.id
                    },
                    {
                        'name': 'script',
                        'value': idx
                    }
                ];
                
                let fldsPages = [
                    [
                        {
                            'field': 'page',
                            'type': 'select',
                            'label': 'Page',
                            'required': false,
                            'option': {
                                'ajax': true,
                                'data_model_name': 'KytePage',
                                'data_model_field': 'site',
                                'data_model_value': script.site.id,
                                'data_model_attributes': ['title', 's3key'],
                                'data_model_default_field': 'id',
                            }
                        },
                    ],
                ];
                
                let colDefPages = [
                    {'targets': 0, 'data': 'page.title', 'label': 'Page'},
                    {'targets': 1, 'data': 'page.s3key', 'label': 'Path'},
                ];
                
                var tblPages = new KyteTable(_ks, $("#pages-table"), 
                    {'name': "KyteScriptAssignment", 'field': "script", 'value': idx}, 
                    colDefPages, true, [0, "asc"], false, true);
                tblPages.init();
                
                var frmPages = new KyteForm(_ks, $("#modalFormPages"), 'KyteScriptAssignment', 
                    hiddenScriptAssignment, fldsPages, 'Script Assignment', tblPages, true, $("#addPage"));
                frmPages.init();
                tblPages.bindEdit(frmPages);

                // Version History table
                let colDefVersionHistory = [
                    {'targets': 0, 'data': 'version_number', 'label': 'Version'},
                    {'targets': 1, 'data': 'date_created', 'label': 'Date'},
                    {'targets': 2, 'data': 'change_summary', 'label': 'Summary'},
                    {'targets': 3, 'data': 'created_by.name', 'label': 'Author', render: function(data, type, row, meta) { return data ? data : ''; }},
                    {'targets': 4, 'data': 'can_revert', 'label': 'Current Version', render: function(data, type, row, meta) { return data == false ? '<i class="fas fa-check text-success"></i> Yes' : '<i class="fas fa-times text-danger"></i> No'; }},
                ];

                tblVersionHistory = new KyteTable(_ks, $("#version-history-table"), 
                    {'name': "KyteScriptVersion", 'field': "script", 'value': idx}, 
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
                        'faicon': 'fas fa-eye',
                        'callback': function(data, model, row) {
                            previewVersion(data, _ks);
                        }
                    },
                    {
                        'className':'restoreVersion',
                        'label':'Restore',
                        'faicon': 'fas fa-undo',
                        'callback': function(data, model, row) {
                            restoreVersion(data, _ks);
                        }
                    }
                ];
                tblVersionHistory.init();

                // Bind save and publish handlers with change summary modals
                $("#saveCode").off('click').on('click', function() {
                    if (hasActualChanges()) {
                        showChangeSummaryModal('save', saveScriptWithSummary);
                    } else {
                        showNotification('info', 'No changes to save', 'Script is already up to date');
                    }
                });

                $("#publishPage").off('click').on('click', function() {
                    showChangeSummaryModal('publish', publishScriptWithSummary);
                });

                // Bind download handler
                $("#downloadPage").off('click').on('click', function(e) {
                    e.preventDefault();
                    
                    if (script.download_link) {
                        fetch(script.download_link).then(res => res.blob()).then(file => {
                            const filename = script.name + (script.script_type === 'js' ? '.js' : '.css');
                            
                            let tempUrl = URL.createObjectURL(file);
                            const aTag = document.createElement("a");
                            aTag.href = tempUrl;
                            aTag.download = filename;
                            document.body.appendChild(aTag);
                            aTag.click();
                            URL.revokeObjectURL(tempUrl);
                            aTag.remove();
                        }).catch((e) => {
                            alert("Failed to download file! " + e);
                        });
                    } else {
                        // Fallback: create file from current content
                        const content = scriptEditor.getValue();
                        const filename = script.name + (script.script_type === 'js' ? '.js' : '.css');
                        const blob = new Blob([content], { type: 'text/plain' });
                        
                        const tempUrl = URL.createObjectURL(blob);
                        const aTag = document.createElement("a");
                        aTag.href = tempUrl;
                        aTag.download = filename;
                        document.body.appendChild(aTag);
                        aTag.click();
                        URL.revokeObjectURL(tempUrl);
                        aTag.remove();
                    }
                });

                // Form change handlers to mark as dirty
                $("#setting-script-name, #setting-script-description, #setting-include-all, #setting-obfuscatejs, #setting-jsmodule").on('change input', function() {
                    isDirty = true;
                });

            } else {
                alert("ERROR: Script not found");
            }
            $('#pageLoaderModal').modal('hide');
        }, function(err) {
            alert("ERROR: " + err);
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href = "/?redir=" + encodeURIComponent(window.location);
    }
});

// Warn user about unsaved changes
window.onbeforeunload = function() {
    if (isDirty) {
        return "You have unsaved changes. Are you sure you want to leave?";
    }
};