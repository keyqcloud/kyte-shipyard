let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'App Name',
            'required':true
        },
        {
            'field':'obfuscate_kyte_connect',
            'type':'select',
            'label':'Obfuscate Kyte Connect',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    1: 'Obfuscate (Default)',
                    0: 'Do not obfuscate (not recommended)'
                }
            }
        },
    ],
    [
        {
            'field':'aws_username',
            'type':'text',
            'label':'AWS Username',
            'required':true
        },
        {
            'field':'aws_public_key',
            'type':'text',
            'label':'AWS Public Key',
            'required':true
        },
        {
            'field':'aws_secret_key',
            'type':'text',
            'label':'AWS Secret Key',
            'required':true
        }
    ]
];

let colDefApps = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'identifier','label':'Identifier'},
    {'targets':2,'data':'aws_key','label':'AWS Username', render: function(data, type, row, meta) { if (!row.aws_key) return 'None'; else return row.aws_key.public_key; }},
    {'targets':3,'data':'aws_key','label':'AWS Public Key', render: function(data, type, row, meta) { if (!row.aws_key) return 'None'; else return row.aws_key.private_key; }},
];

$(document).ready(function() {
    let navbar = new KyteNav("#mainnav", rootnav, null, 'Kyte Shipyard<sup>&trade;</sup>');
    navbar.create();

    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var dataTable = createTable("#models-table", "Application", colDefApps, null, null, true, true, '/app/dashboard/', 'id', true);
        var modalForm = new KyteForm(k, $("#modalForm"), 'Application', null, elements, 'My App', dataTable, true, $("#new"));
        modalForm.successCallBack = function(r) {
            let connect = "let endpoint = 'https://"+r.kyte_api+"';var k = new Kyte(endpoint, '"+r.kyte_pub+"', '"+r.kyte_iden+"', '"+r.kyte_num+"', '"+r.data[0].identifier+"');k.init();\n\n";
            let obfuscatedConnect = JavaScriptObfuscator.obfuscate(connect,
                {
                    compact: true,
                    controlFlowFlattening: true,
                    controlFlowFlatteningThreshold: 1,
                    numbersToExpressions: true,
                    simplify: true,
                    stringArrayEncoding: ['base64'],
                    stringArrayShuffle: true,
                    splitStrings: true,
                    stringArrayWrappersType: 'variable',
                    stringArrayThreshold: 1
                }
            );
            k.put('Application', 'id', r.data[0].id,
            {
                'kyte_connect': connect,
                'kyte_connect_obfuscated': obfuscatedConnect,
            }, null, [], function(res) {
                if (res.data.length > 0) {
                    alert("Application settings successfully updated");
                } else {
                    alert("Unable to update application settings. Please try again or contact support.");
                }
            }, function(err) {
                alert("Unable to update application settings. Please try again or contact support. "+err);
            });
        }
        modalForm.init();
        dataTable.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});