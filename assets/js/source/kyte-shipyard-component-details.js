// Updated kyte-shipyard-component-details.js
import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

var htmlEditor;
var cssEditor;
var iframe;
var isDirty = false;
var currentComponent = null;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    if (htmlEditor) {
        htmlEditor.setTheme(colorMode);
    }
    if (cssEditor) {
        cssEditor.setTheme(colorMode);
    }
});

// Key bindings for saving
document.addEventListener("keydown", function(event) {
    var isCtrlPressed = event.ctrlKey || event.metaKey;
    var isSPressed = event.key === "s";
    
    if (isCtrlPressed && isSPressed) {
        event.preventDefault();
        $("#saveCode").click();
    }

    // Escape to close sidebar on mobile
    if (e.key === 'Escape' && window.innerWidth <= 768) {
        document.getElementById('sidenav').classList.remove('show');
    }
});

class ComponentEditor {
    constructor(kyteSession) {
        this._ks = kyteSession;
        this.placeholders = new Set();
        this.init();
    }

    init() {
        try {
            const componentId = this.getComponentIdFromUrl();
            if (componentId) {
                this.loadComponent(componentId);
            } else {
                console.warn("No component ID found in URL");
                $('#pageLoaderModal').modal('hide');
            }
        } catch (error) {
            console.error("Error initializing component editor:", error);
            this.showError("Failed to initialize component editor");
            $('#pageLoaderModal').modal('hide');
        }
    }

