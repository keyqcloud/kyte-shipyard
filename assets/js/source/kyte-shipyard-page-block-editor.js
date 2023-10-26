var page;
var jsEditor;

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
        '@silexlabs/grapesjs-fonts',
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
        '@silexlabs/grapesjs-fonts': {
            api_key: 'AIzaSyABwPYuu1wZ5ujTfv2iK5bAZMjWr0zUzqg',
        }
    }
})

$(document).ready(function () {
    let sidenav = new KyteSidenav("#sidenav", subnavPage, "#Page");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Page' : hash;
    $(hash).removeClass('d-none');
    $(hash + '-nav-link').addClass('active');

    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        k.get("Page", "id", idx, [], function (r) {
            if (r.data[0]) {
                page = r.data[0];

                // display page title in window
                document.title = document.title + " - " + page.title;
                // set page title and description
                $("#setting-page-title").val(page.title);
                $("#setting-page-description").val(page.description);

                // if code editor, redirect to code editor page
                if (page.page_type != 'block') {
                    let obj = { 'model': 'Page', 'idx': idx };
                    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    window.location = '/app/page/index.html?request=' + encoded;
                }

                if (page.protected == 0) {
                    $("#sitemap-option-wrapper").removeClass('d-none');
                    $('#setting-sitemap-include').val(page.sitemap_include);
                }

                $("#setting-obfuscatejs").val(page.obfuscate_js);
                $("#setting-use_container").val(page.use_container);

                // load blocks
                let blocks = {};
                if (page.block_layout.length > 0) {
                    try {
                        blocks = JSON.parse(page.block_layout);
                        blockEditor.loadProjectData(blocks);
                    } catch (e) {
                        console.error(e + " => " + page.block_layout);
                        alert(e);
                    }
                }

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

                // hide after editor generation
                if (hash != '#Page') {
                    $("#Page").addClass('d-none');
                }
                if (hash != '#JavaScript') {
                    $("#JavaScript").addClass('d-none');
                }

                let obj = { 'model': 'Site', 'idx': page.site.id };
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request=' + encoded);

                $("#page-title").html(page.title);
                $("#viewPage").attr('href', 'https://' + (page.site.aliasDomain ? page.site.aliasDomain : page.site.cfDomain) + '/' + page.s3key);

                obj = { 'model': 'Application', 'idx': page.site.application.id };
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

                k.get('Navigation', 'site', page.site.id, [], function (r) {
                    let main_navigation = page.main_navigation ? page.main_navigation.id : 0;
                    for (data of r.data) {
                        $("#setting-main-navigation").append('<option value="' + data.id + '"' + (main_navigation == data.id ? ' selected' : '') + '>' + data.name + '</option>');
                    }
                });

                k.get('SideNav', 'site', page.site.id, [], function (r) {
                    let side_navigation = page.side_navigation ? page.side_navigation.id : 0;
                    for (data of r.data) {
                        $("#setting-side-navigation").append('<option value="' + data.id + '"' + (side_navigation == data.id ? ' selected' : '') + '>' + data.name + '</option>');
                    }
                });

                let sectionTemplateCond = btoa(JSON.stringify([{ 'field': 'category', 'value': 'footer' }]));
                k.get('SectionTemplate', 'site', page.site.id, [{ 'name': 'x-kyte-query-conditions', 'value': sectionTemplateCond }], function (r) {
                    let section = page.footer ? page.footer.id : 0;
                    for (data of r.data) {
                        $("#setting-footer").append('<option value="' + data.id + '"' + (section == data.id ? ' selected' : '') + '>' + data.title + '</option>');
                    }
                });

                let appnav = generateAppNav(page.site.application.name, encoded);

                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">', 'Sites');
                navbar.create();

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
                        'sitemap_include': $("#setting-sitemap-include").val(),
                        'block_layout': JSON.stringify(blockEditor.getProjectData()),
                        'html': blockEditor.getHtml().match(/<body[^>]*>([\s\S]*)<\/body>/)[1],
                        'javascript': rawJS + blockEditor.getJs(),
                        'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
                        'stylesheet': blockEditor.getCss(),
                    };

                    console.log(payload);

                    k.put('Page', 'id', idx, payload, null, [], function (r) {
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
                        'main_navigation': $("#setting-main-navigation").val(),
                        'side_navigation': $("#setting-side-navigation").val(),
                        'footer': $("#setting-footer").val(),
                        'title': $("#setting-page-title").val(),
                        'description': $("#setting-page-description").val(),
                        'sitemap_include': $("#setting-sitemap-include").val(),
                        'obfuscate_js': $("#setting-obfuscatejs").val(),
                        'use_container': $("#setting-use_container").val(),
                        'state': 1,
                    };
                    k.put('Page', 'id', idx, payload, null, [], function (r) {
                        $('#pageLoaderModal').modal('hide');
                    }, function (err) {
                        if (err == 'Unable to create new invalidation') {
                            setTimeout(() => {
                                k.put('Page', 'id', idx, payload, null, [], function (r) {
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
});