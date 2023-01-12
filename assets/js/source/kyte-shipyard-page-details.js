var htmlEditor;
var jsEditor;
var cssEditor;
var page;

$(document).ready(function() {
    let sidenav = new KyteSidenav("#sidenav", subnavPage, "#Page");
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

        k.get("Page", "id", idx, [], function(r) {
            if (r.data[0]) {
                page = r.data[0];
                let hidden = [
                    {
                        'name': 'site',
                        'value': page.site.id
                    }
                ];
                
                htmlEditor = monaco.editor.create(document.getElementById("htmlEditor"), {
                    value: page.html,
                    theme: 'vs-dark',
                    language: "html"
                });

                jsEditor = monaco.editor.create(document.getElementById("jsEditor"), {
                    value: page.javascript,
                    theme: 'vs-dark',
                    language: "javascript"
                });

                cssEditor = monaco.editor.create(document.getElementById("cssEditor"), {
                    value: page.stylesheet,
                    theme: 'vs-dark',
                    language: "css"
                });

                // hide after editor generation
                $("#JavaScript").addClass('d-none');
                $("#Stylesheet").addClass('d-none');

                let obj = {'model': 'Site', 'idx':page.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site?request='+encoded);

                $("#page-title").html(page.title);
                $("#page-path").html('<i class="fas fa-link me-2"></i>https://'+page.site.cfDomain+'/'+page.s3key);
                // $("#domain-name").attr('href', 'https://'+data.cfDomain);
                // $("#region").html(data.region);
                obj = {'model': 'Application', 'idx':page.site.application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                
                let appnav = [
                    [
                        {
                            faicon:'fas fa-rocket',
                            class:'me-2 text-light',
                            label: page.site.application.name,
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
                    k.put('Page', 'id', idx, {'html':htmlEditor.getValue(), 'javascript': jsEditor.getValue(), 'stylesheet': cssEditor.getValue()}, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                    });
                });

                $("#publishPage").click(function() {
                    $('#pageLoaderModal').modal('show');
                    // create kyte connect js
                    let connect = "let endpoint = 'https://api.getpage.co';var k = new Kyte(endpoint, '"+r.kyte_pub+"', '"+r.kyte_iden+"', '"+r.kyte_num+"', '"+page.application_identifier+"');k.init();$(document).ready(function() { k.addLogoutHandler(\"#logout\");});\n\n";

                    let rawJS = jsEditor.getValue();
                    // var obfuscated = JavaScriptObfuscator.obfuscate(connect+rawJS,
                    //     {
                    //         compact: true,
                    //         controlFlowFlattening: true,
                    //         controlFlowFlatteningThreshold: 1,
                    //         numbersToExpressions: true,
                    //         simplify: true,
                    //         stringArrayEncoding: ['base64'],
                    //         stringArrayShuffle: true,
                    //         splitStrings: true,
                    //         stringArrayWrappersType: 'variable',
                    //         stringArrayThreshold: 1
                    //     }
                    // );
                    k.put('Page', 'id', idx, {'html':htmlEditor.getValue(), 'javascript': rawJS, 'state': 1, 'kyte_connect': connect}, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                    });
                });
            } else {
                alert("ERROR");
            }
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});