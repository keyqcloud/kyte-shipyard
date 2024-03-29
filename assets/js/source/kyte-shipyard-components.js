let fldsComponent = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name',
            'required':true
        },
        {
            'field':'identifier',
            'type':'text',
            'label':'Identifier',
            'required':true
        },
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

let colDefComponents = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'identifier','label':'Identifier'},
    {'targets':2,'data':'description','label':'Description'},
];

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    
    $('#pageLoaderModal').modal('show');

    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        let hidden = [
            {
                'name': 'application',
                'value': idx
            }
        ];

        var tblComponents = new KyteTable(_ks, $("#webcomponents-table"), {'name':'KyteWebComponent','field':'application','value':idx}, colDefComponents, true, [0,"asc"], false, true, 'id', '/app/component/');
        tblComponents.init();
        var frmComponent = new KyteForm(_ks, $("#modalForm"), 'KyteWebComponent', hidden, fldsComponent, 'Web Component', tblComponents, true, $("#new"));
        frmComponent.init();
        frmComponent.success = function(r) {
            if (r.data[0]) {
                let obj = {'model': 'KyteWebComponent', 'idx':r.data[0].id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                location.href="/app/component/?request="+encoded+"#Code";
            }
        }
        tblComponents.bindEdit(frmComponent);
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});