    getComponentIdFromUrl() {
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
                
                if (obj.model === 'KyteWebComponent' && obj.idx) {
                    return obj.idx;
                }
            }
        } catch (error) {
            console.error("Error parsing URL parameters manually:", error);
        }

        return null;
    }

    loadComponent(componentId) {
        this._ks.get("KyteWebComponent", "id", componentId, [], (response) => {
            if (response.data && response.data[0]) {
                currentComponent = response.data[0];
                this.displayComponent(currentComponent);
            } else {
                this.showError("Component not found");
                $('#pageLoaderModal').modal('hide');
            }
        }, (error) => {
            console.error("Error loading component:", error);
            this.showError("Failed to load component: " + error);
            $('#pageLoaderModal').modal('hide');
        });
    }

    displayComponent(component) {
        // Update header info
        $("#component-name").text(component.name || 'Untitled Component');
        $("#component-identifier").text(component.identifier || 'no-identifier');
        
        // Update settings form
        $('#setting-component-name').val(component.name || '');
        $('#setting-component-identifier').val(component.identifier || '');
        $('#setting-component-description').val(component.description || '');
        
        // Set up exit link
        if (component.application) {
            let appObj = {
                'model': 'Application', // or whatever model represents the components list
                'idx': component.application.id
            };
            let encoded = encodeURIComponent(btoa(JSON.stringify(appObj)));
            $("#backToController").attr('href', '/app/components.html?request=' + encoded);
        }
        
        // Create editors
        this.createEditors(component);
        
        // Set up form change listeners
        this.setupFormChangeListeners();
        
        // Initialize preview
        this.initializeIFrame();
        this.populatePropertiesPanel(component.html || '');
        this.renderHtmlCode();
        
        $('#pageLoaderModal').modal('hide');
    }

    createEditors(component) {
        // Create HTML Editor
        htmlEditor = monaco.editor.create(document.getElementById("htmlEditor"), {
            value: component.html || '',
            theme: colorMode,
            language: "html",
            automaticLayout: true,
            wordWrap: true,
            wordWrapMinified: true,
            wrappingIndent: 'indent',
            minimap: {
                enabled: true
            },
            fontSize: 14,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false
        });

        // Create CSS Editor
        cssEditor = monaco.editor.create(document.getElementById("cssEditor"), {
            value: component.stylesheet || '',
            theme: colorMode,
            language: "css",
            automaticLayout: true,
            wordWrap: true,
            wordWrapMinified: true,
            wrappingIndent: 'indent',
            minimap: {
                enabled: true
            },
            fontSize: 14,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false
        });

        // Set up change listeners
        htmlEditor.onDidChangeModelContent(() => {
            isDirty = true;
            this.populatePropertiesPanel(htmlEditor.getValue());
            this.renderHtmlCode();
        });

        cssEditor.onDidChangeModelContent(() => {
            isDirty = true;
            this.renderHtmlCode();
        });
    }

    setupFormChangeListeners() {
        // Remove existing listeners to avoid duplicates
        $('#setting-component-name, #setting-component-identifier, #setting-component-description').off('input change');
        
        // Add change listeners to form fields
        $('#setting-component-name, #setting-component-identifier, #setting-component-description').on('input change', () => {
            isDirty = true;
            
            // Update header in real-time
            const name = $('#setting-component-name').val() || 'Untitled Component';
            const identifier = $('#setting-component-identifier').val() || 'no-identifier';
            
            $("#component-name").text(name);
            $("#component-identifier").text(identifier);
        });
    }

    initializeIFrame() {
        const previewContainer = document.getElementById("preview");
        iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        previewContainer.innerHTML = "";
        previewContainer.appendChild(iframe);
    }

    renderHtmlCode() {
        if (!htmlEditor || !cssEditor || !iframe) return;

        try {
            // Get the HTML code from the editor
            let htmlCode = htmlEditor.getValue();

            // Replace placeholders with values from the inputs
            const inputs = document.querySelectorAll('#placeholderWrapper input');
            inputs.forEach(input => {
                const placeholder = `{{${input.name}}}`;
                const value = input.value || input.placeholder || `[${input.name}]`;
                // Replace all occurrences of this placeholder in the HTML code
                htmlCode = htmlCode.split(placeholder).join(value);
            });

            // Build the complete HTML document
            const css = cssEditor.getValue();
            const code = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Component Preview</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        }
        ${css}
    </style>
</head>
<body>
    ${htmlCode}
</body>
</html>`;

            const blob = new Blob([code], {type: "text/html; charset=utf-8"});
            iframe.src = URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error rendering HTML code:', error);
        }
    }

    populatePropertiesPanel(htmlCode) {
        const placeholderWrapper = document.getElementById('placeholderWrapper');
        
        // Extract placeholders using regex
        const regex = /{{\s*(\w+)\s*}}/g; 
        let match;
        const newPlaceholders = new Set();

        // Collect all placeholders in the HTML code
        while ((match = regex.exec(htmlCode)) !== null) {
            newPlaceholders.add(match[1]);
        }

        // Get existing inputs
        const existingInputs = new Set();
        document.querySelectorAll('#placeholderWrapper input').forEach(input => {
            existingInputs.add(input.name);
        });

        // Add new inputs for new placeholders
        newPlaceholders.forEach(placeholder => {
            if (!existingInputs.has(placeholder)) {
                this.createPlaceholderInput(placeholder, placeholderWrapper);
            }
        });

        // Remove inputs for placeholders that no longer exist
        existingInputs.forEach(inputName => {
            if (!newPlaceholders.has(inputName)) {
                this.removePlaceholderInput(inputName);
            }
        });

        // Update the stored placeholders
        this.placeholders = newPlaceholders;

        // Show/hide the placeholders section
        const placeholderSection = placeholderWrapper.closest('.properties-section');
        if (placeholderSection) {
            placeholderSection.style.display = newPlaceholders.size > 0 ? 'block' : 'none';
        }
    }

    createPlaceholderInput(placeholder, container) {
        const placeholderItem = document.createElement('div');
        placeholderItem.className = 'placeholder-item';
        placeholderItem.id = `placeholder-${placeholder}`;

        const label = document.createElement('label');
        label.textContent = `{{${placeholder}}}`;
        label.htmlFor = `input-${placeholder}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `input-${placeholder}`;
        input.name = placeholder;
        input.placeholder = `Enter value for ${placeholder}`;
        input.className = 'form-control';

        input.addEventListener('input', () => {
            this.renderHtmlCode();
        });

        placeholderItem.appendChild(label);
        placeholderItem.appendChild(input);
        container.appendChild(placeholderItem);
    }

    removePlaceholderInput(placeholder) {
        const placeholderItem = document.getElementById(`placeholder-${placeholder}`);
        if (placeholderItem) {
            placeholderItem.remove();
        }
    }

    save() {
        if (!currentComponent) {
            return Promise.reject("No component loaded");
        }
        
        return new Promise((resolve, reject) => {
            $('#pageLoaderModal').modal('show');
            
            const componentData = {
                'html': htmlEditor.getValue(),
                'stylesheet': cssEditor.getValue(),
                'name': $('#setting-component-name').val(),
                'identifier': $('#setting-component-identifier').val(),
                'description': $('#setting-component-description').val()
            };
            
            this._ks.put('KyteWebComponent', 'id', currentComponent.id, componentData, null, [], 
                (response) => {
                    $('#pageLoaderModal').modal('hide');
                    isDirty = false;
                    
                    // Update current component data
                    Object.assign(currentComponent, componentData);
                    
                    console.log('Component saved successfully');
                    resolve(response);
                }, 
                (error) => {
                    $('#pageLoaderModal').modal('hide');
                    reject(error);
                }
            );
        });
    }

    showError(message) {
        alert(message);
        console.error(message);
    }
}

// Global instance
window.ComponentEditor = null;

// Main initialization
document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    
    // Store session globally
    window.kyteSession = _ks;
    
    $('#pageLoaderModal').modal('show');
    
    if (_ks.isSession()) {
        // Initialize the component editor
        window.ComponentEditor = new ComponentEditor(_ks);
        
        // Set up save button
        $("#saveCode").click(function() {
            if (window.ComponentEditor) {
                window.ComponentEditor.save().then(() => {
                    console.log('Component saved successfully');
                }).catch((error) => {
                    alert('Error saving component: ' + error);
                    console.error('Save error:', error);
                });
            }
        });
        
    } else {
        location.href = "/?redir=" + encodeURIComponent(window.location);
    }
});

// Enhanced preview functionality
window.renderHtmlCode = function() {
    if (window.ComponentEditor) {
        window.ComponentEditor.renderHtmlCode();
    }
};

// Handle page unload
window.onbeforeunload = function() {
    if (isDirty) {
        return "You have unsaved changes. Are you sure you want to leave?";
    }
};

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
