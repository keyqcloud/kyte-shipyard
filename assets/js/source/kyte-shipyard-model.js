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

$(document).ready(function() {
    let navbar = new KyteNav("#mainnav", nav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Models');
    navbar.create();

    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var tblModels = createTable("#models-table", "DataModel", colDefModels, null, null, false, true, '/app/model/', 'id', true);
        var modalForm = new KyteForm(k, $("#modalForm"), 'DataModel', null, elements, 'Data Model', tblModels, true, $("#new"));
        modalForm.init();
        tblModels.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});