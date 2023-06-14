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

                // application setting
                $("#userorg_colname").val(app.userorg_colname);

                let modelIdx = null;
                let orgIdx = null;

                k.get('DataModel', 'application', r.data[0].application.id, [], function(r) {
                    if(r.data.length > 0) {
                        r.data.forEach(element => {
                            if (element.name == app.user_model) {
                                modelIdx = element.id;
                            }
                            if (element.name == app.org_model) {
                                orgIdx = element.id;
                            }
                            $("#user_model").append('<option value="'+element.id+'" '+(element.name == app.user_model ? 'selected' : '')+'>'+element.name+'</option>');
                            $("#org_model").append('<option value="'+element.id+'" '+(element.name == app.org_model ? 'selected' : '')+'>'+element.name+'</option>');
                        });

                        if (modelIdx != null) {
                            k.get('ModelAttribute', 'dataModel', modelIdx, [], function(r) {
                                if(r.data.length > 0) {
                                    if (orgIdx != null) {
                                        $("#userorg_colname").append('<option value="0">None</option>');
                                    }
                                    r.data.forEach(element => {
                                        $("#username_colname").append('<option value="'+element.id+'" '+(element.name == app.username_colname ? 'selected' : '')+'>'+element.name+'</option>');
                                        $("#password_colname").append('<option value="'+element.id+'" '+(element.name == app.password_colname ? 'selected' : '')+'>'+element.name+'</option>');
                                        if (orgIdx != null) {
                                            $("#userorg_colname").append('<option value="'+element.id+'" '+(element.name == app.userorg_colname ? 'selected' : '')+'>'+element.name+'</option>');
                                        }
                                    });
                                }
                                $("#username_colname").prop('disabled', false);
                                $("#password_colname").prop('disabled', false);
                                $("#userorg_colname").prop('disabled', false);
                                $("#org_model").prop('disabled', false);
                                $("#default_org_model").html('None');
                            });
                        } else {
                            $("#username_colname").prop('disabled', true);
                            $("#password_colname").prop('disabled', true);
                            $("#org_model").prop('disabled', true);
                            $("#default_org_model").html('Kyte Framework Account (Default)');
                            $("#userorg_colname").prop('disabled', true);
                            $("#org_model").val(0);
                        }
                    }
                });
            } else {
                $("#model-name").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }

    // onchange event listener for org and user dropdown
    $("#user_model").change(function(e) {
        let userModelIdx = parseInt($(this).val());
        let orgModelIdx = parseInt($("#org_model").val());

        if (userModelIdx == 0) {
            // if returning to default, reset values
            $("#username_colname").prop('disabled', true);
            $("#password_colname").prop('disabled', true);
            $("#username_colname").html('');
            $("#password_colname").html('');
            $("#userorg_colname").html('');
            $("#default_org_model").html('Kyte Framework Account (Default)');
            $("#userorg_colname").prop('disabled', true);
            $("#org_model").val(0);
            $("#org_model").prop('disabled', true);
        } else {
            if (userModelIdx != orgModelIdx && typeof userModelIdx === 'number') {
                $('#pageLoaderModal').modal('show');
                k.get('ModelAttribute', 'dataModel', userModelIdx, [], function(r) {
                    $("#username_colname").html('');
                    $("#password_colname").html('');
                    $("#userorg_colname").html('');
                    if(r.data.length > 0) {
                        $("#username_colname").prop('disabled', false);
                        $("#password_colname").prop('disabled', false);
                        $("#userorg_colname").prop('disabled', false);
                        $("#userorg_colname").append('<option value="0">None</option>');
                        r.data.forEach(element => {
                            $("#username_colname").append('<option value="'+element.id+'">'+element.name+'</option>');
                            $("#password_colname").append('<option value="'+element.id+'">'+element.name+'</option>');
                            $("#userorg_colname").append('<option value="'+element.id+'">'+element.name+'</option>');
                        });
                    }
                    $("#org_model").prop('disabled', false);
                    $("#default_org_model").html('None');
                    if (orgModelIdx == 0) {
                        $("#userorg_colname").val(0);
                        $("#userorg_colname").prop('disabled', true);
                    } else {
                        $("#userorg_colname").prop('disabled', false);
                    }
                    $('#pageLoaderModal').modal('hide');
                });
            } else {
                alert("User table and org tabe must be different")
            }
        }
    });
    $("#org_model").change(function(e) {
        let userModelIdx = parseInt($("#user_model").val());
        let orgModelIdx = parseInt($(this).val());

        if (userModelIdx == orgModelIdx) {
            alert("User table and org tabe must be different")
        }
        if (orgModelIdx == 0) {
            $("#userorg_colname").val(0);
            $("#userorg_colname").prop('disabled', true);
        } else {
            $("#userorg_colname").prop('disabled', false);
        }
    });
    $("#username_colname").change(function(e) {
        let usernameColname = parseInt($(this).val());
        let passwordColname = parseInt($("#password_colname").val());
        let userorgColname = parseInt($("#userorg_colname").val());

        if (usernameColname == passwordColname) {
            alert("Username/email column cannot be the same as the password column.");
        }
        if (usernameColname == userorgColname) {
            alert("Username/email column cannot be the same as the user organization column.");
        }
        if (passwordColname == userorgColname) {
            alert("Password column cannot be the same as the user organization column.");
        }
    });
    $("#password_colname").change(function(e) {
        let usernameColname = parseInt($("#username_colname").val());
        let passwordColname = parseInt($(this).val());
        let userorgColname = parseInt($("#userorg_colname").val());

        if (usernameColname == passwordColname) {
            alert("Username/email column cannot be the same as the password column.");
        }
        if (usernameColname == userorgColname) {
            alert("Username/email column cannot be the same as the user organization column.");
        }
        if (passwordColname == userorgColname) {
            alert("Password column cannot be the same as the user organization column.");
        }
    });
    $("#userorg_colname").change(function(e) {
        let usernameColname = parseInt($("#username_colname").val());
        let passwordColname = parseInt($("#password_colname").val());
        let userorgColname = parseInt($(this).val());

        if (usernameColname == passwordColname) {
            alert("Username/email column cannot be the same as the password column.");
        }
        if (usernameColname == userorgColname) {
            alert("Username/email column cannot be the same as the user organization column.");
        }
        if (passwordColname == userorgColname) {
            alert("Password column cannot be the same as the user organization column.");
        }
    });

    // update org and user model in backend
    $("#saveSettings").click(function(e) {
        e.preventDefault();

        let userModelIdx = parseInt($("#user_model").val());
        let userModelName = $('#user_model option:selected').text();
        let orgModelIdx = parseInt($("#org_model").val());
        let orgModelName = $('#org_model option:selected').text();

        let usernameColname = parseInt($("#username_colname").val());
        let usernameColnameLabel = $("#username_colname option:selected").text();
        let passwordColname = parseInt($("#password_colname").val());
        let passwordColnameLabel = $("#password_colname option:selected").text();
        let userorgColname = parseInt($("#userorg_colname").val());
        let userorgColnameLabel = $("#userorg_colname option:selected").text();

        if (userModelIdx != 0) {
            // validate the changes
            if (usernameColname == passwordColname) {
                alert("Username/email column cannot be the same as the password column.");
                return;
            }
            if (orgModelIdx != 0) {
                if (userorgColname == 0) {
                    alert("Please choose an organization column.");
                    return;
                }
                if (usernameColname == userorgColname) {
                    alert("Username/email column cannot be the same as the user organization column.");
                    return;
                }
                if (passwordColname == userorgColname) {
                    alert("Password column cannot be the same as the user organization column.");
                    return;
                }
            }
        }

        k.put('Application', 'id', app.id,
        {
            'user_model':userModelIdx == 0 ? null : userModelName,
            'username_colname':userModelIdx == 0 ? null : usernameColnameLabel,
            'password_colname':userModelIdx == 0 ? null : passwordColnameLabel,
            'org_model':userModelIdx == 0 || orgModelIdx == 0 ? null : orgModelName,
            'userorg_colname':userModelIdx == 0 || orgModelIdx == 0 ? null : userorgColnameLabel,
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