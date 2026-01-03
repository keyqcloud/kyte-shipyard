let colDefDataStore = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'bucketname','label':'Bucket Name'},
    {'targets':2,'data':'region','label':'Region'},
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

    let obj = {'model': 'Application', 'idx':idx};
    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
    $("#new").attr('href', '/app/datastore/new.html?request='+encoded);

    var tblDataStore = new KyteTable(_ks, $("#datastore-table"), {'name':'DataStore','field':'application','value':idx}, colDefDataStore, true, [0,"asc"], false, true);//, 'id', '/app/datastore/');
    tblDataStore.init();
});