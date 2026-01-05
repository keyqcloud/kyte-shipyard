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
                'field':'username',
                'type':'text',
                'label': t('ui.aws_keys.form.username', 'AWS Username'),
                'required':true
            },
            {
                'field':'public_key',
                'type':'text',
                'label': t('ui.aws_keys.form.public_key', 'AWS Public Key'),
                'required':true
            },
            {
                'field':'private_key',
                'type':'text',
                'label': t('ui.aws_keys.form.secret_key', 'AWS Secret Key'),
                'required':true
            }
        ]
    ];

        let colDefApiKey = [
            {'targets':0,'data':'username','label': t('ui.aws_keys.table.username', 'Username')},
            {'targets':1,'data':'public_key','label': t('ui.aws_keys.table.public_key', 'Public Key')},
            {'targets':2,'data':'date_created','label': t('ui.aws_keys.table.date_created', 'Date Created')},
        ];

        $('#pageLoaderModal').modal('show');
        if (_ks.isSession()) {
        var dataTable = new KyteTable(_ks, $("#aws-table"), {'name':"KyteAWSKey",'field':null,'value':null}, colDefApiKey, true, [0,"asc"], false, true);
        dataTable.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        }
            dataTable.init();
            var modalForm = new KyteForm(_ks, $("#modalForm"), 'KyteAWSKey', null, elements, t('ui.aws_keys.form.modal_title', 'AWS Keys'), dataTable, true, $("#new"));
            modalForm.init();
            dataTable.bindEdit(modalForm);
        } else {
            location.href="/?redir="+encodeURIComponent(window.location);
        }
    }); // End KyteI18nReady listener
});