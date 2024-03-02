import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

var pageData;
var jsEditor;
var isDirty = false;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    jsEditor.editor.setTheme(colorMode);
});

const blockEditor = grapesjs.init({
    container: "#blockEditor",
    heigh: '100%',
    width: '100%',
    // Disable the storage manager for the moment
    storageManager: false,
    plugins: [
        'grapesjs-preset-webpage',
        'grapesjs-blocks-flexbox',
        // 'grapesjs-lory-slider',
        'grapesjs-tabs',
        'grapesjs-tooltip',
        'grapesjs-custom-code',
        'grapesjs-touch',
        'grapesjs-parser-postcss',
        'grapesjs-typed',
        'grapesjs-ui-suggest-classes',
        'grapesjs-typed',
        'gjs-blocks-basic',
        // 'grapesjs-navbar',
        'grapesjs-plugin-forms',
        'grapesjs-component-countdown',
        'grapesjs-style-gradient',
        'grapesjs-style-filter', // check initialization
        'grapesjs-style-bg',
        'grapesjs-plugin-export',
        'grapesjs-tui-image-editor',
    ],
    pluginsOpts: {
        'grapesjs-tui-image-editor': {
            config: {
                includeUI: {
                    initMenu: 'filter',
                },
            },
        },
    },
    canvas: {
        styles: [
          'https://use.fontawesome.com/releases/v5.12.0/css/all.css',
          'https://code.jquery.com/ui/1.13.0/themes/base/jquery-ui.css',
          'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css',
          'https://cdn.datatables.net/1.10.23/css/jquery.dataTables.min.css',
        ],
        scripts: [
            'https://code.jquery.com/jquery-3.5.1.min.js',
            'https://code.jquery.com/ui/1.13.0/jquery-ui.min.js',
            'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js',
            'https://cdn.datatables.net/1.10.23/js/jquery.dataTables.min.js',
        ],
    }
});

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let sidenav = new KyteSidenav("#sidenav", subnavPage, "#Page");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Page' : hash;
    $(hash).removeClass('d-none');
    $(hash + '-nav-link').addClass('active');

    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        _ks.get("KytePageData", "page", idx, [], function (r) {
            if (r.data[0]) {
                pageData = r.data[0];

                // display page title in window
                document.title = document.title + " - " + pageData.page.title;
                // set page title and description
                $("#setting-page-title").val(pageData.page.title);
                $("#setting-page-description").val(pageData.page.description);
                $("#lang").val(pageData.page.lang.length == 0 ? 'default' : pageData.page.leng);

                if (pageData.page.protected == 0) {
                    $("#sitemap-option-wrapper").removeClass('d-none');
                    $('#setting-sitemap-include').val(pageData.page.sitemap_include);
                }

                $("#setting-obfuscatejs").val(pageData.page.obfuscate_js);
                $("#setting-use_container").val(pageData.page.use_container);

                // if code editor, redirect to code editor page
                if (pageData.page.page_type != 'block') {
                    // warn user that siwtching to block editor from custom can cause layout issues
                    $("#alertModal").modal('show');

                    // prse the data
                    // HTML content to be parsed
                    const htmlContent = pageData.html;

                    // CSS content to be parsed
                    const cssContent = pageData.stylesheet;

                    // Parse the HTML content and add it to the GrapesJS editor
                    blockEditor.setComponents(htmlContent);

                    // Parse the CSS content and add it to the GrapesJS editor
                    blockEditor.setStyle(cssContent);
                } else {
                    // load blocks
                    let blocks = {};
                    if (pageData.block_layout.length > 0) {
                        try {
                            blocks = JSON.parse(pageData.block_layout);
                            blockEditor.loadProjectData(blocks);
                        } catch (e) {
                            console.error(e + " => " + pageData.block_layout);
                            alert(e);
                        }
                    }
                }

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

                jsEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });

                // hide after editor generation
                if (hash != '#Page') {
                    $("#Page").addClass('d-none');
                }
                if (hash != '#JavaScript') {
                    $("#JavaScript").addClass('d-none');
                }

                let obj = { 'model': 'KyteSite', 'idx': pageData.page.site.id };
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request=' + encoded);

                $("#page-title").html(pageData.page.title);
                $("#page-path").html(pageData.page.s3key);
                $(".viewPage").attr('href', 'https://' + (pageData.page.site.aliasDomain ? pageData.page.site.aliasDomain : pageData.page.site.cfDomain) + '/' + pageData.page.s3key);

                _ks.get('Navigation', 'site', pageData.page.site.id, [], function (r) {
                    let main_navigation = pageData.page.main_navigation ? pageData.page.main_navigation.id : 0;
                    r.data.forEach(function(data) {
                        $("#setting-main-navigation").append('<option value="' + data.id + '"' + (main_navigation == data.id ? ' selected' : '') + '>' + data.name + '</option>');
                    });
                });
                

                _ks.get('SideNav', 'site', pageData.page.site.id, [], function (r) {
                    let side_navigation = pageData.page.side_navigation ? pageData.page.side_navigation.id : 0;
                    r.data.forEach(function(data) {
                        $("#setting-side-navigation").append('<option value="' + data.id + '"' + (side_navigation == data.id ? ' selected' : '') + '>' + data.name + '</option>');
                    });
                });

                let KyteSectionTemplateCond = btoa(JSON.stringify([{ 'field': 'category', 'value': 'footer' }]));
                _ks.get('KyteSectionTemplate', 'site', pageData.page.site.id, [{ 'name': 'x-kyte-query-conditions', 'value': KyteSectionTemplateCond }], function (r) {
                    let section = pageData.page.footer ? pageData.page.footer.id : 0;
                    r.data.forEach(function(data) {
                        $("#setting-footer").append('<option value="' + data.id + '"' + (section == data.id ? ' selected' : '') + '>' + data.title + '</option>');
                    });
                });

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
                var tblScripts = new KyteTable(_ks, $("#scripts-table"), {'name':"KyteScriptAssignment",'field':"page",'value':pageData.page.id}, colDefScripts, true, [0,"asc"], false, true);
                tblScripts.init();
                var frmScript = new KyteForm(_ks, $("#modalFormScripts"), 'KyteScriptAssignment', hiddenScriptAssignment, fldsScripts, 'Script Assignment', tblScripts, true, $("#addScript"));
                frmScript.init();
                tblScripts.bindEdit(frmScript);

                $("#saveCode").click(function () {
                    $('#pageLoaderModal').modal('show');
                    let rawJS = jsEditor.getValue();
                    let obfuscatedJS = JavaScriptObfuscator.obfuscate(rawJS + blockEditor.getJs(),
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
                    let payload = {
                        'main_navigation': $("#setting-main-navigation").val(),
                        'side_navigation': $("#setting-side-navigation").val(),
                        'title': $("#setting-page-title").val(),
                        'description': $("#setting-page-description").val(),
                        'lang':$("#lang").val() == 'default' ? null : $("#lang").val(),
                        'sitemap_include': $("#setting-sitemap-include").val(),
                        'block_layout': JSON.stringify(blockEditor.getProjectData()),
                        'page_type': 'block',
                        'html': blockEditor.getHtml().match(/<body[^>]*>([\s\S]*)<\/body>/)[1],
                        'javascript': rawJS + blockEditor.getJs(),
                        'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
                        'stylesheet': blockEditor.getCss(),
                    };

                    console.log(payload);

                    _ks.put('KytePage', 'id', idx, payload, null, [], function (r) {
                        $('#pageLoaderModal').modal('hide');
                        isDirty = false;
                    }, function(err) {
                        alert(err);
                        console.error(err)
                        $('#pageLoaderModal').modal('hide');
                    });
                });

                $("#publishPage").click(function () {
                    $('#pageLoaderModal').modal('show');
                    let rawJS = jsEditor.getValue();
                    let obfuscatedJS = JavaScriptObfuscator.obfuscate(rawJS + blockEditor.getJs(),
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
                    let payload = {
                        'block_layout': JSON.stringify(blockEditor.getProjectData()),
                        'html': blockEditor.getHtml().match(/<body[^>]*>([\s\S]*)<\/body>/)[1],
                        'javascript': rawJS + blockEditor.getJs(),
                        'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
                        'stylesheet': blockEditor.getCss(),
                        'page_type': 'block',
                        'main_navigation': $("#setting-main-navigation").val(),
                        'side_navigation': $("#setting-side-navigation").val(),
                        'footer': $("#setting-footer").val(),
                        'title': $("#setting-page-title").val(),
                        'description': $("#setting-page-description").val(),
                        'lang':$("#lang").val() == 'default' ? null : $("#lang").val(),
                        'sitemap_include': $("#setting-sitemap-include").val(),
                        'obfuscate_js': $("#setting-obfuscatejs").val(),
                        'use_container': $("#setting-use_container").val(),
                        'state': 1,
                    };
                    _ks.put('KytePage', 'id', idx, payload, null, [], function (r) {
                        $('#pageLoaderModal').modal('hide');
                    }, function (err) {
                        if (err == 'Unable to create new invalidation') {
                            setTimeout(() => {
                                _ks.put('KytePage', 'id', idx, payload, null, [], function (r) {
                                    $('#pageLoaderModal').modal('hide');
                                }, function (err) {
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
        location.href = "/?redir=" + encodeURIComponent(window.location);
    }

    $("#downloadPage").click(function(e) {
        e.preventDefault();

        fetch(pageData.download_link).then(res => res.blob()).then(file => {
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
});

window.onbeforeunload = function() {
    if (isDirty) {
        return "You have unsaved changes. Are you sure you want to leave?";
    }
};