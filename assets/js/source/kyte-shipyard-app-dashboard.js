
$(document).ready(function() {

    $('#pageLoaderModal').modal('show');

    if (!k.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // get url param
    let idx = k.getPageRequest();
    idx = idx.idx;

    k.get("Application", "id", idx, [], function(r) {
        if (r.data[0]) {
            data = r.data[0];

            let obj = {'model': 'Application', 'idx':r.data[0].id};
            let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
            
            let appnav = [
                [
                    {
                        faicon:'fas fa-rocket',
                        class:'me-2 text-light',
                        label: data.name,
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
            ]
        
            let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Models');
            navbar.create();

        } else {
            alert("Failed to load...");
        }
        $('#pageLoaderModal').modal('hide');
    });
});