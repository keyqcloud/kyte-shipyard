import {registerPHPSnippetLanguage} from '/assets/js/packages/utils/php-snippet/registerPHPSnippetLanguage.js';

var editor;
let functionName = "Undefined";

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    editor.editor.setTheme(colorMode);
});


registerPHPSnippetLanguage(monaco.languages);

let assignControllerElements = [
    [
        {
            'field': 'controller',
            'type': 'select',
            'label': 'Controller',
            'required': true,
            'placeholder': 'Please select...',
            'option': {
                'ajax': true,
                'data_model_name': 'Controller',
                'data_model_field': '',
                'data_model_value': '',
                'data_model_attributes': ['name'],
                'data_model_default_field': 'id',
                // 'data_model_default_value': 1,
            }
        }
    ]
];

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
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Sites');
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