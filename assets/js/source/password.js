document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let email = null;

    // get token - if none found, then redir to /
    let token = _ks.getUrlParameter('token');
    if (!token) {
        location.href="/";
    }

    // get user info from token
    _ks.get('KytePasswordReset', 'token', token, [], function(response) {
        if (response.data.length < 1) { location.href = "/"; }
        email = response.data[0].email;
        $("#email").val(email);
    });

    // 
    // Password validation and requirements
    const requirements = {
        length: { regex: /.{8,}/, element: 'req-length' },
        uppercase: { regex: /[A-Z]/, element: 'req-uppercase' },
        lowercase: { regex: /[a-z]/, element: 'req-lowercase' },
        number: { regex: /[0-9]/, element: 'req-number' },
        special: { regex: /[!@#$%^&*(),.?":{}|<>]/, element: 'req-special' }
    };

    // Password strength calculator
    function calculateStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
        
        return score;
    }

    function updateStrengthMeter(password) {
        const strength = calculateStrength(password);
        const strengthMeter = document.querySelector('.password-strength');
        const strengthText = document.getElementById('strength-text');
        // const strengthFill = document.getElementById('strength-fill');
        
        // Remove all strength classes
        strengthMeter.className = 'password-strength';
        
        if (password.length === 0) {
            strengthText.textContent = 'Enter password';
            return;
        }
        
        switch (strength) {
            case 0:
            case 1:
            case 2:
                strengthMeter.classList.add('strength-weak');
                strengthText.textContent = 'Weak';
                break;
            case 3:
                strengthMeter.classList.add('strength-fair');
                strengthText.textContent = 'Fair';
                break;
            case 4:
                strengthMeter.classList.add('strength-good');
                strengthText.textContent = 'Good';
                break;
            case 5:
                strengthMeter.classList.add('strength-strong');
                strengthText.textContent = 'Strong';
                break;
        }
    }

    function updateRequirements() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('password-conf').value;
        const submitButton = document.getElementById('signin');
        
        let allValid = true;
        
        // Check password requirements
        Object.entries(requirements).forEach(([key, req]) => {
            const element = document.getElementById(req.element);
            const icon = element.querySelector('.requirement-icon i');
            
            if (req.regex.test(password)) {
                element.className = 'requirement valid';
                icon.className = 'fas fa-check';
            } else {
                element.className = 'requirement invalid';
                icon.className = 'fas fa-times';
                allValid = false;
            }
        });
        
        // Check password match
        const matchElement = document.getElementById('req-match');
        const matchIcon = matchElement.querySelector('.requirement-icon i');
        
        if (password && confirmPassword && password === confirmPassword) {
            matchElement.className = 'requirement valid';
            matchIcon.className = 'fas fa-check';
        } else {
            matchElement.className = 'requirement invalid';
            matchIcon.className = 'fas fa-times';
            allValid = false;
        }
        
        // Update form validation styles
        const passwordInput = document.getElementById('password');
        const confirmInput = document.getElementById('password-conf');
        
        if (password) {
            const passwordValid = Object.values(requirements).every(req => req.regex.test(password));
            passwordInput.className = `form-control ${passwordValid ? 'is-valid' : 'is-invalid'}`;
        }
        
        if (confirmPassword) {
            const matchValid = password === confirmPassword;
            confirmInput.className = `form-control ${matchValid ? 'is-valid' : 'is-invalid'}`;
        }
        
        // Enable/disable submit button
        submitButton.disabled = !allValid || !password || !confirmPassword;
        
        // Update strength meter
        updateStrengthMeter(password);
    }

    // Password toggle functionality
    function togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const button = input.nextElementSibling;
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    // Event listeners
    document.getElementById('password').addEventListener('input', updateRequirements);
    document.getElementById('password-conf').addEventListener('input', updateRequirements);

    // Form submission
    document.getElementById('password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = document.getElementById('signin');
        const errorMsg = document.getElementById('errorMsg');
        const successMsg = document.getElementById('successMsg');
        
        // Hide previous messages
        errorMsg.classList.add('d-none');
        successMsg.classList.add('d-none');
        
        // Show loading state
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating Password...';
        submitButton.disabled = true;

        _ks.put('KytePasswordReset', 'email', encodeURIComponent(email), {'token':token, 'password':$("#password").val()}, null, [], function(response) {
            submitButton.innerHTML = originalText;
            // Show success message
            successMsg.classList.remove('d-none');
            // Redirect to login after a delay
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }, function(e) {
            submitButton.innerHTML = originalText;
            showError(e);
            submitButton.disabled = false;
        });
    });

    // Initialize email field (would typically come from URL parameter)
    document.addEventListener('DOMContentLoaded', function() {
        const emailInput = document.querySelector('input[name="email"]');
        // This would typically get the email from URL parameters or token
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email') || 'user@example.com';
        emailInput.value = email;
    });

    function showError(message) {
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.querySelector('span').textContent = message;
        errorMsg.classList.remove('d-none');
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
