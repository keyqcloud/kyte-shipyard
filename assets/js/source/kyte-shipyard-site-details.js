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

let domainFormElements = [
    [
        {
            'field':'domainName',
            'type':'text',
            'label':'Domain Name (i.e example.com)',
            'required':true
        }
    ]
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

let colDefDomains = [
    {'targets':0,'data':'domainName','label':'Domain Name'},
    {'targets':1,'data':'assigned','label':'In Use', render: function(data, type, row, meta) { return data ? 'Yes' : 'No'; }},
    {'targets':2,'data':'status','label':'Status', render: function(data, type, row, meta) { if (data) return data.replace('_', ' '); else return 'unknown'; }}
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
    let sidenav = new KyteSidenav("#sidenav", subnavSite, "#Attributes");
    sidenav.create();
    sidenav.bind();

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

                // domains
                var tblDomains = new KyteTable(_ks, $("#domains-table"), {'name':'Domain','field':'site','value':idx}, colDefDomains, true, [0,"asc"], false, true, 'id', '/app/site/domain.html');
                tblDomains.initComplete = function() {
                    $('#pageLoaderModal').modal('hide');
                }
                tblDomains.init();
                var modalFormDomain = new KyteForm(_ks, $("#modalFormDomain"), 'Domain', hidden, domainFormElements, 'Domain', tblDomains, true, $("#addDomain"));
                modalFormDomain.itemized = {
                    'title': 'Subject Alternative Names<small class="d-block">(i.e. www.example.com, app.example.com, *.example.com, etc.)</small>',
                    'fields': [
                        {
                            'name': 'name[]',
                            'type': 'text',
                            'label': '',
                            'required': true
                        },
                    ]
                };
                modalFormDomain.init();
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

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});