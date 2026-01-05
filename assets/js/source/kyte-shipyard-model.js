let colDefModels = [
    {'targets':0,'data':'name','label':'User Model'},
];

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    if (!_ks.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // Initialize application sidebar navigation
    if (typeof initAppSidebar === 'function') {
        initAppSidebar();
    }

    // get url param
    let idx = _ks.getPageRequest();
    idx = idx.idx;

    // Wait for i18n to be ready before creating form
    function waitForI18n(callback) {
        if (window.kyteI18n && window.kyteI18n.initialized) {
            callback();
        } else {
            setTimeout(() => waitForI18n(callback), 50);
        }
    }

    waitForI18n(() => {
        const i18n = window.kyteI18n;

        let elements = [
            [
                {
                    'field':'name',
                    'type':'text',
                    'label': i18n.t('ui.models.modal.field.name'),
                    'required':true
                }
            ]
        ];

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
        var modalForm = new KyteForm(_ks, $("#modalForm"), 'DataModel', hidden, elements, i18n.t('ui.models.modal.title'), dataTable, true, $("#new"));
        modalForm.init();
        dataTable.bindEdit(modalForm);
    });
});