var editor;
let functionName = "Undefined";

let assignControllerElements = [
    [
        {
            'field': 'controller',
            'type': 'select',
            'label': 'Controller',
            'required': true,
            'placeholder': 'Please select...',
            'option': {
                'ajax': true,
                'data_model_name': 'Controller',
                'data_model_field': '',
                'data_model_value': '',
                'data_model_attributes': ['name'],
                'data_model_default_field': 'id',
                // 'data_model_default_value': 1,
            }
        }
    ]
];

$(document).ready(function() {
    let sidenav = new KyteSidenav("#sidenav", subnavFunction, "#Code");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Code' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        let hidden = [
            {
                'name': 'function',
                'value': idx
            }
        ];

        k.get("Function", "id", idx, [], function(r) {
            if (r.data[0]) {
                functionName = r.data[0].name;
                $("#function-name").html(functionName);
                $("#function-type").html(r.data[0].type);

                editor = monaco.editor.create(document.getElementById('container'), {
                    value: r.data[0].code,
                    theme: 'vs-dark',
                    language: "php"
                });

                let obj = {'model': 'Controller', 'idx':r.data[0].controller.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToController").attr('href', '/app/controller?request='+encoded);

                obj = {'model': 'Application', 'idx':r.data[0].controller.application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

                let appnav = [
                    [
                        {
                            faicon:'fas fa-rocket',
                            class:'me-2 text-light',
                            label: r.data[0].controller.application.name,
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

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    k.put('Function', 'id', idx, {'code':editor.getValue()}, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                    });
                });
            } else {
                $("#function-name").html("Undefined");
                $("#function-type").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});