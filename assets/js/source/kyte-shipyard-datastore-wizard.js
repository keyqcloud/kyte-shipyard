let colDefDataStore = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'region','label':'Region'},
];

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

    // **** add cors handler
    $("#addCORS").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        $("#cors-wrapper").append(`
        <div class="cors-policy my-2 p-2">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col">
                            <h6>Headers</h6>
                            <div class="row align-items-center">
                                <div class="col">
                                    <input type="text" class="form-control corsHeaders" value="*">
                                </div>
                                <div class="col-1 mx-0 px-0 text-left">
                                    <a href="#" class="policy-add-header"><i class="fas fa-plus"></i></a>
                                </div>
                            </div>
                            <div class="policy-headers-wrapper">
                            </div>
                        </div>
                        <div class="col">
                            <h6>Methods</h6>
                            <div class="d-inline me-2"><input type="checkbox" class="corsMethodGet"> GET</div>
                            <div class="d-inline me-2"><input type="checkbox" class="corsMethodPost"> POST</div>
                            <div class="d-inline me-2"><input type="checkbox" class="corsMethodPut"> PUT</div>
                            <div class="d-inline"><input type="checkbox" class="corsMethodDelete"> DELETE</div>
                            <div class="d-block"><input type="checkbox" class="corsMethodHead"> HEAD</div>
                        </div>
                        <div class="col">
                            <h6>Origins</h6>
                            <div class="row align-items-center">
                                <div class="col">
                                    <input type="text" class="form-control corsOrigins" value="*">
                                </div>
                                <div class="col-1 mx-0 px-0 text-left">
                                    <a href="#" class="policy-add-origin"><i class="fas fa-plus"></i></a>
                                </div>
                            </div>
                            <div class="policy-origins-wrapper">
                            </div>
                        </div>
                        <div class="col-1 text-right"><a href="#" class="delete-policy"><i class="fas fa-times-circle text-danger"></i></a></div>
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
                <input type="text" class="form-control corsHeaders">
            </div>
            <div class="col-1 mx-0 px-0 text-left">
                <a href="#" class="policy-remove-header"><i class="fas fa-times-circle text-secondary"></i></a>
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
                <input type="text" class="form-control corsOrigins">
            </div>
            <div class="col-1 mx-0 px-0 text-left">
                <a href="#" class="policy-remove-origin"><i class="fas fa-times-circle text-secondary"></i></a>
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
    });

    // **** Navigation
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

        $("#wizard-1").addClass('d-none');
        $("#wizard-2").removeClass('d-none');
    });

    $("#wizard-2-back").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        $("#wizard-2").addClass('d-none');
        $("#wizard-1").removeClass('d-none');
    });

    $("#wizard-2-next").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        $("#wizard-2").addClass('d-none');
        $("#wizard-3").removeClass('d-none');
    });

    $("#wizard-3-back").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        $("#wizard-3").addClass('d-none');
        $("#wizard-2").removeClass('d-none');
    });

    // create bucket
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

        _ks.post('DataStore', {'name':bucketName, 'region': bucketRegion, 'acl': bucketAcl, 'blockPublicAccess':bucketPublicAccess, 'application': idx, 'cors':cors}, null, [], function(r) {
            $("#wizard-3").addClass('d-none');
            $("#wizard-final").removeClass('d-none');
        }, function(e) {
            alert("Unable to create a data store at this time. Please try again later or contact support if problem persists.");
        });
    });
});