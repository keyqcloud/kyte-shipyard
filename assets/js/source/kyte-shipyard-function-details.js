// Updated kyte-shipyard-function-details.js
import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';
import {registerPHPSnippetLanguage} from '/assets/js/packages/php-snippet/registerPHPSnippetLanguage.js';

let subnavFunction = [
    {
        faicon:'fas fa-code',
        label:'Code',
        selector:'#Code'
    },
];

var editor;

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

// key bindings for saving
document.addEventListener("keydown", function(event) {
    // Check if the Ctrl key (Windows) or the Command key (Mac) is pressed
    var isCtrlPressed = event.ctrlKey || event.metaKey;
  
    // Check if the S key is pressed
    var isSPressed = event.key === "s";
  
    // Check if both the Ctrl key and the S key are pressed
    if (isCtrlPressed && isSPressed) {
        event.preventDefault(); // Prevent the default browser save action
        
        // Use the function list manager to save
        if (window.KyteFunctionListManager) {
            window.KyteFunctionListManager.save().then(() => {
                // Success handled by function list manager
            }).catch((error) => {
                alert("Error saving: " + error);
                console.error(error);
            });
        } else {
            // Fallback to old method
            $("#saveCode").click();
        }
    }
});

registerPHPSnippetLanguage(monaco.languages);

// Override the onbeforeunload to use function list manager
window.onbeforeunload = function() {
    if (window.KyteFunctionListManager && window.KyteFunctionListManager.isDirtyCheck()) {
        return "You have unsaved changes. Are you sure you want to leave?";
    }
};

// kyte-function-list.js
// Manages the dynamic function list in the sidebar

class KyteFunctionList {
    constructor(kyteSession) {
        this._ks = kyteSession;
        this.controllerId = null;
        this.functions = [];
        this.currentFunctionId = null;
        this.editor = null;
        this.isDirty = false;
        
        this.init();
    }

