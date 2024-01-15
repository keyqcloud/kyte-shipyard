document.addEventListener('KyteInitialized', function(e) {
    let k = e.detail.k;
    $("#reset-form").submit(function(e) {
        e.preventDefault();
        e.stopPropagation();

        if ($("input[type=email]").val()) {
            $('#pageLoaderModal').modal('show');
            k.post("PasswordReset", {'email' : $("input[type=email]").val()}, null, [], function() {
                alert("If the email you provided is correct, an email with reset instructions was sent to you.");
                $('#pageLoaderModal').modal('hide');
            }, function() {
                alert("If the email you provided is correct, an email with reset instructions was sent to you.");
                $('#pageLoaderModal').modal('hide');
            });
        }
    });
});
