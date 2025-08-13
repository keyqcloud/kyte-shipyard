let currentDomainData = null;
let siteId = null;

// Enhanced domain state management
let validationStartTime = null;
let validationTimer = null;
let progressInterval = null;

// Navigation Management Variables
let currentNavigationData = null;
let currentSitePages = [];
let navigationItems = [];
let navigationItemCount = 1;

// Side Navigation Management Variables
let currentSideNavData = null;
let sideNavItems = [];
let sideNavItemCount = 1;
let currentColumnStyle = 0;
let currentNavItemStyle = 0;

let scriptElement = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Script Name',
            'required':true
        },
        {
            'field':'s3key',
            'type':'text',
            'label':'File Name',
            'required':true
        },
    ],
    [
        {
            'field':'script_type',
            'type':'select',
            'label':'Script Stype',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    'css': 'CSS Stylesheet',
                    'js': 'JavaScript'
                }
            }
        },
        {
            'field':'include_all',
            'type':'select',
            'label':'Globally Include',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    0: 'No',
                    1: 'Yes'
                }
            }
        }
    ],
    [
        {
            'field':'description',
            'type':'textarea',
            'label':'Description',
            'required':false
        },
    ],
];

let libraryElement = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Script Name',
            'required':true
        },
        {
            'id':'library_script_type',
            'field':'script_type',
            'type':'select',
            'label':'Script Type',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    'css': 'CSS Stylesheet',
                    'js': 'JavaScript'
                }
            }
        },
        {
            'id':'library_is_js_module',
            'field':'is_js_module',
            'type':'select',
            'label':'JavaScript Module',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    0: 'No',
                    1: 'Yes'
                }
            }
        },
        {
            'field':'include_all',
            'type':'select',
            'label':'Globally Include',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    0: 'No',
                    1: 'Yes'
                }
            }
        }
    ],
    [

        {
            'field':'link',
            'type':'text',
            'label':'Link',
            'required':true
        },
    ],
    [
        {
            'field':'description',
            'type':'textarea',
            'label':'Description',
            'required':false
        },
    ],
];
function checkScriptTypeAndUpdateModule() {
    let scriptType = $("#library_script_type").val();
    if (scriptType == 'js') {
        $("#library_is_js_module").prop('disabled', false);
    } else {
        $("#library_is_js_module").val(0);
        $("#library_is_js_module").prop('disabled', true);
    }
}

let sectionsFormElement = [
    [
        {
            'field':'title',
            'type':'text',
            'label':'Section Name',
            'required':true
        },
        {
            'field':'category',
            'type':'select',
            'label':'Category',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    'header': 'Header',
                    'footer': 'Footer',
                    'other': 'Other'
                }
            }
        },
    ],
    [
        {
            'field':'description',
            'type':'text',
            'label':'Description',
            'required':true
        },
    ],
];

let mediaElements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name',
            'required':true
        },
    ],
    [
        {
            'field':'media',
            'type':'file',
            'label':'Static asset file',
            'required':true
        },
    ]
];

let colDefPage = [
    {'targets':0,'data':'title','label':'Page Title'},
    {'targets':1,'data':'s3key','label':'Path', render: function(data, type, row, meta) { return '/'+data; }},
    {'targets':2,'data':'protected','label':'Access', render: function(data, type, row, meta) { return parseInt(data) ? 'Protected' : 'Public'; }},
    {'targets':3,'data':'page_type','label':'Editor', render: function(data, type, row, meta) { return data == 'block' ? 'Block' : 'Code'; }},
    {'targets':4,'data':'state','label':'Status', render: function(data, type, row, meta) { if (data == 0) { return 'Not Published'; } else if (data == 1) { return 'Published'; } else { return 'Published (Stale)'; }}},
    {'targets':5,'data':'date_modified','label':'Last Modified'},
];

let colDefSections = [
    {'targets':0,'data':'title','label':'Section Title'},
    {'targets':1,'data':'category','label':'Category'},
    {'targets':2,'data':'description','label':'Description'},
    {'targets':3,'data':'date_modified','label':'Last Modified', render: function(data, type, row, meta) { return data ? data : ''; }},
];

let colDefMedia = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'s3key','label':'Path', render: function(data, type, row, meta) { if (row.site.cfMediaDomain) return 'https://'+row.site.cfMediaDomain+'/'+data; else return '/'+data; }}
];

// table def
let colDefScript = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'script_type','label':'Type', render: function(data, type, row, meta) { if (data == 'css') { return 'Stylesheet'; } else if (data == 'js') { return 'JavaScript'+(row.is_js_module ? ' (module)' : ''); } else { return 'Unknown'; } }},
    {'targets':2,'data':'s3key','label':'Path'},
    {'targets':3,'data':'state','label':'Status', render: function(data, type, row, meta) { if (data == 0) { return 'Not Published'; } else if (data == 1) { return 'Published'; } else { return 'Published (Stale)'; }}},
    {'targets':4,'data':'include_all','label':'Include All', render: function(data, type, row, meta) { if (data == 0) { return 'No'; } else if (data == 1) { return 'Yes'; } else { return 'Unknown'; }}},
    {'targets':5,'data':'date_modified','label':'Date Modified', render: function(data, type, row, meta) { return data ? data : '' }}
];

let colDefLibrary = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'script_type','label':'Type', render: function(data, type, row, meta) { if (data == 'css') { return 'Stylesheet'; } else if (data == 'js') { return 'JavaScript'+(row.is_js_module ? ' (module)' : ''); } else { return 'Unknown'; } }},
    {'targets':2,'data':'link','label':'Link'},
    {'targets':3,'data':'include_all','label':'Include All', render: function(data, type, row, meta) { if (data == 0) { return 'No'; } else if (data == 1) { return 'Yes'; } else { return 'Unknown'; }}},
    {'targets':4,'data':'date_modified','label':'Date Modified', render: function(data, type, row, meta) { return data ? data : '' }}
];

