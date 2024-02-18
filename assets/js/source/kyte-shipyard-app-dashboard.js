
document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    $('#pageLoaderModal').modal('show');

    if (!_ks.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // get url param
    let idx = _ks.getPageRequest();
    idx = idx.idx;

    _ks.get("Application", "id", idx, [], function(r) {
        if (r.data[0]) {
            data = r.data[0];

            let obj = {'model': 'Application', 'idx':r.data[0].id};
            let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
            
            let appnav = generateAppNav(encoded);
        
            let navbar = new KyteNav("#mainnav", appnav, null, `<i class="fas fa-rocket me-2"></i>${data.name}`);
            navbar.create();

        } else {
            alert("Failed to load...");
        }
        $('#pageLoaderModal').modal('hide');
    });
});