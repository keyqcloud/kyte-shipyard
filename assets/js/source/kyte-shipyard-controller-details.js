let controllerName = "Undefined";
let modelName = "Virtual";

// let implementationMap = {
//     // hooks
//     'hook_init':0,
//     'hook_auth':0,
//     'hook_prequery':0,
//     'hook_preprocess':0,
//     'hook_response_data':0,
//     'hook_process_get_response':0,

//     // overrides
//     'new':0,
//     'update':0,
//     'get':0,
//     'delete':0,
// }

let functionFormElements = [
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
                    'hook_init': 'hook : hook_init',
                    'hook_auth': 'hook : hook_auth',
                    'hook_prequery': 'hook : hook_prequery',
                    'hook_preprocess': 'hook : hook_preprocess',
                    'hook_response_data': 'hook : hook_response_data',
                    'hook_process_get_response': 'hook : hook_process_get_response',
                    'new':'override : new',
                    'update':'override : update',
                    'get':'override : get',
                    'delete':'override : delete',
                    'custom':'custom'
                }
            }
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
    let sidenav = new KyteSidenav("#sidenav", subnavController, "#Functions");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#CustomFunctions' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        let hidden = [
            {
                'name': 'controller',
                'value': idx
            }
        ];

        k.get("Controller", "id", idx, [], function(r) {
            if (r.data[0]) {
                controllerName = r.data[0].name;
                $("#controller-name").html(controllerName);
                if (r.data[0].dataModel) {
                    modelName = r.data[0].dataModel.name;
                }
                $("#model-name").html(modelName)

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
            } else {
                $("#controller-name").html("Undefined");
                $("#model-name").html("Undefined");
            }

            $('#pageLoaderModal').modal('hide');
        });

        var functionsTable = createTable("#functions-table", "Function", colDefFunctions, 'controller', idx, false, true, '/app/function/', 'id');
        var modelFormFunction = new KyteForm(k, $("#modalControllerFunctionForm"), 'Function', hidden, functionFormElements, 'Function', functionsTable, true, $("#assignController"));
        modelFormFunction.init();
        modelFormFunction.success = function(r) {
            if (r.data[0]) {
                let obj = {'model': 'Function', 'idx':r.data[0].id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                location.href="/app/function/?request="+encoded+"#Code";
            }
        }
        functionsTable.bindEdit(modelFormFunction);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});