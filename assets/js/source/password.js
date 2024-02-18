document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let email = null;
    // setup password requirements
    var passreq = new KytePasswordRequirement(k, $("#passwordRequirements"), $("#password"), $("#password-conf"));
    passreq.init();

    // get token - if none found, then redir to /
    let token = _ks.getUrlParameter('token');
    if (!token) {
        location.href="/";
    }

    // get user info from token
    _ks.get('PasswordReset', 'token', token, [], function(response) {
        if (response.data.length < 1) { location.href = "/"; }
        email = response.data[0].email;
        $("#email").val(email);
        $('#pageLoaderModal').modal('hide');
    });

    function displayPasswordError() {
        $("#errorMsg").html('Please confirm you password again as they do not match, or meet the requirements.');
        $("#errorMsg").removeClass('d-none');
        $('#pageLoaderModal').modal('hide');
    }
    function displayEnrollmentError() {
        $("#errorMsg").html('Unable to update your password. Please try again later.');
        $("#errorMsg").removeClass('d-none');
        $('#pageLoaderModal').modal('hide');
    }

    $("#password-form").submit(function(e) {
        e.preventDefault();
        e.stopPropagation();

        $("#errorMsg").html('');
        $("#errorMsg").addClass('d-none');
        let p = $("#password").val();
        let c = $("#password-conf").val()
        if (c == p && c.length >= 8 && passreq.validatePassword($("#password"))) {
            $('#pageLoaderModal').modal('show');

            _ks.put('PasswordReset', 'email', encodeURIComponent(email), {'token':token, 'password':$("#password").val()}, null, [], function(response) {
                alert("Your password has been successfully update.");
                location.href="/";
            }, function() { displayEnrollmentError(); });
        } else displayPasswordError();
    });
});