let app = null;

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Pages' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        let hidden = [
            {
                'name': 'site',
                'value': idx
            }
        ];

        _ks.get("KyteSite", "id", idx, [], function(r) {
            if (r.data[0]) {
                app = r.data[0].application;
                data = r.data[0];
                // if site is not active display a message
                if (data.status != 'active') {
                    $("#site-detail-page-wrapper").html(`<div class="container"><div class="my-5 alert alert-info text-center" role="alert"><i class="my-3 d-block fas fa-exclamation fa-3x"></i><h3>We are ${data.status} your site.</h3><h4 style="font-weight:300">Please wait until the operation is completed.</h4><span class="fas fa-sync fa-spin my-4"></span></div></div>`);
                    if (data.status == 'creating') {
                        // check status every minute
                        setTimeout(function() {
                            _ks.get("KyteSite", "id", idx, [], function(r) {
                                if (r.data[0].status == 'active') {
                                    location.reload();
                                }
                            });
                        }, 6000);
                    }
                }
                $("#site-name").html(data.name);
                $("#domain-name").html('<i class="fas fa-link me-2"></i>'+(data.aliasDomain ? data.aliasDomain : data.cfDomain));
                $("#domain-name").attr('href', 'https://'+(data.aliasDomain ? data.aliasDomain : data.cfDomain));
                $("#region").html(data.region);
                $("#aliasDomain").val(data.aliasDomain);
                $("#default_lang").val(data.default_lang);
                $("#ga_code").val(data.ga_code);
                $("#gtm_code").val(data.gtm_code);

                let obj = {'model': 'KyteSite', 'idx':data.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#createPage").attr('href', '/app/page/wizard.html?request='+encoded);

                obj = {'model': 'Application', 'idx':r.data[0].application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                
                let appnav = generateAppNav(encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, `<i class="fas fa-rocket me-2"></i>${r.data[0].application.name}`);
                navbar.create();

                // pages
                var tblPage = new KyteTable(_ks, $("#pages-table"), {'name':'KytePage','field':'site','value':idx}, colDefPage, true, [0,"asc"], false, true, 'id', '/app/page/');
                tblPage.customAction = [
                    {
                        'className': 'open-block-editor',
                        'label': 'Open in Block Editor',
                        'faicon': 'fas fa-cubes',
                        'callback': function(data, model) {
                            obj = {'model': model, 'idx':data['id']};
                            encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                            location.href='/app/page/blockeditor.html?request='+encoded;
                        }
                    },
                    {
                        'className': 'open-code-editor',
                        'label': 'Open in Code Editor',
                        'faicon': 'fas fa-code',
                        'callback': function(data, model) {
                            obj = {'model': model, 'idx':data['id']};
                            encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                            location.href='/app/page/?mode=code&request='+encoded;
                        }
                    }
                ];
                // tblPage.targetBlank = true;
                tblPage.init();

                // scripts
                var tblScript = new KyteTable(_ks, $("#scripts-table"), {'name':"KyteScript",'field':"site",'value':idx}, colDefScript, true, [0,"asc"], false, true, 'id', '/app/script/');
                tblScript.init();
                var modalFormScript = new KyteForm(_ks, $("#modalFormScript"), 'KyteScript', hidden, scriptElement, 'Script', tblScript, true, $("#newScript"));
                modalFormScript.success = function(r) {
                    if (r.data[0]) {
                        let obj = {'model': 'KyteScript', 'idx':r.data[0].id};
                        let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                        location.href="/app/script/?request="+encoded;
                    }
                }
                modalFormScript.init();
                tblScript.bindEdit(modalFormScript);

                // Library
                var tblLibrary = new KyteTable(_ks, $("#libraries-table"), {'name':"KyteLibrary",'field':"site",'value':idx}, colDefLibrary, true, [0,"asc"], true, true);
                tblLibrary.init();
                var modalFormLibrary = new KyteForm(_ks, $("#modalFormLibrary"), 'KyteLibrary', hidden, libraryElement, 'Script', tblLibrary, true, $("#addLibrary"));
                modalFormLibrary.init();
                tblLibrary.bindEdit(modalFormLibrary);
                checkScriptTypeAndUpdateModule();
                $("#library_script_type").change(function() {
                    checkScriptTypeAndUpdateModule();
                });

                // media
                var tblMedia = new KyteTable(_ks, $("#media-table"), {'name':"Media",'field':"site",'value':idx}, colDefMedia, true, [0,"asc"], false, true);
                tblMedia.init();
                var modalFormMedia = new KyteForm(_ks, $("#modalFormMedia"), 'Media', hidden, mediaElements, 'Media', tblMedia, true, $("#newMedia"));
                modalFormMedia.init();
                tblMedia.bindEdit(modalFormMedia);

                // sections
                var tblSections = new KyteTable(_ks, $("#sections-table"), {'name':'KyteSectionTemplate','field':'site','value':idx}, colDefSections, true, [0,"asc"], true, true, 'id', '/app/section/');
                tblSections.initComplete = function() {
                    $('#pageLoaderModal').modal('hide');
                }
                tblSections.init();
                var modalFormSection = new KyteForm(_ks, $("#modalFormSection"), 'KyteSectionTemplate', hidden, sectionsFormElement, 'Section', tblSections, true, $("#addSection"));
                modalFormSection.init();
                tblSections.bindEdit(modalFormSection);

                // domain
                loadDomainData(_ks, idx);
            }
            $('#pageLoaderModal').modal('hide');
        });

        // update org and user model in backend
        $("#saveSettings").click(function(e) {
            e.preventDefault();

            let aliasDomain = $("#aliasDomain").val();
            let default_lang = $("#default_lang").val();
            let ga_code = $("#ga_code").val();
            let gtm_code = $("#gtm_code").val();

            _ks.put('KyteSite', 'id', idx,
            {
                'aliasDomain':aliasDomain,
                'default_lang':default_lang.length > 0 ? default_lang : 'en',
                'ga_code':ga_code,
                'gtm_code':gtm_code,
            }, null, [], function(r) {
                if (r.data.length > 0) {
                    alert("Application settings successfully updated");
                } else {
                    alert("Unable to update application settings. Please try again or contact support.");
                }
            }, function(err) {
                alert("Unable to update application settings. Please try again or contact support. "+err);
            });
        });

        // Add event listeners for domain management
        document.getElementById('add-domain-btn').addEventListener('click', function() {
            const domainInput = document.getElementById('domain-input');
            const domain = domainInput.value.trim();
            
            $('#pageLoaderModal').modal('show');

            _ks.post("Domain", {
                'domainName': domain,
                'site': idx,
                'name': [domain]
            }, null, [], function(r) {
                if (r.data && r.data.length > 0) {
                    // wait a little and then retrieve the domain data
                    setTimeout(() => {
                        loadDomainData(_ks, idx);
                        $('#pageLoaderModal').modal('hide');
                    }, 5000);
                } else {
                    $('#pageLoaderModal').modal('hide');
                    alert('Failed to add domain. Please try again.');
                }
            }, function(err) {
                $('#pageLoaderModal').modal('hide');
                console.error('Error adding domain:', err);
                alert('Failed to add domain. Please try again.');
            });
            
            domainInput.value = '';
        });

        document.getElementById('assign-domain-btn').addEventListener('click', function() {
            if (currentDomainData) {
                // Get site's CloudFront distribution ID
                _ks.get("KyteSite", "id", siteId, [], function(r) {
                    if (r.data && r.data.length > 0) {
                        const cfDistributionId = r.data[0].cfDistributionId;
                        
                        _ks.put('Domain', 'id', currentDomainData.id, {
                            'assigned': cfDistributionId
                        }, null, [], function(r) {
                            if (r.data && r.data.length > 0) {
                                currentDomainData.assigned = cfDistributionId;
                                showHasDomainState(currentDomainData);
                            }
                        }, function(err) {
                            console.error('Error assigning domain:', err);
                            alert('Failed to assign domain. Please try again.');
                        });
                    }
                });
            }
        });

        document.getElementById('unassign-domain-btn').addEventListener('click', function() {
            if (currentDomainData) {
                _ks.put('Domain', 'id', currentDomainData.id, {
                    'assigned': null
                }, null, [], function(r) {
                    if (r.data && r.data.length > 0) {
                        currentDomainData.assigned = null;
                        showHasDomainState(currentDomainData);
                    }
                }, function(err) {
                    console.error('Error unassigning domain:', err);
                    alert('Failed to unassign domain. Please try again.');
                });
            }
        });

        document.getElementById('remove-domain-btn').addEventListener('click', function() {
            if (currentDomainData && confirm('Are you sure you want to remove this domain? This action cannot be undone.')) {
                _ks.delete('Domain', 'id', currentDomainData.id, [], function(r) {
                    currentDomainData = null;
                    showNoDomainState();
                }, function(err) {
                    console.error('Error removing domain:', err);
                    alert('Failed to remove domain. Please try again.');
                });
            }
        });

        // Navigation functionality
        document.querySelectorAll('[data-section]').forEach(button => {
            button.addEventListener('click', function() {
                const section = this.dataset.section;
                
                // Update active nav item
                document.querySelectorAll('[data-section]').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Show corresponding section
                document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
                document.getElementById(section).classList.add('active');
                
                // Special handling for Navigation and SideNav sections
                if (section === 'Navigation') {
                    // Ensure navigation data is loaded when section is first viewed
                    if (!currentNavigationData) {
                        const selector = document.getElementById('navigation-selector');
                        if (selector && selector.value) {
                            loadNavigationData(_ks, selector.value);
                        }
                    }
                } else if (section === 'SideNav') {
                    // Ensure side navigation data is loaded when section is first viewed
                    if (!currentSideNavData) {
                        const selector = document.getElementById('sidenav-selector');
                        if (selector && selector.value) {
                            loadSideNavigationData(_ks, selector.value);
                        }
                    }
                }
            });
        });

        function showNoDomainState() {
            document.getElementById('no-domain-state').style.display = 'block';
            document.getElementById('has-domain-state').style.display = 'none';
        }

        function showHasDomainState(domainData) {
        document.getElementById('no-domain-state').style.display = 'none';
        document.getElementById('has-domain-state').style.display = 'block';
        
        currentDomainData = domainData;
        
        // Update domain display
        document.getElementById('configured-domain').textContent = domainData.domainName;
        
        // Update status indicator
        updateDomainStatus(domainData.status);
        
        // Show/hide assign/unassign buttons
        if (domainData.assigned) {
            document.getElementById('assign-domain-btn').style.display = 'none';
            document.getElementById('unassign-domain-btn').style.display = 'inline-block';
        } else {
            document.getElementById('assign-domain-btn').style.display = 'inline-block';
            document.getElementById('unassign-domain-btn').style.display = 'none';
        }
        
        // Show appropriate domain state with enhanced UX
        showDomainState(domainData.status, domainData);
    }

    function updateDomainStatus(status) {
        const indicator = document.getElementById('domain-status-indicator');
        const text = document.getElementById('domain-status-text');
        
        // Remove all status classes
        indicator.className = 'status-indicator';
        
        switch(status) {
            case 'ISSUED':
                indicator.classList.add('status-success');
                text.textContent = 'Active';
                break;
            case 'PENDING_VALIDATION':
                indicator.classList.add('status-warning');
                text.textContent = 'Pending Validation';
                break;
            case 'FAILED':
            case 'REVOKED':
            case 'EXPIRED':
                indicator.classList.add('status-danger');
                text.textContent = status.replace('_', ' ');
                break;
            default:
                indicator.classList.add('status-secondary');
                text.textContent = status ? status.replace('_', ' ') : 'Unknown';
        }
    }
    
    function showDomainState(status, domainData = null) {
        // Always check if we have DNS records first
        const hasRecords = domainData && domainData.dns_validation && domainData.dns_validation.length > 0;
        
        // Show/hide DNS records section based on availability
        const dnsSection = document.getElementById('dns-records-section');
        const noRecordsElement = document.getElementById('no-records-state');
        
        if (hasRecords) {
            // Show DNS records regardless of status (unless domain is active)
            if (status !== 'ISSUED' && dnsSection) {
                dnsSection.style.display = 'block';
                renderDNSRecords(domainData.dns_validation);
            }
            if (noRecordsElement) noRecordsElement.style.display = 'none';
        } else {
            // Only show "no records" state if we're in pending/validation mode
            if (status === 'PENDING_VALIDATION' || !status || status === 'VALIDATION_TIMED_OUT') {
                if (noRecordsElement) noRecordsElement.style.display = 'block';
                if (dnsSection) dnsSection.style.display = 'none';
                
                // Auto-refresh for records every 10 seconds for first 2 minutes
                let attempts = 0;
                const maxAttempts = 12; // 2 minutes
                validationTimer = setInterval(() => {
                    attempts++;
                    if (attempts >= maxAttempts) {
                        clearInterval(validationTimer);
                        return;
                    }
                    refreshDomainStatus();
                }, 10000);
            }
        }
        
        // Hide all status states first
        ['domain-active', 'domain-failed', 'domain-pending'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Clear any existing timers
        clearInterval(validationTimer);
        clearInterval(progressInterval);
        
        // Show appropriate status indicator
        switch(status) {
            case 'PENDING_VALIDATION':
                const pendingElement = document.getElementById('domain-pending');
                if (pendingElement) {
                    pendingElement.style.display = 'block';
                    startValidationTimer();
                    startProgressSimulation();
                    // Auto-refresh every 30 seconds for status updates
                    validationTimer = setInterval(() => {
                        refreshDomainStatus();
                    }, 30000);
                }
                break;
                
            case 'ISSUED':
                // Hide DNS records section when domain is active
                if (dnsSection) dnsSection.style.display = 'none';
                if (noRecordsElement) noRecordsElement.style.display = 'none';
                
                const activeElement = document.getElementById('domain-active');
                if (activeElement) {
                    activeElement.style.display = 'block';
                }
                break;
                
            case 'FAILED':
            case 'REVOKED':
            case 'EXPIRED':
            case 'VALIDATION_TIMED_OUT':
                const failedElement = document.getElementById('domain-failed');
                if (failedElement) {
                    failedElement.style.display = 'block';
                }
                break;
        }
    }

    // Enhanced DNS Records rendering with better visual hierarchy
    function renderDNSRecords(records) {
        const container = document.getElementById('dns-records-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        records.forEach((record, index) => {
            const recordDiv = document.createElement('div');
            recordDiv.className = 'dns-record mb-3';
            
            let statusClass = 'status-secondary';
            let statusText = 'Pending';
            if (record.ValidationStatus === 'SUCCESS') {
                statusClass = 'status-success';
                statusText = 'Verified ✓';
            }
            if (record.ValidationStatus === 'PENDING_VALIDATION') {
                statusClass = 'status-warning';
                statusText = 'Pending Validation';
            }
            if (record.ValidationStatus === 'FAILED') {
                statusClass = 'status-danger';
                statusText = 'Validation Failed';
            }
            
            recordDiv.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-light border-bottom d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">
                            <i class="fas fa-globe text-primary me-2"></i>
                            ${record.DomainName}
                        </h6>
                        <span class="badge bg-light text-dark">
                            <span class="status-indicator ${statusClass} me-1"></span>
                            ${statusText}
                        </span>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-5">
                                <label class="form-label small text-muted fw-bold">RECORD NAME</label>
                                <div class="input-group">
                                    <input type="text" class="form-control font-monospace bg-light" 
                                        value="${record.ResourceRecord.Name}" readonly>
                                    <button class="btn btn-outline-secondary copy-btn" 
                                            onclick="copyToClipboard('${record.ResourceRecord.Name}', this)"
                                            title="Copy to clipboard">
                                        <i class="far fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-2 text-center">
                                <label class="form-label small text-muted fw-bold">TYPE</label>
                                <div class="badge bg-primary fs-6 d-block py-2">${record.ResourceRecord.Type}</div>
                            </div>
                            <div class="col-md-5">
                                <label class="form-label small text-muted fw-bold">TARGET VALUE</label>
                                <div class="input-group">
                                    <input type="text" class="form-control font-monospace bg-light" 
                                        value="${record.ResourceRecord.Value}" readonly>
                                    <button class="btn btn-outline-secondary copy-btn" 
                                            onclick="copyToClipboard('${record.ResourceRecord.Value}', this)"
                                            title="Copy to clipboard">
                                        <i class="far fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(recordDiv);
        });
    }

    function startValidationTimer() {
        validationStartTime = Date.now();
        const timerElement = document.getElementById('validation-timer');
        
        if (timerElement) {
            validationTimer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - validationStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                
                if (minutes === 0) {
                    timerElement.textContent = `${seconds} seconds ago`;
                } else {
                    timerElement.textContent = `${minutes}m ${seconds}s ago`;
                }
            }, 1000);
        }
    }

    function startProgressSimulation() {
        const progressBar = document.getElementById('validation-progress');
        if (progressBar) {
            let progress = 10;
            
            progressInterval = setInterval(() => {
                progress += Math.random() * 5; // Gradually increase
                if (progress > 90) progress = 90; // Cap at 90% until actual completion
                progressBar.style.width = `${progress}%`;
            }, 2000);
        }
    }

    function refreshDomainStatus() {
        // Add loading state to refresh button
        const refreshBtn = document.getElementById('refresh-dns-btn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync fa-spin me-2"></i>Refreshing...';
            refreshBtn.disabled = true;
        }
        
        loadDomainData(_ks, siteId);
        
        // Reset button after delay
        setTimeout(() => {
            if (refreshBtn) {
                refreshBtn.innerHTML = '<i class="fas fa-sync me-2"></i>Refresh Status';
                refreshBtn.disabled = false;
            }
        }, 2000);
    }

    // Add these event listeners to your existing domain initialization code
    function setupEnhancedDomainEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-dns-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshDomainStatus);
        }
        
        // Retry validation button
        const retryBtn = document.getElementById('retry-validation-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', function() {
                if (currentDomainData && typeof _ks !== 'undefined') {
                    // Call API to retry validation
                    _ks.get("Domain", "site", siteId, [], function(r) {
                        if (r.data && r.data.length > 0) {
                            showHasDomainState(r.data[0]);
                        }
                    }, function(err) {
                        console.error('Error retrying validation:', err);
                        alert('Failed to retry validation. Please try again.');
                    });
                }
            });
        }
        
        // Contact support button
        const supportBtn = document.getElementById('contact-support-btn');
        if (supportBtn) {
            supportBtn.addEventListener('click', function() {
                // Customize this with your support contact method
                window.open('mailto:support@keyqcloud.com?subject=Domain Validation Issue&body=I need help with domain validation for: ' + (currentDomainData ? currentDomainData.domainName : 'Unknown'), '_blank');
            });
        }
    }

        function renderDNSRecords(records) {
            const container = document.getElementById('dns-records-container');
            container.innerHTML = '';
            
            records.forEach(record => {
                const recordDiv = document.createElement('div');
                recordDiv.className = 'dns-record';
                
                let statusClass = 'status-secondary';
                if (record.ValidationStatus === 'SUCCESS') statusClass = 'status-success';
                if (record.ValidationStatus === 'PENDING_VALIDATION') statusClass = 'status-warning';
                if (record.ValidationStatus === 'FAILED') statusClass = 'status-danger';
                
                recordDiv.innerHTML = `
                    <div class="dns-record-header">
                        <h6 class="mb-0">${record.DomainName}</h6>
                        <div class="domain-status">
                            <span class="status-indicator ${statusClass}"></span>
                            <span>${record.ValidationStatus.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <div class="dns-record-details">
                        <div>
                            <strong>Name:</strong><br>
                            <code>${record.ResourceRecord.Name}</code>
                            <button class="copy-btn" onclick="copyToClipboard('${record.ResourceRecord.Name}', this)">
                                <i class="far fa-copy"></i>
                            </button>
                        </div>
                        <div class="text-center">
                            <strong>${record.ResourceRecord.Type}</strong>
                        </div>
                        <div>
                            <strong>Value:</strong><br>
                            <code>${record.ResourceRecord.Value}</code>
                            <button class="copy-btn" onclick="copyToClipboard('${record.ResourceRecord.Value}', this)">
                                <i class="far fa-copy"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                container.appendChild(recordDiv);
            });
        }        

        function loadDomainData(_ks, siteId) {
            // Check if site has a domain configured
            _ks.get("Domain", "site", siteId, [], function(r) {
                if (r.data && r.data.length > 0) {
                    // Site has a domain configured
                    showHasDomainState(r.data[0]);
                } else {
                    // No domain configured
                    showNoDomainState();
                }
            }, function(err) {
                console.error('Error loading domain data:', err);
                showNoDomainState();
            });
        }

        setupEnhancedDomainEventListeners();

        // Navigation Management code
        // Initialize Navigation Management
        function initializeNavigationManagement(_ks, siteId) {
            // Load site pages for dropdown population
            _ks.get('KytePage', 'site', siteId, [], function(r) {
                if (r.data && r.data.length > 0) {
                    currentSitePages = r.data;
                }
                loadNavigationMenus(_ks, siteId);
            });

            // Setup navigation event handlers
            setupNavigationEventHandlers(_ks, siteId);
        }

        // Load available navigation menus
        function loadNavigationMenus(_ks, siteId) {
            _ks.get('Navigation', 'site', siteId, [], function(r) {
                const selector = document.getElementById('navigation-selector');
                selector.innerHTML = '<option value="">Create a new navigation menu (or select one from this dropdown)...</option>';
                
                if (r.data && r.data.length > 0) {
                    r.data.forEach(nav => {
                        const option = document.createElement('option');
                        option.value = nav.id;
                        option.textContent = nav.name;
                        selector.appendChild(option);
                    });
                    
                    // Auto-select first navigation if only one exists
                    if (r.data.length === 1) {
                        selector.value = r.data[0].id;
                        loadNavigationData(_ks, r.data[0].id);
                    }
                } else {
                    selector.innerHTML = '<option value="">No navigation menus found</option>';
                }
            });
        }

        // Load navigation data and items
        function loadNavigationData(_ks, navigationId) {
            if (!navigationId) {
                showNoNavigationSelected();
                return;
            }

            _ks.get('Navigation', 'id', navigationId, [], function(r) {
                if (r.data && r.data.length > 0) {
                    currentNavigationData = r.data[0];
                    
                    // Update styles form
                    updateNavigationStylesForm(currentNavigationData);
                    
                    // Load navigation items
                    loadNavigationItems(_ks, navigationId);
                    
                    // Show navigation container
                    document.getElementById('navigation-items-container').style.display = 'block';
                    document.getElementById('no-navigation-selected').style.display = 'none';
                    document.getElementById('current-navigation-name').textContent = currentNavigationData.name;
                }
            });
        }

        // Load navigation items
        function loadNavigationItems(_ks, navigationId) {
            _ks.get('NavigationItem', 'navigation', navigationId, [], function(r) {
                navigationItems = r.data || [];
                renderNavigationItems();
                
                if (navigationItems.length === 0) {
                    document.getElementById('navigation-empty-state').style.display = 'block';
                } else {
                    document.getElementById('navigation-empty-state').style.display = 'none';
                }
            });
        }

        // Render navigation items
        function renderNavigationItems() {
            const container = document.getElementById('sortable-navigation-items');
            container.innerHTML = '';
            
            // Sort items by itemOrder
            navigationItems.sort((a, b) => (a.itemOrder || 0) - (b.itemOrder || 0));
            
            navigationItems.forEach(item => {
                const itemElement = createNavigationItemElement(item);
                container.appendChild(itemElement);
            });
            
            // Initialize sortable if jQuery UI is available
            if (typeof $ !== 'undefined' && $.fn.sortable) {
                $("#sortable-navigation-items").sortable({
                    handle: '.fa-grip-vertical',
                    update: function(event, ui) {
                        updateNavigationItemOrder();
                    }
                });
            }
        }

        // Create navigation item element
        function createNavigationItemElement(item) {
            const template = document.getElementById('navigation-item-template');
            const clone = template.content.cloneNode(true);
            const listItem = clone.querySelector('.navigation-item');
            
            // Set data attribute
            listItem.setAttribute('data-nav-item-id', item.id);
            
            // Populate form fields
            clone.querySelector('.nav-item-title').value = item.title || '';
            clone.querySelector('.nav-item-icon').value = item.faicon || '';
            clone.querySelector('.nav-item-element-id').value = item.element_id || '';
            clone.querySelector('.nav-item-element-class').value = item.element_class || '';
            clone.querySelector('.nav-item-position').value = item.center || '1';
            
            // Set link type and show/hide appropriate fields
            const linkType = determineItemLinkType(item);
            clone.querySelector('.nav-item-type').value = linkType;
            
            // Populate pages dropdown
            const pageSelect = clone.querySelector('.nav-item-page');
            pageSelect.innerHTML = '<option value="">Select a page...</option>';
            currentSitePages.forEach(page => {
                const option = document.createElement('option');
                option.value = page.id;
                option.textContent = `${page.title} [/${page.s3key}]`;
                if (item.page && item.page.id === page.id) {
                    option.selected = true;
                }
                pageSelect.appendChild(option);
            });
            
            // Populate parent items dropdown
            const parentSelect = clone.querySelector('.nav-item-parent');
            parentSelect.innerHTML = '<option value="0">No Parent (Top Level)</option>';
            navigationItems.forEach(navItem => {
                if (navItem.id !== item.id) { // Don't allow self as parent
                    const option = document.createElement('option');
                    option.value = navItem.id;
                    option.textContent = navItem.title;
                    if (item.parentItem && item.parentItem.id === navItem.id) {
                        option.selected = true;
                    }
                    parentSelect.appendChild(option);
                }
            });
            
            // Set link value if custom link
            if (linkType === 'link') {
                clone.querySelector('.nav-item-link').value = item.link || '';
            }
            
            // Show/hide appropriate fields based on type
            toggleNavigationItemFields(clone, linkType);
            
            return clone;
        }

        // Determine item link type
        function determineItemLinkType(item) {
            if (item.isLogout) return 'logout';
            if (item.page) return 'page';
            return 'link';
        }

        // Toggle navigation item fields based on type
        function toggleNavigationItemFields(element, type) {
            const pageWrapper = element.querySelector('.nav-item-page-wrapper');
            const linkWrapper = element.querySelector('.nav-item-link-wrapper');
            
            switch(type) {
                case 'page':
                    pageWrapper.style.display = 'block';
                    linkWrapper.style.display = 'none';
                    break;
                case 'link':
                    pageWrapper.style.display = 'none';
                    linkWrapper.style.display = 'block';
                    break;
                case 'logout':
                    pageWrapper.style.display = 'none';
                    linkWrapper.style.display = 'none';
                    break;
            }
        }

        // Update navigation styles form
        function updateNavigationStylesForm(navData) {
            document.getElementById('nav-sticky-top').value = navData.isStickyTop || '1';
            document.getElementById('nav-bg-color').value = navData.bgColor || '#343a40';
            document.getElementById('nav-text-color').value = navData.fgColor || '#ffffff';
            document.getElementById('nav-dropdown-bg-color').value = navData.bgDropdownColor || '#ffffff';
            document.getElementById('nav-dropdown-text-color').value = navData.fgDropdownColor || '#212529';
            
            // Update preview
            updateNavigationPreview();
        }

        // Update navigation preview
        function updateNavigationPreview() {
            const navbar = document.getElementById('preview-navbar');
            const bgColor = document.getElementById('nav-bg-color').value;
            const textColor = document.getElementById('nav-text-color').value;
            const dropdownBg = document.getElementById('nav-dropdown-bg-color').value;
            const dropdownText = document.getElementById('nav-dropdown-text-color').value;
            
            // Apply styles to preview
            navbar.style.backgroundColor = bgColor;
            navbar.querySelectorAll('.navbar-brand, .nav-link').forEach(el => {
                el.style.color = textColor;
            });
            navbar.querySelectorAll('.dropdown-menu').forEach(el => {
                el.style.backgroundColor = dropdownBg;
            });
            navbar.querySelectorAll('.dropdown-item').forEach(el => {
                el.style.color = dropdownText;
            });
        }

        // Setup navigation event handlers
        function setupNavigationEventHandlers(_ks, siteId) {
            // Navigation selector change
            document.getElementById('navigation-selector').addEventListener('change', function() {
                const navigationId = this.value;
                if (navigationId) {
                    loadNavigationData(_ks, navigationId);
                } else {
                    showNoNavigationSelected();
                }
            });

            // Add navigation item button
            document.getElementById('addNavigationItem').addEventListener('click', function() {
                if (!currentNavigationData) {
                    alert('Please select a navigation menu first.');
                    return;
                }
                addNavigationItem(_ks);
            });

            // Create new navigation button
            document.getElementById('create-new-navigation').addEventListener('click', function() {
                createNewNavigation(_ks, siteId);
            });

            // Publish navigation button
            document.getElementById('publishNavigation').addEventListener('click', function() {
                if (!currentNavigationData) {
                    alert('Please select a navigation menu first.');
                    return;
                }
                publishNavigationStyles(_ks);
            });

            // Color input changes for live preview
            ['nav-bg-color', 'nav-text-color', 'nav-dropdown-bg-color', 'nav-dropdown-text-color'].forEach(id => {
                document.getElementById(id).addEventListener('change', updateNavigationPreview);
            });

            // Event delegation for navigation item controls
            document.getElementById('sortable-navigation-items').addEventListener('change', handleNavigationItemChange.bind(null, _ks));
            document.getElementById('sortable-navigation-items').addEventListener('click', handleNavigationItemClick.bind(null, _ks));
        }

        // Handle navigation item form changes
        function handleNavigationItemChange(_ks, event) {
            const target = event.target;
            const listItem = target.closest('.navigation-item');
            const itemId = listItem.getAttribute('data-nav-item-id');
            
            if (!itemId) return;

            let updateData = {};
            
            if (target.classList.contains('nav-item-title')) {
                updateData.title = target.value;
            } else if (target.classList.contains('nav-item-type')) {
                const linkType = target.value;
                toggleNavigationItemFields(listItem, linkType);
                
                switch(linkType) {
                    case 'page':
                        updateData.isLogout = 0;
                        updateData.link = null;
                        break;
                    case 'link':
                        updateData.isLogout = 0;
                        updateData.page = null;
                        break;
                    case 'logout':
                        updateData.isLogout = 1;
                        updateData.page = null;
                        updateData.link = null;
                        break;
                }
            } else if (target.classList.contains('nav-item-page')) {
                updateData.page = target.value || null;
                updateData.link = null;
            } else if (target.classList.contains('nav-item-link')) {
                updateData.link = target.value;
                updateData.page = null;
            } else if (target.classList.contains('nav-item-parent')) {
                updateData.parentItem = target.value === '0' ? null : target.value;
            } else if (target.classList.contains('nav-item-position')) {
                updateData.center = target.value;
            } else if (target.classList.contains('nav-item-icon')) {
                updateData.faicon = target.value;
            } else if (target.classList.contains('nav-item-element-id')) {
                updateData.element_id = target.value;
            } else if (target.classList.contains('nav-item-element-class')) {
                updateData.element_class = target.value;
            }
            
            // Update the item
            if (Object.keys(updateData).length > 0) {
                _ks.put('NavigationItem', 'id', itemId, updateData, null, []);
            }
        }

        // Handle navigation item clicks (delete button)
        function handleNavigationItemClick(_ks, event) {
            if (event.target.closest('.delete-nav-item')) {
                event.preventDefault();
                const listItem = event.target.closest('.navigation-item');
                const itemId = listItem.getAttribute('data-nav-item-id');
                
                if (confirm('Are you sure you want to delete this navigation item?')) {
                    deleteNavigationItem(_ks, itemId, listItem);
                }
            }
        }

        // Add new navigation item
        function addNavigationItem(_ks) {
            const newItemData = {
                title: 'New Navigation Item',
                navigation: currentNavigationData.id,
                site: currentNavigationData.site.id,
                itemOrder: navigationItemCount++
            };
            
            _ks.post('NavigationItem', newItemData, null, [], function(r) {
                if (r.data && r.data.length > 0) {
                    navigationItems.push(r.data[0]);
                    renderNavigationItems();
                    document.getElementById('navigation-empty-state').style.display = 'none';
                } else {
                    alert('Failed to create navigation item.');
                }
            });
        }

        // Delete navigation item
        function deleteNavigationItem(_ks, itemId, listItem) {
            _ks.delete('NavigationItem', 'id', itemId, [], function(r) {
                // Remove from local array
                navigationItems = navigationItems.filter(item => item.id !== parseInt(itemId));
                
                // Remove from DOM
                listItem.remove();
                
                // Show empty state if no items left
                if (navigationItems.length === 0) {
                    document.getElementById('navigation-empty-state').style.display = 'block';
                }
            }, function(err) {
                alert('Unable to delete navigation item: ' + err);
            });
        }

        // Update navigation item order after drag/drop
        function updateNavigationItemOrder() {
            const items = document.querySelectorAll('.navigation-item');
            const updates = [];
            
            items.forEach((item, index) => {
                const itemId = item.getAttribute('data-nav-item-id');
                if (itemId) {
                    updates.push({
                        id: parseInt(itemId),
                        itemOrder: index
                    });
                }
            });
            
            if (updates.length > 0) {
                // Use the same API pattern as the original code
                if (typeof _ks !== 'undefined') {
                    _ks.put('NavItems', 'NavigationItem', updates.length, {navitems: updates}, null, []);
                }
            }
        }

        // Create new navigation menu
        function createNewNavigation(_ks, siteId) {
            const name = prompt('Enter navigation menu name:');
            if (!name) return;
            
            const newNavData = {
                name: name,
                site: siteId,
                bgColor: '#343a40',
                fgColor: '#ffffff',
                bgDropdownColor: '#ffffff',
                fgDropdownColor: '#212529',
                isStickyTop: 1
            };
            
            _ks.post('Navigation', newNavData, null, [], function(r) {
                if (r.data && r.data.length > 0) {
                    // Reload navigation menus and select the new one
                    loadNavigationMenus(_ks, siteId);
                    setTimeout(() => {
                        document.getElementById('navigation-selector').value = r.data[0].id;
                        loadNavigationData(_ks, r.data[0].id);
                    }, 100);
                } else {
                    alert('Failed to create navigation menu.');
                }
            });
        }

        // Publish navigation styles
        function publishNavigationStyles(_ks) {
            const updateData = {
                bgColor: document.getElementById('nav-bg-color').value,
                fgColor: document.getElementById('nav-text-color').value,
                bgDropdownColor: document.getElementById('nav-dropdown-bg-color').value,
                fgDropdownColor: document.getElementById('nav-dropdown-text-color').value,
                isStickyTop: document.getElementById('nav-sticky-top').value
            };
            
            _ks.put('Navigation', 'id', currentNavigationData.id, updateData, null, [], function(r) {
                if (r.data && r.data.length > 0) {
                    alert('Navigation styles published successfully!');
                    currentNavigationData = {...currentNavigationData, ...updateData};
                } else {
                    alert('Failed to publish navigation styles.');
                }
            });
        }

        // Show no navigation selected state
        function showNoNavigationSelected() {
            document.getElementById('navigation-items-container').style.display = 'none';
            document.getElementById('no-navigation-selected').style.display = 'block';
            currentNavigationData = null;
        }

        initializeNavigationManagement(_ks, idx);

        // Initialize Side Navigation Management
        function initializeSideNavigationManagement(_ks, siteId) {
            // Load side navigation menus
            loadSideNavigationMenus(_ks, siteId);
            
            // Setup side navigation event handlers
            setupSideNavigationEventHandlers(_ks, siteId);
        }

        // Load available side navigation menus
        function loadSideNavigationMenus(_ks, siteId) {
            _ks.get('SideNav', 'site', siteId, [], function(r) {
                const selector = document.getElementById('sidenav-selector');
                selector.innerHTML = '<option value="">Create a new side navigation menu (or select one from this dropdown)...</option>';
                
                if (r.data && r.data.length > 0) {
                    r.data.forEach(sidenav => {
                        const option = document.createElement('option');
                        option.value = sidenav.id;
                        option.textContent = sidenav.name;
                        selector.appendChild(option);
                    });
                    
                    // Auto-select first side navigation if only one exists
                    if (r.data.length === 1) {
                        selector.value = r.data[0].id;
                        loadSideNavigationData(_ks, r.data[0].id);
                    }
                } else {
                    selector.innerHTML = '<option value="">No side navigation menus found</option>';
                }
            });
        }

        // Load side navigation data and items
        function loadSideNavigationData(_ks, sideNavId) {
            if (!sideNavId) {
                showNoSideNavSelected();
                return;
            }

            _ks.get('SideNav', 'id', sideNavId, [], function(r) {
                if (r.data && r.data.length > 0) {
                    currentSideNavData = r.data[0];
                    
                    // Update styles form
                    updateSideNavigationStylesForm(currentSideNavData);
                    
                    // Load side navigation items
                    loadSideNavigationItems(_ks, sideNavId);
                    
                    // Show side navigation container
                    document.getElementById('sidenav-items-container').style.display = 'block';
                    document.getElementById('no-sidenav-selected').style.display = 'none';
                    document.getElementById('current-sidenav-name').textContent = currentSideNavData.name;
                }
            });
        }

        // Load side navigation items
        function loadSideNavigationItems(_ks, sideNavId) {
            _ks.get('SideNavItem', 'sidenav', sideNavId, [], function(r) {
                sideNavItems = r.data || [];
                renderSideNavigationItems();
                
                if (sideNavItems.length === 0) {
                    document.getElementById('sidenav-empty-state').style.display = 'block';
                } else {
                    document.getElementById('sidenav-empty-state').style.display = 'none';
                }
            });
        }

        // Render side navigation items
        function renderSideNavigationItems() {
            const container = document.getElementById('sortable-sidenav-items');
            container.innerHTML = '';
            
            // Sort items by itemOrder
            sideNavItems.sort((a, b) => (a.itemOrder || 0) - (b.itemOrder || 0));
            
            sideNavItems.forEach(item => {
                const itemElement = createSideNavigationItemElement(item);
                container.appendChild(itemElement);
            });
            
            // Initialize sortable if jQuery UI is available
            if (typeof $ !== 'undefined' && $.fn.sortable) {
                $("#sortable-sidenav-items").sortable({
                    handle: '.fa-grip-vertical',
                    update: function(event, ui) {
                        updateSideNavigationItemOrder();
                    }
                });
            }
        }

        // Create side navigation item element
        function createSideNavigationItemElement(item) {
            const template = document.getElementById('sidenav-item-template');
            const clone = template.content.cloneNode(true);
            const listItem = clone.querySelector('.sidenav-item');
            
            // Set data attribute
            listItem.setAttribute('data-sidenav-item-id', item.id);
            
            // Populate form fields
            clone.querySelector('.sidenav-item-title').value = item.title || '';
            clone.querySelector('.sidenav-item-icon').value = item.faicon || '';
            clone.querySelector('.sidenav-item-element-id').value = item.element_id || '';
            clone.querySelector('.sidenav-item-element-class').value = item.element_class || '';
            
            // Set link type and show/hide appropriate fields
            const linkType = determineSideNavItemLinkType(item);
            clone.querySelector('.sidenav-item-type').value = linkType;
            
            // Populate pages dropdown
            const pageSelect = clone.querySelector('.sidenav-item-page');
            pageSelect.innerHTML = '<option value="">Select a page...</option>';
            currentSitePages.forEach(page => {
                const option = document.createElement('option');
                option.value = page.id;
                option.textContent = `${page.title} [/${page.s3key}]`;
                if (item.page && item.page.id === page.id) {
                    option.selected = true;
                }
                pageSelect.appendChild(option);
            });
            
            // Set link value if custom link
            if (linkType === 'link') {
                clone.querySelector('.sidenav-item-link').value = item.link || '';
            }
            
            // Show/hide appropriate fields based on type
            toggleSideNavigationItemFields(clone, linkType);
            
            return clone;
        }

        // Determine side nav item link type
        function determineSideNavItemLinkType(item) {
            if (item.isLogout) return 'logout';
            if (item.page) return 'page';
            return 'link';
        }

        // Toggle side navigation item fields based on type
        function toggleSideNavigationItemFields(element, type) {
            const pageWrapper = element.querySelector('.sidenav-item-page-wrapper');
            const linkWrapper = element.querySelector('.sidenav-item-link-wrapper');
            
            switch(type) {
                case 'page':
                    pageWrapper.style.display = 'block';
                    linkWrapper.style.display = 'none';
                    break;
                case 'link':
                    pageWrapper.style.display = 'none';
                    linkWrapper.style.display = 'block';
                    break;
                case 'logout':
                    pageWrapper.style.display = 'none';
                    linkWrapper.style.display = 'none';
                    break;
            }
        }

        // Update side navigation styles form
        function updateSideNavigationStylesForm(sideNavData) {
            // Set color values
            document.getElementById('sidenav-bg-color').value = sideNavData.bgColor || '#343a40';
            document.getElementById('sidenav-text-color').value = sideNavData.fgColor || '#ffffff';
            document.getElementById('sidenav-active-bg-color').value = sideNavData.bgActiveColor || '#007bff';
            document.getElementById('sidenav-active-text-color').value = sideNavData.fgActiveColor || '#ffffff';
            
            // Set style selections
            currentColumnStyle = sideNavData.columnStyle || 0;
            currentNavItemStyle = sideNavData.labelCenterBlock || 0;
            
            // Update radio buttons
            const columnStyleRadio = document.querySelector(`input[name="columnStyle"][value="${currentColumnStyle}"]`);
            if (columnStyleRadio) columnStyleRadio.checked = true;
            
            const navItemStyleRadio = document.querySelector(`input[name="navItemStyle"][value="${currentNavItemStyle}"]`);
            if (navItemStyleRadio) navItemStyleRadio.checked = true;
            
            // Update layout option selections visually
            document.querySelectorAll('.layout-option').forEach(option => {
                option.classList.remove('selected');
            });
            const selectedLayout = document.querySelector(`[data-column-style="${currentColumnStyle}"]`);
            if (selectedLayout) selectedLayout.classList.add('selected');
            
            document.querySelectorAll('.nav-item-option').forEach(option => {
                option.classList.remove('selected');
            });
            const selectedNavItem = document.querySelector(`[data-nav-item-style="${currentNavItemStyle}"]`);
            if (selectedNavItem) selectedNavItem.classList.add('selected');
            
            // Update preview
            updateSideNavigationPreview();
        }

        // Update side navigation preview
        function updateSideNavigationPreview() {
            const preview = document.getElementById('preview-sidenav');
            const bgColor = document.getElementById('sidenav-bg-color').value;
            const textColor = document.getElementById('sidenav-text-color').value;
            const activeBgColor = document.getElementById('sidenav-active-bg-color').value;
            const activeTextColor = document.getElementById('sidenav-active-text-color').value;
            
            // Apply background to container
            const container = document.getElementById('sidenav-preview');
            container.style.backgroundColor = bgColor;
            
            // Apply styles to nav links
            preview.querySelectorAll('.nav-link').forEach(link => {
                link.style.color = textColor;
                link.style.borderColor = 'transparent';
                
                if (link.classList.contains('active')) {
                    link.style.backgroundColor = activeBgColor;
                    link.style.color = activeTextColor;
                } else {
                    link.style.backgroundColor = 'transparent';
                }
            });
            
            // Apply nav item style (icon positioning)
            preview.querySelectorAll('.nav-link').forEach(link => {
                if (currentNavItemStyle === 1) {
                    // Centered - icon above text
                    link.style.flexDirection = 'column';
                    link.style.textAlign = 'center';
                    link.style.alignItems = 'center';
                } else {
                    // Left aligned - icon next to text
                    link.style.flexDirection = 'row';
                    link.style.textAlign = 'left';
                    link.style.alignItems = 'center';
                }
            });
        }

        // Setup side navigation event handlers
        function setupSideNavigationEventHandlers(_ks, siteId) {
            // Side navigation selector change
            document.getElementById('sidenav-selector').addEventListener('change', function() {
                const sideNavId = this.value;
                if (sideNavId) {
                    loadSideNavigationData(_ks, sideNavId);
                } else {
                    showNoSideNavSelected();
                }
            });

            // Add side navigation item button
            document.getElementById('addSideNavigationItem').addEventListener('click', function() {
                if (!currentSideNavData) {
                    alert('Please select a side navigation menu first.');
                    return;
                }
                addSideNavigationItem(_ks);
            });

            // Create new side navigation button
            document.getElementById('create-new-sidenav').addEventListener('click', function() {
                createNewSideNavigation(_ks, siteId);
            });

            // Publish side navigation button
            document.getElementById('publishSideNavigation').addEventListener('click', function() {
                if (!currentSideNavData) {
                    alert('Please select a side navigation menu first.');
                    return;
                }
                publishSideNavigationStyles(_ks);
            });

            // Color input changes for live preview
            ['sidenav-bg-color', 'sidenav-text-color', 'sidenav-active-bg-color', 'sidenav-active-text-color'].forEach(id => {
                document.getElementById(id).addEventListener('change', updateSideNavigationPreview);
            });

            // Layout style selection
            document.addEventListener('change', function(event) {
                if (event.target.name === 'columnStyle') {
                    currentColumnStyle = parseInt(event.target.value);
                    // Update visual selection
                    document.querySelectorAll('.layout-option').forEach(option => {
                        option.classList.remove('selected');
                    });
                    const selectedLayout = document.querySelector(`[data-column-style="${currentColumnStyle}"]`);
                    if (selectedLayout) selectedLayout.classList.add('selected');
                }
                
                if (event.target.name === 'navItemStyle') {
                    currentNavItemStyle = parseInt(event.target.value);
                    // Update visual selection
                    document.querySelectorAll('.nav-item-option').forEach(option => {
                        option.classList.remove('selected');
                    });
                    const selectedNavItem = document.querySelector(`[data-nav-item-style="${currentNavItemStyle}"]`);
                    if (selectedNavItem) selectedNavItem.classList.add('selected');
                    
                    // Update preview
                    updateSideNavigationPreview();
                }
            });

            // Event delegation for side navigation item controls
            document.getElementById('sortable-sidenav-items').addEventListener('change', handleSideNavigationItemChange.bind(null, _ks));
            document.getElementById('sortable-sidenav-items').addEventListener('click', handleSideNavigationItemClick.bind(null, _ks));
        }

        // Handle side navigation item form changes
        function handleSideNavigationItemChange(_ks, event) {
            const target = event.target;
            const listItem = target.closest('.sidenav-item');
            const itemId = listItem.getAttribute('data-sidenav-item-id');
            
            if (!itemId) return;

            let updateData = {};
            
            if (target.classList.contains('sidenav-item-title')) {
                updateData.title = target.value;
            } else if (target.classList.contains('sidenav-item-type')) {
                const linkType = target.value;
                toggleSideNavigationItemFields(listItem, linkType);
                
                switch(linkType) {
                    case 'page':
                        updateData.isLogout = 0;
                        updateData.link = null;
                        break;
                    case 'link':
                        updateData.isLogout = 0;
                        updateData.page = null;
                        break;
                    case 'logout':
                        updateData.isLogout = 1;
                        updateData.page = null;
                        updateData.link = null;
                        break;
                }
            } else if (target.classList.contains('sidenav-item-page')) {
                updateData.page = target.value || null;
                updateData.link = null;
            } else if (target.classList.contains('sidenav-item-link')) {
                updateData.link = target.value;
                updateData.page = null;
            } else if (target.classList.contains('sidenav-item-icon')) {
                updateData.faicon = target.value;
            } else if (target.classList.contains('sidenav-item-element-id')) {
                updateData.element_id = target.value;
            } else if (target.classList.contains('sidenav-item-element-class')) {
                updateData.element_class = target.value;
            }
            
            // Update the item
            if (Object.keys(updateData).length > 0) {
                _ks.put('SideNavItem', 'id', itemId, updateData, null, []);
            }
        }

        // Handle side navigation item clicks (delete button)
        function handleSideNavigationItemClick(_ks, event) {
            if (event.target.closest('.delete-sidenav-item')) {
                event.preventDefault();
                const listItem = event.target.closest('.sidenav-item');
                const itemId = listItem.getAttribute('data-sidenav-item-id');
                
                if (confirm('Are you sure you want to delete this side navigation item?')) {
                    deleteSideNavigationItem(_ks, itemId, listItem);
                }
            }
        }

        // Add new side navigation item
        function addSideNavigationItem(_ks) {
            const newItemData = {
                title: 'New Side Nav Item',
                sidenav: currentSideNavData.id,
                site: currentSideNavData.site.id,
                itemOrder: sideNavItemCount++
            };
            
            _ks.post('SideNavItem', newItemData, null, [], function(r) {
                if (r.data && r.data.length > 0) {
                    sideNavItems.push(r.data[0]);
                    renderSideNavigationItems();
                    document.getElementById('sidenav-empty-state').style.display = 'none';
                } else {
                    alert('Failed to create side navigation item.');
                }
            });
        }

        // Delete side navigation item
        function deleteSideNavigationItem(_ks, itemId, listItem) {
            _ks.delete('SideNavItem', 'id', itemId, [], function(r) {
                // Remove from local array
                sideNavItems = sideNavItems.filter(item => item.id !== parseInt(itemId));
                
                // Remove from DOM
                listItem.remove();
                
                // Show empty state if no items left
                if (sideNavItems.length === 0) {
                    document.getElementById('sidenav-empty-state').style.display = 'block';
                }
            }, function(err) {
                alert('Unable to delete side navigation item: ' + err);
            });
        }

        // Update side navigation item order after drag/drop
        function updateSideNavigationItemOrder() {
            const items = document.querySelectorAll('.sidenav-item');
            const updates = [];
            
            items.forEach((item, index) => {
                const itemId = item.getAttribute('data-sidenav-item-id');
                if (itemId) {
                    updates.push({
                        id: parseInt(itemId),
                        itemOrder: index
                    });
                }
            });
            
            if (updates.length > 0) {
                // Use the same API pattern as the original code
                if (typeof _ks !== 'undefined') {
                    _ks.put('NavItems', 'SideNavItem', updates.length, {navitems: updates}, null, []);
                }
            }
        }

        // Create new side navigation menu
        function createNewSideNavigation(_ks, siteId) {
            const name = prompt('Enter side navigation menu name:');
            if (!name) return;
            
            const newSideNavData = {
                name: name,
                site: siteId,
                bgColor: '#343a40',
                fgColor: '#ffffff',
                bgActiveColor: '#007bff',
                fgActiveColor: '#ffffff',
                columnStyle: 0,
                labelCenterBlock: 0
            };
            
            _ks.post('SideNav', newSideNavData, null, [], function(r) {
                if (r.data && r.data.length > 0) {
                    // Reload side navigation menus and select the new one
                    loadSideNavigationMenus(_ks, siteId);
                    setTimeout(() => {
                        document.getElementById('sidenav-selector').value = r.data[0].id;
                        loadSideNavigationData(_ks, r.data[0].id);
                    }, 100);
                } else {
                    alert('Failed to create side navigation menu.');
                }
            });
        }

        // Publish side navigation styles
        function publishSideNavigationStyles(_ks) {
            const updateData = {
                bgColor: document.getElementById('sidenav-bg-color').value,
                fgColor: document.getElementById('sidenav-text-color').value,
                bgActiveColor: document.getElementById('sidenav-active-bg-color').value,
                fgActiveColor: document.getElementById('sidenav-active-text-color').value,
                columnStyle: currentColumnStyle,
                labelCenterBlock: currentNavItemStyle
            };
            
            _ks.put('SideNav', 'id', currentSideNavData.id, updateData, null, [], function(r) {
                if (r.data && r.data.length > 0) {
                    alert('Side navigation styles published successfully!');
                    currentSideNavData = {...currentSideNavData, ...updateData};
                } else {
                    alert('Failed to publish side navigation styles.');
                }
            });
        }

        // Show no side navigation selected state
        function showNoSideNavSelected() {
            document.getElementById('sidenav-items-container').style.display = 'none';
            document.getElementById('no-sidenav-selected').style.display = 'block';
            currentSideNavData = null;
        }

        // Additional helper functions for side navigation management

        // Initialize layout and nav item style selections
        function initializeSideNavStyleSelections() {
            // Add click handlers for layout options
            document.querySelectorAll('.layout-option').forEach(option => {
                option.addEventListener('click', function() {
                    const styleValue = this.getAttribute('data-column-style');
                    currentColumnStyle = parseInt(styleValue);
                    
                    // Update radio button
                    const radio = this.querySelector('input[type="radio"]');
                    if (radio) radio.checked = true;
                    
                    // Update visual selection
                    document.querySelectorAll('.layout-option').forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });
            
            // Add click handlers for nav item style options
            document.querySelectorAll('.nav-item-option').forEach(option => {
                option.addEventListener('click', function() {
                    const styleValue = this.getAttribute('data-nav-item-style');
                    currentNavItemStyle = parseInt(styleValue);
                    
                    // Update radio button
                    const radio = this.querySelector('input[type="radio"]');
                    if (radio) radio.checked = true;
                    
                    // Update visual selection
                    document.querySelectorAll('.nav-item-option').forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                    
                    // Update preview immediately
                    updateSideNavigationPreview();
                });
            });
        }

        // Validate side navigation item data
        function validateSideNavItem(itemData) {
            if (!itemData.title || itemData.title.trim() === '') {
                return { valid: false, message: 'Navigation item title is required.' };
            }
            
            if (itemData.type === 'link' && (!itemData.link || itemData.link.trim() === '')) {
                return { valid: false, message: 'Link URL is required for custom link items.' };
            }
            
            if (itemData.type === 'page' && !itemData.page) {
                return { valid: false, message: 'Page selection is required for page link items.' };
            }
            
            return { valid: true };
        }

        // Enhanced error handling for side navigation operations
        function handleSideNavError(operation, error) {
            console.error(`Side Navigation ${operation} Error:`, error);
            
            const errorMessages = {
                'load': 'Failed to load side navigation data. Please refresh the page and try again.',
                'save': 'Failed to save side navigation changes. Please check your connection and try again.',
                'delete': 'Failed to delete side navigation item. Please try again.',
                'create': 'Failed to create side navigation item. Please try again.',
                'publish': 'Failed to publish side navigation styles. Please try again.'
            };
            
            alert(errorMessages[operation] || 'An unexpected error occurred. Please try again.');
        }

        // Debounced function for live preview updates
        let previewUpdateTimeout;
        function debouncedPreviewUpdate() {
            clearTimeout(previewUpdateTimeout);
            previewUpdateTimeout = setTimeout(updateSideNavigationPreview, 150);
        }

        // Enhanced side navigation preview with animation
        function updateSideNavigationPreviewAnimated() {
            const preview = document.getElementById('preview-sidenav');
            
            // Add loading state
            preview.style.opacity = '0.5';
            preview.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
                updateSideNavigationPreview();
                preview.style.opacity = '1';
            }, 150);
        }

        // Export management functions for external use if needed
        window.sideNavigationManager = {
            loadData: loadSideNavigationData,
            addItem: addSideNavigationItem,
            publishStyles: publishSideNavigationStyles,
            updatePreview: updateSideNavigationPreview,
            getCurrentData: () => currentSideNavData,
            getCurrentItems: () => sideNavItems
        };

        // Initialize style selections when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize style selections after a short delay to ensure DOM is fully loaded
            setTimeout(initializeSideNavStyleSelections, 100);
        });

        initializeSideNavigationManagement(_ks, idx);

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        button.classList.add('copied');
        setTimeout(() => {
            button.classList.remove('copied');
        }, 1000);
    }).catch(err => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        button.classList.add('copied');
        setTimeout(() => {
            button.classList.remove('copied');
        }, 1000);
    });
}
