let elements = [
    [
        {
            'field':'username',
            'type':'text',
            'label':'AWS Username',
            'required':true
        },
        {
            'field':'public_key',
            'type':'text',
            'label':'AWS Public Key',
            'required':true
        },
        {
            'field':'secret_key',
            'type':'text',
            'label':'AWS Secret Key',
            'required':true
        }
    ]
];

let colDefApps = [
    {'targets':0,'data':'username','label':'Username'},
    {'targets':1,'data':'public_key','label':'Public Key'},
    {'targets':2,'data':'date_created','label':'Date Created'},
    {'targets':3,'data':'date_modified','label':'Date Modified'},
];

$(document).ready(function() {
    let navbar = new KyteNav("#mainnav", rootnav, null, 'Kyte Shipyard<sup>&trade;</sup>');
    navbar.create();

    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var dataTable = createTable("#models-table", "KyteAWSKey", colDefApps, null, null, true, false);
        var modalForm = new KyteForm(k, $("#modalForm"), 'KyteAWSKey', null, elements, 'AWS Keys', dataTable, true, $("#new"));
        modalForm.init();
        dataTable.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});