document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let navbar = new KyteNav("#mainnav", rootnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">');
    navbar.create();

    // Wait for i18n to be ready before creating forms/tables with translations
    document.addEventListener('KyteI18nReady', function() {
        // Translation helper
        const t = (key, fallback) => {
            if (window.kyteI18n) {
                let text = window.kyteI18n.t(key);
                return text === key ? fallback : text;
            }
            return fallback;
        };

        let elements = [
        [
            {
                'field':'name',
                'type':'text',
                'label': t('ui.api_keys.form.name', 'Name'),
                'required':false
            },
        ],
        [
            {
                'field':'username',
                'type':'text',
                'label': t('ui.api_keys.form.username', 'Username'),
                'required':false
            },
            {
                'field':'token',
                'type':'text',
                'label': t('ui.api_keys.form.token', 'Token'),
                'required':false
            },
        ],
        [
            {
                'field':'public_key',
                'type':'text',
                'label': t('ui.api_keys.form.public_key', 'Public Key'),
                'required':false
            },
            {
                'field':'private_key',
                'type':'text',
                'label': t('ui.api_keys.form.secret_key', 'Secret Key'),
                'required':false
            }
        ],
        [
            {
                'field':'description',
                'type':'textarea',
                'label': t('ui.api_keys.form.description', 'Description'),
                'required':false
            }
        ]
    ];

    let colDefApiKey = [
        {'targets':0,'data':'name','label': t('ui.api_keys.table.name', 'Name')},
        {'targets':1,'data':'username','label': t('ui.api_keys.table.username', 'Username')},
        {'targets':2,'data':'token','label': t('ui.api_keys.table.token', 'Token')},
        {'targets':3,'data':'public_key','label': t('ui.api_keys.table.public_key', 'Public Key')},
        {'targets':4,'data':'description','label': t('ui.api_keys.table.description', 'Description')},
        {'targets':5,'data':'date_created','label': t('ui.api_keys.table.date_created', 'Date Created')},
    ];

        $('#pageLoaderModal').modal('show');
        if (_ks.isSession()) {

            var dataTable = new KyteTable(_ks, $("#aws-table"), {'name':"APIKey",'field':null,'value':null}, colDefApiKey, true, [0,"asc"], false, true);
            dataTable.initComplete = function() {
                $('#pageLoaderModal').modal('hide');
            }
            dataTable.init();

            var modalForm = new KyteForm(_ks, $("#modalForm"), 'APIKey', null, elements, t('ui.api_keys.form.modal_title', 'API Keys'), dataTable, true, $("#new"));
            modalForm.init();
            dataTable.bindEdit(modalForm);
        } else {
            location.href="/?redir="+encodeURIComponent(window.location);
        }
    }); // End KyteI18nReady listener
});
