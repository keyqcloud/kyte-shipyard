document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    // Initialize root navigation
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
                'label': t('ui.projects.form.app_name', 'App Name'),
                'required':true
            },
            {
                'field':'auth_mode',
                'type':'select',
                'label': t('ui.projects.form.auth_mode', 'Auth Mode'),
                'required':true,
                'option': {
                    'ajax': false,
                    'data': {
                        'hmac': t('ui.projects.form.auth_mode_hmac', 'HMAC (legacy, default)'),
                        'jwt':  t('ui.projects.form.auth_mode_jwt',  'JWT (requires kyte-api-js v2+)')
                    }
                }
            },
        ],
        [
            {
                'field':'aws_username',
                'type':'text',
                'label': t('ui.projects.form.aws_username', 'AWS Username'),
                'required':true
            },
            {
                'field':'aws_public_key',
                'type':'text',
                'label': t('ui.projects.form.aws_public_key', 'AWS Public Key'),
                'required':true
            },
            {
                'field':'aws_private_key',
                'type':'text',
                'label': t('ui.projects.form.aws_secret_key', 'AWS Secret Key'),
                'required':true
            }
        ]
    ];

    let colDefApps = [
        {'targets':0,'data':'name','label': t('ui.projects.table.name', 'Name')},
        {'targets':1,'data':'identifier','label': t('ui.projects.table.identifier', 'Identifier')},
        {'targets':2,'data':'aws_key','label': t('ui.projects.table.aws_username', 'AWS Username'), render: function(data, type, row, meta) { if (!row.aws_key) return t('ui.projects.table.none', 'None'); else return row.aws_key.username; }},
        {'targets':3,'data':'aws_key','label': t('ui.projects.table.aws_public_key', 'AWS Public Key'), render: function(data, type, row, meta) { if (!row.aws_key) return t('ui.projects.table.none', 'None'); else return row.aws_key.public_key; }},
    ];

        $('#pageLoaderModal').modal('show');
        if (_ks.isSession()) {
        var dataTable = new KyteTable(_ks, $("#models-table"), {'name':"Application",'field':null,'value':null}, colDefApps, true, [0,"asc"], true, true, 'id', '/app/dashboard/');
        dataTable.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        }
        dataTable.init();
        var modalForm = new KyteForm(_ks, $("#modalForm"), 'Application', null, elements, t('ui.projects.form.modal_title', 'My App'), dataTable, true, $("#new"));
        modalForm.success = function(r) {
            // Branch the generated constructor on the new Application.auth_mode
            // column. JWT mode uses null for the HMAC positional args and
            // passes the 6th-arg options bag introduced in kyte-api-js v2.0;
            // legacy HMAC mode is unchanged.
            let authMode = (r.data[0] && r.data[0].auth_mode) ? r.data[0].auth_mode : 'hmac';
            let appIdentifier = r.data[0].identifier;
            let endpointURL = "https://" + r.kyte_api;
            let connect;
            if (authMode === 'jwt') {
                connect = "let endpoint = '" + endpointURL + "';var k = new Kyte(endpoint, null, null, null, '" + appIdentifier + "', { authMode: 'jwt' });k.init();\n\n";
            } else {
                connect = "let endpoint = '" + endpointURL + "';var k = new Kyte(endpoint, '" + r.kyte_pub + "', '" + r.kyte_iden + "', '" + r.kyte_num + "', '" + appIdentifier + "');k.init();\n\n";
            }
            _ks.put('Application', 'id', r.data[0].id,
            {
                'kyte_connect': connect,
                'kyte_connect_obfuscated': '',
            }, null, [], function(res) {
                if (res.data.length <= 0) {
                    alert(t('ui.projects.form.error_update', 'Unable to update application settings. Please try again or contact support.'));
                }
            }, function(err) {
                alert(t('ui.projects.form.error_update_with_message', 'Unable to update application settings. Please try again or contact support.') + ' ' + err);
            });
        }
            modalForm.init();
            dataTable.bindEdit(modalForm);
        } else {
            location.href="/?redir="+encodeURIComponent(window.location);
        }
    }); // End KyteI18nReady listener
});