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

let assignedControllersColDef = [
    {'targets':0,'data':'controller.name','label':'Controller', render: function(data, type, row, meta) { return data ? data:'Unknown'; }},
    {'targets':1,'data':'controller.description','label':'Description', render: function(data, type, row, meta) { return data ? data:''; }},
];

$(document).ready(function() {
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
                $("#model-name").html("Undefined");
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
        var assignedControllertbl = new KyteTable(k, $("#controller-table"), {'name':'ControllerFunction','field':"function",'value':idx}, assignedControllersColDef, true, [0,"asc"], false, true, 'controller', '/app/controller/');
        assignedControllertbl.init();
        var assignControllerModalForm = new KyteForm(k, $("#modalForm"), 'ControllerFunction', hidden, assignControllerElements, 'Controller', assignedControllertbl, true, $("#assignController"));
        assignControllerModalForm.init();
        assignedControllertbl.bindEdit(assignControllerModalForm);

        // navigation listners
        $("#Code-nav-link").click(function(e) {
            history.pushState({}, '', this.href);

            e.preventDefault();
            e.stopPropagation();
            
            $("#Code-nav-link").addClass("active");
            $("#Code").removeClass('d-none');

            $("#Controllers-nav-link").removeClass("active");
            $("#Controllers").addClass('d-none');
        });
        $("#Controllers-nav-link").click(function(e) {
            history.pushState({}, '', this.href);

            e.preventDefault();
            e.stopPropagation();
            
            $("#Controllers-nav-link").addClass("active");
            $("#Controllers").removeClass('d-none');

            $("#Code-nav-link").removeClass("active");
            $("#Code").addClass('d-none');
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});