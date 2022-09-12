let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name',
            'required':true
        }
    ],
    [
        {
            'field':'email',
            'type':'text',
            'label':'Email',
            'required':true
        }
    ],
    [
        {
            'field': 'role',
            'type': 'select',
            'label': 'Role',
            'required': false,
            'option': {
                'ajax': true,
                'data_model_name': 'Role',
                'data_model_field': '',
                'data_model_value': '',
                'data_model_attributes': ['name'],
            }
        }
    ]
];

let colDef = [
    {'targets':0,'data':'name','label':'User Name'},
    {'targets':1,'data':'email','label':'Email'},
    {'targets':2,'data':'role.name','label':'Role'},
];

$(document).ready(function() {
    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        // var tbl = new KyteTable(k, $("#data-table"), {'name':'Administrator','field':null,'value':null}, colDef, true, [0,"asc"], true, true);
        // tbl.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        // }
        // tbl.init();
        // var modalForm = new KyteForm(k, $("#modalForm"), 'Administrator', null, elements, 'Administrator', tbl, true, $("#new"));
        // modalForm.init();
        // tbl.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});