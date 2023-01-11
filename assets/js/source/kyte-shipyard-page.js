

$(document).ready(function() {
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