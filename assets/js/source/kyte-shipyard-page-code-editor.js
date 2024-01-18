import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

var htmlEditor;
var jsEditor;
var cssEditor;
var pageData;

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

document.addEventListener('KyteInitialized', function(e) {
    let k = e.detail.k;
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

        // check if we are explicitly asked to use code editor even if page was made using block
        let forceCodeEditor = k.getUrlParameter('mode') == 'code';

        k.get("KytePageData", "page", idx, [], function(r) {
            if (r.data[0]) {
                pageData = r.data[0];

                // display page title in window
                document.title = document.title + " - " + pageData.page.title;
                // set page title and description
                $("#setting-page-title").val(pageData.page.title);
                $("#setting-page-description").val(pageData.page.description);
                
                // if block editor, redirect to block editor page.
                if (pageData.page.page_type == 'block' && !forceCodeEditor) {
                    // redirect to block editor....
                    let obj = {'model': 'KytePage', 'idx':idx};
                    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    window.location = '/app/page/blockeditor.html?request='+encoded;
                }

                if (pageData.page.protected == 0) {
                    $("#sitemap-option-wrapper").removeClass('d-none');
                    $('#setting-sitemap-include').val(pageData.page.sitemap_include);
                }

                $("#setting-obfuscatejs").val(pageData.page.obfuscate_js);
                $("#setting-use_container").val(pageData.page.use_container);

                htmlEditor = monaco.editor.create(document.getElementById("htmlEditor"), {
                    value: pageData.html,
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
                    value: pageData.javascript,
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
                    value: pageData.stylesheet,
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

                let obj = {'model': 'KyteSite', 'idx':pageData.page.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request='+encoded+'#Pages');

                $("#page-title").html(pageData.page.title);
                $("#viewPage").attr('href','https://'+(pageData.page.site.aliasDomain ? pageData.page.site.aliasDomain : pageData.page.site.cfDomain)+'/'+pageData.page.s3key);

                obj = {'model': 'Application', 'idx':pageData.page.site.application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

                k.get('Navigation', 'site', pageData.page.site.id, [], function (r) {
                    let main_navigation = pageData.page.main_navigation ? pageData.page.main_navigation.id : 0;
                    r.data.forEach(function(data) {
                        $("#setting-main-navigation").append('<option value="' + data.id + '"' + (main_navigation == data.id ? ' selected' : '') + '>' + data.name + '</option>');
                    });
                });
                

                k.get('SideNav', 'site', pageData.page.site.id, [], function (r) {
                    let side_navigation = pageData.page.side_navigation ? pageData.page.side_navigation.id : 0;
                    r.data.forEach(function(data) {
                        $("#setting-side-navigation").append('<option value="' + data.id + '"' + (side_navigation == data.id ? ' selected' : '') + '>' + data.name + '</option>');
                    });
                });

                let KyteSectionTemplateCond = btoa(JSON.stringify([{ 'field': 'category', 'value': 'footer' }]));
                k.get('KyteSectionTemplate', 'site', pageData.page.site.id, [{ 'name': 'x-kyte-query-conditions', 'value': KyteSectionTemplateCond }], function (r) {
                    let section = pageData.page.footer ? pageData.page.footer.id : 0;
                    r.data.forEach(function(data) {
                        $("#setting-footer").append('<option value="' + data.id + '"' + (section == data.id ? ' selected' : '') + '>' + data.title + '</option>');
                    });
                });

                let appnav = generateAppNav(pageData.page.site.application.name, encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">', 'Sites');
                navbar.create();

                // page assignment table and form
                let hiddenScriptAssignment = [
                    {
                        'name': 'site',
                        'value': pageData.page.site.id
                    },
                    {
                        'name': 'page',
                        'value': pageData.page.id
                    }
                ];
                let fldsScripts = [
                    [
                        {
                            'field':'script',
                            'type':'select',
                            'label':'Script',
                            'required':false,
                            'option': {
                                'ajax': true,
                                'data_model_name': 'KyteScript',
                                'data_model_field': 'site',
                                'data_model_value': pageData.page.site.id,
                                'data_model_attributes': ['name', 's3key'],
                                'data_model_default_field': 'id',
                                // 'data_model_default_value': 1,
                            }
                        },
                    ],
                ];
                let colDefScripts = [
                    {'targets':0,'data':'script.name','label':'Script'},
                    {'targets':1,'data':'script.s3key','label':'path'},
                ];
                var tblScripts = new KyteTable(k, $("#scripts-table"), {'name':"KyteScriptAssignment",'field':"page",'value':pageData.page.id}, colDefScripts, true, [0,"asc"], false, true);
                tblScripts.init();
                var frmScript = new KyteForm(k, $("#modalFormScripts"), 'KyteScriptAssignment', hiddenScriptAssignment, fldsScripts, 'Script Assignment', tblScripts, true, $("#addScript"));
                frmScript.init();
                tblScripts.bindEdit(frmScript);

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    
                    try {
                        let rawJS = jsEditor.getValue();
                        let obfuscatedJS = JavaScriptObfuscator.obfuscate(rawJS, {
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
                        });
                    
                        let payload = {
                            'html': htmlEditor.getValue(),
                            'javascript': rawJS,
                            'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
                            'stylesheet': cssEditor.getValue(),
                            'main_navigation':$("#setting-main-navigation").val(),
                            'side_navigation':$("#setting-side-navigation").val(),
                            'footer':$("#setting-footer").val(),
                            'title':$("#setting-page-title").val(),
                            'description':$("#setting-page-description").val(),
                            'sitemap_include':$("#setting-sitemap-include").val(),
                            'obfuscate_js':$("#setting-obfuscatejs").val(),
                            'use_container':$("#setting-use_container").val(),
                            'page_type': pageData.page.page_type == 'block' ? 'custom' : pageData.page.page_type,
                        };
                        k.put('KytePage', 'id', idx, payload, null, [], function(r) {
                            $('#pageLoaderModal').modal('hide');
                        });
                    
                    } catch (error) {
                        // Alert the user
                        alert("An error occurred: " + error.message);

                        console.error(error.message);
                    
                        // Hide the modal
                        $('#pageLoaderModal').modal('hide');
                    }
                });

                $("#publishPage").click(function() {
                    $('#pageLoaderModal').modal('show');

                    try {
                        let rawJS = jsEditor.getValue();
                        let obfuscatedJS = JavaScriptObfuscator.obfuscate(rawJS, {
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
                        });
                    
                        let payload = {
                            'html': htmlEditor.getValue(),
                            'javascript': rawJS,
                            'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
                            'stylesheet': cssEditor.getValue(),
                            'main_navigation':$("#setting-main-navigation").val(),
                            'side_navigation':$("#setting-side-navigation").val(),
                            'footer':$("#setting-footer").val(),
                            'title':$("#setting-page-title").val(),
                            'description':$("#setting-page-description").val(),
                            'sitemap_include':$("#setting-sitemap-include").val(),
                            'obfuscate_js':$("#setting-obfuscatejs").val(),
                            'use_container':$("#setting-use_container").val(),
                            'page_type': pageData.page.page_type == 'block' ? 'custom' : pageData.page.page_type,
                            'state': 1,
                        };
                        k.put('KytePage', 'id', idx, payload, null, [], function(r) {
                            $('#pageLoaderModal').modal('hide');
                        }, function(err) {
                            if (err == 'Unable to create new invalidation') {
                                setTimeout(() => {
                                    k.put('KytePage', 'id', idx, payload, null, [], function(r) {
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
                    
                    } catch (error) {
                        // Alert the user
                        alert("An error occurred: " + error.message);

                        console.error(error.message);
                    
                        // Hide the modal
                        $('#pageLoaderModal').modal('hide');
                    }
                });
            } else {
                alert("ERROR");
            }
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }

    $("#downloadPage").click(function(e) {
        e.preventDefault();

        fetch(page.download_link).then(res => res.blob()).then(file => {
            const pathnameParts = pageData.page.s3key.split('/');
            const filenameWithExtension = pathnameParts[pathnameParts.length - 1];

            let tempUrl = URL.createObjectURL(file);
            const aTag = document.createElement("a");
            aTag.href = tempUrl;
            console.log(filenameWithExtension);
            aTag.download = filenameWithExtension;
            document.body.appendChild(aTag);
            aTag.click();
            URL.revokeObjectURL(tempUrl);
            aTag.remove();
        }).catch((e) => {
            alert("Failed to download file!"+e);
        });
    });

    $('.page-tab-link').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
    
        $('.page-tab-link').removeClass('active');
        $(this).addClass('active');
    
       $('.tab-page').addClass('d-none');
       let pageSelector = $(this).data('targetPage');
       $('#'+pageSelector).removeClass('d-none');
    });
});