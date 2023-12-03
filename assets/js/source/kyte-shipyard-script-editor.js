var scriptEditor;
var script;

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
        faicon:'fas fa-wrench',
        label:'Settings',
        selector:'#Settings'
    },
];

$(document).ready(function() {
    let sidenav = new KyteSidenav("#sidenav", subnavScript, "#Content");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Content' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        // check if we are explicitly asked to use code editor even if page was made using block
        let forceCodeEditor = k.getUrlParameter('mode') == 'code';

        k.get("KyteScript", "id", idx, [], function(r) {
            if (r.data[0]) {
                script = r.data[0];

                // display page title in window
                document.title = document.title + " - " + script.name;
                // set page title and description
                $("#setting-script-name").val(script.name);
                $("#setting-script-description").val(script.description);
                $("#setting-include-all").val(script.include_all);
                
                if (script.script_type == 'js') {
                    $('#obfuscatejs-option-wrapper').addClass('d-none');
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
                
                // hide after editor generation
                if (hash != '#Content') {
                    $("#Content").addClass('d-none');
                }

                let obj = {'model': 'KyteSite', 'idx':script.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request='+encoded+'#Scripts');

                $("#script-name").html(script.name);

                obj = {'model': 'Application', 'idx':script.site.application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

                let appnav = generateAppNav(script.site.application.name, encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">', 'Sites');
                navbar.create();

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    
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
                        'javascript_obfuscated': obfuscatedJS,
                        'name':$("#setting-script-name").val(),
                        'description':$("#setting-script-description").val(),
                        'obfuscate_js':$("#setting-obfuscatejs").val(),
                        'include_all':$("#setting-include-all").val(),
                    };
                    k.put('KyteScript', 'id', idx, payload, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                    });
                });

                $("#publishPage").click(function() {
                    $('#pageLoaderModal').modal('show');

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
                        'javascript_obfuscated': obfuscatedJS,
                        'name':$("#setting-script-name").val(),
                        'description':$("#setting-script-description").val(),
                        'obfuscate_js':$("#setting-obfuscatejs").val(),
                        'include_all':$("#setting-include-all").val(),
                        'state': 1,
                    };
                    k.put('KyteScript', 'id', idx, payload, null, [], function(r) {
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