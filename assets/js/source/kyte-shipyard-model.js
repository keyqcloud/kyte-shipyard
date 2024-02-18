let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Model',
            'required':true
        }
    ]
];

let colDefModels = [
    {'targets':0,'data':'name','label':'User Model'},
];

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    if (!_ks.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // get url param
    let idx = _ks.getPageRequest();
    idx = idx.idx;

    let hidden = [
        {
            'name': 'application',
            'value': idx
        }
    ];
    
    var dataTable = new KyteTable(_ks, $("#models-table"), {'name':"DataModel",'field':"application",'value':idx}, colDefModels, true, [0,"asc"], false, true, 'id', '/app/model/');
    dataTable.initComplete = function() {
        $('#pageLoaderModal').modal('hide');
    }
    dataTable.init();
    var modalForm = new KyteForm(_ks, $("#modalForm"), 'DataModel', hidden, elements, 'Data Model', dataTable, true, $("#new"));
    modalForm.init();
    dataTable.bindEdit(modalForm);
});