    init() {
        try {
            // Get function ID from URL params with better error handling
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

    getFunctionIdFromUrl() {
        try {
            // First try using the Kyte session method
            const urlParams = this._ks.getPageRequest();
            if (urlParams && urlParams.idx) {
                return urlParams.idx;
            }
        } catch (error) {
            console.warn("Error getting page request from Kyte session, trying manual parsing:", error);
        }

        // Fallback: manually parse URL
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const requestParam = urlParams.get('request');
            
            if (requestParam) {
                // Decode the base64 encoded request parameter
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
        // First, get the function to find the controller
        this._ks.get("Function", "id", functionId, [], (response) => {
            if (response.data && response.data[0]) {
                const functionData = response.data[0];
                this.controllerId = functionData.controller.id;
                
                // Update header with controller name
                $("#function-name").text(functionData.controller.name);
                $("#function-type").text("Controller");
                
                // Update exit link
                const controllerObj = {
                    'model': 'Controller',
                    'idx': this.controllerId
                };
                const encoded = encodeURIComponent(btoa(JSON.stringify(controllerObj)));
                $("#backToController").attr('href', '/app/controller/?request=' + encoded);
                
                // Load all functions for this controller
                this.loadFunctions(this.controllerId);
                
                // Set current function and load it
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
                
                // Auto-load the current function if it was set during initialization
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
        
        // Auto-select current function if set
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
        
        // Add click handler
        item.on('click', () => {
            this.onFunctionClick(func.id);
        });
        
        return item;
    }

    getFunctionIcon(type) {
        const iconMap = {
            // HTTP Methods - RESTful operations
            'get': 'fas fa-search',           // Search/retrieve data
            'post': 'fas fa-plus-circle',     // Create new resource
            'put': 'fas fa-edit',             // Update existing resource
            'delete': 'fas fa-trash-alt',     // Delete resource
            'new': 'fas fa-plus-square',      // Alternative create method
            
            // Controller Hooks - Lifecycle events
            'hook_init': 'fas fa-power-off',        // Initialization/startup
            'hook_auth': 'fas fa-shield-alt',       // Authentication/security
            'hook_prequery': 'fas fa-database',     // Database query preparation
            'hook_preprocess': 'fas fa-filter',     // Data preprocessing
            'hook_response_data': 'fas fa-exchange-alt', // Data transformation
            'hook_process_get_response': 'fas fa-arrow-circle-right', // Response processing
            
            // Custom Functions
            'custom': 'fas fa-code'           // Generic custom function
        };
        
        return iconMap[type] || 'fas fa-code';
    }

    async onFunctionClick(functionId) {
        // Check for unsaved changes
        if (this.isDirty) {
            const confirm = await this.confirmUnsavedChanges();
            if (!confirm) return;
        }
        
        this.selectFunction(functionId);
        this.loadFunctionCode(functionId);
    }

    selectFunction(functionId) {
        // Update UI
        $('.function-item').removeClass('active');
        $(`.function-item[data-function-id="${functionId}"]`).addClass('active');
        
        // Update current function
        this.currentFunctionId = functionId;
        
        // Update tab name
        const func = this.functions.find(f => f.id == functionId);
        if (func) {
            $('#current-function-name').text(func.type || 'function');
        }
        
        // Update URL without reload
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
        // Show editor container
        const codeContainer = $('#Code');
        const noFunctionMessage = codeContainer.find('.no-function-message');
        const editorContainer = codeContainer.find('#container');
        
        codeContainer.removeClass('no-function');
        noFunctionMessage.hide();
        editorContainer.show();
        
        // Create or update editor
        if (this.editor) {
            this.editor.setValue(func.code || '');
            this.editor.updateOptions({ readOnly: false });
        } else {
            // Editor will be created by the main script
            // Store the code for when editor is ready
            window.functionCodeToLoad = func.code || '';
        }
        
        // Update header info
        $("#function-name").text(func.controller.name);
        $("#function-type").text(func.type);
        
        // Store current function data
        this.currentFunction = func;
    }

    saveCurrentFunction() {
        if (!this.currentFunctionId || !this.editor) {
            return Promise.reject("No function selected or editor not ready");
        }
        
        return new Promise((resolve, reject) => {
            $('#pageLoaderModal').modal('show');
            
            const code = this.editor.getValue();
            
            this._ks.put('Function', 'id', this.currentFunctionId, {'code': code}, null, [], 
                (response) => {
                    $('#pageLoaderModal').modal('hide');
                    this.isDirty = false;
                    resolve(response);
                }, 
                (error) => {
                    $('#pageLoaderModal').modal('hide');
                    reject(error);
                }
            );
        });
    }

    setEditor(editor) {
        this.editor = editor;
        
        // Set up change listener
        if (editor) {
            editor.onDidChangeModelContent(() => {
                this.isDirty = true;
            });
            
            // Load initial code if available
            if (window.functionCodeToLoad !== undefined) {
                editor.setValue(window.functionCodeToLoad);
                editor.updateOptions({ readOnly: false });
                delete window.functionCodeToLoad;
            }
        }
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

    // Public methods for external use
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

// Global instance
window.KyteFunctionListManager = null;

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    let hash = location.hash;
    hash = hash == "" ? '#Code' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (_ks.isSession()) {
        window.KyteFunctionListManager = new KyteFunctionList(_ks);

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
                
                // If there's code to load, make editor writable
                if (window.functionCodeToLoad !== undefined) {
                    editor.updateOptions({ readOnly: false });
                }
            }
        }, 100);

        // Set up save button click handler
        $("#saveCode").click(function() {
            if (window.KyteFunctionListManager) {
                window.KyteFunctionListManager.save().then(() => {
                    // Success message could be added here
                }).catch((error) => {
                    alert("Error saving: " + error);
                    console.error(error);
                });
            }
        });

        // Function to enable editor when function is selected
        window.enableEditor = function() {
            if (editor) {
                editor.updateOptions({ readOnly: false });
            }
        };

        // Close the loading modal after initialization
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