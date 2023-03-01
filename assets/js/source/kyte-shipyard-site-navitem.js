$(document).ready(function() {
    $('#pageLoaderModal').modal('show');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        k.get("Navigation", "id", idx, [], function(r) {
            if (r.data[0]) {
                data = r.data[0];
                $("#site-name").html(data.site.name);
                $("#domain-name").html('<i class="fas fa-link me-2"></i>'+data.site.cfDomain);
                $("#domain-name").attr('href', 'https://'+data.site.cfDomain);
                $("#region").html(data.site.region);

                $("#navigation-name").html(data.name);

                let hidden = [
                    {
                        'name': 'site',
                        'value': data.site.id
                    },
                    {
                        'name': 'navigation',
                        'value': idx
                    }
                ];

                let obj = {'model': 'Site', 'idx':data.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

                let subnavSite = [
                    {
                        faicon:'fas fa-sitemap',
                        label:'Pages',
                        href:'/app/site/?request='+encoded+'#Pages',
                        selector:'#Pages'
                    },
                    {
                        faicon:'fas fa-photo-video',
                        label:'Media',
                        href:'/app/site/?request='+encoded+'#Media',
                        selector:'#Media'
                    },
                    {
                        faicon:'fas fa-compass',
                        label:'Navigation',
                        href:'/app/site/?request='+encoded+'#Navigation',
                        selector:'#Navigation'
                    },
                    {
                        faicon:'fas fa-bars',
                        label:'Side Menu',
                        href:'/app/site/?request='+encoded+'#SideNav',
                        selector:'#SideNav'
                    },
                    {
                        faicon:'fas fa-at',
                        label:'Domains',
                        href:'/app/site/?request='+encoded+'#Domains',
                        selector:'#Domains'
                    },
                    {
                        faicon:'fas fa-wrench',
                        label:'Settings',
                        href:'/app/site/?request='+encoded+'#Settings',
                        selector:'#Settings'
                    },
                ];

                let sidenav = new KyteSidenav("#sidenav", subnavSite);
                sidenav.create();

                obj = {'model': 'Application', 'idx':data.site.application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                
                let appnav = generateAppNav(data.site.application.name, encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Sites');
                navbar.create();

                // form element
                let NavItemElements = [
                    [
                        {
                            'field':'title',
                            'type':'text',
                            'label':'Label',
                            'required':true
                        },
                        {
                            'field':'isLogout',
                            'type':'select',
                            'label':'Is this a logout button?',
                            'required':true,
                            'option': {
                                'ajax': false,
                                'data': {
                                    '0': 'No',
                                    '1': 'Yes',
                                }
                            }
                        },
                        {
                            'field':'center',
                            'type':'select',
                            'label':'Location',
                            'required':true,
                            'option': {
                                'ajax': false,
                                'data': {
                                    '1': 'Center',
                                    '0': 'Right',
                                }
                            }
                        },
                        {
                            'field':'faicon',
                            'type':'text',
                            'label':'Font Awesome class',
                            'required':false
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
                            'field':'page',
                            'type':'select',
                            'label':'Page',
                            'required':false,
                            'placeholder': 'N/A',
                            'option': {
                                'ajax': true,
                                'data_model_name': 'Page',
                                'data_model_field': 'site',
                                'data_model_value': data.site.id,
                                'data_model_attributes': ['title'],
                                'data_model_default_field': 'id',
                                // 'data_model_default_value': 1,
                            }
                        },
                        {
                            'field':'parentItem',
                            'type':'select',
                            'label':'Parent menu item (only select if submenu',
                            'required':false,
                            'placeholder': 'N/A',
                            'option': {
                                'ajax': true,
                                'data_model_name': 'NavigationItem',
                                'data_model_field': 'navigation',
                                'data_model_value': idx,
                                'data_model_attributes': ['title'],
                                'data_model_default_field': 'id',
                                // 'data_model_default_value': 1,
                            }
                        }
                    ]
                ];

                // table and forms
                var datatable = createTable("#navitem-table", "NavigationItem", colDefNavItem, 'navigation', idx, true, true);
                var modalForm = new KyteForm(k, $("#modalFormNavItem"), 'NavigationItem', hidden, NavItemElements, 'Navigation Item', datatable, true, $("#addMenuItem"));
                modalForm.init();
                datatable.bindEdit(modalForm);
            } else {
                $("#model-name").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});