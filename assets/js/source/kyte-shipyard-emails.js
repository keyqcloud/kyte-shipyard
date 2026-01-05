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

    // Initialize application sidebar navigation
    if (typeof initAppSidebar === 'function') {
        initAppSidebar();
    }

    // get url param
    let idx = _ks.getPageRequest();
    idx = idx.idx;

    // Function to initialize form with translations
    function initializeForm() {
        // Define form elements with translated labels
        const t = window.kyteI18n ? (key) => window.kyteI18n.t(key) : (key) => key;
        let elements = [
            [
                {
                    'field':'title',
                    'type':'text',
                    'label': t('ui.emails.modal.field.name'),
                    'required':true
                },
                {
                    'field':'identifier',
                    'type':'text',
                    'label': t('ui.emails.modal.field.identifier'),
                    'required':true
                }
            ],
            [
                {
                    'field':'description',
                    'type':'textarea',
                    'label': t('ui.emails.modal.field.description'),
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

        var modalForm = new KyteForm(_ks, $("#modalForm"), 'EmailTemplate', hidden, elements, t('ui.emails.modal.title'), dataTable, true, $("#new"));
        modalForm.init();
        modalForm.success = function(r) {
            if (r.data[0]) {
                let obj = {'model': 'EmailTemplate', 'idx':r.data[0].id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                location.href="/app/email/?request="+encoded+"#HTML";
            }
        }
        dataTable.bindEdit(modalForm);
    }

    var dataTable = new KyteTable(_ks, $("#emails-table"), {'name':"EmailTemplate",'field':'application','value':idx}, colDefEmails, true, [0,"asc"], false, true, 'id', '/app/email/');
    dataTable.initComplete = function() {
        $('#pageLoaderModal').modal('hide');
    }
    dataTable.init();

    // Wait for i18n to be ready before initializing form
    function waitForI18n() {
        if (window.kyteI18n && window.kyteI18n.initialized) {
            initializeForm();
        } else {
            setTimeout(waitForI18n, 50);
        }
    }
    waitForI18n();
});