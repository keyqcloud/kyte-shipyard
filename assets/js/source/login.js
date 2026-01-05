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
                console.log('[i18n DEBUG] Full session object:', session);
                console.log('[i18n DEBUG] session.data:', session.data);
                console.log('[i18n DEBUG] session.data keys:', session.data ? Object.keys(session.data) : 'no data');
                console.log('[i18n DEBUG] session.uid:', session.uid);

                // Store user ID and language preference in localStorage for i18n
                if (session.uid) {
                    localStorage.setItem('kyte_user_id', session.uid);
                }

                // Check different possible locations for language field
                let userLanguage = null;
                if (session.data) {
                    // Check if data is an array (USE_SESSION_MAP = false)
                    if (Array.isArray(session.data) && session.data.length > 0) {
                        console.log('[i18n DEBUG] session.data is an array');
                        const userData = session.data[0];
                        if (userData.language) {
                            userLanguage = userData.language;
                            console.log('[i18n DEBUG] Found language in session.data[0].language:', userLanguage);
                        }
                    }
                    // Check if data is a direct object (USE_SESSION_MAP = true)
                    else if (session.data.language) {
                        userLanguage = session.data.language;
                        console.log('[i18n DEBUG] Found language in session.data.language:', userLanguage);
                    }
                    // Try nested User object
                    else if (session.data.User && session.data.User.language) {
                        userLanguage = session.data.User.language;
                        console.log('[i18n DEBUG] Found language in session.data.User.language:', userLanguage);
                    }
                    // Try KyteUser object
                    else if (session.data.KyteUser && session.data.KyteUser.language) {
                        userLanguage = session.data.KyteUser.language;
                        console.log('[i18n DEBUG] Found language in session.data.KyteUser.language:', userLanguage);
                    }
                    else {
                        console.log('[i18n DEBUG] No language field found in any expected location');
                    }
                }

                if (userLanguage) {
                    localStorage.setItem('kyte_user_language', userLanguage);
                    console.log('[i18n] Stored user language preference:', userLanguage);
                } else {
                    console.log('[i18n] No language preference found, will use browser detection');
                }

                // Redirect to app
                if (redir) {
                    location.href = redir;
                } else {
                    location.href = "/app/";
                }
            }, function() {
                // failed login
                displayLoginError('Invalid email and/or password.');
            });
        }
    });
});
