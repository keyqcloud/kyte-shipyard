import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

var htmlEditor;
var jsEditor;
var cssEditor;
var pageData;
var iframe;
var libraries;

var isDirty = false;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    // htmlEditor.editor.setTheme(colorMode);
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

function initializeIFrame() {
    var codeContainer = document.getElementById("pagePreview");
    // Create an iframe element
    iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    // Append the iframe to the code container
    codeContainer.innerHTML = "";
    codeContainer.appendChild(iframe);
}

function renderHtmlCode() {    
    // Get the HTML code from the textarea
    var code = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no"><title>Kyte Shipyard - Page Preview</title>`;
    var css = cssEditor.getValue();
    libraries.forEach(l => {
        if (l.script_type == 'css') {
            code += `<link rel="stylesheet" href="${l.link}">`;
        }
        // else if (l.script_type == 'js') {
        //     code += `<script src="${l.link}"></script>`;
        // }
    });
    code += `<style>${css}</style>`;
    code += `</head><body>`;
    code += htmlEditor.getData();
    code += `</body></html>`;
    
    var blob = new Blob([code], {type: "text/html; charset=utf-8"});
    iframe.src = URL.createObjectURL(blob);
}

document.addEventListener('KyteInitialized', function(e) {
    (function() {
        // Extract the current URL's query string
        const urlParams = new URLSearchParams(window.location.search);
    
        // Retrieve the 'request' parameter from the query
        const requestParam = urlParams.get('request');
    
        // Check if CK_LICENSE is defined
        if (typeof CK_LICENSE === 'undefined') {
            alert("CK_LICENSE is not defined. Please visit CK Editor to obtain a valid license.");
    
            // Construct the new URL for the code editor using the extracted request param
            // encodeURIComponent is used to ensure any special characters are safely encoded
            const newUrl = `/app/page/?request=${encodeURIComponent(requestParam)}#`;
            
            // Redirect to the code editor
            window.location.href = newUrl;
        }
    })();

    let _ks = e.detail._ks;
    let sidenav = new KyteSidenav("#sidenav", subnavPage, "#Page");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Page' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        // check if we are explicitly asked to use code editor even if page was made using block
        let forceCodeEditor = _ks.getUrlParameter('mode') == 'code';

        _ks.get("KytePageData", "page", idx, [], function(r) {
            if (r.data[0]) {
                pageData = r.data[0];

                _ks.get('KyteLibrary', 'site', pageData.site, [], function(r) {
                    libraries = r.data;
                }, function(e) {
                    console.error(e);
                    alert(e);
                });

                // display page title in window
                document.title = document.title + " - " + pageData.page.title;
                // set page title and description
                $("#setting-page-title").val(pageData.page.title);
                $("#setting-page-description").val(pageData.page.description);
                $("#webcomponent_obj_name").val(pageData.page.webcomponent_obj_name);
                $("#lang").val(pageData.page.lang.length == 0 ? 'default' : pageData.page.lang);
                
                // if block editor, redirect to block editor page.
                if (pageData.page.page_type == 'block' && !forceCodeEditor) {
                    // redirect to block editor....
                    let obj = {'model': 'KytePage', 'idx':idx};
                    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    window.location = '/app/page/blockeditor.html?request='+encoded;
                }

                $("#setting-protected").val(pageData.page.protected);
                if (pageData.page.protected == 0) {
                    $("#sitemap-option-wrapper").removeClass('d-none');
                    $('#setting-sitemap-include').val(pageData.page.sitemap_include);
                }

                $("#setting-obfuscatejs").val(pageData.page.obfuscate_js);
                $("#setting-is_js_module").val(pageData.page.is_js_module);
                $("#setting-use_container").val(pageData.page.use_container);

                // htmlEditor = monaco.editor.create(document.getElementById("htmlEditor"), {
                //     value: pageData.html,
                //     theme: colorMode,
                //     language: "html",
                //     automaticLayout: true,
                //     wordWrap: true,
                //     // wordWrapColumn: 40,
                //     // Set this to false to not auto word wrap minified files
                //     wordWrapMinified: true,
                //     // try "same", "indent" or "none"
                //     wrappingIndent: 'indent'
                // });
                const {
                    ClassicEditor,
                    Alignment,
                    Autoformat,
                    AutoImage,
                    AutoLink,
                    Autosave,
                    BalloonToolbar,
                    BlockQuote,
                    Bold,
                    Bookmark,
                    Code,
                    CodeBlock,
                    Essentials,
                    FindAndReplace,
                    FontBackgroundColor,
                    FontColor,
                    FontFamily,
                    FontSize,
                    GeneralHtmlSupport,
                    Heading,
                    Highlight,
                    HorizontalLine,
                    HtmlEmbed,
                    ImageBlock,
                    ImageCaption,
                    ImageInline,
                    ImageInsertViaUrl,
                    ImageResize,
                    ImageStyle,
                    ImageTextAlternative,
                    ImageToolbar,
                    Indent,
                    IndentBlock,
                    Italic,
                    Link,
                    LinkImage,
                    List,
                    ListProperties,
                    MediaEmbed,
                    Paragraph,
                    PasteFromOffice,
                    RemoveFormat,
                    ShowBlocks,
                    SourceEditing,
                    SpecialCharacters,
                    SpecialCharactersArrows,
                    SpecialCharactersCurrency,
                    SpecialCharactersEssentials,
                    SpecialCharactersLatin,
                    SpecialCharactersMathematical,
                    SpecialCharactersText,
                    Strikethrough,
                    Style,
                    Subscript,
                    Superscript,
                    Table,
                    TableCaption,
                    TableCellProperties,
                    TableColumnResize,
                    TableProperties,
                    TableToolbar,
                    TextTransformation,
                    TodoList,
                    Underline,
                    WordCount
                } = CKEDITOR;
                const editorConfig = {
                    toolbar: {
                        items: [
                            'sourceEditing',
                            'showBlocks',
                            '|',
                            'heading',
                            'style',
                            '|',
                            'fontSize',
                            'fontFamily',
                            'fontColor',
                            'fontBackgroundColor',
                            '|',
                            'bold',
                            'italic',
                            'underline',
                            '|',
                            'link',
                            'insertImageViaUrl',
                            'insertTable',
                            'highlight',
                            'blockQuote',
                            'codeBlock',
                            '|',
                            'alignment',
                            '|',
                            'bulletedList',
                            'numberedList',
                            'todoList',
                            'outdent',
                            'indent'
                        ],
                        shouldNotGroupWhenFull: false
                    },
                    plugins: [
                        Alignment,
                        Autoformat,
                        AutoImage,
                        AutoLink,
                        Autosave,
                        BalloonToolbar,
                        BlockQuote,
                        Bold,
                        Bookmark,
                        Code,
                        CodeBlock,
                        Essentials,
                        FindAndReplace,
                        FontBackgroundColor,
                        FontColor,
                        FontFamily,
                        FontSize,
                        GeneralHtmlSupport,
                        Heading,
                        Highlight,
                        HorizontalLine,
                        HtmlEmbed,
                        ImageBlock,
                        ImageCaption,
                        ImageInline,
                        ImageInsertViaUrl,
                        ImageResize,
                        ImageStyle,
                        ImageTextAlternative,
                        ImageToolbar,
                        Indent,
                        IndentBlock,
                        Italic,
                        Link,
                        LinkImage,
                        List,
                        ListProperties,
                        MediaEmbed,
                        Paragraph,
                        PasteFromOffice,
                        RemoveFormat,
                        ShowBlocks,
                        SourceEditing,
                        SpecialCharacters,
                        SpecialCharactersArrows,
                        SpecialCharactersCurrency,
                        SpecialCharactersEssentials,
                        SpecialCharactersLatin,
                        SpecialCharactersMathematical,
                        SpecialCharactersText,
                        Strikethrough,
                        Style,
                        Subscript,
                        Superscript,
                        Table,
                        TableCaption,
                        TableCellProperties,
                        TableColumnResize,
                        TableProperties,
                        TableToolbar,
                        TextTransformation,
                        TodoList,
                        Underline,
                        WordCount
                    ],
                    balloonToolbar: ['bold', 'italic', '|', 'link', 'insertImage', '|', 'bulletedList', 'numberedList'],
                    fontFamily: {
                        supportAllValues: true
                    },
                    fontSize: {
                        options: [10, 12, 14, 'default', 18, 20, 22],
                        supportAllValues: true
                    },
                    heading: {
                        options: [
                            {
                                model: 'paragraph',
                                title: 'Paragraph',
                                class: 'ck-heading_paragraph'
                            },
                            {
                                model: 'heading1',
                                view: 'h1',
                                title: 'Heading 1',
                                class: 'ck-heading_heading1'
                            },
                            {
                                model: 'heading2',
                                view: 'h2',
                                title: 'Heading 2',
                                class: 'ck-heading_heading2'
                            },
                            {
                                model: 'heading3',
                                view: 'h3',
                                title: 'Heading 3',
                                class: 'ck-heading_heading3'
                            },
                            {
                                model: 'heading4',
                                view: 'h4',
                                title: 'Heading 4',
                                class: 'ck-heading_heading4'
                            },
                            {
                                model: 'heading5',
                                view: 'h5',
                                title: 'Heading 5',
                                class: 'ck-heading_heading5'
                            },
                            {
                                model: 'heading6',
                                view: 'h6',
                                title: 'Heading 6',
                                class: 'ck-heading_heading6'
                            }
                        ]
                    },
                    htmlSupport: {
                        allow: [
                            {
                                name: /^.*$/,
                                styles: true,
                                attributes: true,
                                classes: true
                            }
                        ]
                    },
                    image: {
                        toolbar: [
                            'toggleImageCaption',
                            'imageTextAlternative',
                            '|',
                            'imageStyle:inline',
                            'imageStyle:wrapText',
                            'imageStyle:breakText',
                            '|',
                            'resizeImage'
                        ]
                    },
                    licenseKey: CK_LICENSE,
                    link: {
                        addTargetToExternalLinks: true,
                        defaultProtocol: 'https://',
                        decorators: {
                            toggleDownloadable: {
                                mode: 'manual',
                                label: 'Downloadable',
                                attributes: {
                                    download: 'file'
                                }
                            }
                        }
                    },
                    list: {
                        properties: {
                            styles: true,
                            startIndex: true,
                            reversed: true
                        }
                    },
                    menuBar: {
                        isVisible: true
                    },
                    style: {
                        definitions: [
                            {
                                name: 'Article category',
                                element: 'h3',
                                classes: ['category']
                            },
                            {
                                name: 'Title',
                                element: 'h2',
                                classes: ['document-title']
                            },
                            {
                                name: 'Subtitle',
                                element: 'h3',
                                classes: ['document-subtitle']
                            },
                            {
                                name: 'Info box',
                                element: 'p',
                                classes: ['info-box']
                            },
                            {
                                name: 'Side quote',
                                element: 'blockquote',
                                classes: ['side-quote']
                            },
                            {
                                name: 'Marker',
                                element: 'span',
                                classes: ['marker']
                            },
                            {
                                name: 'Spoiler',
                                element: 'span',
                                classes: ['spoiler']
                            },
                            {
                                name: 'Code (dark)',
                                element: 'pre',
                                classes: ['fancy-code', 'fancy-code-dark']
                            },
                            {
                                name: 'Code (bright)',
                                element: 'pre',
                                classes: ['fancy-code', 'fancy-code-bright']
                            }
                        ]
                    },
                    table: {
                        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
                    }
                };
                ClassicEditor.create(document.querySelector('#htmlEditor'), editorConfig).then(editor => {
                    const wordCount = editor.plugins.get('WordCount');
                    // document.querySelector('#editor-word-count').appendChild(wordCount.wordCountContainer);
                
                    // document.querySelector('#editor-menu-bar').appendChild(editor.ui.view.menuBarView.element);
                    htmlEditor = editor;
                    handleStatusChanges( htmlEditor );
                    htmlEditor.setData(pageData.html);
                    return editor;
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

                // htmlEditor.onDidChangeModelContent(function(e) {
                //     isDirty = true;
                // });
                // Listen to new changes (to enable the "Save" button) and to
                // pending actions (to show the spinner animation when the editor is busy).
                function handleStatusChanges(editor) {
                    editor.model.document.on('change:data', () => {
                        isDirty = true;
                    });
                }
                jsEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });
                cssEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });

                initializeIFrame();
                
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
                $("#page-path").html(pageData.page.s3key);
                $(".viewPage").attr('href','https://'+(pageData.page.site.aliasDomain ? pageData.page.site.aliasDomain : pageData.page.site.cfDomain)+'/'+pageData.page.s3key);

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
                    {'targets':1,'data':'script.script_type','label':'Type', render: function(data, type, row, meta) { if (data == 'css') { return 'Stylesheet'; } else if (data == 'js') { return 'JavaScript'+(row.script.is_js_module ? ' (module)' : ''); } else { return 'Unknown'; } }},
                    {'targets':2,'data':'script.s3key','label':'path'},
                ];
                var tblScripts = new KyteTable(_ks, $("#scripts-table"), {'name':"KyteScriptAssignment",'field':"page",'value':pageData.page.id}, colDefScripts, true, [0,"asc"], false, true);
                tblScripts.init();
                var frmScript = new KyteForm(_ks, $("#modalFormScripts"), 'KyteScriptAssignment', hiddenScriptAssignment, fldsScripts, 'Script Assignment', tblScripts, true, $("#addScript"));
                frmScript.init();
                tblScripts.bindEdit(frmScript);

                // web components assignment table and form
                let hiddenComponent = [
                    {
                        'name': 'page',
                        'value': pageData.page.id
                    }
                ];
                let fldsComponent = [
                    [
                        {
                            'field':'component',
                            'type':'select',
                            'label':'Web Component',
                            'required':false,
                            'option': {
                                'ajax': true,
                                'data_model_name': 'KyteWebComponent',
                                'data_model_field': 'application',
                                'data_model_value': pageData.page.site.application.id,
                                'data_model_attributes': ['name', 'identifier'],
                                'data_model_default_field': 'id',
                                // 'data_model_default_value': 1,
                            }
                        },
                    ],
                ];
                let colDefComponents = [
                    {'targets':0,'data':'component.name','label':'Web Component'},
                    {'targets':1,'data':'component.identifier','label':'Identifier'},
                    {'targets':2,'data':'component.description','label':'Description'},
                ];
                var tblComponents = new KyteTable(_ks, $("#components-table"), {'name':"KytePageWebComponent",'field':"page",'value':pageData.page.id}, colDefComponents, true, [0,"asc"], true, true);
                tblComponents.init();
                var frmComponent = new KyteForm(_ks, $("#modalFormComponent"), 'KytePageWebComponent', hiddenComponent, fldsComponent, 'Web Component', tblComponents, true, $("#addComponent"));
                frmComponent.init();
                tblComponents.bindEdit(frmComponent);

                $("#Preview-nav-link").click(function() {
                    renderHtmlCode();
                });

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

                        console.log(`HTML: ${htmlEditor.getData()}`);
                    
                        let payload = {
                            'html': htmlEditor.getData(),
                            'javascript': rawJS,
                            'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
                            'stylesheet': cssEditor.getValue(),
                            'main_navigation':$("#setting-main-navigation").val(),
                            'side_navigation':$("#setting-side-navigation").val(),
                            'footer':$("#setting-footer").val(),
                            'title':$("#setting-page-title").val(),
                            'description':$("#setting-page-description").val(),
                            'lang':$("#lang").val() == 'default' ? null : $("#lang").val(),
                            'webcomponent_obj_name': $("#webcomponent_obj_name").val(),
                            'sitemap_include':$("#setting-sitemap-include").val(),
                            'obfuscate_js':$("#setting-obfuscatejs").val(),
                            'is_js_module': $("#setting-is_js_module").val(),
                            'use_container':$("#setting-use_container").val(),
                            'page_type': pageData.page.page_type == 'block' ? 'custom': pageData.page.page_type,
                            'protected': $("#setting-protected").val(),
                        };
                        _ks.put('KytePage', 'id', idx, payload, null, [], function(r) {
                            $('#pageLoaderModal').modal('hide');
                            isDirty = false;
                        }, function(err) {
                            alert(err);
                            console.error(err)
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
                            'html': htmlEditor.getData(),
                            'javascript': rawJS,
                            'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
                            'stylesheet': cssEditor.getValue(),
                            'main_navigation':$("#setting-main-navigation").val(),
                            'side_navigation':$("#setting-side-navigation").val(),
                            'footer':$("#setting-footer").val(),
                            'title':$("#setting-page-title").val(),
                            'description':$("#setting-page-description").val(),
                            'lang':$("#lang").val() == 'default' ? null : $("#lang").val(),
                            'webcomponent_obj_name': $("#webcomponent_obj_name").val(),
                            'sitemap_include':$("#setting-sitemap-include").val(),
                            'obfuscate_js':$("#setting-obfuscatejs").val(),
                            'is_js_module': $("#setting-is_js_module").val(),
                            'use_container':$("#setting-use_container").val(),
                            'page_type': pageData.page.page_type == 'block' ? 'custom' : pageData.page.page_type,
                            'state': 1,
                            'protected': $("#setting-protected").val(),
                        };
                        _ks.put('KytePage', 'id', idx, payload, null, [], function(r) {
                            $('#pageLoaderModal').modal('hide');
                            isDirty = false;
                        }, function(err) {
                            alert(err);
                            console.error(err)
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

window.onbeforeunload = function() {
    if (isDirty) {
        return "You have unsaved changes. Are you sure you want to leave?";
    }
};