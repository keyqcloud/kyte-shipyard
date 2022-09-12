$(document).ready(function() {
    function displayLoginError(error_message) {
        $("#errorMsg").html(error_message);
        $("#errorMsg").removeClass('d-none');
        $('#pageLoaderModal').modal('hide');
    }
    
    $("#login-form").submit(function(e) {
        e.preventDefault();

        let redir = false;
        redir = k.getUrlParameter("redir");

        $("#errorMsg").html('');
        $("#errorMsg").addClass('d-none');
        if ($("input[type=password]").val() && $("input[type=email]").val()) {
            $('#pageLoaderModal').modal('show');
            k.sessionCreate({'email' : $("input[type=email]").val(), 'password': $("input[type=password]").val()}, function(session) {
                // check if kyte_account is 1...
                // let kyte_account = session.data.User.kyte_account.id;
                // if (kyte_account == 1) {
                    if (redir) {
                        location.href = redir;
                    } else {
                        location.href = "/app/";
                    }
                // } else {
                //     k.sessionDestroy();
                //     displayLoginError('No account found with specified credentials.');
                // }
            }, function() {
                // failed login
                displayLoginError('Invalid email and/or password.');
            });
        }
    });
});
