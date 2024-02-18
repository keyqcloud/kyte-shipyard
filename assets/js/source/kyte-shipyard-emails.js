let elements = [
    [
        {
            'field':'title',
            'type':'text',
            'label':'Name',
            'required':true
        },
        {
            'field':'identifier',
            'type':'text',
            'label':'Identifier',
            'required':true
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

let colDefEmails = [
    {'targets':0,'data':'title','label':'Name'},
    {'targets':1,'data':'identifier','label':'Identifier'},
    {'targets':2,'data':'description','label':'Description'},
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
    
    var dataTable = new KyteTable(_ks, $("#emails-table"), {'name':"EmailTemplate",'field':'application','value':idx}, colDefEmails, true, [0,"asc"], false, true, 'id', '/app/email/');
    dataTable.initComplete = function() {
        $('#pageLoaderModal').modal('hide');
    }
    dataTable.init();
    var modalForm = new KyteForm(_ks, $("#modalForm"), 'EmailTemplate', hidden, elements, 'Email Template', dataTable, true, $("#new"));
    modalForm.init();
    modalForm.success = function(r) {
        if (r.data[0]) {
            let obj = {'model': 'EmailTemplate', 'idx':r.data[0].id};
            let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
            location.href="/app/email/?request="+encoded+"#HTML";
        }
    }
    dataTable.bindEdit(modalForm);
});