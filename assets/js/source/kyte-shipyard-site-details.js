let scriptElement = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Script Name',
            'required':true
        },
        {
            'field':'type',
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
            'field':'is_url',
            'type':'select',
            'label':'URL or File',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    0: 'Create file in editor',
                    1: 'Provide URL to script'
                }
            }
        },
        {
            'field':'include_global',
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
];

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
    {'targets':2,'data':'state','label':'Status', render: function(data, type, row, meta) { if (data == 0) { return 'Not Published'; } else if (data == 1) { return 'Published'; } else { return 'Published (Stale)'; }}},
    {'targets':3,'data':'date_modified','label':'Last Modified'},
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
    {'targets':0,'data':'name','label':'Script Name'},
    {'targets':1,'data':'type','label':'Script Type', render: function(data, type, row, meta) { if (data == 'css') { return 'Stylesheet'; } else if (data == 'js') { return 'JavaScript'; } else { return 'Unknown'; } }},
    {'targets':2,'data':'state','label':'Status', render: function(data, type, row, meta) { if (data == 0) { return 'Not Published'; } else if (data == 1) { return 'Published'; } else { return 'Published (Stale)'; }}},
    {'targets':3,'data':'include_global','label':'Include All', render: function(data, type, row, meta) { if (data == 0) { return 'No'; } else if (data == 1) { return 'Yes'; } else { return 'Unknown'; }}},
    {'targets':4,'data':'date_modified','label':'Date Modified'},
];

let app = null;

$(document).ready(function() {
    let sidenav = new KyteSidenav("#sidenav", subnavSite, "#Attributes");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Pages' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
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
                        'data_model_name': 'Page',
                        'data_model_field': 'site',
                        'data_model_value': idx,
                        'data_model_attributes': ['title'],
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
                    'type':'textare',
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
                    'type':'textare',
                    'label':'Description',
                    'required':false
                }
            ]
        ];

        k.get("Site", "id", idx, [], function(r) {
            if (r.data[0]) {
                app = r.data[0].application;
                data = r.data[0];
                $("#site-name").html(data.name);
                $("#domain-name").html('<i class="fas fa-link me-2"></i>'+data.cfDomain);
                $("#domain-name").attr('href', 'https://'+data.cfDomain);
                $("#region").html(data.region);
                $("#aliasDomain").val(data.aliasDomain);
                $("#ga_code").val(data.ga_code);
                $("#gtm_code").val(data.gtm_code);

                let obj = {'model': 'Site', 'idx':data.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#createPage").attr('href', '/app/page/wizard.html?request='+encoded);

                obj = {'model': 'Application', 'idx':r.data[0].application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                
                let appnav = generateAppNav(r.data[0].application.name, encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Sites');
                navbar.create();

                // pages
                var tblPage = createTable("#pages-table", "Page", colDefPage, 'site', idx, false, true, '/app/page/', 'id', true);
                // tblPage.targetBlank = true;

                // scripts
                // var tblScript = createTable("#scripts-table", "AssetScript", colDefScript, 'site', idx, false, true);
                // var modalFormScript = new KyteForm(k, $("#modalFormScript"), 'AssetScript', hidden, scriptElement, 'Script', tblScript, true, $("#newScript"));
                // modalFormScript.init();
                // tblScript.bindEdit(modalFormScript);

                // media
                var tblMedia = createTable("#media-table", "Media", colDefMedia, 'site', idx, false, true);
                var modalFormMedia = new KyteForm(k, $("#modalFormMedia"), 'Media', hidden, mediaElements, 'Media', tblMedia, true, $("#newMedia"));
                modalFormMedia.init();
                tblMedia.bindEdit(modalFormMedia);

                // navigation
                var tblNavigation = createTable("#navigation-table", "Navigation", colDefNavigation, 'site', idx, true, true, '/app/site/navigation.html', 'id', true);
                var modalFormNavigation = new KyteForm(k, $("#modalFormNavigation"), 'Navigation', hidden, navigationFormElements, 'Navigation', tblNavigation, true, $("#createNavigation"));
                modalFormNavigation.init();
                tblNavigation.bindEdit(modalFormNavigation);

                // side navigation
                var tblSideNav = createTable("#side-navigation-table", "SideNav", colDefSideNavigation, 'site', idx, true, true, '/app/site/sidenav.html', 'id', true);
                var modalFormSideNav = new KyteForm(k, $("#modalFormSideNav"), 'SideNav', hidden, sideNavigationFormElements, 'Navigation', tblSideNav, true, $("#createSideNavigation"));
                modalFormSideNav.init();
                tblSideNav.bindEdit(modalFormSideNav);

                // side navigation
                var tblSections = createTable("#sections-table", "SectionTemplate", colDefSections, 'site', idx, true, true, '/app/section/', 'id', true);
                var modalFormSection = new KyteForm(k, $("#modalFormSection"), 'SectionTemplate', hidden, sectionsFormElement, 'Section', tblSections, true, $("#addSection"));
                modalFormSection.init();
                tblSections.bindEdit(modalFormSection);

                // domains
                var tblDomains = createTable("#domains-table", "Domain", colDefDomains, 'site', idx, false, true, '/app/site/domain.html', 'id', true);
                var modalFormDomain = new KyteForm(k, $("#modalFormDomain"), 'Domain', hidden, domainFormElements, 'Domain', tblDomains, true, $("#addDomain"));
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
            let ga_code = $("#ga_code").val();
            let gtm_code = $("#gtm_code").val();

            k.put('Site', 'id', idx,
            {
                'aliasDomain':aliasDomain,
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