// Enhanced kyte-shipyard-function-details.js with Version Control
import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';
import {registerPHPSnippetLanguage} from '/assets/js/packages/php-snippet/registerPHPSnippetLanguage.js';
import {registerKytePhpIntelliSense} from '/assets/js/kyte-php-intellisense.js';

var editor;
var tblVersionHistory;

// Global variables for change summary functionality
let pendingActionCallback = null;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    if (editor) {
        editor.setTheme(colorMode);
    }
});

// Initialize change summary modal
function initializeChangeSummaryModal() {
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
                            <div id="actionTypeBadge" class="mb-3" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; background: linear-gradient(135deg, #fb8500, #e76f00); color: white;">
                                <i class="fas fa-save"></i>
                                <span>Saving Changes</span>
                            </div>
                            
                            <div class="mb-3">
                                <label for="changeSummaryInput" class="form-label" style="color: #cccccc; font-weight: 500;">
                                    What changed in this function?
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
                                </div>
                            </div>
                            
                            <div>
                                <label class="form-label" style="color: #cccccc; font-weight: 500;">Quick Options</label>
                                <div class="quick-options" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                                    <span class="quick-option" onclick="setSummary('Fixed function logic')">Fixed function logic</span>
                                    <span class="quick-option" onclick="setSummary('Updated parameters')">Updated parameters</span>
                                    <span class="quick-option" onclick="setSummary('Added error handling')">Added error handling</span>
                                    <span class="quick-option" onclick="setSummary('Performance improvements')">Performance improvements</span>
                                    <span class="quick-option" onclick="setSummary('Code refactoring')">Code refactoring</span>
                                    <span class="quick-option" onclick="setSummary('Bug fixes')">Bug fixes</span>
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

// Version preview function
function previewVersion(versionData, _ks) {
    // Get i18n helper
    const t = (key, fallback) => window.kyteI18n ? window.kyteI18n.t(key) : fallback;

    const previewContent = `
        <div class="modal fade" id="versionPreviewModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content" style="background: #1e1e1e; color: #d4d4d4; border: 1px solid #3e3e42;">
                    <div class="modal-header" style="background: #2d2d30; border-bottom: 1px solid #3e3e42; padding: 1.5rem;">
                        <div class="d-flex align-items-center gap-3">
                            <div class="version-badge px-3 py-2 rounded" style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; font-weight: 600; font-size: 0.9rem;">
                                <span data-i18n="ui.function_editor.version_modal.version_label">${t('ui.function_editor.version_modal.version_label', 'Version')}</span> ${versionData.version_number}
                            </div>
                            <div>
                                <h5 class="modal-title mb-1" style="color: #ffffff; font-weight: 600;" data-i18n="ui.function_editor.version_modal.title">${t('ui.function_editor.version_modal.title', 'Function Version Preview')}</h5>
                                <div class="text-muted" style="font-size: 0.85rem;">
                                    ${new Date(versionData.date_created).toLocaleString()} • ${versionData.created_by?.name || 'Unknown'}
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-0" style="height: calc(100vh - 200px);">
                        <div class="d-flex flex-column h-100">
                            <div class="content-header p-3" style="background: #252526; border-bottom: 1px solid #3e3e42; flex-shrink: 0;">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0" style="color: #ffffff; font-weight: 600;" data-i18n="ui.function_editor.version_modal.php_code">${t('ui.function_editor.version_modal.php_code', 'PHP Code')}</h6>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-sm copy-content" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.375rem 0.75rem; border-radius: 4px; font-size: 0.8rem;">
                                            <i class="fas fa-copy me-1"></i><span data-i18n="ui.function_editor.version_modal.copy_button">${t('ui.function_editor.version_modal.copy_button', 'Copy')}</span>
                                        </button>
                                    </div>
                                </div>
                                ${versionData.change_summary ? `
                                <div class="mt-2 p-2 rounded" style="background: #2d2d30; border: 1px solid #3e3e42;">
                                    <small style="color: #969696;" data-i18n="ui.function_editor.version_modal.change_summary">${t('ui.function_editor.version_modal.change_summary', 'Change Summary:')}</small>
                                    <div style="color: #d4d4d4; font-size: 0.9rem;">${versionData.change_summary}</div>
                                </div>
                                ` : ''}
                            </div>
                            <div class="code-container" style="flex: 1; overflow: auto; font-family: 'JetBrains Mono', monospace; background: #1e1e1e;">
                                <pre style="margin: 0; padding: 2rem; color: #d4d4d4; line-height: 1.6; white-space: pre-wrap; word-break: break-word;"><code id="version-code-content" class="language-php">${escapeHtml(versionData.code || '')}</code></pre>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="background: #2d2d30; border-top: 1px solid #3e3e42; padding: 1.5rem; gap: 1rem;">
                        <div class="d-flex w-100 justify-content-between align-items-center">
                            <div class="version-info" style="color: #969696; font-size: 0.85rem;">
                                <i class="fas fa-info-circle me-1"></i>
                                <span data-i18n="${versionData.can_revert ? 'ui.function_editor.version_modal.can_restore' : 'ui.function_editor.version_modal.current_version'}">${versionData.can_revert ? t('ui.function_editor.version_modal.can_restore', 'This version can be restored') : t('ui.function_editor.version_modal.current_version', 'This is the current version')}</span>
                            </div>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn" data-bs-dismiss="modal" style="background: #3c3c3c; border: 1px solid #5a5a5a; color: #d4d4d4; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500;">
                                    <i class="fas fa-times me-2"></i><span data-i18n="ui.function_editor.version_modal.close_button">${t('ui.function_editor.version_modal.close_button', 'Close')}</span>
                                </button>
                                ${versionData.can_revert ? `
                                <button type="button" id="restoreVersionBtn" class="btn" style="background: linear-gradient(135deg, #238636, #2ea043); border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500;">
                                    <i class="fas fa-undo me-2"></i><span data-i18n="ui.function_editor.version_modal.restore_button">${t('ui.function_editor.version_modal.restore_button', 'Restore This Version')}</span>
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

    // Add modal to body and show
    $('body').append(previewContent);

    // Translate the modal content
    if (window.kyteI18n) {
        window.kyteI18n.translateDOM(document.getElementById('versionPreviewModal'));
    }

    // Bind events
    $('#versionPreviewModal .copy-content').on('click', function() {
        const content = versionData.code || '';
        navigator.clipboard.writeText(content).then(() => {
            const btn = $(this);
            const originalHtml = btn.html();
            btn.html('<i class="fas fa-check me-1"></i>' + (window.kyteI18n ? window.kyteI18n.t('ui.function_editor.version_modal.copied', 'Copied!') : 'Copied!'));
            btn.css('background', '#238636');

            setTimeout(() => {
                btn.html(originalHtml);
                btn.css('background', '#3c3c3c');
            }, 2000);
        });
    });

    // Restore functionality
    $('#restoreVersionBtn').on('click', function() {
        restoreVersion(versionData, _ks);
        $('#versionPreviewModal').modal('hide');
    });

    $('#versionPreviewModal').modal('show');
}

function restoreVersion(versionData, _ks) {
    if (versionData.can_revert !== true) {
        alert("This is already the current version.");
        return;
    }

    if (!confirm("Are you sure you want to restore this version? Current unsaved changes will be lost.")) {
        return;
    }

    $('#pageLoaderModal').modal('show');
    
    // Get version content
    _ks.get("KyteFunctionVersionContent", "content_hash", versionData.content_hash, [], function(r) {
        if (!r.data[0]) {
            alert("Error: Could not retrieve version content.");
            $('#pageLoaderModal').modal('hide');
            return;
        }
        
        const versionContent = r.data[0];
        
        // Update editor with restored content
        if (editor) {
            editor.setValue(versionContent.code || '');
        }
        
        // Create restore summary
        const changeSummary = `Restored to version ${versionData.version_number} (${versionData.change_summary || 'No summary'})`;
        
        // Save the restored function
        saveFunctionWithSummary(changeSummary);
        
    }, function(err) {
        alert("Error fetching version content: " + err);
        console.error(err);
        $('#pageLoaderModal').modal('hide');
    });
}

function escapeHtml(text) {
    if (typeof text !== 'string') {
        return ''; // or throw an error, or convert to string
    }
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Show change summary modal
function showChangeSummaryModal(callback) {
    pendingActionCallback = callback;
    
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
    
    // Hide modal immediately
    const modalElement = document.getElementById('changeSummaryModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
    
    // Execute the callback with the summary
    if (pendingActionCallback) {
        const finalSummary = summary || 'Manual save';
        pendingActionCallback(finalSummary);
        pendingActionCallback = null;
    }
}

window.proceedWithAction = proceedWithAction;

// Save function that uses the modal
function saveFunctionWithSummary(changeSummary) {
    if (!window.KyteFunctionListManager || !window.KyteFunctionListManager.getCurrentFunctionId()) {
        alert("No function selected");
        return;
    }
    
    $('#pageLoaderModal').modal('show');
    
    try {
        const functionId = window.KyteFunctionListManager.getCurrentFunctionId();
        const code = editor ? editor.getValue() : '';
        
        let payload = {
            'change_summary': changeSummary,
            'code': code
        };
        
        window.KyteFunctionListManager._ks.put('Function', 'id', functionId, payload, null, [], function(r) {
            $('#pageLoaderModal').modal('hide');
            
            window.KyteFunctionListManager.isDirty = false;
            
            // Refresh version history table if visible
            if (tblVersionHistory && tblVersionHistory.table) {
                tblVersionHistory.table.ajax.reload();
            }
            
            // Show success notification
            showNotification('success', 'Function saved successfully!', changeSummary);
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

// Check for actual changes
function hasActualChanges() {
    if (!window.KyteFunctionListManager || !window.KyteFunctionListManager.currentFunction || !editor) {
        return false;
    }
    
    const currentCode = editor.getValue();
    const originalCode = window.KyteFunctionListManager.currentFunction.code || '';
    
    return currentCode !== originalCode;
}

// key bindings for saving
document.addEventListener("keydown", function(event) {
    var isCtrlPressed = event.ctrlKey || event.metaKey;
    var isSPressed = event.key === "s";

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
        
        // Check for changes first
        if (hasActualChanges()) {
            showChangeSummaryModal(saveFunctionWithSummary);
        } else {
            showNotification('info', 'No changes to save', 'Function is already up to date');
        }
    }
});

registerPHPSnippetLanguage(monaco.languages);

// Enhanced KyteFunctionList class with version control
class KyteFunctionList {
    constructor(kyteSession) {
        this._ks = kyteSession;
        this.controllerId = null;
        this.functions = [];
        this.currentFunctionId = null;
        this.currentFunction = null;
        this.editor = null;
        this.isDirty = false;
        
        this.init();
        this.setupAddFunctionModal();
    }

    init() {
        try {
            const functionId = this.getFunctionIdFromUrl();
            if (functionId) {
                this.loadControllerAndFunctions(functionId);
            } else {
                console.warn("No function ID found in URL");
                $('#pageLoaderModal').modal('hide');
            }
        } catch (error) {
            console.error("Error initializing function list:", error);
            this.showError("Failed to initialize function editor");
            $('#pageLoaderModal').modal('hide');
        }
    }

    setupAddFunctionModal() {
        $('#addFunctionBtn, #addFunctionFromHeader').on('click', () => {
            this.showAddFunctionModal();
        });

        $('#createFunctionBtn').on('click', () => {
            this.createNewFunction();
        });

        $('#addFunctionModal').on('hidden.bs.modal', () => {
            this.resetAddFunctionForm();
        });

        $('#functionType').on('change', () => {
            const type = $('#functionType').val();
            const nameField = $('#functionName');
            
            if (!nameField.val().trim() && type) {
                if (type.startsWith('hook_') || ['new', 'update', 'get', 'delete'].includes(type)) {
                    nameField.val(type);
                } else if (type === 'custom') {
                    nameField.val('custom_function');
                }
            }
        });
    }

    showAddFunctionModal() {
        this.resetAddFunctionForm();
        const modal = new bootstrap.Modal(document.getElementById('addFunctionModal'));
        modal.show();
    }

    resetAddFunctionForm() {
        $('#addFunctionForm')[0].reset();
        $('#functionName').val('');
        $('#functionType').val('');
        $('#functionDescription').val('');
    }

    async createNewFunction() {
        const type = $('#functionType').val();
        const name = $('#functionName').val().trim();
        const description = $('#functionDescription').val().trim();

        if (!type) {
            alert('Please select a function type');
            return;
        }

        if (this.isDirty) {
            const confirm = await this.confirmUnsavedChanges();
            if (!confirm) return;
        }

        const functionData = {
            controller: this.controllerId,
            type: type,
            name: name || type,
            description: description || '',
            code: this.getDefaultCodeForType(type)
        };

        $('#pageLoaderModal').modal('show');

        try {
            await new Promise((resolve, reject) => {
                this._ks.post('Function', functionData, null, [], 
                    (response) => {
                        if (response.data && response.data[0]) {
                            resolve(response.data[0]);
                        } else {
                            reject('Failed to create function');
                        }
                    }, 
                    (error) => {
                        reject(error);
                    }
                );
            }).then((newFunction) => {
                $('#pageLoaderModal').modal('hide');
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('addFunctionModal'));
                modal.hide();

                this.functions.push(newFunction);
                this.renderFunctionList();
                this.selectFunction(newFunction.id);
                this.loadFunctionCode(newFunction.id);
                
                this.showSuccessMessage(`Function "${newFunction.name}" created successfully!`);
                
            }).catch((error) => {
                $('#pageLoaderModal').modal('hide');
                console.error('Error creating function:', error);
                this.showError('Failed to create function: ' + error);
            });

        } catch (error) {
            $('#pageLoaderModal').modal('hide');
            console.error('Error creating function:', error);
            this.showError('Failed to create function: ' + error);
        }
    }

    getDefaultCodeForType(type) {
        const codeTemplates = {
            'hook_init': `<?php
// Hook: Initialization
// Called when the controller is first initialized

// Your initialization code here
`,
            'hook_auth': `<?php
// Hook: Authentication
// Called to handle authentication logic
// Return true to allow access, false to deny

// Your authentication code here
return true;
`,
            'hook_prequery': `<?php
// Hook: Pre-query
// Called before database queries are executed

// Your pre-query code here
`,
            'hook_preprocess': `<?php
// Hook: Pre-processing
// Called before data processing

// Your pre-processing code here
`,
            'hook_response_data': `<?php
// Hook: Response Data
// Called to modify response data before sending

// Your response data processing code here
`,
            'hook_process_get_response': `<?php
// Hook: Process Get Response
// Called to process GET request responses

// Your GET response processing code here
`,
            'new': `<?php
// Override: Create Operation
// Handle POST requests to create new records

// Your create operation code here
`,
            'update': `<?php
// Override: Update Operation
// Handle PUT requests to update existing records

// Your update operation code here
`,
            'get': `<?php
// Override: Get Operation
// Handle GET requests to retrieve records

// Your get operation code here
`,
            'delete': `<?php
// Override: Delete Operation
// Handle DELETE requests to remove records

// Your delete operation code here
`,
            'custom': `<?php
// Custom Function
// Your custom functionality goes here

// Your custom code here
`
        };

        return codeTemplates[type] || `<?php
// Function: ${type}
// Add your code here

`;
    }

    getFunctionIdFromUrl() {
        try {
            const urlParams = this._ks.getPageRequest();
            if (urlParams && urlParams.idx) {
                return urlParams.idx;
            }
        } catch (error) {
            console.warn("Error getting page request from Kyte session, trying manual parsing:", error);
        }

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const requestParam = urlParams.get('request');
            
            if (requestParam) {
                const decoded = atob(decodeURIComponent(requestParam));
                const obj = JSON.parse(decoded);
                
                if (obj.model === 'Function' && obj.idx) {
                    return obj.idx;
                }
            }
        } catch (error) {
            console.error("Error parsing URL parameters manually:", error);
        }

        return null;
    }

    loadControllerAndFunctions(functionId) {
        this._ks.get("Function", "id", functionId, [], (response) => {
            if (response.data && response.data[0]) {
                const functionData = response.data[0];
                this.controllerId = functionData.controller.id;
                
                $("#function-name").text(functionData.controller.name);
                $("#function-type").text("Controller");
                
                const controllerObj = {
                    'model': 'Controller',
                    'idx': this.controllerId
                };
                const encoded = encodeURIComponent(btoa(JSON.stringify(controllerObj)));
                $("#backToController").attr('href', '/app/controller/?request=' + encoded);
                
                this.loadFunctions(this.controllerId);
                this.currentFunctionId = functionId;
            } else {
                this.showError("Function not found");
            }
        }, (error) => {
            console.error("Error loading function:", error);
            this.showError("Failed to load function data: " + error);
        });
    }

    loadFunctions(controllerId) {
        const functionsContainer = $("#functions-list");
        functionsContainer.html('<div class="loading-functions"><i class="fas fa-spinner fa-spin me-2"></i>Loading functions...</div>');
        
        this._ks.get("Function", "controller", controllerId, [], (response) => {
            if (response.data && response.data.length > 0) {
                this.functions = response.data;
                this.renderFunctionList();
                
                if (this.currentFunctionId) {
                    this.loadFunctionCode(this.currentFunctionId);
                }
            } else {
                functionsContainer.html('<div class="no-functions">No functions found</div>');
            }
        }, (error) => {
            console.error("Error loading functions:", error);
            functionsContainer.html('<div class="no-functions">Error loading functions</div>');
        });
    }

    renderFunctionList() {
        const functionsContainer = $("#functions-list");
        functionsContainer.empty();
        
        this.functions.forEach(func => {
            const functionItem = this.createFunctionItem(func);
            functionsContainer.append(functionItem);
        });
        
        if (this.currentFunctionId) {
            this.selectFunction(this.currentFunctionId);
        }
    }

    createFunctionItem(func) {
        const icon = this.getFunctionIcon(func.type);
        const displayName = func.name || 'function';
        
        const item = $(`
            <button class="function-item" data-function-id="${func.id}">
                <i class="function-icon ${icon}"></i>
                <div class="function-details">
                    <div class="function-name">${displayName}</div>
                    <div class="function-type">${func.type}</div>
                </div>
            </button>
        `);
        
        item.on('click', () => {
            this.onFunctionClick(func.id);
        });
        
        return item;
    }

    getFunctionIcon(type) {
        const iconMap = {
            'get': 'fas fa-search',
            'post': 'fas fa-plus-circle',
            'put': 'fas fa-edit',
            'delete': 'fas fa-trash-alt',
            'new': 'fas fa-plus-square',
            'hook_init': 'fas fa-power-off',
            'hook_auth': 'fas fa-shield-alt',
            'hook_prequery': 'fas fa-database',
            'hook_preprocess': 'fas fa-filter',
            'hook_response_data': 'fas fa-exchange-alt',
            'hook_process_get_response': 'fas fa-arrow-circle-right',
            'custom': 'fas fa-code'
        };
        
        return iconMap[type] || 'fas fa-code';
    }

    async onFunctionClick(functionId) {
        if (this.isDirty) {
            const confirm = await this.confirmUnsavedChanges();
            if (!confirm) return;
        }
        
        this.selectFunction(functionId);
        this.loadFunctionCode(functionId);
    }

    selectFunction(functionId) {
        $('.function-item').removeClass('active');
        $(`.function-item[data-function-id="${functionId}"]`).addClass('active');
        
        this.currentFunctionId = functionId;
        
        const func = this.functions.find(f => f.id == functionId);
        if (func) {
            $('#current-function-name').text(func.type || 'function');
            $('#function-type').text(func.type);
        }
        
        try {
            const newUrl = new URL(window.location);
            const obj = {'model': 'Function', 'idx': functionId};
            const encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
            newUrl.searchParams.set('request', encoded);
            window.history.replaceState({}, '', newUrl);
        } catch (error) {
            console.warn("Could not update URL:", error);
        }
    }

    loadFunctionCode(functionId) {
        this._ks.get("Function", "id", functionId, [], (response) => {
            if (response.data && response.data[0]) {
                const func = response.data[0];
                this.displayFunctionCode(func);
                this.isDirty = false;
            } else {
                this.showError("Function not found");
            }
        }, (error) => {
            console.error("Error loading function code:", error);
            this.showError("Failed to load function code");
        });
    }

    displayFunctionCode(func) {
        const codeContainer = $('#Code');
        const noFunctionMessage = codeContainer.find('.no-function-message');
        const editorContainer = codeContainer.find('#container');
        
        codeContainer.removeClass('no-function');
        noFunctionMessage.hide();
        editorContainer.show();
        
        if (this.editor) {
            this.editor.setValue(func.code || '');
            this.editor.updateOptions({ readOnly: false });
        } else {
            window.functionCodeToLoad = func.code || '';
        }
        
        $("#function-name").text(func.controller.name);
        $("#function-type").text(func.type);
        
        this.currentFunction = func;
        
        // Load version history for this function
        this.loadVersionHistory(func.id);
    }

    loadVersionHistory(functionId) {
        if (!functionId) return;
        
        this.initializeVersionHistoryTable(functionId);
    }

    initializeVersionHistoryTable(functionId) {
        const colDefVersionHistory = [
            {'targets': 0, 'data': 'version_number', 'label': 'Version'},
            {'targets': 1, 'data': 'date_created', 'label': 'Date'},
            {'targets': 2, 'data': 'change_summary', 'label': 'Summary', 'render': function(data) {
                return data || 'No summary provided';
            }},
            {'targets': 3, 'data': 'created_by.name', 'label': 'Author', 'render': function(data) { 
                return data || 'Unknown'; 
            }},
            {'targets': 4, 'data': 'can_revert', 'label': 'Current Version', 'render': function(data) { 
                return data === false ? '<i class="fas fa-check text-success"></i> Yes' : '<i class="fas fa-times text-danger"></i> No'; 
            }},
        ];

        $("#version-history-table-wrapper").html('<table id="version-history-table" class="table table-striped w-100"></table>');

        tblVersionHistory = new KyteTable(this._ks, $("#version-history-table"), 
            {'name': "KyteFunctionVersion", 'field': "function", 'value': functionId}, 
            colDefVersionHistory, 
            true,
            [1, "desc"], // sort by date descending
            false,
            false
        );
        
        tblVersionHistory.customActionButton = [
            {
                'className':'previewVersion',
                'label': window.kyteI18n ? window.kyteI18n.t('ui.function_editor.version_modal.preview_button', 'Preview') : 'Preview',
                'faicon': 'fas fa-eye',
                'callback': (data, model, row) => {
                    this.previewFunctionVersion(data);
                }
            },
            {
                'className':'restoreVersion',
                'label': window.kyteI18n ? window.kyteI18n.t('ui.function_editor.version_modal.restore_action', 'Restore') : 'Restore',
                'faicon': 'fas fa-undo',
                'callback': (data, model, row) => {
                    this.restoreFunctionVersion(data);
                }
            }
        ];
        
        tblVersionHistory.init();
    }

    previewFunctionVersion(versionData) {
        // Get version content first
        this._ks.get("KyteFunctionVersionContent", "content_hash", versionData['content_hash'], [], (r) => {
            if (r.data[0]) {
                const versionContent = r.data[0];
                const combinedData = { ...versionData, code: versionContent.code };
                previewVersion(combinedData, this._ks);
            } else {
                alert("Error: Could not retrieve version content.");
            }
        }, (err) => {
            alert("Error fetching version content: " + err);
            console.error(err);
        });
    }

    restoreFunctionVersion(versionData) {
        restoreVersion(versionData, this._ks);
    }

    setEditor(editor) {
        this.editor = editor;
        
        if (editor) {
            editor.onDidChangeModelContent(() => {
                this.isDirty = true;
            });
            
            if (window.functionCodeToLoad !== undefined) {
                editor.setValue(window.functionCodeToLoad);
                editor.updateOptions({ readOnly: false });
                delete window.functionCodeToLoad;
            }
        }
    }

    saveCurrentFunction() {
        if (!this.currentFunctionId || !this.editor) {
            return Promise.reject("No function selected or editor not ready");
        }
        
        return new Promise((resolve, reject) => {
            const code = this.editor.getValue();
            
            this._ks.put('Function', 'id', this.currentFunctionId, {'code': code}, null, [], 
                (response) => {
                    this.isDirty = false;
                    resolve(response);
                }, 
                (error) => {
                    reject(error);
                }
            );
        });
    }

    confirmUnsavedChanges() {
        return new Promise((resolve) => {
            const result = confirm("You have unsaved changes. Do you want to continue without saving?");
            resolve(result);
        });
    }

    showError(message) {
        alert(message);
        console.error(message);
    }

    showSuccessMessage(message) {
        console.log(message);
    }

    isDirtyCheck() {
        return this.isDirty;
    }

    getCurrentFunctionId() {
        return this.currentFunctionId;
    }

    save() {
        return this.saveCurrentFunction();
    }
}

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.dataset.target;

            // Skip if no target (e.g., the popup button)
            if (!target) return;

            // Update active tab
            document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding content
            document.querySelectorAll('.editor-container, .secondary-content').forEach(container => {
                container.classList.remove('active');
            });

            document.getElementById(target).classList.add('active');

            // Load version history when switching to History tab
            if (target === 'History' && window.KyteFunctionListManager) {
                const functionId = window.KyteFunctionListManager.getCurrentFunctionId();
                if (functionId) {
                    window.KyteFunctionListManager.loadVersionHistory(functionId);
                }
            }
        });
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
                'KyteFunctionDocs',
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
                        <title>Kyte Function Types Documentation</title>
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
                            .text-success {
                                color: #48bb78 !important;
                            }
                            .text-warning {
                                color: #ecc94b !important;
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
                            .alert {
                                padding: 0.75rem 1rem;
                                border-radius: 4px;
                                margin-bottom: 1rem;
                                font-size: 0.85rem;
                            }
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
});

// Global instance
window.KyteFunctionListManager = null;

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    let hash = location.hash;
    hash = hash == "" ? '#Code' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (_ks.isSession()) {
        // Initialize change summary modal
        initializeChangeSummaryModal();
        
        window.KyteFunctionListManager = new KyteFunctionList(_ks);

        // Register Kyte PHP IntelliSense
        registerKytePhpIntelliSense(monaco);

        // Create the Monaco editor
        editor = monaco.editor.create(document.getElementById('container'), {
            value: '// Select a function from the sidebar to start editing',
            theme: colorMode,
            language: "php-snippet",
            automaticLayout: true,
            wordWrap: true,
            wordWrapMinified: true,
            wrappingIndent: 'indent',
            readOnly: true
        });

        // Register editor with function list manager
        setTimeout(() => {
            if (window.KyteFunctionListManager) {
                window.KyteFunctionListManager.setEditor(editor);
                
                if (window.functionCodeToLoad !== undefined) {
                    editor.updateOptions({ readOnly: false });
                }
            }
        }, 100);

        // Set up save button click handler
        $("#saveCode").click(function() {
            if (hasActualChanges()) {
                showChangeSummaryModal(saveFunctionWithSummary);
            } else {
                showNotification('info', 'No changes to save', 'Function is already up to date');
            }
        });

        // Mobile sidebar toggle
        $('#sidebarToggle').on('click', function() {
            $('#sidenav').toggleClass('show');
        });

        $('#closeSidebar').on('click', function() {
            $('#sidenav').removeClass('show');
        });

        setTimeout(() => {
            $('#pageLoaderModal').modal('hide');
        }, 500);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});

// Handle page unload
window.onbeforeunload = function() {
    if (window.KyteFunctionListManager && window.KyteFunctionListManager.isDirtyCheck()) {
        return "You have unsaved changes. Are you sure you want to leave?";
    }
};