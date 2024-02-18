function displayLoginError(error_message) {
    $("#errorMsg").html(error_message);
    $("#errorMsg").removeClass('d-none');
    $('#pageLoaderModal').modal('hide');
}

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let redir = false;
    redir = _ks.getUrlParameter("redir");

    if (_ks.isSession(false, false)) {
        if (redir) {
            location.href = redir;
        } else {
            location.href = "/app/";
        }
    }
    
    $("#login-form").submit(function(e) {
        e.preventDefault();
        e.stopPropagation();

        $("#errorMsg").html('');
        $("#errorMsg").addClass('d-none');
        if ($("input[type=password]").val() && $("input[type=email]").val()) {
            $('#pageLoaderModal').modal('show');
            _ks.sessionCreate({'email' : $("input[type=email]").val(), 'password': $("input[type=password]").val()}, function(session) {
                // check if kyte_account is 1...
                // let kyte_account = session.data.User.kyte_account.id;
                // if (kyte_account == 1) {
                    if (redir) {
                        location.href = redir;
                    } else {
                        location.href = "/app/";
                    }
                // } else {
                //     _ks.sessionDestroy();
                //     displayLoginError('No account found with specified credentials.');
                // }
            }, function() {
                // failed login
                displayLoginError('Invalid email and/or password.');
            });
        }
    });
});
