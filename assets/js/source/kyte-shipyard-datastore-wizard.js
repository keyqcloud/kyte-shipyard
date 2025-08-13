// Wizard navigation functionality
let currentStep = 1;
const totalSteps = 3;

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    if (!_ks.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // get url param
    let idx = _ks.getPageRequest();
    idx = idx.idx;

    let obj = {'model': 'Application', 'idx':idx};
    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
    $(".backToDS").attr('href', '/app/datastores.html?request='+encoded);

    function updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressFill.style.width = progressPercentage + '%';

        // Update step indicators
        for (let i = 1; i <= totalSteps; i++) {
            const indicator = document.getElementById(`step-indicator-${i}`);
            const circle = indicator.querySelector('.step-circle');
            
            indicator.classList.remove('active', 'complete');
            
            if (i < currentStep) {
                indicator.classList.add('complete');
                circle.innerHTML = '<i class="fas fa-check"></i>';
            } else if (i === currentStep) {
                indicator.classList.add('active');
                circle.textContent = i;
            } else {
                circle.textContent = i;
            }
        }
    }

    function showStep(stepNumber) {
        // Hide all steps using d-none (matching original)
        document.querySelectorAll('.wizard-step').forEach(step => {
            step.classList.add('d-none');
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepElement = document.getElementById(`wizard-${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.classList.remove('d-none');
            currentStepElement.classList.add('active');
        }
        
        currentStep = stepNumber;
        updateProgress();
    }

    // Bucket name input handler
    document.getElementById('bucket-name')?.addEventListener('input', function() {
        const bucketName = this.value || 'your-bucket-name';
        const preview = document.getElementById('bucket-url-preview');
        if (preview) {
            preview.textContent = `s3://${bucketName}`;
        }
    });

    // ACL selection handlers
    document.querySelectorAll('.acl-option').forEach(option => {
        option.addEventListener('click', function() {
            const section = this.closest('.wizard-section');
            const hiddenInput = section.querySelector('input[type="hidden"]');
            
            // Remove selected class from siblings
            section.querySelectorAll('.acl-option').forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
            
            // Update hidden input value
            if (hiddenInput) {
                hiddenInput.value = this.dataset.value;
            }
        });
    });

    // **** add cors handler (matching original structure)
    $("#addCORS").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        const corsWrapper = document.getElementById('cors-wrapper');
        
        // Remove empty state if there are no existing CORS cards
        const existingCards = corsWrapper.querySelectorAll('.cors-policy');
        if (existingCards.length === 0) {
            corsWrapper.innerHTML = '';
        }

        $("#cors-wrapper").append(`
        <div class="cors-policy my-3">
            <div class="cors-card">
                <div class="cors-card-header">
                    <h6 class="mb-0">CORS Policy</h6>
                    <button class="cors-remove delete-policy" type="button">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="row">
                    <div class="col-md-4">
                        <h6>Headers</h6>
                        <div class="row align-items-center mb-2">
                            <div class="col">
                                <input type="text" class="form-control corsHeaders" value="*" placeholder="Content-Type">
                            </div>
                            <div class="col-auto">
                                <a href="#" class="policy-add-header btn btn-sm btn-outline-primary">
                                    <i class="fas fa-plus"></i>
                                </a>
                            </div>
                        </div>
                        <div class="policy-headers-wrapper"></div>
                    </div>
                    <div class="col-md-4">
                        <h6>Methods</h6>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input corsMethodGet" id="get-${Date.now()}">
                            <label class="form-check-label" for="get-${Date.now()}">GET</label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input corsMethodPost" id="post-${Date.now()}">
                            <label class="form-check-label" for="post-${Date.now()}">POST</label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input corsMethodPut" id="put-${Date.now()}">
                            <label class="form-check-label" for="put-${Date.now()}">PUT</label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input corsMethodDelete" id="delete-${Date.now()}">
                            <label class="form-check-label" for="delete-${Date.now()}">DELETE</label>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input corsMethodHead" id="head-${Date.now()}">
                            <label class="form-check-label" for="head-${Date.now()}">HEAD</label>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <h6>Origins</h6>
                        <div class="row align-items-center mb-2">
                            <div class="col">
                                <input type="text" class="form-control corsOrigins" value="*" placeholder="https://example.com">
                            </div>
                            <div class="col-auto">
                                <a href="#" class="policy-add-origin btn btn-sm btn-outline-primary">
                                    <i class="fas fa-plus"></i>
                                </a>
                            </div>
                        </div>
                        <div class="policy-origins-wrapper"></div>
                    </div>
                </div>
            </div>
        </div>
        `);
    });

    // **** cors add headers
    $("#cors-wrapper").on('click', '.policy-add-header', function(e) {
        e.stopPropagation();
        e.preventDefault();

        $(this).closest('.row').next('.policy-headers-wrapper').append(`
        <div class="row my-2 align-items-center policy-header-info">
            <div class="col">
                <input type="text" class="form-control corsHeaders" placeholder="Authorization">
            </div>
            <div class="col-auto">
                <a href="#" class="policy-remove-header btn btn-sm btn-outline-danger">
                    <i class="fas fa-times"></i>
                </a>
            </div>
        </div>
        `);
    });

    // **** delete cors header
    $("#cors-wrapper").on('click', '.policy-remove-header', function(e) {
        e.stopPropagation();
        e.preventDefault();

        $(this).closest('.policy-header-info').remove();
    });

    // **** cors add origin
    $("#cors-wrapper").on('click', '.policy-add-origin', function(e) {
        e.stopPropagation();
        e.preventDefault();

        $(this).closest('.row').next('.policy-origins-wrapper').append(`
        <div class="row my-2 align-items-center policy-origin-info">
            <div class="col">
                <input type="text" class="form-control corsOrigins" placeholder="https://yoursite.com">
            </div>
            <div class="col-auto">
                <a href="#" class="policy-remove-origin btn btn-sm btn-outline-danger">
                    <i class="fas fa-times"></i>
                </a>
            </div>
        </div>
        `);
    });

    // **** delete cors origin
    $("#cors-wrapper").on('click', '.policy-remove-origin', function(e) {
        e.stopPropagation();
        e.preventDefault();

        $(this).closest('.policy-origin-info').remove();
    });

    // **** delete cors handler
    $("#cors-wrapper").on('click', '.delete-policy', function(e) {
        e.stopPropagation();
        e.preventDefault();

        $(this).closest('.cors-policy').remove();
        
        // Check remaining CORS cards
        const corsWrapper = document.getElementById('cors-wrapper');
        const remainingCards = corsWrapper.querySelectorAll('.cors-policy');
        
        // Show empty state if no policies remain
        if (remainingCards.length === 0) {
            corsWrapper.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-info-circle fa-3x mb-3"></i>
                    <h5>No CORS Policies Configured</h5>
                    <p>Add CORS policies to enable cross-origin requests to your data store.</p>
                </div>
            `;
        }
    });

    // Navigation event listeners (matching original navigation system)
    $("#wizard-1-next").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        let bucketName = $("#bucket-name").val();
        if (bucketName.length < 5) {
            $("#bucket-name").addClass('is-invalid');
            $(".bucket-name-error").html('Your data store name must be at least 5 characters long.');
            $(".bucket-name-error").removeClass('d-none');
            return;
        }
        $(".bucket-name-error").addClass('d-none');
        $("#bucket-name").removeClass('is-invalid');

        var pattern = /^[a-z0-9-]+$/i;
        if (!pattern.test(bucketName)) {
            $("#bucket-name").addClass('is-invalid');
            $(".bucket-name-error").html('Your data store name contains invalid characters.');
            $(".bucket-name-error").removeClass('d-none');
            return;
        }
        $(".bucket-name-error").addClass('d-none');
        $("#bucket-name").removeClass('is-invalid');

        if (!$("#bucket-region").val()) {
            $("#bucket-region").addClass('is-invalid');
        }
        $("#bucket-region").removeClass('is-invalid');

        if (!$("#bucket-acl").val()) {
            $("#bucket-acl").addClass('is-invalid');
        }
        $("#bucket-acl").removeClass('is-invalid');

        if (!$("#bucket-public-access").val()) {
            $("#bucket-public-access").addClass('is-invalid');
        }
        $("#bucket-public-access").removeClass('is-invalid');

        showStep(2);
    });

    $("#wizard-2-back").click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        showStep(1);
    });

    $("#wizard-2-next").click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        showStep(3);
    });

    $("#wizard-3-back").click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        showStep(2);
    });

    // create bucket (matching original API call structure)
    $("#wizard-3-next").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        let validationError = false;
        $(".cors-policy").each(function() {
            // verify that all headers and origin fields are populated
            // Get all input fields with class "corsHeaders"
            var inputFields = $(this).find('.corsHeaders');
            // Loop through each input field
            inputFields.each(function() {
                // Check if input field is empty
                if ($(this).val().trim() === '') {
                    // If input field is empty, do something (e.g., display an error message)
                    alert('There are empty allowable header fields. Please remove unused fields.');
                    validationError = true;
                    return false; // Exit the loop
                }
            });
            if (validationError) {
                return;
            }
            // Check if there is more than one input field with the class "corsHeaders"
            if (inputFields.length > 1) {
                // Loop through each input field
                inputFields.each(function() {
                    // Check if input field is empty
                    if ($(this).val().trim() === '*') {
                        // If there is more than one input field, display an error message
                        alert('If a wildcard is used ("*"), only one header field is allowed.');
                        validationError = true;
                        return false; // Exit the loop
                    }
                });
            }
            if (validationError) {
                return;
            }

            // validate that at least one method is checked
            if (!$(this).find('.corsMethodGet').prop('checked') && !$(this).find('.corsMethodPost').prop('checked') && !$(this).find('.corsMethodPut').prop('checked') && !$(this).find('.corsMethodDelete').prop('checked') && !$(this).find('.corsMethodHead').prop('checked')) {
                alert('At least one method must be selected');
                validationError = true;
                return false; // Exit the loop
            }

            // Get all input fields with class "corsOrigins"
            var inputFields = $(this).find('.corsOrigins');
            // Loop through each input field
            inputFields.each(function() {
                // Check if input field is empty
                if ($(this).val().trim() === '') {
                    // If input field is empty, do something (e.g., display an error message)
                    alert('There are empty allowable origin fields. Please remove unused fields.');
                    validationError = true;
                    return false; // Exit the loop
                }
            });
            if (validationError) {
                return;
            }
            // Check if there is more than one input field with the class "corsOrigins"
            if (inputFields.length > 1) {
                // Loop through each input field
                inputFields.each(function() {
                    // Check if input field is empty
                    if ($(this).val().trim() === '*') {
                        // If there is more than one input field, display an error message
                        alert('If a wildcard is used ("*"), only one origin field is allowed.');
                        validationError = true;
                        return false; // Exit the loop
                    }
                });
            }
            if (validationError) {
                return;
            }
        });

        if (validationError) {
            return;
        }

        let cors = [];

        let bucketName = $("#bucket-name").val();
        var pattern = /^[a-z0-9-]+$/i;
        if (!pattern.test(bucketName) || bucketName.length < 5) {
            alert("Invalid bucket name. Please go back and fix.");
            return;
        }
        let bucketRegion = $("#bucket-region").val();
        let bucketAcl = $("#bucket-acl").val();
        let bucketPublicAccess = $("#bucket-public-access").val();

        // generate cors array
        $(".cors-policy").each(function() {
            // AllowedHeaders
            let allowedHeaders = [];
            $(this).find(".corsHeaders").each(function() {
                allowedHeaders.push($(this).val());
            });

            // AllowedMethods
            let corsGet = $(this).find('.corsMethodGet').prop('checked');
            let corsPost = $(this).find('.corsMethodPost').prop('checked');
            let corsPut = $(this).find('.corsMethodPut').prop('checked');
            let corsDelete = $(this).find('.corsMethodDelete').prop('checked');
            let corsHead = $(this).find('.corsMethodHead').prop('checked');
            let allowedMethods = [];
            if (corsGet) {
                allowedMethods.push('GET');
            }
            if (corsPost) {
                allowedMethods.push('POST');
            }
            if (corsPut) {
                allowedMethods.push('PUT');
            }
            if (corsDelete) {
                allowedMethods.push('DELETE');
            }
            if (corsHead) {
                allowedMethods.push('HEAD');
            }

            // AllowedOrigins
            let allowedOrigins = [];
            $(this).find(".corsOrigins").each(function() {
                allowedOrigins.push($(this).val());
            });

            cors.push({
                'AllowedHeaders': allowedHeaders,
                'AllowedMethods': allowedMethods,
                'AllowedOrigins': allowedOrigins,
            });
        });

        _ks.post('DataStore', {
            'name': bucketName, 
            'region': bucketRegion, 
            'acl': bucketAcl, 
            'blockPublicAccess': bucketPublicAccess, 
            'application': idx, 
            'cors': cors
        }, null, [], function(r) {
            showStep('final');
        }, function(e) {
            alert("Unable to create a data store at this time. Please try again later or contact support if problem persists.");
        });
    });

    // Initialize on page load
    updateProgress();
    
    // Initialize bucket URL preview
    const preview = document.getElementById('bucket-url-preview');
    if (preview) {
        preview.textContent = 's3://your-bucket-name';
    }
});