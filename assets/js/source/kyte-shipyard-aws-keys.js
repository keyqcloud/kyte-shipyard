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
    let _ks = e.detail._ks;
    let navbar = new KyteNav("#mainnav", rootnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">');
    navbar.create();

    $('#pageLoaderModal').modal('show');
    if (_ks.isSession()) {
        var dataTable = new KyteTable(_ks, $("#aws-table"), {'name':"KyteAWSKey",'field':null,'value':null}, colDefApiKey, true, [0,"asc"], false, true);
        dataTable.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        }
        dataTable.init();
        var modalForm = new KyteForm(_ks, $("#modalForm"), 'KyteAWSKey', null, elements, 'AWS Keys', dataTable, true, $("#new"));
        modalForm.init();
        dataTable.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});