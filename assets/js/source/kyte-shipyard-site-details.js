let currentDomainData = null;
let siteId = null;

// Enhanced domain state management
let validationStartTime = null;
let validationTimer = null;
let progressInterval = null;

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

let colDefNavigation = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'description','label':'Description'},
    // {'targets':2,'data':'link','label':'Target', render: function(data, type, row, meta) { console.log(row); if (data) { return data; } else { if (row.page) { return row.page.title; } else {return 'No'; }} }}
];

let colDefSideNavigation = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'description','label':'Description'},
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

        let navigationFormElements = [
            [
                {
                    'field':'name',
                    'type':'text',
                    'label':'Name',
                    'required':true
                },
                {
                    'field':'page',
                    'type':'select',
                    'label':'Page',
                    'required':false,
                    'placeholder': 'N/A',
                    'option': {
                        'ajax': true,
                        'data_model_name': 'KytePage',
                        'data_model_field': 'site',
                        'data_model_value': idx,
                        'data_model_attributes': ['title', 's3key'],
                        'data_model_default_field': 'id',
                        // 'data_model_default_value': 1,
                    }
                },
            ],
            [
                {
                    'field':'link',
                    'type':'text',
                    'label':'Link URL (optional if page or logout is set)',
                    'required':false
                },
            ],
            [
                {
                    'field':'logo',
                    'type':'text',
                    'label':'Logo URL',
                    'required':false
                },
            ],
            [
                {
                    'field':'description',
                    'type':'textarea',
                    'label':'Description',
                    'required':false
                }
            ]
        ];

        let sideNavigationFormElements = [
            [
                {
                    'field':'name',
                    'type':'text',
                    'label':'Name',
                    'required':true
                }
            ],
            [
                {
                    'field':'description',
                    'type':'textarea',
                    'label':'Description',
                    'required':false
                }
            ]
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

                // navigation
                var tblNavigation = new KyteTable(_ks, $("#navigation-table"), {'name':"Navigation",'field':'site','value':idx}, colDefNavigation, true, [0,"asc"], true, true, 'id', '/app/site/navigation.html');
                tblNavigation.initComplete = function() {
                    $('#pageLoaderModal').modal('hide');
                }
                tblNavigation.init();
                var modalFormNavigation = new KyteForm(_ks, $("#modalFormNavigation"), 'Navigation', hidden, navigationFormElements, 'Navigation', tblNavigation, true, $("#createNavigation"));
                modalFormNavigation.init();
                tblNavigation.bindEdit(modalFormNavigation);

                // side navigation
                var tblSideNav = new KyteTable(_ks, $("#side-navigation-table"), {'name':"SideNav",'field':'site','value':idx}, colDefSideNavigation, true, [0,"asc"], true, true, 'id', '/app/site/sidenav.html');
                tblSideNav.initComplete = function() {
                    $('#pageLoaderModal').modal('hide');
                }
                tblSideNav.init();
                var modalFormSideNav = new KyteForm(_ks, $("#modalFormSideNav"), 'SideNav', hidden, sideNavigationFormElements, 'Navigation', tblSideNav, true, $("#createSideNavigation"));
                modalFormSideNav.init();
                tblSideNav.bindEdit(modalFormSideNav);

                // side navigation
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