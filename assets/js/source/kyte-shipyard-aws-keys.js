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
            'field':'private_key',
            'type':'text',
            'label':'AWS Secret Key',
            'required':true
        }
    ]
];

let colDefApiKey = [
    {'targets':0,'data':'username','label':'Username'},
    {'targets':1,'data':'public_key','label':'Public Key'},
    {'targets':2,'data':'date_created','label':'Date Created'},
];

document.addEventListener('KyteInitialized', function(e) {
    let k = e.detail.k;
    let navbar = new KyteNav("#mainnav", rootnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">');
    navbar.create();

    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var dataTable = createTable("#aws-table", "KyteAWSKey", colDefApiKey, null, null, false, true, false, null, true);
        var modalForm = new KyteForm(k, $("#modalForm"), 'KyteAWSKey', null, elements, 'AWS Keys', dataTable, true, $("#new"));
        modalForm.init();
        dataTable.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});