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

let colDef = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'type','label':'Type'},
    {'targets':2,'data':'description','label':'Description'},
];

$(document).ready(function() {
    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {
        var tbl = new KyteTable(k, $("#data-table"), {'name':'Function','field':null,'value':null}, colDef, true, [0,"asc"], false, true, 'id', '/app/function/');
        tbl.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        }
        tbl.init();
        var modalForm = new KyteForm(k, $("#modalForm"), 'Function', null, elements, 'Function', tbl, true, $("#new"));
        modalForm.init();
        modalForm.success = function(r) {
            if (r.data[0]) {
                let obj = {'model': 'Function', 'idx':r.data[0].id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                location.href="/app/function/?request="+encoded+"#Code";
            }
        }
        tbl.bindEdit(modalForm);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});