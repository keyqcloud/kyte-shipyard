let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name',
            'required':false
        },
    ],
    [
        {
            'field':'username',
            'type':'text',
            'label':'Username',
            'required':false
        },
        {
            'field':'token',
            'type':'text',
            'label':'Token',
            'required':false
        },
    ],
    [
        {
            'field':'public_key',
            'type':'text',
            'label':'Public Key',
            'required':false
        },
        {
            'field':'private_key',
            'type':'text',
            'label':'Secret Key',
            'required':false
        }
    ],
    [
        {
            'field':'description',
            'type':'textarea',
            'label':'Description',
            'required':false
        }
    ]
];

let colDefApiKey = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'username','label':'Username'},
    {'targets':2,'data':'token','label':'Token'},
    {'targets':3,'data':'public_key','label':'Public Key'},
    {'targets':4,'data':'description','label':'Description'},
    {'targets':5,'data':'date_created','label':'Date Created'},
];

document.addEventListener('KyteInitialized', function(e) {
    let k = e.detail.k;
    let navbar = new KyteNav("#mainnav", rootnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">');
    navbar.create();

    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var dataTable = createTable("#aws-table", "APIKey", colDefApiKey, null, null, false, true, false, null, true);
        var modalForm = new KyteForm(k, $("#modalForm"), 'APIKey', null, elements, 'API Keys', dataTable, true, $("#new"));
        modalForm.init();
        dataTable.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});