document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    // Enhanced form handling
    document.getElementById('reset-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = this.querySelector('input[name="email"]');
        const submitButton = this.querySelector('#signin');
        const errorMsg = document.getElementById('errorMsg');
        const successMsg = document.getElementById('successMsg');
        
        // Hide previous messages
        errorMsg.classList.add('d-none');
        successMsg.classList.add('d-none');
        
        // Validate email
        if (!emailInput.value || !isValidEmail(emailInput.value)) {
            showError('Please enter a valid email address.');
            return;
        }
        
        // Show loading state
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitButton.disabled = true;
        
        if ($("input[type=email]").val()) {
            // No-reveal in both modes: success and failure show the same
            // "if the email is correct..." message.
            const done = function() {
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                successMsg.classList.remove('d-none');
            };

            if (_ks.authMode === 'jwt') {
                // Shipyard is platform-level (no applicationId), so the
                // anonymous model-CRUD path can't carry this in JWT mode —
                // use the dedicated endpoint (kyte-php v4.11.0+, KYTE-#268).
                $.ajax({
                    method: 'POST',
                    url: _ks.url + '/jwt/password-reset',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify({ email: $("input[type=email]").val() }),
                    success: done,
                    error: done
                });
            } else {
                _ks.post("KytePasswordReset", {'email' : $("input[type=email]").val()}, null, [], done, done);
            }
        }
    });
            
    function showError(message) {
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.querySelector('span').textContent = message;
        errorMsg.classList.remove('d-none');
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Input focus animations
    document.querySelectorAll('.form-control').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });

});