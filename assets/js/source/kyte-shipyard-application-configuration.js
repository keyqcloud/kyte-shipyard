// Add _ks to global scope or create a stored reference
let globalKyteSession = null;

// Modern Application Configuration JavaScript
let api = null;
let app = null;
let currentKyteCode = '';
let systemKyteCode = '';
let hasCodeDifferences = false;

let colDefEnvVars = [
    {'targets':0,'data':'key','label':'Key'},
    {'targets':1,'data':'value','label':'Value'},
];

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    // Store _ks globally so it can be accessed from modal onclick handlers
    globalKyteSession = _ks;

    $('#pageLoaderModal').modal('show');

    if (_ks.isSession()) {
        // Initialize application sidebar navigation
        if (typeof initAppSidebar === 'function') {
            initAppSidebar();
        }

        let idx = _ks.getPageRequest();
        idx = idx.idx;

        // Store application ID for navigation
        localStorage.setItem('currentAppId', idx);

        // Environment Variables form fields
        let fldsEnvVars = [
            [
                {
                    'field':'key',
                    'type':'text',
                    'label':'Key',
                    'required':true
                }
            ],
            [
                {
                    'field':'value',
                    'type':'textarea',
                    'label':'Value',
                    'required':true
                }
            ]
        ];
    
        let hidden = [
            {
                'name': 'application',
                'value': idx
            }
        ];

        // Load application data
        _ks.get("Application", "id", idx, [], function(r) {
            if (r.data.length == 0) {
                alert('Failed to retrieve app data.');
                return;
            }
            
            api = r;
            app = r.data[0];
            
            // Update page title and navigation
            document.getElementById('app-name').textContent = app.name;
            
            // Generate navigation
            let obj = {'model': 'Application', 'idx':idx};
            let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
            let appnav = generateAppNav(encoded);
            let navbar = new KyteNav("#mainnav", appnav, null, `<i class="fas fa-rocket me-2"></i>${app.name}`);
            navbar.create();

            // Translate the page after navigation is created
            if (window.kyteI18n) {
                window.kyteI18n.translateDOM();
            }
            
            if (app) {
                initializeKyteConnectComparison();
            
                // Populate form fields
                populateApplicationSettings(app);
                
                // Load data models
                loadDataModels(_ks, idx, app);

                // Setup event handlers for Kyte Connect section
                setupKyteConnectHandlers(_ks);
            }
            
            // Initialize environment variables table
            initializeEnvironmentVariables(_ks, idx, hidden, fldsEnvVars);
        });
        
        // Setup navigation event handlers
        setupNavigationHandlers();
        
        // Setup form event handlers
        setupFormEventHandlers(_ks, idx);
        
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});

// Populate application settings form
function populateApplicationSettings(app) {
    $("#obfuscate_kyte_connect").val(parseInt(app.obfuscate_kyte_connect));

    // AWS credentials
    if (typeof app.aws_key === "object" && app.aws_key) {
        $("#aws_username").val(app.aws_key.username || '');
        $("#aws_public_key").val(app.aws_key.public_key || '');
    }

    $("#userorg_colname").val(app.userorg_colname);

    // Application default language
    if (app.default_language) {
        $("#app_default_language").val(app.default_language);
    } else {
        $("#app_default_language").val('en'); // Default to English
    }
}

// Load and populate data models
function loadDataModels(_ks, idx, app) {
    let modelIdx = null;
    let orgIdx = null;

    _ks.get('DataModel', 'application', idx, [], function(r) {
        if(r.data.length > 0) {
            // Clear existing options (keep default)
            $("#user_model option:not(:first)").remove();
            $("#org_model option:not(:first)").remove();
            
            r.data.forEach(element => {
                if (element.name == app.user_model) {
                    modelIdx = element.id;
                }
                if (element.name == app.org_model) {
                    orgIdx = element.id;
                }
                
                // Add to user model dropdown
                $("#user_model").append(`<option value="${element.id}" ${element.name == app.user_model ? 'selected' : ''}>${element.name}</option>`);
                
                // Add to org model dropdown
                $("#org_model").append(`<option value="${element.id}" ${element.name == app.org_model ? 'selected' : ''}>${element.name}</option>`);
            });

            // Load model attributes if user model is selected
            if (modelIdx != null) {
                loadModelAttributes(_ks, modelIdx, orgIdx, app);
            } else {
                resetToDefaults();
            }
        }
        $('#pageLoaderModal').modal('hide');
    });
}

