
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

    $('#pageLoaderModal').modal('hide');
});