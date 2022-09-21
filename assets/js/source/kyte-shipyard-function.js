let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name',
            'required':true
        },
        {
            'field':'type',
            'type':'select',
            'label':'Type',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    'hook_init': 'hook : hook_init',
                    'hook_auth': 'hook : hook_auth',
                    'hook_prequery': 'hook : hook_prequery',
                    'hook_preprocess': 'hook : hook_preprocess',
                    'hook_response_data': 'hook : hook_response_data',
                    'hook_process_get_response': 'hook : hook_process_get_response',
                    'new':'override : new',
                    'update':'override : update',
                    'get':'override : get',
                    'delete':'override : delete',
                    'custom':'custom'
                }
            }
        }
    ],
    [
        {
            'field':'description',
            'type':'textare',
            'label':'Description',
            'required':false
        }
    ]
];

$(document).ready(function() {
    let navbar = new KyteNav("#mainnav", nav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Functions');
    navbar.create();

    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var tblFunctions = createTable("#functions-table", "Function", colDefFunctions, null, null, false, true, '/app/function/', 'id', true);
        var modalForm = new KyteForm(k, $("#modalForm"), 'Function', null, elements, 'Function', tblFunctions, true, $("#new"));
        modalForm.init();
        modalForm.success = function(r) {
            if (r.data[0]) {
                let obj = {'model': 'Function', 'idx':r.data[0].id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                location.href="/app/function/?request="+encoded+"#Code";
            }
        }
        tblFunctions.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});