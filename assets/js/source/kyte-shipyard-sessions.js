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

    let colDef = [
        {'targets':0,'data':'date_created','label':'Timestamp'},
        {'targets':1,'data':'exp_date','label':'Expiration'},
        {'targets':2,'data':'uid','label':'UID', render: function(data, type, row, meta) { console.log(row); return `<span style="display:block">${data}</span><small style="display:block">${row.user_email}</small>`; }},
        {'targets':3,'data':'remoteIP','label':'Remote IP'},
        {'targets':4,'data':'forwardedIP','label':'Forwarded IP'},
        {'targets':5,'data':'userAgent','label':'User Agent'},
    ];

    console.log(idx);

    var tblSessions = new KyteTable(_ks, $("#sessions-table"), {'name':"SessionInspector",'field':'app_idx','value':idx}, colDef, true, [0,"desc"], false, false);
    tblSessions.initComplete = function() {
        $('#pageLoaderModal').modal('hide');
    }
    tblSessions.init();
});