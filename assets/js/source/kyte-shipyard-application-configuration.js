// Modern Application Configuration JavaScript
let api = null;
let app = null;

let colDefEnvVars = [
    {'targets':0,'data':'key','label':'Key'},
    {'targets':1,'data':'value','label':'Value'},
];

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    
    $('#pageLoaderModal').modal('show');
    
    if (_ks.isSession()) {
        let idx = _ks.getPageRequest();
        idx = idx.idx;

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
            
            // Populate form fields
            populateApplicationSettings(app);
            
            // Load data models
            loadDataModels(_ks, idx, app);
            
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

// Setup navigation handlers
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
        });
    });
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
    
    // Save settings handler
    $("#saveSettings").click(function(e) {
        e.preventDefault();
        saveApplicationSettings(_ks, idx);
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

// Save application settings
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
    
    // Generate Kyte connection code
    let connect = `let endpoint = 'https://${api.kyte_api}';var k = new Kyte(endpoint, '${api.kyte_pub}', '${api.kyte_iden}', '${api.kyte_num}', '${app.identifier}');k.init();\n\n`;
    let obfuscatedConnect = JavaScriptObfuscator.obfuscate(connect, {
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

    // Prepare update data
    let updateData = {
        'obfuscate_kyte_connect': parseInt($("#obfuscate_kyte_connect").val()),
        'kyte_connect': connect,
        'kyte_connect_obfuscated': obfuscatedConnect.getObfuscatedCode(),
        'user_model': userModelIdx == 0 ? null : $('#user_model option:selected').text(),
        'username_colname': userModelIdx == 0 ? null : $("#username_colname option:selected").text(),
        'password_colname': userModelIdx == 0 ? null : $("#password_colname option:selected").text(),
        'org_model': userModelIdx == 0 || orgModelIdx == 0 ? null : $('#org_model option:selected').text(),
        'userorg_colname': userModelIdx == 0 || orgModelIdx == 0 ? null : $("#userorg_colname option:selected").text(),
    };

    // Show loading state
    const saveBtn = $("#saveSettings");
    const originalText = saveBtn.html();
    saveBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Saving...').prop('disabled', true);

    // Save settings
    _ks.put('Application', 'id', idx, updateData, null, [], function(r) {
        if (r.data.length > 0) {
            showSuccess("Application settings successfully updated!");
            // Update local app object
            app = {...app, ...updateData};
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