// Load model attributes for selected user model
function loadModelAttributes(_ks, modelIdx, orgIdx, app) {
    _ks.get('ModelAttribute', 'dataModel', modelIdx, [], function(r) {
        if(r.data.length > 0) {
            // Clear attribute dropdowns
            $("#username_colname, #password_colname, #userorg_colname").empty();
            
            if (orgIdx != null) {
                $("#userorg_colname").append('<option value="0">None</option>');
            }
            
            r.data.forEach(element => {
                // Populate username dropdown
                $("#username_colname").append(`<option value="${element.id}" ${element.name == app.username_colname ? 'selected' : ''}>${element.name}</option>`);
                
                // Populate password dropdown
                $("#password_colname").append(`<option value="${element.id}" ${element.name == app.password_colname ? 'selected' : ''}>${element.name}</option>`);
                
                // Populate org relationship dropdown if org model exists
                if (orgIdx != null) {
                    $("#userorg_colname").append(`<option value="${element.id}" ${element.name == app.userorg_colname ? 'selected' : ''}>${element.name}</option>`);
                }
            });
        }
        
        // Enable form controls
        $("#username_colname, #password_colname, #userorg_colname, #org_model").prop('disabled', false);
        $("#default_org_model").html('None');
    });
}

// Reset form to defaults
function resetToDefaults() {
    $("#username_colname, #password_colname").prop('disabled', true).empty();
    $("#userorg_colname").prop('disabled', true).empty();
    $("#org_model").prop('disabled', true).val(0);
    $("#default_org_model").html('Kyte Framework Account (Default)');
}

// Initialize environment variables section
function initializeEnvironmentVariables(_ks, idx, hidden, fldsEnvVars) {
    var tblEnvVars = new KyteTable(_ks, $("#tblEnvVars"), {'name':"KyteEnvironmentVariable",'field':'application','value':idx}, colDefEnvVars, true, [0,"asc"], true, true);
    tblEnvVars.init();
    
    var frmEnvVars = new KyteForm(_ks, $("#modalForm"), 'KyteEnvironmentVariable', hidden, fldsEnvVars, 'Environment Variable', tblEnvVars, true, $("#newEnvVar"));
    frmEnvVars.init();
    tblEnvVars.bindEdit(frmEnvVars);
}

// Setup form event handlers
function setupFormEventHandlers(_ks, idx) {
    // User model change handler
    $("#user_model").change(function(e) {
        handleUserModelChange(_ks, $(this).val());
    });
    
    // Org model change handler
    $("#org_model").change(function(e) {
        handleOrgModelChange(_ks, $(this).val());
    });
    
    // Field validation handlers
    $("#username_colname, #password_colname, #userorg_colname").change(function(e) {
        validateFieldSelection();
    });
    
    // App settings save handler
    $("#saveAppSettings").click(function(e) {
        e.preventDefault();
        saveApplicationSettings(_ks, idx);
    });
    
    // Obfuscation settings save handler
    $("#saveObfuscationSettings").click(function(e) {
        e.preventDefault();
        saveObfuscationSettings(_ks, idx);
    });
}

