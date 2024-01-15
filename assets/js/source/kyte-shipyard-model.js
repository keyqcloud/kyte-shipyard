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

document.addEventListener('KyteInitialized', function(e) {
    let k = e.detail.k;
    if (!k.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // get url param
    let idx = k.getPageRequest();
    idx = idx.idx;

    let hidden = [
        {
            'name': 'application',
            'value': idx
        }
    ];
    
    var dataTable = new KyteTable(k, $("#models-table"), {'name':"DataModel",'field':"application",'value':idx}, colDefModels, true, [0,"asc"], false, true, 'id', '/app/model/');
    dataTable.initComplete = function() {
        $('#pageLoaderModal').modal('hide');
    }
    dataTable.init();
    var modalForm = new KyteForm(k, $("#modalForm"), 'DataModel', hidden, elements, 'Data Model', dataTable, true, $("#new"));
    modalForm.init();
    dataTable.bindEdit(modalForm);
});