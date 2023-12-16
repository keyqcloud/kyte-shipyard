import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';
import {registerPHPSnippetLanguage} from '/assets/js/packages/utils/php-snippet/registerPHPSnippetLanguage.js';

let subnavFunction = [
    {
        faicon:'fas fa-code',
        label:'Code',
        selector:'#Code'
    },
];


var editor;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    editor.editor.setTheme(colorMode);
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

registerPHPSnippetLanguage(monaco.languages);

$(document).ready(function() {
    let sidenav = new KyteSidenav("#sidenav", subnavFunction, "#Code");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Code' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        let hidden = [
            {
                'name': 'function',
                'value': idx
            }
        ];

        k.get("Function", "id", idx, [], function(r) {
            if (r.data[0]) {
                $("#function-name").html(r.data[0].controller.name);
                $("#function-type").html(r.data[0].type);

                editor = monaco.editor.create(document.getElementById('container'), {
                    value: r.data[0].code,
                    theme: colorMode,
                    language: "php-snippet",
                    automaticLayout: true,
                    wordWrap: true,
                    // wordWrapColumn: 40,
                    // Set this to false to not auto word wrap minified files
                    wordWrapMinified: true,
                    // try "same", "indent" or "none"
                    wrappingIndent: 'indent'
                });

                let obj = {'model': 'Controller', 'idx':r.data[0].controller.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToController").attr('href', '/app/controller/?request='+encoded);

                obj = {'model': 'Application', 'idx':r.data[0].controller.application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

                let appnav = generateAppNav(r.data[0].controller.application.name, encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">', 'Sites');
                navbar.create();

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    k.put('Function', 'id', idx, {'code':editor.getValue()}, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                    });
                });
            } else {
                $("#function-name").html("Undefined");
                $("#function-type").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});