// Handle user model change
function handleUserModelChange(_ks, userModelIdx) {
    userModelIdx = parseInt(userModelIdx);
    let orgModelIdx = parseInt($("#org_model").val());

    if (userModelIdx == 0) {
        // Reset to default
        resetToDefaults();
    } else {
        if (userModelIdx != orgModelIdx && typeof userModelIdx === 'number') {
            $('#pageLoaderModal').modal('show');
            
            _ks.get('ModelAttribute', 'dataModel', userModelIdx, [], function(r) {
                // Clear dropdowns
                $("#username_colname, #password_colname, #userorg_colname").empty();
                
                if(r.data.length > 0) {
                    $("#username_colname, #password_colname, #userorg_colname").prop('disabled', false);
                    $("#userorg_colname").append('<option value="0">None</option>');
                    
                    r.data.forEach(element => {
                        $("#username_colname").append(`<option value="${element.id}">${element.name}</option>`);
                        $("#password_colname").append(`<option value="${element.id}">${element.name}</option>`);
                        $("#userorg_colname").append(`<option value="${element.id}">${element.name}</option>`);
                    });
                }
                
                $("#org_model").prop('disabled', false);
                $("#default_org_model").html('None');
                
                if (orgModelIdx == 0) {
                    $("#userorg_colname").val(0).prop('disabled', true);
                } else {
                    $("#userorg_colname").prop('disabled', false);
                }
                
                $('#pageLoaderModal').modal('hide');
            });
        } else {
            showError("User table and organization table must be different");
        }
    }
}

// Handle org model change
function handleOrgModelChange(_ks, orgModelIdx) {
    let userModelIdx = parseInt($("#user_model").val());
    orgModelIdx = parseInt(orgModelIdx);

    if (userModelIdx == orgModelIdx) {
        showError("User table and organization table must be different");
        return;
    }
    
    if (orgModelIdx == 0) {
        $("#userorg_colname").val(0).prop('disabled', true);
    } else {
        _ks.get('ModelAttribute', 'dataModel', userModelIdx, [], function(r) {
            if(r.data.length > 0) {
                $("#userorg_colname").empty().append('<option value="0">None</option>');
                
                r.data.forEach(element => {
                    const selected = element.name == app.userorg_colname ? 'selected' : '';
                    $("#userorg_colname").append(`<option value="${element.id}" ${selected}>${element.name}</option>`);
                });
            }
            $("#userorg_colname").prop('disabled', false);
        });
    }
}

// Validate field selection to prevent conflicts
function validateFieldSelection() {
    let usernameColname = parseInt($("#username_colname").val());
    let passwordColname = parseInt($("#password_colname").val());
    let userorgColname = parseInt($("#userorg_colname").val());

    if (usernameColname == passwordColname) {
        showError("Username/email field cannot be the same as the password field.");
        return false;
    }
    if (usernameColname == userorgColname) {
        showError("Username/email field cannot be the same as the user organization field.");
        return false;
    }
    if (passwordColname == userorgColname) {
        showError("Password field cannot be the same as the user organization field.");
        return false;
    }
    
    return true;
}

