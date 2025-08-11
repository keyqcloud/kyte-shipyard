// Updated kyte-shipyard-email-template-editor.js
import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

var htmlEditor;
var emailTemplate;
var iframe;
var isDirty = false;
var currentTemplateId = null;
var applicationId = null;
var emailTemplates = [];

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    if (htmlEditor) {
        htmlEditor.setTheme(colorMode);
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

class EmailTemplateManager {
    constructor(kyteSession) {
        this._ks = kyteSession;
        this.init();
    }

    init() {
        try {
            const templateId = this.getTemplateIdFromUrl();
            if (templateId) {
                this.loadTemplateAndApplication(templateId);
            } else {
                console.warn("No template ID found in URL");
                $('#pageLoaderModal').modal('hide');
            }
        } catch (error) {
            console.error("Error initializing email template manager:", error);
            this.showError("Failed to initialize email template editor");
            $('#pageLoaderModal').modal('hide');
        }
    }

    getTemplateIdFromUrl() {
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
                
                if (obj.model === 'EmailTemplate' && obj.idx) {
                    return obj.idx;
                }
            }
        } catch (error) {
            console.error("Error parsing URL parameters manually:", error);
        }

        return null;
    }

    loadTemplateAndApplication(templateId) {
        this._ks.get("EmailTemplate", "id", templateId, [], (response) => {
            if (response.data && response.data[0]) {
                const templateData = response.data[0];
                applicationId = templateData.application.id;
                
                // Set up exit link
                const appObj = {
                    'model': 'Application',
                    'idx': applicationId
                };
                const encoded = encodeURIComponent(btoa(JSON.stringify(appObj)));
                $("#backToSite").attr('href', '/app/emails.html?request=' + encoded);
                
                // Load all templates for this application
                this.loadEmailTemplates(applicationId);
                
                // Set current template and load it
                currentTemplateId = templateId;
            } else {
                this.showError("Email template not found");
                $('#pageLoaderModal').modal('hide');
            }
        }, (error) => {
            console.error("Error loading email template:", error);
            this.showError("Failed to load email template data: " + error);
            $('#pageLoaderModal').modal('hide');
        });
    }

    loadEmailTemplates(appId) {
        const templatesContainer = $("#email-templates-list");
        templatesContainer.html('<div class="loading-templates"><i class="fas fa-spinner fa-spin me-2"></i>Loading templates...</div>');
        
        this._ks.get("EmailTemplate", "application", appId, [], (response) => {
            if (response.data && response.data.length > 0) {
                emailTemplates = response.data;
                this.renderTemplateList();
                
                // Auto-load the current template if it was set during initialization
                if (currentTemplateId) {
                    this.loadTemplateContent(currentTemplateId);
                }
            } else {
                templatesContainer.html('<div class="no-templates">No email templates found</div>');
                $('#pageLoaderModal').modal('hide');
            }
        }, (error) => {
            console.error("Error loading email templates:", error);
            templatesContainer.html('<div class="no-templates">Error loading templates</div>');
            $('#pageLoaderModal').modal('hide');
        });
    }

    renderTemplateList() {
        const templatesContainer = $("#email-templates-list");
        templatesContainer.empty();
        
        emailTemplates.forEach(template => {
            const templateItem = this.createTemplateItem(template);
            templatesContainer.append(templateItem);
        });
        
        // Auto-select current template if set
        if (currentTemplateId) {
            this.selectTemplate(currentTemplateId);
        }
    }

    createTemplateItem(template) {
        const displayName = template.title || template.identifier || 'Untitled Template';
        const identifier = template.identifier || 'no-identifier';
        
        const item = $(`
            <button class="template-item" data-template-id="${template.id}">
                <i class="template-icon fas fa-envelope"></i>
                <div class="template-details">
                    <div class="template-name">${displayName}</div>
                    <div class="template-identifier">${identifier}</div>
                </div>
            </button>
        `);
        
        // Add click handler
        item.on('click', () => {
            this.onTemplateClick(template.id);
        });
        
        return item;
    }

    async onTemplateClick(templateId) {
        // Check for unsaved changes
        if (isDirty) {
            const confirm = await this.confirmUnsavedChanges();
            if (!confirm) return;
        }
        
        this.selectTemplate(templateId);
        this.loadTemplateContent(templateId);
    }

    selectTemplate(templateId) {
        // Update UI
        $('.template-item').removeClass('active');
        $(`.template-item[data-template-id="${templateId}"]`).addClass('active');
        
        // Update current template
        currentTemplateId = templateId;
        
        // Update URL without reload
        try {
            const newUrl = new URL(window.location);
            const obj = {'model': 'EmailTemplate', 'idx': templateId};
            const encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
            newUrl.searchParams.set('request', encoded);
            window.history.replaceState({}, '', newUrl);
        } catch (error) {
            console.warn("Could not update URL:", error);
        }
    }

    loadTemplateContent(templateId) {
        $('#pageLoaderModal').modal('show');
        
        this._ks.get("EmailTemplate", "id", templateId, [], (response) => {
            if (response.data && response.data[0]) {
                emailTemplate = response.data[0];
                this.displayTemplateContent(emailTemplate);
                isDirty = false;
            } else {
                this.showError("Template not found");
            }
            $('#pageLoaderModal').modal('hide');
        }, (error) => {
            console.error("Error loading template content:", error);
            this.showError("Failed to load template content");
            $('#pageLoaderModal').modal('hide');
        });
    }

    displayTemplateContent(template) {
        // Show editor container
        const htmlContainer = $('#HTML');
        const noTemplateMessage = htmlContainer.find('.no-template-message');
        const editorContainer = htmlContainer.find('#htmlEditor');
        
        htmlContainer.removeClass('no-template');
        noTemplateMessage.hide();
        editorContainer.show();
        
        // Update form fields
        $('#setting-email-title').val(template.title || '');
        $('#setting-email-identifier').val(template.identifier || '');
        $('#setting-email-description').val(template.description || '');
        
        // Update header display
        $('#email-title').text(template.title || 'Untitled Template');
        $('#email-identifier').text(template.identifier || 'no-identifier');
        
        // Create or update editor
        if (htmlEditor) {
            htmlEditor.setValue(template.html || '');
        } else {
            this.createEditor(template.html || '');
        }
        
        // Set up form change listeners
        this.setupFormChangeListeners();
        
        // Initialize iframe for preview
        initializeIFrame();
    }

    createEditor(content) {
        htmlEditor = monaco.editor.create(document.getElementById('htmlEditor'), {
            value: content,
            theme: colorMode,
            language: 'html',
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
        
        // Set up change listener
        htmlEditor.onDidChangeModelContent(function(e) {
            isDirty = true;
        });
    }

    setupFormChangeListeners() {
        // Remove existing listeners to avoid duplicates
        $('#setting-email-title, #setting-email-identifier, #setting-email-description').off('input change');
        
        // Add change listeners to form fields
        $('#setting-email-title, #setting-email-identifier, #setting-email-description').on('input change', function() {
            isDirty = true;
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

    save() {
        if (!emailTemplate) {
            return Promise.reject("No template loaded");
        }
        
        return new Promise((resolve, reject) => {
            $('#pageLoaderModal').modal('show');
            
            const templateData = {
                'html': htmlEditor.getValue(),
                'title': $('#setting-email-title').val(),
                'identifier': $('#setting-email-identifier').val(),
                'description': $('#setting-email-description').val()
            };
            
            this._ks.put('EmailTemplate', 'id', emailTemplate.id, templateData, null, [], 
                (response) => {
                    $('#pageLoaderModal').modal('hide');
                    isDirty = false;
                    
                    // Update header with new values
                    $('#email-title').text(templateData.title);
                    $('#email-identifier').text(templateData.identifier);
                    
                    // Update the template in the list
                    const templateItem = $(`.template-item[data-template-id="${emailTemplate.id}"]`);
                    templateItem.find('.template-name').text(templateData.title || templateData.identifier || 'Untitled Template');
                    templateItem.find('.template-identifier').text(templateData.identifier || 'no-identifier');
                    
                    resolve(response);
                }, 
                (error) => {
                    $('#pageLoaderModal').modal('hide');
                    reject(error);
                }
            );
        });
    }
}

function initializeIFrame() {
    var previewContainer = document.getElementById('previewEmailTemplate');
    iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    previewContainer.innerHTML = '';
    previewContainer.appendChild(iframe);
}

function renderHtmlCode() {
    if (!htmlEditor || !iframe) return;
    
    try {
        const htmlContent = htmlEditor.getValue();
        const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
        iframe.src = URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error rendering HTML code:', error);
    }
}

// Global instance
window.EmailTemplateManager = null;

// Main initialization
document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    
    // Store session globally
    window.kyteSession = _ks;
    
    $('#pageLoaderModal').modal('show');

    // Handle URL hash
    let hash = location.hash;
    hash = hash == "" ? '#HTML' : hash;
    $(hash).removeClass('d-none');
    $(hash + '-nav-link').addClass('active');
    
    if (_ks.isSession()) {
        // Initialize the email template manager
        window.EmailTemplateManager = new EmailTemplateManager(_ks);
        
        // Set up save button
        $("#saveCode").click(function() {
            if (window.EmailTemplateManager) {
                window.EmailTemplateManager.save().then(() => {
                    console.log('Template saved successfully');
                }).catch((error) => {
                    alert('Error saving template: ' + error);
                    console.error('Save error:', error);
                });
            }
        });
        
    } else {
        location.href = "/?redir=" + encodeURIComponent(window.location);
    }
});

// Enhanced preview functionality
window.renderHtmlCode = renderHtmlCode;

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
        
        // Update preview when switching to preview tab
        if (target === 'Preview' && typeof renderHtmlCode === 'function') {
            renderHtmlCode();
        }
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidenav').classList.remove('show');
        }
    });
});

// Preview button functionality
document.getElementById('previewEmail')?.addEventListener('click', function() {
    // Switch to preview tab
    document.querySelectorAll('[data-target]').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('[data-target="Preview"]').forEach(btn => btn.classList.add('active'));
    
    document.querySelectorAll('.editor-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.editor-tab[data-target="Preview"]').forEach(tab => tab.classList.add('active'));
    
    document.querySelectorAll('.editor-container, .secondary-content').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById('Preview').classList.add('active');
    
    // Render the preview
    if (typeof renderHtmlCode === 'function') {
        renderHtmlCode();
    }
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
