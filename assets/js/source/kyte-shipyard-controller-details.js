let controllerName = "Undefined";
let modelName = "Virtual";

// let implementationMap = {
//     // hooks
//     'hook_init':0,
//     'hook_auth':0,
//     'hook_prequery':0,
//     'hook_preprocess':0,
//     'hook_response_data':0,
//     'hook_process_get_response':0,

//     // overrides
//     'new':0,
//     'update':0,
//     'get':0,
//     'delete':0,
// }

let assignControllerElements = [
    [
        {
            'field': 'function',
            'type': 'select',
            'label': 'Function',
            'required': true,
            'placeholder': 'Please select...',
            'option': {
                'ajax': true,
                'data_model_name': 'Function',
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
    let navbar = new KyteNav("#mainnav", nav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Controllers');
    navbar.create();

    let sidenav = new KyteSidenav("#sidenav", subnavController, "#Functions");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#CustomFunctions' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        let hidden = [
            {
                'name': 'controller',
                'value': idx
            }
        ];

        k.get("Controller", "id", idx, [], function(r) {
            if (r.data[0]) {
                controllerName = r.data[0].name;
                $("#controller-name").html(controllerName);
                if (r.data[0].dataModel) {
                    modelName = r.data[0].dataModel.name;
                }
                $("#model-name").html(modelName)
            } else {
                $("#controller-name").html("Undefined");
                $("#model-name").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });

        // get controller functions
        k.get("ControllerFunction", "controller", idx, [], function(r) {
            if (r.data[0]) {
                
            }
        });

        var customFunctionstbl = createTable("#functions-table", "ControllerFunction", colDefAssignedFunctions, 'controller', idx, false, true, '/app/function/', 'function.id');
        var assignControllerModalForm = new KyteForm(k, $("#modalControllerFunctionForm"), 'ControllerFunction', hidden, assignControllerElements, 'Controller', customFunctionstbl, true, $("#assignController"));
        assignControllerModalForm.init();
        customFunctionstbl.bindEdit(assignControllerModalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});