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

let controllerElements = [
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


        k.get("Site", "id", idx, [], function(r) {
            if (r.data[0]) {
                data = r.data[0];
                $("#site-name").html(data.name);
                $("#domain-name").html('<i class="fas fa-link me-2"></i>'+data.cfDomain);
                $("#domain-name").attr('href', 'https://'+data.cfDomain);
                $("#region").html(data.region);
                let obj = {'model': 'Application', 'idx':r.data[0].application.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                
                let appnav = [
                    [
                        {
                            faicon:'fas fa-rocket',
                            class:'me-2 text-light',
                            label: r.data[0].application.name,
                            href: '/app/dashboard/?request='+encoded
                        },
                        {
                            faicon:'fas fa-globe',
                            class:'me-2 text-light',
                            label:'Sites',
                            href:'/app/sites.html?request='+encoded
                        },
                        {
                            faicon:'fas fa-hdd',
                            class:'me-2 text-light',
                            label:'Data Store',
                            href:'/app/datastore.html?request='+encoded
                        },
                        {
                            faicon:'fas fa-table',
                            class:'me-2 text-light',
                            label:'Models',
                            href:'/app/models.html?request='+encoded
                        },
                        {
                            faicon:'fas fa-layer-group',
                            class:'me-2 text-light',
                            label:'Controllers',
                            href:'/app/controllers.html?request='+encoded
                        },
                        {
                            faicon:'fas fa-cubes',
                            class:'me-2 text-light',
                            label:'Functions',
                            href:'/app/functions.html?request='+encoded
                        }
                    ],
                    [
                        {
                            dropdown: true,
                            // faicon:'fas fa-server',
                            class:'me-2 text-light',
                            label:'Account',
                            items: [
                                {
                                    faicon:'fas fa-cog',
                                    class:'me-2',
                                    label:'Settings',
                                    href:'/app/settings.html'
                                },
                                {
                                    logout: true,
                                    faicon:'fas fa-server',
                                    class:'me-2',
                                    label:'Logout'
                                }
                            ]
                        }
                    ]
                ];
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Sites');
                navbar.create();

                let pageFrmElements = [
                    [
                        {
                            'field':'title',
                            'type':'text',
                            'label':'Page Title',
                            'required':true
                        }
                    ],
                    [
                        {
                            'field':'s3key',
                            'type':'text',
                            'label':'Path: https://'+data.cfDomain+'/',
                            'required':true
                        }
                    ],
                    [
                        {
                            'field':'protected',
                            'type':'select',
                            'label':'Requires Session',
                            'required':true,
                            'option': {
                                'ajax': false,
                                'data': {
                                    '0': 'No',
                                    '1': 'Yes'
                                }
                            }
                        }
                    ]
                ];
                var tblPage = createTable("#pages-table", "Page", colDefPage, 'site', idx, false, true, '/app/page/', 'id', true);
                var modalFormPage = new KyteForm(k, $("#modalFormPage"), 'Page', hidden, pageFrmElements, 'Page', tblPage, true, $("#createPage"));
                modalFormPage.init();
                modalFormPage.success = function(r) {
                    if (r.data[0]) {
                        let obj = {'model': 'Page', 'idx':r.data[0].id};
                        let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                        location.href="/app/page/?request="+encoded+"#Code";
                    }
                }
                tblPage.bindEdit(modalFormPage);
            } else {
                $("#model-name").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });

        // attribute table and form
        // var tblAttributes = createTable("#attributes-table", "ModelAttribute", colDefAttributes, 'dataModel', idx, true, true);
        // var modalForm = new KyteForm(k, $("#modalForm"), 'ModelAttribute', hidden, elements, 'Model Attribute', tblAttributes, true, $("#newAttribute"));
        // modalForm.init();
        // tblAttributes.bindEdit(modalForm);

        // controller table and form
        // var tblController = createTable("#controller-table", "Controller", colDefControllers, 'dataModel', idx, true, true, '/app/controller/', 'id');
        // var controllerModalForm = new KyteForm(k, $("#modalControllerForm"), 'Controller', hidden, controllerElements, 'Controller', tblController, true, $("#newController"));
        // controllerModalForm.init();
        // controllerModalForm.success = function(r) {
        //     if (r.data[0]) {
        //         let obj = {'model': 'Controller', 'idx':r.data[0].id};
        //         let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
        //         location.href="/app/controller/?request="+encoded;
        //     }
        // }
        // tblController.bindEdit(controllerModalForm);

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});