var htmlEditor;
var jsEditor;
var cssEditor;
var page;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    htmlEditor.editor.setTheme(colorMode);
    jsEditor.editor.setTheme(colorMode);
    cssEditor.editor.setTheme(colorMode);
});

// key bindings for saving
document.addEventListener("keydown", function(event) {
    // Check if the Ctrl key (Windows) or the Command key (Mac) is pressed
    var isCtrlPressed = event.ctrlKey || event.metaKey;
  
    // Check if the S key is pressed
    var isSPressed = event.key === "s";

    var isPPressed = event.key === "p";
  
    // Check if both the Ctrl key and the S key are pressed
    if (isCtrlPressed && isSPressed) {
      event.preventDefault(); // Prevent the default browser save action
  
      // Call your function here
      $("#saveCode").click();
    }

    if (isCtrlPressed && isPPressed) {
        event.preventDefault(); // Prevent the default browser save action
    
        // Call your function here
        $("#publishPage").click();
      }    
});

$(document).ready(function() {
    let sidenav = new KyteSidenav("#sidenav", subnavPage, "#Page");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Page' : hash;
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

                $("#setting-page-title").val(page.title);
                $("#setting-page-description").val(page.description);
                
                if (page.page_type == 'block') {
                    // redirect to block editor....
                    let obj = {'model': 'Page', 'idx':idx};
                    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    window.location = '/app/page/blockeditor.html?request='+encoded;
                }

                if (page.protected == 0) {
                    $("#sitemap-option-wrapper").removeClass('d-none');
                    $('#setting-sitemap-include').val(page.sitemap_include);
                }

                htmlEditor = monaco.editor.create(document.getElementById("htmlEditor"), {
                    value: page.html,
                    theme: colorMode,
                    language: "html",
                    automaticLayout: true,
                    wordWrap: true,
                    // wordWrapColumn: 40,
                    // Set this to false to not auto word wrap minified files
                    wordWrapMinified: true,
                    // try "same", "indent" or "none"
                    wrappingIndent: 'indent'
                });

                jsEditor = monaco.editor.create(document.getElementById("jsEditor"), {
                    value: page.javascript,
                    theme: colorMode,
                    language: "javascript",
                    automaticLayout: true,
                    wordWrap: true,
                    // wordWrapColumn: 40,
                    // Set this to false to not auto word wrap minified files
                    wordWrapMinified: true,
                    // try "same", "indent" or "none"
                    wrappingIndent: 'indent'
                });

                cssEditor = monaco.editor.create(document.getElementById("cssEditor"), {
                    value: page.stylesheet,
                    theme: colorMode,
                    language: "css",
                    automaticLayout: true,
                    wordWrap: true,
                    // wordWrapColumn: 40,
                    // Set this to false to not auto word wrap minified files
                    wordWrapMinified: true,
                    // try "same", "indent" or "none"
                    wrappingIndent: 'indent'
                });
                
                // hide after editor generation
                if (hash != '#Page') {
                    $("#Page").addClass('d-none');
                }
                if (hash != '#JavaScript') {
                    $("#JavaScript").addClass('d-none');
                }
                if (hash != '#Stylesheet') {
                    $("#Stylesheet").addClass('d-none');
                }

                let obj = {'model': 'Site', 'idx':page.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request='+encoded);

                $("#page-title").html(page.title);
                $("#viewPage").attr('href','https://'+page.site.cfDomain+'/'+page.s3key);
                // $("#domain-name").attr('href', 'https://'+data.cfDomain);
                // $("#region").html(data.region);
                obj = {'model': 'Application', 'idx':page.site.application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                
                k.get('Navigation', 'site', page.site.id, [], function(r) {
                    let main_navigation = page.main_navigation ? page.main_navigation.id : 0;
                    for (data of r.data) {
                        $("#setting-main-navigation").append('<option value="'+data.id+'"'+(main_navigation == data.id ? ' selected' : '')+'>'+data.name+'</option>');
                    }
                });

                k.get('SideNav', 'site', page.site.id, [], function(r) {
                    let side_navigation = page.side_navigation ? page.side_navigation.id : 0;
                    for (data of r.data) {
                        $("#setting-side-navigation").append('<option value="'+data.id+'"'+(side_navigation == data.id ? ' selected' : '')+'>'+data.name+'</option>');
                    }
                });

                let appnav = generateAppNav(page.site.application.name, encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Sites');
                navbar.create();

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    let payload = {
                        'html': htmlEditor.getValue(),
                        'javascript': jsEditor.getValue(),
                        'stylesheet': cssEditor.getValue(),
                        'main_navigation':$("#setting-main-navigation").val(),
                        'side_navigation':$("#setting-side-navigation").val(),
                        'title':$("#setting-page-title").val(),
                        'description':$("#setting-page-description").val(),
                        'sitemap_include':$("#setting-sitemap-include").val(),
                    };
                    k.put('Page', 'id', idx, payload, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                    });
                });

                $("#publishPage").click(function() {
                    $('#pageLoaderModal').modal('show');
                    // create kyte connect js
                    let connect = "let endpoint = 'https://"+page.api_endpoint+"';var k = new Kyte(endpoint, '"+r.kyte_pub+"', '"+r.kyte_iden+"', '"+r.kyte_num+"', '"+page.application_identifier+"');k.init();\n\n";

                    let rawJS = jsEditor.getValue();
                    let obfuscatedConnect = JavaScriptObfuscator.obfuscate(connect,
                        {
                            compact: true,
                            controlFlowFlattening: true,
                            controlFlowFlatteningThreshold: 1,
                            numbersToExpressions: true,
                            simplify: true,
                            stringArrayEncoding: ['base64'],
                            stringArrayShuffle: true,
                            splitStrings: true,
                            stringArrayWrappersType: 'variable',
                            stringArrayThreshold: 1
                        }
                    );
                    console.log(obfuscatedConnect.getObfuscatedCode());
                    let obfuscatedJS = JavaScriptObfuscator.obfuscate(rawJS,
                        {
                            compact: true,
                            controlFlowFlattening: true,
                            controlFlowFlatteningThreshold: 1,
                            numbersToExpressions: true,
                            simplify: true,
                            stringArrayEncoding: ['base64'],
                            stringArrayShuffle: true,
                            splitStrings: true,
                            stringArrayWrappersType: 'variable',
                            stringArrayThreshold: 1
                        }
                    );
                    console.log(obfuscatedJS.getObfuscatedCode());
                    let payload = {
                        'html': htmlEditor.getValue(),
                        'javascript': rawJS,
                        'stylesheet': cssEditor.getValue(),
                        'main_navigation':$("#setting-main-navigation").val(),
                        'side_navigation':$("#setting-side-navigation").val(),
                        'title':$("#setting-page-title").val(),
                        'description':$("#setting-page-description").val(),
                        'sitemap_include':$("#setting-sitemap-include").val(),
                        'state': 1,
                        'kyte_connect': connect
                    };
                    k.put('Page', 'id', idx, payload, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                    }, function(err) {
                        if (err == 'Unable to create new invalidation') {
                            setTimeout(() => {
                                k.put('Page', 'id', idx, payload, null, [], function(r) {
                                    $('#pageLoaderModal').modal('hide');
                                }, function(err) {
                                    alert(err);
                                    $('#pageLoaderModal').modal('hide');
                                });
                            }, "500");
                        } else {
                            alert(err);
                            $('#pageLoaderModal').modal('hide');
                        }
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