document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    if (!_ks.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // get url param
    let idx = _ks.getPageRequest();
    idx = idx.idx;

    let colDef = [
        {'targets':0,'data':'date_created','label':'Timestamp'},
        {'targets':1,'data':'request','label':'Request', render: function(data, type, row, meta) { return `<span style="display:block">${data}</span><span style="display:block">${row.contentType}</span><span style="font-style:italic;display:block">${row.model.length > 0 ? '/'+row.model : ''}${row.field.length > 0 ? '/'+row.field : ''}${row.value.length > 0 ? '/'+row.value : ''}</span>`; }},
        {'targets':2,'data':'message','label':'Details', render: function(data, type, row, meta) { return `<span style="font-style: italic;display:block;">${row.file} (${row.line})</span><span style="display:block">${data}</span>`; }},
    ];

    console.log(idx);

    var tblErrorLog = new KyteTable(_ks, $("#log-table"), {'name':"KyteError",'field':'app_idx','value':idx}, colDef, true, [0,"desc"], false, false, 'id', '/app/log/');
    tblErrorLog.targetBlank = true;
    tblErrorLog.initComplete = function() {
        $('#pageLoaderModal').modal('hide');
    }
    tblErrorLog.init();
});