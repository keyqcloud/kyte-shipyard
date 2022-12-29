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

$(document).ready(function() {
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
    
    var dataTable = createTable("#models-table", "DataModel", colDefModels, 'application', idx, false, true, '/app/model/', 'id', true);
    var modalForm = new KyteForm(k, $("#modalForm"), 'DataModel', hidden, elements, 'Data Model', dataTable, true, $("#new"));
    modalForm.init();
    dataTable.bindEdit(modalForm);
});