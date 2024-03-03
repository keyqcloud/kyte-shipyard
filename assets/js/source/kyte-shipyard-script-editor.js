import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

var scriptEditor;
var script;
var isDirty = false;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    scriptEditor.editor.setTheme(colorMode);
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

let subnavScript = [
    {
        faicon:'fas fa-code',
        label:'Content',
        selector:'#Content'
    },
    {
        faicon:'far fa-file',
        label:'Pages',
        selector:'#Pages'
    },
    {
        faicon:'fas fa-wrench',
        label:'Settings',
        selector:'#Settings'
    },
];

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let sidenav = new KyteSidenav("#sidenav", subnavScript, "#Content");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Content' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        // check if we are explicitly asked to use code editor even if page was made using block
        let forceCodeEditor = _ks.getUrlParameter('mode') == 'code';

        _ks.get("KyteScript", "id", idx, [], function(r) {
            if (r.data[0]) {
                script = r.data[0];

                // display page title in window
                document.title = document.title + " - " + script.name;
                // set page title and description
                $("#setting-script-name").val(script.name);
                $("#setting-script-description").val(script.description);
                
                if (script.script_type == 'js') {
                    $("#setting-obfuscatejs").val(script.obfuscate_js)
                    $('#obfuscatejs-option-wrapper').removeClass('d-none');
                }

                if (script.script_type == 'js') {
                    $("#setting-jsmodule").val(script.is_js_module);
                    $("#jsmodule-option-wrapper").removeClass('d-none');
                }

                scriptEditor = monaco.editor.create(document.getElementById("scriptEditor"), {
                    value: script.content,
                    theme: colorMode,
                    language: script.script_type == 'js' ? 'javascript' : 'css',
                    automaticLayout: true,
                    wordWrap: true,
                    // wordWrapColumn: 40,
                    // Set this to false to not auto word wrap minified files
                    wordWrapMinified: true,
                    // try "same", "indent" or "none"
                    wrappingIndent: 'indent'
                });

                scriptEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });
                
                // hide after editor generation
                if (hash != '#Content') {
                    $("#Content").addClass('d-none');
                }

                let obj = {'model': 'KyteSite', 'idx':script.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request='+encoded+'#Scripts');

                $("#script-name").html(script.name);

                // page assignment table and form
                let hiddenScriptAssignment = [
                    {
                        'name': 'site',
                        'value': script.site.id
                    },
                    {
                        'name': 'script',
                        'value': idx
                    }
                ];
                let fldsPages = [
                    [
                        {
                            'field':'page',
                            'type':'select',
                            'label':'Page',
                            'required':false,
                            'option': {
                                'ajax': true,
                                'data_model_name': 'KytePage',
                                'data_model_field': 'site',
                                'data_model_value': script.site.id,
                                'data_model_attributes': ['title', 's3key'],
                                'data_model_default_field': 'id',
                                // 'data_model_default_value': 1,
                            }
                        },
                    ],
                ];
                let colDefPages = [
                    {'targets':0,'data':'page.title','label':'Page'},
                ];
                var tblPages = new KyteTable(_ks, $("#pages-table"), {'name':"KyteScriptAssignment",'field':"script",'value':idx}, colDefPages, true, [0,"asc"], false, true);
                tblPages.init();
                var frmPages = new KyteForm(_ks, $("#modalFormPages"), 'KyteScriptAssignment', hiddenScriptAssignment, fldsPages, 'Script Assignment', tblPages, true, $("#addPage"));
                frmPages.init();
                tblPages.bindEdit(frmPages);

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    
                    try {
                        let obfuscatedJS = script.script_type == 'js' ? JavaScriptObfuscator.obfuscate(scriptEditor.getValue(),
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
                        ).getObfuscatedCode() : '';
                        let payload = {
                            'content': scriptEditor.getValue(),
                            'content_js_obfuscated': obfuscatedJS,
                            'name':$("#setting-script-name").val(),
                            'description':$("#setting-script-description").val(),
                            'obfuscate_js':$("#setting-obfuscatejs").val(),
                            'is_js_module':$("#setting-jsmodule").val(),
                        };
                        _ks.put('KyteScript', 'id', idx, payload, null, [], function(r) {
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
                        let obfuscatedJS = script.script_type == 'js' ? JavaScriptObfuscator.obfuscate(scriptEditor.getValue(),
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
                        ).getObfuscatedCode() : '';
                        let payload = {
                            'content': scriptEditor.getValue(),
                            'content_js_obfuscated': obfuscatedJS,
                            'name':$("#setting-script-name").val(),
                            'description':$("#setting-script-description").val(),
                            'obfuscate_js':$("#setting-obfuscatejs").val(),
                            'is_js_module':$("#setting-jsmodule").val(),
                            'state': 1,
                        };
                        _ks.put('KyteScript', 'id', idx, payload, null, [], function(r) {
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

        fetch(page.download_link).then(res => res.blob()).then(file => {
            const pathnameParts = page.s3key.split('/');
            const filenameWithExtension = pathnameParts[pathnameParts.length - 1];

            let tempUrl = URL.createObjectURL(file);
            const aTag = document.createElement("a");
            aTag.href = tempUrl;
            console.log(filenameWithExtension);
            aTag.download = filenameWithExtension; //page.download_link.replace(/^.*[\\\/]/, '');
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