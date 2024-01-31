document.addEventListener('KyteInitialized', function(e) {
    let k = e.detail.k;
    if (!k.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // get url param
    let idx = k.getPageRequest();
    idx = idx.idx;

    let elements = [
        [
            {
                'field':'name',
                'type':'text',
                'label':'Name',
                'required':true
            },
            {
                'field': 'dataModel',
                'type': 'select',
                'label': 'Data Model',
                'required': false,
                'placeholder': 'Virtual Model',
                'option': {
                    'ajax': true,
                    'data_model_name': 'DataModel',
                    'data_model_field': 'application',
                    'data_model_value': idx,
                    'data_model_attributes': ['name'],
                    'data_model_default_field': 'id',
                    // 'data_model_default_value': 1,
                }
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

    let hidden = [
        {
            'name': 'application',
            'value': idx
        }
    ];

    var tblControllers = new KyteTable(k, $("#controllers-table"), {'name':"Controller",'field':'application','value':idx}, colDefControllers, true, [0,"asc"], false, true, 'id', '/app/controller/');
    tblControllers.initComplete = function() {
        $('#pageLoaderModal').modal('hide');
    }
    tblControllers.init();
    var modalForm = new KyteForm(k, $("#modalForm"), 'Controller', hidden, elements, 'Controller', tblControllers, true, $("#new"));
    modalForm.init();
    modalForm.success = function(r) {
        if (r.data[0]) {
            let obj = {'model': 'Controller', 'idx':r.data[0].id};
            let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
            location.href="/app/controller/?request="+encoded;
        }
    }
    tblControllers.bindEdit(modalForm);
});