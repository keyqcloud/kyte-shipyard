let subnavController = [
    {
        faicon:'fas fa-code',
        label:'Functions',
        selector:'#Functions'
    },
];

let controllerName = "Undefined";
let modelName = "Virtual";

// let implementationMap = {
//     // hooks
//     'hook_init':0,
//     'hook_auth':0,
//     'hook_prequery':0,
//     'hook_preprocess':0,
//     'hook_response_data':0,
//     'hook_process_get_response':0,

//     // overrides
//     'new':0,
//     'update':0,
//     'get':0,
//     'delete':0,
// }

let functionFormElements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name',
            'required':false
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
            'type':'textarea',
            'label':'Description',
            'required':false
        }
    ]
];

let colDefFunctions = [
    {'targets':0,'data':'type','label':'Type', render: function(data, type, row, meta) { return row.name ? data+'<small class="d-block">'+row.name+'</small>' : data; }},
    {'targets':1,'data':'description','label':'Description'},
];

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let sidenav = new KyteSidenav("#sidenav", subnavController, "#Functions");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#CustomFunctions' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        let hidden = [
            {
                'name': 'controller',
                'value': idx
            }
        ];

        _ks.get("Controller", "id", idx, [], function(r) {
            if (r.data[0]) {
                controllerName = r.data[0].name;
                $("#controller-name").html(controllerName);
                if (r.data[0].dataModel) {
                    modelName = r.data[0].dataModel.name;
                }
                // Store application ID for navigation
                localStorage.setItem('currentAppId', r.data[0].application.id);
                let obj = {'model': 'Application', 'idx':r.data[0].application.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

                let appnav = generateAppNav(encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, `<i class="fas fa-rocket me-2"></i>${r.data[0].application.name}`);
                navbar.create();

                // create link to model and update model name
                if (r.data[0].dataModel == 0 || !r.data[0].dataModel) {
                    $("#model-name").html(`Virtual`);
                } else {
                    obj = {'model': 'Model', 'idx':r.data[0].dataModel.id};
                    encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    $("#model-name").html(`<a href="/app/model/?request=${encoded}">${modelName}</a>`);
                }
            } else {
                $("#controller-name").html("Undefined");
                $("#model-name").html("Undefined");
            }

            $('#pageLoaderModal').modal('hide');
        });

        var functionsTable = new KyteTable(_ks, $("#functions-table"), {'name':'Function','field':'controller','value':idx}, colDefFunctions, true, [0,"asc"], false, true, 'id', '/app/function/');
        functionsTable.init();
        var modelFormFunction = new KyteForm(_ks, $("#modalControllerFunctionForm"), 'Function', hidden, functionFormElements, 'Function', functionsTable, true, $("#assignController"));
        modelFormFunction.init();
        modelFormFunction.success = function(r) {
            if (r.data[0]) {
                let obj = {'model': 'Function', 'idx':r.data[0].id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                location.href="/app/function/?request="+encoded+"#Code";
            }
        }
        functionsTable.bindEdit(modelFormFunction);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});