// Enhanced notification functions
function showSuccess(message) {
    // Create a modern toast notification
    const toast = createToast('success', message);
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showError(message) {
    // Create a modern toast notification
    const toast = createToast('error', message);
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function createToast(type, message) {
    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        max-width: 400px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        background: ${isSuccess ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
        animation: slideIn 0.3s ease-out;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add animation keyframes if not already added
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    return toast;
}

// Generate system Kyte Connect code
function generateSystemKyteCode() {
    if (!api || !app) return '';
    
    return `let endpoint = 'https://${api.kyte_api}';
var k = new Kyte(endpoint, '${api.kyte_pub}', '${api.kyte_iden}', '${api.kyte_num}', '${app.identifier}');
k.init();

`;
}

// Initialize Kyte Connect comparison
function initializeKyteConnectComparison() {
    // Get current code from app
    currentKyteCode = app.kyte_connect || '';
    
    // Generate system code
    systemKyteCode = generateSystemKyteCode();
    
    // Display codes
    displayKyteCodes();
    
    // Compare codes
    compareKyteCodes();
}

// Display Kyte codes in the comparison panels
function displayKyteCodes() {
    const currentCodeElement = document.getElementById('current-kyte-code');
    const systemCodeElement = document.getElementById('system-kyte-code');
    
    // Display current code
    if (currentKyteCode) {
        currentCodeElement.innerHTML = `<code>${escapeHtml(currentKyteCode)}</code>`;
        document.getElementById('current-version-date').textContent = app.updated_at ? 
            formatDate(app.updated_at) : 'Unknown';
    } else {
        currentCodeElement.innerHTML = '<code class="text-muted">No Kyte Connect code found</code>';
        document.getElementById('current-version-date').textContent = 'Not set';
    }
    
    // Display system code
    systemCodeElement.innerHTML = `<code>${escapeHtml(systemKyteCode)}</code>`;
    document.getElementById('system-version-date').textContent = formatDate(new Date());
}

// Compare Kyte codes and update UI
function compareKyteCodes() {
    const statusBanner = document.getElementById('version-status-banner');
    const statusText = statusBanner.querySelector('.status-text');
    const statusIcon = statusBanner.querySelector('.status-icon');
    const updateButton = document.getElementById('update-to-system');
    const diffSummary = document.getElementById('diff-summary');
    
    // Remove existing status classes
    statusBanner.classList.remove('up-to-date', 'outdated', 'error');
    
    if (!currentKyteCode) {
        // No current code - needs initial setup
        statusBanner.classList.add('outdated');
        statusIcon.className = 'fas fa-exclamation-triangle status-icon';
        statusText.textContent = 'No Kyte Connect code found - Update required';
        updateButton.disabled = false;
        updateButton.innerHTML = '<i class="fas fa-download me-2"></i>Generate Initial Code';
        hasCodeDifferences = true;
        showDiffSummary(true, 0, 0, 1);
    } else if (currentKyteCode.trim() === systemKyteCode.trim()) {
        // Codes match - up to date
        statusBanner.classList.add('up-to-date');
        statusIcon.className = 'fas fa-check-circle status-icon';
        statusText.textContent = 'Kyte Connect code is up to date';
        updateButton.disabled = true;
        updateButton.innerHTML = '<i class="fas fa-check me-2"></i>Up to Date';
        hasCodeDifferences = false;
        diffSummary.style.display = 'none';
    } else {
        // Codes differ - update available
        statusBanner.classList.add('outdated');
        statusIcon.className = 'fas fa-sync-alt status-icon';
        statusText.textContent = 'System version available - Update recommended';
        updateButton.disabled = false;
        updateButton.innerHTML = '<i class="fas fa-upload me-2"></i>Update to System Version';
        hasCodeDifferences = true;
        
        // Calculate basic diff stats
        const diffStats = calculateDiffStats(currentKyteCode, systemKyteCode);
        showDiffSummary(false, diffStats.additions, diffStats.deletions, diffStats.modifications);
    }
    
    // Update panel styling based on differences
    const currentPanel = document.querySelector('.code-panel.current-version');
    const systemPanel = document.querySelector('.code-panel.system-version');
    
    if (hasCodeDifferences) {
        currentPanel.classList.add('has-changes');
        systemPanel.classList.add('has-changes');
    } else {
        currentPanel.classList.remove('has-changes');
        systemPanel.classList.remove('has-changes');
    }
}

// Calculate basic diff statistics
function calculateDiffStats(current, system) {
    const currentLines = current.split('\n').filter(line => line.trim());
    const systemLines = system.split('\n').filter(line => line.trim());
    
    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    
    // Simple line-by-line comparison
    const maxLines = Math.max(currentLines.length, systemLines.length);
    
    for (let i = 0; i < maxLines; i++) {
        const currentLine = currentLines[i] || '';
        const systemLine = systemLines[i] || '';
        
        if (!currentLine && systemLine) {
            additions++;
        } else if (currentLine && !systemLine) {
            deletions++;
        } else if (currentLine !== systemLine) {
            modifications++;
        }
    }
    
    return { additions, deletions, modifications };
}

// Show diff summary
function showDiffSummary(isInitial, additions, deletions, modifications) {
    const diffSummary = document.getElementById('diff-summary');
    
    if (isInitial) {
        diffSummary.style.display = 'block';
        document.getElementById('additions-count').textContent = 'Initial';
        document.getElementById('deletions-count').textContent = '0';
        document.getElementById('modifications-count').textContent = 'setup';
    } else if (additions > 0 || deletions > 0 || modifications > 0) {
        diffSummary.style.display = 'block';
        document.getElementById('additions-count').textContent = additions;
        document.getElementById('deletions-count').textContent = deletions;
        document.getElementById('modifications-count').textContent = modifications;
    } else {
        diffSummary.style.display = 'none';
    }
}

// Setup Kyte Connect event handlers
function setupKyteConnectHandlers(_ks) {
    // Refresh comparison button
    document.getElementById('refresh-comparison').addEventListener('click', function() {
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Refreshing...';
        this.disabled = true;
        
        setTimeout(() => {
            systemKyteCode = generateSystemKyteCode();
            displayKyteCodes();
            compareKyteCodes();
            
            this.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Refresh Comparison';
            this.disabled = false;
            
            showSuccess('Comparison refreshed successfully');
        }, 500);
    });
    
    // Update to system version button
    document.getElementById('update-to-system').addEventListener('click', function() {
        if (!hasCodeDifferences) return;
        
        updateKyteConnectCode(_ks);
    });
    
    // View detailed diff button
    document.getElementById('view-diff').addEventListener('click', function() {
        showDetailedDiff();
    });
}

// Update Kyte Connect code to system version
function updateKyteConnectCode(_ks) {
    const updateButton = document.getElementById('update-to-system');
    const originalText = updateButton.innerHTML;
    
    updateButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Updating...';
    updateButton.disabled = true;
    
    // Generate obfuscated version if needed
    const obfuscateEnabled = parseInt(document.getElementById('obfuscate_kyte_connect').value);
    let obfuscatedCode = '';
    
    if (obfuscateEnabled) {
        try {
            const obfuscated = JavaScriptObfuscator.obfuscate(systemKyteCode, {
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
            obfuscatedCode = obfuscated.getObfuscatedCode();
        } catch (error) {
            console.error('Obfuscation failed:', error);
            showError('Failed to obfuscate code. Saving unobfuscated version.');
        }
    }
    
    // Prepare update data - only update Kyte Connect related fields
    const updateData = {
        'kyte_connect': systemKyteCode,
        'kyte_connect_obfuscated': obfuscatedCode,
        'republish_kyte_connect': 1 // Reset flag after manual update
    };
    
    // Update via API
    _ks.put('Application', 'id', app.id, updateData, null, [], function(r) {
        if (r.data.length > 0) {
            // Update local app object
            app.kyte_connect = systemKyteCode;
            app.kyte_connect_obfuscated = obfuscatedCode;
            
            // Update current code and refresh comparison
            currentKyteCode = systemKyteCode;
            displayKyteCodes();
            compareKyteCodes();
            
            showSuccess('Kyte Connect code updated successfully!');
        } else {
            showError('Failed to update Kyte Connect code. Please try again.');
        }
        
        updateButton.innerHTML = originalText;
        updateButton.disabled = false;
    }, function(err) {
        showError('Failed to update Kyte Connect code: ' + err);
        updateButton.innerHTML = originalText;
        updateButton.disabled = false;
    });
}

// Show detailed diff in a modal
function showDetailedDiff() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-search me-2"></i>
                        Detailed Code Comparison
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6 class="text-primary mb-3">
                                <i class="fas fa-file-code me-2"></i>
                                Current Version
                            </h6>
                            <pre class="diff-code current"><code>${escapeHtml(currentKyteCode || 'No code available')}</code></pre>
                        </div>
                        <div class="col-md-6">
                            <h6 class="text-success mb-3">
                                <i class="fas fa-cloud me-2"></i>
                                System Version
                            </h6>
                            <pre class="diff-code system"><code>${escapeHtml(systemKyteCode)}</code></pre>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    ${hasCodeDifferences ? '<button type="button" class="btn btn-primary" id="modal-update-btn">Update to System Version</button>' : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add diff styles
    const style = document.createElement('style');
    style.textContent = `
        .diff-code {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 8px;
            max-height: 500px;
            overflow: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.85rem;
            line-height: 1.4;
        }
        .diff-code.current {
            border-left: 4px solid #3b82f6;
        }
        .diff-code.system {
            border-left: 4px solid #10b981;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Add event listener for the update button using the global reference
    const updateBtn = modal.querySelector('#modal-update-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', function() {
            updateKyteConnectCode(globalKyteSession);
            bsModal.hide();
        });
    }
    
    // Remove modal after hiding
    modal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    });
}

// main save function to exclude Kyte Connect auto-generation
function saveApplicationSettings(_ks, idx) {
    if (!validateFieldSelection()) {
        return;
    }
    
    // Validate required fields for custom user model
    let userModelIdx = parseInt($("#user_model").val());
    let orgModelIdx = parseInt($("#org_model").val());
    let userorgColname = parseInt($("#userorg_colname").val());
    
    if (userModelIdx != 0) {
        if (orgModelIdx != 0 && userorgColname == 0) {
            showError("Please choose an organization field.");
            return;
        }
    }

    // Prepare update data - REMOVED kyte_connect auto-generation
    let updateData = {
        'user_model': userModelIdx == 0 ? null : $('#user_model option:selected').text(),
        'username_colname': userModelIdx == 0 ? null : $("#username_colname option:selected").text(),
        'password_colname': userModelIdx == 0 ? null : $("#password_colname option:selected").text(),
        'org_model': userModelIdx == 0 || orgModelIdx == 0 ? null : $('#org_model option:selected').text(),
        'userorg_colname': userModelIdx == 0 || orgModelIdx == 0 ? null : $("#userorg_colname option:selected").text(),
        'default_language': $("#app_default_language").val()
    };

    // Show loading state
    const saveBtn = $("#saveAppSettings");
    const originalText = saveBtn.html();
    saveBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Saving...').prop('disabled', true);

    // Save settings
    _ks.put('Application', 'id', idx, updateData, null, [], function(r) {
        if (r.data.length > 0) {
            showSuccess("Application settings successfully updated!");
            // Update local app object
            app = {...app, ...updateData};
            
            // Refresh Kyte Connect comparison in case obfuscation setting changed
            if (document.getElementById('KyteConnect').classList.contains('active')) {
                initializeKyteConnectComparison();
            }
        } else {
            showError("Unable to update application settings. Please try again or contact support.");
        }
        
        // Restore button
        saveBtn.html(originalText).prop('disabled', false);
    }, function(err) {
        showError("Unable to update application settings. Please try again or contact support. " + err);
        saveBtn.html(originalText).prop('disabled', false);
    });
}

function saveObfuscationSettings(_ks, idx) {
    // Get current obfuscation setting to check if it actually changed
    const currentObfuscationSetting = parseInt(app.obfuscate_kyte_connect);
    const newObfuscationSetting = parseInt($("#obfuscate_kyte_connect").val());
    
    // Prepare update data - ONLY obfuscation setting
    let updateData = {
        'obfuscate_kyte_connect': newObfuscationSetting
    };

    // Show loading state for obfuscation button
    const saveBtn = $("#saveObfuscationSettings");
    const originalText = saveBtn.html();
    saveBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Saving...').prop('disabled', true);

    // Save obfuscation settings
    _ks.put('Application', 'id', idx, updateData, null, [], function(r) {
        if (r.data.length > 0) {
            // Update local app object first
            app = {...app, ...updateData};
            
            // Only regenerate Kyte Connect code if the setting actually changed
            if (currentObfuscationSetting !== newObfuscationSetting) {
                updateKyteConnectCode(_ks);
            }
            
            showSuccess("Obfuscation settings successfully updated!");
            
            // Refresh Kyte Connect comparison since obfuscation setting changed
            if (document.getElementById('KyteConnect').classList.contains('active')) {
                initializeKyteConnectComparison();
            }
        } else {
            showError("Unable to update obfuscation settings. Please try again or contact support.");
        }
        
        // Restore button
        saveBtn.html(originalText).prop('disabled', false);
    }, function(err) {
        showError("Unable to update obfuscation settings. Please try again or contact support. " + err);
        saveBtn.html(originalText).prop('disabled', false);
    });
}

// Navigation handlers to initialize Kyte Connect when section is shown
function setupNavigationHandlers() {
    document.querySelectorAll('[data-section]').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // Update active nav item
            document.querySelectorAll('[data-section]').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(section).classList.add('active');
            
            // Initialize Kyte Connect comparison when that section is shown
            if (section === 'KyteConnect' && api && app) {
                initializeKyteConnectComparison();
            }
        });
    });
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    if (!date) return 'Unknown';
    
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}