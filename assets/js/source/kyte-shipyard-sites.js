let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Site Name',
            'required':true
        },
        {
            'field':'region',
            'type':'select',
            'label':'Region',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    'us-east-1': 'N. Virginia',
                    'us-east-2': 'Ohio',
                    'us-west-1': 'N. California',
                    'us-west-2': 'Oregon',
                    'ap-south-1': 'Mumbai',
                    'ap-northeast-1': 'Tokyo',
                    'ap-northeast-2': 'Seoul',
                    'ap-southeast-1': 'Singapore',
                    'ap-southeast-2': 'Sydney',
                    'ca-central-1': 'Canada (Central)',
                    'eu-central-1': 'Frankfurt',
                    'eu-north-1': 'Stockholm',
                    'eu-west-1': 'Ireland',
                    'eu-west-2': 'London',
                    'eu-west-3': 'Paris',
                    'sa-east-1': 'São Paulo',
                }
            }
        }
    ],
    [
        {
            'field':'description',
            'type':'text',
            'label':'Description',
            'required':true
        }
    ]
];

let colDefSites = [
    {'targets':0,'data':'name','label':'Site Name'},
    {'targets':1,'data':'cfDomain','label':'CF Domain', render: function(data, type, row, meta) { return data ? data : ''}},
    {'targets':2,'data':'aliasDomain','label':'Alias', render: function(data, type, row, meta) { return data ? data : ''}},
    {'targets':3,'data':'region','label':'region'},
    {'targets':4,'data':'status','label':'Status', render: function(data, type, row, meta) { return data.charAt(0).toUpperCase() + data.slice(1); }},
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

    let hidden = [
        {
            'name': 'application',
            'value': idx
        }
    ];
    
    var dataTable = new KyteTable(_ks, $("#data-table"), {'name':'KyteSite', 'field':'application', 'value':idx}, colDefSites, true, [0,"asc"], false, true, 'id', '/app/site/');
    dataTable.initComplete = function() {
        $('#pageLoaderModal').modal('hide');
    }
    dataTable.init();
    var modalForm = new KyteForm(_ks, $("#modalForm"), 'KyteSite', hidden, elements, 'Site', dataTable, true, $("#new"));
    modalForm.init();
    dataTable.bindEdit(modalForm);
});