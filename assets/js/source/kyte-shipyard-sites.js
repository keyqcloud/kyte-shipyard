let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Site Name',
            'required':true
        }
    ],
    [
        {
            'field':'description',
            'type':'text',
            'label':'Description',
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
    
    var dataTable = createTable("#data-table", "Site", colDefSites, 'application', idx, false, true, '/app/site/', 'id', true);
    var modalForm = new KyteForm(k, $("#modalForm"), 'Site', hidden, elements, 'Site', dataTable, true, $("#new"));
    modalForm.init();
    dataTable.bindEdit(modalForm);
});