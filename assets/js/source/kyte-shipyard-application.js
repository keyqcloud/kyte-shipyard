let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'App Name',
            'required':true
        }
    ]
];

let colDefApps = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'identifier','label':'Identifier'},
];

$(document).ready(function() {
    let navbar = new KyteNav("#mainnav", rootnav, null, 'Kyte Shipyard<sup>&trade;</sup>');
    navbar.create();

    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var dataTable = createTable("#models-table", "Application", colDefApps, null, null, true, true, '/app/dashboard/', 'id', true);
        var modalForm = new KyteForm(k, $("#modalForm"), 'Application', null, elements, 'My App', dataTable, true, $("#new"));
        modalForm.init();
        dataTable.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});