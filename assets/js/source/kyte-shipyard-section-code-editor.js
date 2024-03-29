import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

var htmlEditor;
var jsEditor;
var cssEditor;
var section;

var isDirty = false;

let subnavSection = [
    {
        faicon:'fas fa-code',
        label:'Section',
        selector:'#Section'
    },
    {
        faicon:'fab fa-js',
        label:'JavaScript',
        selector:'#JavaScript'
    },
    {
        faicon:'fab fa-css3',
        label:'Stylesheet',
        selector:'#Stylesheet'
    },
    {
        faicon:'fas fa-wrench',
        label:'Settings',
        selector:'#Settings'
    },
];

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
  
    // Check if both the Ctrl key and the S key are pressed
    if (isCtrlPressed && isSPressed) {
      event.preventDefault(); // Prevent the default browser save action
  
      // Call your function here
      $("#saveCode").click();
    }
});

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let sidenav = new KyteSidenav("#sidenav", subnavSection, "#Section");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Section' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        _ks.get("KyteSectionTemplate", "id", idx, [], function(r) {
            if (r.data[0]) {
                section = r.data[0];
                let hidden = [
                    {
                        'name': 'site',
                        'value': section.site.id
                    }
                ];

                // display Section title in window
                document.title = document.title + " - " + section.title;
                // set Section title and description
                $("#setting-section-title").val(section.title);
                $("#setting-section-description").val(section.description);
                $("#bgColor").val(section.bgColor);
                $("#fgColor").val(section.fgColor);
                $("#setting-obfuscatejs").val(section.obfuscate_js);

                htmlEditor = monaco.editor.create(document.getElementById("htmlEditor"), {
                    value: section.html,
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
                    value: section.javascript,
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
                    value: section.stylesheet,
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

                htmlEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });
                jsEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });
                cssEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });
                
                // hide after editor generation
                if (hash != '#Section') {
                    $("#Section").addClass('d-none');
                }
                if (hash != '#JavaScript') {
                    $("#JavaScript").addClass('d-none');
                }
                if (hash != '#Stylesheet') {
                    $("#Stylesheet").addClass('d-none');
                }

                let obj = {'model': 'KyteSite', 'idx':section.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSection").attr('href', '/app/site/?request='+encoded+'#Sections');

                $("#section-title").html(section.title);
                
                _ks.get('Navigation', 'site', section.site.id, [], function(r) {
                    let navigation = section.navigation ? section.navigation.id : 0;
                    r.data.forEach(item => {
                        $("#setting-main-navigation").append('<option value="'+item.id+'"'+(navigation == item.id ? ' selected' : '')+'>'+item.name+'</option>');
                    })
                });

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    
                    let rawJS = jsEditor.getValue();
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
                    let payload = {
                        'html': htmlEditor.getValue(),
                        'javascript': rawJS,
                        'javascript_obfuscated': obfuscatedJS.getObfuscatedCode(),
                        'stylesheet': cssEditor.getValue(),
                        'navigation':$("#setting-main-navigation").val(),
                        'title':$("#setting-section-title").val(),
                        'description':$("#setting-section-description").val(),
                        'obfuscate_js':$("#setting-obfuscatejs").val(),
                        'bgColor':$("#bgColor").val(),
                        'fgColor':$("#fgColor").val(),
                    };
                    _ks.put('KyteSectionTemplate', 'id', idx, payload, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                        isDirty = false;
                    }, function(err) {
                        alert(err);
                        console.error(err)
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