// kyte-shipyard-component-details.js
// Monaco Editor is loaded via AMD loader (require.js) configured in the HTML file

var htmlEditor;
var cssEditor;
var sampleDataEditor;
var iframe;
var isDirty = false;
var currentComponent = null;
var sampleDataArray = [];
var currentPreviewWidth = '100%';

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
    if (sampleDataEditor) {
        sampleDataEditor.setTheme(colorMode);
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
    if (event.key === 'Escape' && window.innerWidth <= 768) {
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

        // Initialize preview iframe first (before editors)
        this.initializeIFrame();

        // Set up form change listeners
        this.setupFormChangeListeners();

        // Setup feature buttons (these don't depend on editors)
        this.setupResponsivePreview();
        this.setupQuickTest();
        this.setupTabNavigation();

        // Create editors - this is async, so initialization that depends on editors happens inside
        this.createEditors(component);
    }

    setupTabNavigation() {
        // Tab navigation for editor tabs
        document.querySelectorAll('.editor-tab').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = button.dataset.target;

                // Update active tab
                document.querySelectorAll('.editor-tab').forEach(tab => tab.classList.remove('active'));
                button.classList.add('active');

                // Show corresponding content
                document.querySelectorAll('.editor-container, .secondary-content').forEach(container => {
                    container.classList.remove('active');
                });
                const targetElement = document.getElementById(target);
                if (targetElement) {
                    targetElement.classList.add('active');
                }

                // Refresh Quick Test preview when that tab is activated
                if (target === 'QuickTest') {
                    const instances = parseInt(document.querySelector('.quick-test-mode-btn.active')?.dataset.instances || '1');
                    this.updateQuickTestPreview(instances);
                }
            });
        });
    }

    createEditors(component) {
        // Load Monaco Editor via AMD loader and then create editors
        require(['vs/editor/editor.main'], () => {
            // Monaco is now available as window.monaco

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
                // Update Quick Test if on that tab
                const activeTab = document.querySelector('.editor-tab.active');
                if (activeTab && activeTab.dataset.target === 'QuickTest') {
                    this.updateQuickTestPreview(parseInt(document.querySelector('.quick-test-mode-btn.active')?.dataset.instances || '1'));
                }
            });

            cssEditor.onDidChangeModelContent(() => {
                isDirty = true;
                this.renderHtmlCode();
                // Update Quick Test if on that tab
                const activeTab = document.querySelector('.editor-tab.active');
                if (activeTab && activeTab.dataset.target === 'QuickTest') {
                    this.updateQuickTestPreview(parseInt(document.querySelector('.quick-test-mode-btn.active')?.dataset.instances || '1'));
                }
            });

            // Create Sample Data Editor (JSON)
            const sampleDataValue = component.sample_data || '[{"title": "Example Title", "description": "Example description"}]';
            sampleDataEditor = monaco.editor.create(document.getElementById("sampleDataEditor"), {
                value: sampleDataValue,
                theme: colorMode,
                language: "json",
                automaticLayout: true,
                wordWrap: true,
                wordWrapMinified: true,
                wrappingIndent: 'indent',
                minimap: {
                    enabled: false
                },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false
            });

            sampleDataEditor.onDidChangeModelContent(() => {
                isDirty = true;
                // Update Quick Test if on that tab
                const activeTab = document.querySelector('.editor-tab.active');
                if (activeTab && activeTab.dataset.target === 'QuickTest') {
                    this.updateQuickTestPreview(parseInt(document.querySelector('.quick-test-mode-btn.active')?.dataset.instances || '1'));
                }
            });

            // Now that editors are created, initialize the preview and features
            this.populatePropertiesPanel(component.html || '');
            this.renderHtmlCode();
            this.updateQuickTestPreview(1);

            // Hide loading modal
            $('#pageLoaderModal').modal('hide');
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

            // Replace placeholders with values from the inputs and textareas
            const inputs = document.querySelectorAll('#placeholderWrapper input, #placeholderWrapper textarea');
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

        // Detect type based on placeholder name
        let detectedType = 'text';
        let placeholderText = `Enter value for ${placeholder}`;

        if (placeholder.includes('url') || placeholder.includes('link') || placeholder.includes('href')) {
            detectedType = 'url';
            placeholderText = 'https://example.com';
        } else if (placeholder.includes('email')) {
            detectedType = 'email';
            placeholderText = 'user@example.com';
        } else if (placeholder.includes('phone') || placeholder.includes('tel')) {
            detectedType = 'tel';
            placeholderText = '+1 (555) 123-4567';
        } else if (placeholder.includes('date')) {
            detectedType = 'date';
        } else if (placeholder.includes('time')) {
            detectedType = 'time';
        } else if (placeholder.includes('number') || placeholder.includes('count') || placeholder.includes('quantity') || placeholder.includes('price')) {
            detectedType = 'number';
            placeholderText = '0';
        } else if (placeholder.includes('color')) {
            detectedType = 'color';
        } else if (placeholder.includes('description') || placeholder.includes('content') || placeholder.includes('message') || placeholder.includes('text_long')) {
            detectedType = 'textarea';
            placeholderText = 'Enter text...';
        } else if (placeholder.includes('image') || placeholder.includes('img')) {
            detectedType = 'url';
            placeholderText = 'https://via.placeholder.com/400x300';
        }

        // Create input group wrapper
        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group mt-2';

        // Create type selector
        const typeSelect = document.createElement('select');
        typeSelect.className = 'form-select';
        typeSelect.style.maxWidth = '150px';
        const types = [
            {value: 'text', label: 'Text'},
            {value: 'textarea', label: 'Long Text'},
            {value: 'url', label: 'URL'},
            {value: 'email', label: 'Email'},
            {value: 'tel', label: 'Phone'},
            {value: 'number', label: 'Number'},
            {value: 'date', label: 'Date'},
            {value: 'time', label: 'Time'},
            {value: 'color', label: 'Color'}
        ];

        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            if (type.value === detectedType) {
                option.selected = true;
            }
            typeSelect.appendChild(option);
        });

        // Create input or textarea based on type
        let inputElement;
        if (detectedType === 'textarea') {
            inputElement = document.createElement('textarea');
            inputElement.rows = 3;
        } else {
            inputElement = document.createElement('input');
            inputElement.type = detectedType;
        }

        inputElement.id = `input-${placeholder}`;
        inputElement.name = placeholder;
        inputElement.placeholder = placeholderText;
        inputElement.className = 'form-control';

        // Update input when type changes
        typeSelect.addEventListener('change', () => {
            const newType = typeSelect.value;
            const currentValue = inputElement.value;

            // Replace input element
            const newInput = newType === 'textarea' ? document.createElement('textarea') : document.createElement('input');
            if (newType !== 'textarea') {
                newInput.type = newType;
            } else {
                newInput.rows = 3;
            }

            newInput.id = inputElement.id;
            newInput.name = inputElement.name;
            newInput.placeholder = inputElement.placeholder;
            newInput.className = inputElement.className;
            newInput.value = currentValue;

            newInput.addEventListener('input', () => {
                this.renderHtmlCode();
                // Update Quick Test if on that tab
                const activeTab = document.querySelector('.editor-tab.active');
                if (activeTab && activeTab.dataset.target === 'QuickTest') {
                    this.updateQuickTestPreview(parseInt(document.querySelector('.quick-test-mode-btn.active')?.dataset.instances || '1'));
                }
            });

            inputElement.replaceWith(newInput);
            inputElement = newInput;
        });

        inputElement.addEventListener('input', () => {
            this.renderHtmlCode();
            // Update Quick Test if on that tab
            const activeTab = document.querySelector('.editor-tab.active');
            if (activeTab && activeTab.dataset.target === 'QuickTest') {
                this.updateQuickTestPreview(parseInt(document.querySelector('.quick-test-mode-btn.active')?.dataset.instances || '1'));
            }
        });

        inputGroup.appendChild(typeSelect);
        inputGroup.appendChild(inputElement);

        placeholderItem.appendChild(label);
        placeholderItem.appendChild(inputGroup);
        container.appendChild(placeholderItem);
    }

    removePlaceholderInput(placeholder) {
        const placeholderItem = document.getElementById(`placeholder-${placeholder}`);
        if (placeholderItem) {
            placeholderItem.remove();
        }
    }

    // Generate usage code for the component
    generateCode() {
        if (!currentComponent) return;

        const componentName = currentComponent.name || 'Component';
        const identifier = currentComponent.identifier || 'component-id';

        // Loading Code Tab
        const loadingCode = `// Load component from Kyte API
_kyte.get('KyteWebComponent', 'identifier', '${identifier}', [], (response) => {
    if (response.data && response.data[0]) {
        let component = response.data[0];

        // Prepare component template
        let components = {};
        components[component.identifier] =
            component.html + '<style>' + component.stylesheet + '</style>';

        // Create KyteWebComponent instance
        let kwc = new KyteWebComponent(components);

        // Bind to your container with your data
        kwc.bind('#your-container', component.identifier, yourDataArray);
    }
});`;

        // Usage Example Tab
        const usageCode = `<div id="component-container"></div>

<script>
    // Your data array
    let myData = [
        ${this.parseSampleData().slice(0, 2).map(item => '        ' + JSON.stringify(item)).join(',\n')}
    ];

    // Load and render component
    _kyte.get('KyteWebComponent', 'identifier', '${identifier}', [], (r) => {
        let comp = r.data[0];
        let components = {};
        components[comp.identifier] = comp.html + '<style>' + comp.stylesheet + '</style>';

        let kwc = new KyteWebComponent(components);
        kwc.bind('#component-container', comp.identifier, myData);
    });
</script>`;

        // Sample Data Tab
        const sampleData = sampleDataEditor ? sampleDataEditor.getValue() : '[]';

        // Populate modal
        document.getElementById('loadingCodeContent').textContent = loadingCode;
        document.getElementById('usageCodeContent').textContent = usageCode;
        document.getElementById('sampleDataCodeContent').textContent = sampleData;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('getCodeModal'));
        modal.show();
    }

    // Export component as JSON file
    exportComponent() {
        if (!currentComponent) return;

        const exportData = {
            name: $('#setting-component-name').val(),
            identifier: $('#setting-component-identifier').val(),
            description: $('#setting-component-description').val(),
            html: htmlEditor.getValue(),
            stylesheet: cssEditor.getValue(),
            sample_data: sampleDataEditor ? sampleDataEditor.getValue() : '[]',
            exported_at: new Date().toISOString(),
            kyte_version: '1.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${exportData.identifier || 'component'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('Component exported successfully');
    }

    // Setup responsive preview mode buttons
    setupResponsivePreview() {
        document.querySelectorAll('.preview-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                document.querySelectorAll('.preview-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Get target width
                const width = btn.dataset.width;
                currentPreviewWidth = width;

                // Apply to iframe
                if (iframe) {
                    iframe.style.width = width;
                }
            });
        });
    }

    // Setup quick test functionality
    setupQuickTest() {
        document.querySelectorAll('.quick-test-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                document.querySelectorAll('.quick-test-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Get number of instances
                const instances = parseInt(btn.dataset.instances) || 1;

                // Update preview grid
                this.updateQuickTestPreview(instances);
            });
        });
    }

    // Update quick test preview with multiple instances
    updateQuickTestPreview(instanceCount = 1) {
        const container = document.getElementById('quickTestPreview');
        if (!container) return;

        // Update grid class
        container.className = 'quick-test-preview';
        if (instanceCount === 2) {
            container.classList.add('instances-2');
        } else if (instanceCount === 3) {
            container.classList.add('instances-3');
        }

        // Get HTML and CSS
        let htmlTemplate = htmlEditor ? htmlEditor.getValue() : '';
        const css = cssEditor ? cssEditor.getValue() : '';

        // Get placeholder data
        const data = this.parseSampleData().slice(0, instanceCount);

        // Render instances
        container.innerHTML = '';
        data.forEach((item, index) => {
            let html = htmlTemplate;

            // Replace placeholders
            Object.keys(item).forEach(key => {
                const placeholder = `{{${key}}}`;
                html = html.split(placeholder).join(item[key]);
            });

            const itemDiv = document.createElement('div');
            itemDiv.className = 'quick-test-item';
            itemDiv.innerHTML = `<style>${css}</style>${html}`;
            container.appendChild(itemDiv);
        });
    }

    // Parse sample data from editor or properties panel
    parseSampleData() {
        let data = [];

        try {
            // Try to parse from sample data editor first
            if (sampleDataEditor) {
                const jsonStr = sampleDataEditor.getValue();
                data = JSON.parse(jsonStr);
                if (!Array.isArray(data)) {
                    data = [data];
                }
            }
        } catch (e) {
            // Fall back to properties panel inputs and textareas
            const inputs = document.querySelectorAll('#placeholderWrapper input, #placeholderWrapper textarea');
            if (inputs.length > 0) {
                const obj = {};
                inputs.forEach(input => {
                    obj[input.name] = input.value || input.placeholder || `[${input.name}]`;
                });
                data = [obj, obj, obj]; // Create 3 instances with same data
            }
        }

        return data.length > 0 ? data : [{ title: 'Example', description: 'Sample component' }];
    }

    // Take snapshot of preview for thumbnail
    takeSnapshot() {
        if (!iframe || !currentComponent) {
            alert('No preview available to capture');
            return;
        }

        const previewContainer = document.getElementById('preview');
        if (!previewContainer) return;

        // Show loading feedback
        const btn = document.getElementById('snapshotBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capturing...';
        btn.disabled = true;

        // Use html2canvas to capture the iframe content
        // Since we can't directly capture iframe content due to CORS,
        // we'll capture the preview container which includes the iframe
        html2canvas(previewContainer, {
            allowTaint: true,
            useCORS: true,
            backgroundColor: '#ffffff',
            scale: 0.5, // Reduce quality for smaller file size
            width: 400,
            height: 300
        }).then(canvas => {
            // Convert canvas to base64 data URL
            const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);

            // Store in component description as JSON metadata
            // This is a workaround - ideally would be a separate field
            let metadata = {};
            try {
                // Try to parse existing description as JSON
                const existingDesc = $('#setting-component-description').val();
                if (existingDesc && existingDesc.startsWith('{')) {
                    metadata = JSON.parse(existingDesc);
                }
            } catch (e) {
                // Not JSON, create new metadata object
                metadata = {
                    description: $('#setting-component-description').val() || '',
                    thumbnail: null
                };
            }

            // Add thumbnail to metadata
            metadata.thumbnail = thumbnailDataUrl;
            metadata.thumbnail_updated = new Date().toISOString();

            // Update description field
            $('#setting-component-description').val(JSON.stringify(metadata));

            // Reset button
            btn.innerHTML = originalHTML;
            btn.disabled = false;

            // Mark as dirty
            isDirty = true;

            // Show success message
            alert('Snapshot captured! Save the component to keep the thumbnail.');
            console.log('Thumbnail captured:', thumbnailDataUrl.substring(0, 50) + '...');
        }).catch(error => {
            console.error('Error capturing snapshot:', error);
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            alert('Error capturing snapshot. Please try again.');
        });
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
                'description': $('#setting-component-description').val(),
                'sample_data': sampleDataEditor ? sampleDataEditor.getValue() : '[]'
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

        // Set up Get Code button
        $("#getCodeBtn").click(function() {
            if (window.ComponentEditor) {
                window.ComponentEditor.generateCode();
            }
        });

        // Set up Export button
        $("#exportBtn").click(function() {
            if (window.ComponentEditor) {
                window.ComponentEditor.exportComponent();
            }
        });

        // Set up Sample Data buttons
        $("#applySampleDataBtn").click(function() {
            if (window.ComponentEditor) {
                window.ComponentEditor.updateQuickTestPreview(1);
                alert('Sample data applied to preview!');
            }
        });

        $("#clearSampleDataBtn").click(function() {
            if (sampleDataEditor) {
                sampleDataEditor.setValue('[]');
            }
        });

        // Set up Snapshot button
        $("#snapshotBtn").click(function() {
            if (window.ComponentEditor) {
                window.ComponentEditor.takeSnapshot();
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
