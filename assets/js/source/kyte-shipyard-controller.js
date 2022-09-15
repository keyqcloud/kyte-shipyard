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

let colDef = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'dataModel.name','label':'Model', render: function(data, type, row, meta) { return data ? data:'Virtual'; }},
    {'targets':2,'data':'description','label':'Description'},
];

$(document).ready(function() {
    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var tbl = new KyteTable(k, $("#data-table"), {'name':'Controller','field':null,'value':null}, colDef, true, [0,"asc"], false, true, 'id', '/app/controller/');
        tbl.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        }
        tbl.init();
        var modalForm = new KyteForm(k, $("#modalForm"), 'Controller', null, elements, 'Controller', tbl, true, $("#new"));
        modalForm.init();
        modalForm.success = function(r) {
            if (r.data[0]) {
                let obj = {'model': 'Controller', 'idx':r.data[0].id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                location.href="/app/controller/?request="+encoded;
            }
        }
        tbl.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});