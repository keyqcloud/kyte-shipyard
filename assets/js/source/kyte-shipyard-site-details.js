let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name',
            'required':true
        },
        {
            'field':'type',
            'type':'select',
            'label':'Type',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    's': 'String',
                    't': 'Text',
                    'date': 'Date',
                    'i': 'Integer',
                }
            }
        },
        {
            'field':'required',
            'type':'select',
            'label':'Required',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    1: 'Yes',
                    0: 'No'
                }
            }
        },
        {
            'field': 'foreignKeyModel',
            'type': 'select',
            'label': 'FK Model',
            'required': false,
            'placeholder': 'N/A',
            'option': {
                'ajax': true,
                'data_model_name': 'DataModel',
                'data_model_field': '',
                'data_model_value': '',
                'data_model_attributes': ['name'],
                'data_model_default_field': 'id',
                // 'data_model_default_value': 1,
            }
        }
    ],
    [
        {
            'field':'size',
            'type':'text',
            'label':'Size',
            'required':false,
        },
        {
            'field':'unsigned',
            'type':'select',
            'label':'Unsigned',
            'required':false,
            'option': {
                'ajax': false,
                'data': {
                    "":"n/a",
                    1: 'Yes',
                    0: 'No'
                }
            }
        },
        {
            'field':'protected',
            'type':'select',
            'label':'Protected',
            'required':false,
            'option': {
                'ajax': false,
                'data': {
                    0: 'No',
                    1: 'Yes'
                }
            }
        },
        {
            'field':'defaults',
            'type':'text',
            'label':'Default',
            'required':false
        }
    ],
    [
        {
            'field':'description',
            'type':'text',
            'label':'Description',
            'required':false
        }
    ]
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

let colDefSideNavigation = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'description','label':'Description'},
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
                tblPage.targetBlank = true;

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

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }

    // update org and user model in backend
    $("#saveSettings").click(function(e) {
        e.preventDefault();

        let aliasDomain = $("#aliasDomain").val();

        k.put('Application', 'id', app.id,
        {
            'aliasDomain':aliasDomain,
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
});