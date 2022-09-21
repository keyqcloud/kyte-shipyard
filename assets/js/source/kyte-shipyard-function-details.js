var editor;
let functionName = "Undefined";

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
    let navbar = new KyteNav("#mainnav", nav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Functions');
    navbar.create();

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
                functionName = r.data[0].name;
                $("#function-name").html(functionName);
                $("#function-type").html(r.data[0].type);
                editor = monaco.editor.create(document.getElementById('container'), {
                    value: r.data[0].code,
                    language: "php"
                });
            } else {
                $("#function-name").html("Undefined");
                $("#function-type").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });

        $("#saveCode").click(function() {
            $('#pageLoaderModal').modal('show');
            k.put('Function', 'id', idx, {'code':editor.getValue()}, null, [], function(r) {
                $('#pageLoaderModal').modal('hide');
            });
        });

        // controller table and form
        var assignedControllertbl = createTable("#controller-table", "ControllerFunction", colDefAssignedControllers, 'function', idx, false, true, '/app/controller/', 'controller.id');
        var assignControllerModalForm = new KyteForm(k, $("#modalForm"), 'ControllerFunction', hidden, assignControllerElements, 'Controller', assignedControllertbl, true, $("#assignController"));
        assignControllerModalForm.init();
        assignedControllertbl.bindEdit(assignControllerModalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});