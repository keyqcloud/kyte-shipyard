let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name',
            'required':true
        },
        {
            'field': 'dataModel',
            'type': 'select',
            'label': 'Data Model',
            'required': false,
            'placeholder': 'Virtual Model',
            'option': {
                'ajax': true,
                'data_model_name': 'DataModel',
                'data_model_field': '',
                'data_model_value': '',
                'data_model_attributes': ['name'],
                'data_model_default_field': 'id',
                // 'data_model_default_value': 1,
            }
        }
    ],
    [
        {
            'field':'description',
            'type':'textare',
            'label':'Description',
            'required':false
        }
    ]
];

$(document).ready(function() {
    let navbar = new KyteNav("#mainnav", nav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Controllers');
    navbar.create();

    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var tblControllers = createTable("#controllers-table", "Controller", colDefControllers, null, null, false, true, '/app/controller/', 'id', true);
        var modalForm = new KyteForm(k, $("#modalForm"), 'Controller', null, elements, 'Controller', tblControllers, true, $("#new"));
        modalForm.init();
        modalForm.success = function(r) {
            if (r.data[0]) {
                let obj = {'model': 'Controller', 'idx':r.data[0].id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                location.href="/app/controller/?request="+encoded;
            }
        }
        tblControllers.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});