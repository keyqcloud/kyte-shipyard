let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Model',
            'required':true
        }
    ]
    // [
    //     {
    //         'field':'charset',
    //         'type':'text',
    //         'label':'Charset',
    //         'required':true
    //     },
    //     {
    //         'field':'engine',
    //         'type':'text',
    //         'label':'Engine',
    //         'required':true
    //     }
    // ],
];

let colDef = [
    {'targets':0,'data':'name','label':'User Model'},
    {'targets':1,'data':'charset','label':'Charset'},
    {'targets':2,'data':'engine','label':'Engine'},
];

$(document).ready(function() {
    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var tbl = new KyteTable(k, $("#data-table"), {'name':'DataModel','field':null,'value':null}, colDef, true, [0,"asc"], true, false);
        tbl.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        }
        tbl.init();
        var modalForm = new KyteForm(k, $("#modalForm"), 'DataModel', null, elements, 'Data Model', tbl, true, $("#new"));
        modalForm.init();
        tbl.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});