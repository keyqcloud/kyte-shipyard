document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    if (!_ks.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // Initialize application sidebar navigation
    if (typeof initAppSidebar === 'function') {
        initAppSidebar();
    }

    // Get url param
    let idx = _ks.getPageRequest();
    idx = idx.idx;

    // Store application ID for navigation
    localStorage.setItem('currentAppId', idx);

    // Wizard state
    let currentStep = 1;
    const totalSteps = 3;

    // Open wizard modal when clicking "New Cron Job"
    $('#new').on('click', function() {
        resetWizard();
        $('#cronJobWizard').modal('show');
    });

    // Wizard navigation
    $('#wizard-next').on('click', function() {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) {
                goToStep(currentStep + 1);
            }
        }
    });

    $('#wizard-prev').on('click', function() {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    });

    $('#wizard-create').on('click', function() {
        createCronJob();
    });

    // Schedule type change
    $('input[name="schedule-type"]').on('change', function() {
        let scheduleType = $(this).val();
        $('.schedule-config').addClass('d-none');
        $(`.schedule-config[data-schedule="${scheduleType}"]`).removeClass('d-none');
    });

    // Interval preview
    $('#interval-value, #interval-unit').on('change input', function() {
        updateIntervalPreview();
    });

    function resetWizard() {
        currentStep = 1;
        $('#job-name').val('');
        $('#job-description').val('');
        $('#schedule-interval').prop('checked', true);
        $('.schedule-config').addClass('d-none');
        $('.schedule-config[data-schedule="interval"]').removeClass('d-none');
        $('#interval-value').val(1);
        $('#interval-unit').val('3600');
        $('#job-timeout').val(300);
        $('#job-enabled').val('1');
        goToStep(1);
        updateIntervalPreview();
    }

    function goToStep(step) {
        currentStep = step;

        // Update step indicators
        $('.step').removeClass('active completed');
        $(`.step[data-step="${step}"]`).addClass('active');
        for (let i = 1; i < step; i++) {
            $(`.step[data-step="${i}"]`).addClass('completed');
        }

        // Show/hide step content
        $('.wizard-step-content').addClass('d-none');
        $(`.wizard-step-content[data-step="${step}"]`).removeClass('d-none');

        // Update buttons
        $('#wizard-prev').toggle(step > 1);
        if (step === totalSteps) {
            $('#wizard-next').addClass('d-none');
            $('#wizard-create').removeClass('d-none');
            updateSummary();
        } else {
            $('#wizard-next').removeClass('d-none');
            $('#wizard-create').addClass('d-none');
        }
    }

    function validateCurrentStep() {
        if (currentStep === 1) {
            let name = $('#job-name').val().trim();
            if (!name) {
                alert('Please enter a job name');
                return false;
            }
        }
        return true;
    }

    function updateIntervalPreview() {
        let value = parseInt($('#interval-value').val()) || 1;
        let unit = parseInt($('#interval-unit').val());
        let unitName = $('#interval-unit option:selected').text().toLowerCase();

        // Handle singular/plural
        if (value === 1) {
            unitName = unitName.slice(0, -1); // Remove 's'
        }

        $('#interval-preview').text(`${value} ${unitName}`);
    }

    function updateSummary() {
        $('#summary-name').text($('#job-name').val());

        let scheduleType = $('input[name="schedule-type"]:checked').val();
        let scheduleSummary = '';

        switch(scheduleType) {
            case 'interval':
                let value = $('#interval-value').val();
                let unitText = $('#interval-unit option:selected').text();
                if (value == 1) unitText = unitText.slice(0, -1);
                scheduleSummary = `Every ${value} ${unitText.toLowerCase()}`;
                break;
            case 'daily':
                scheduleSummary = `Daily at ${$('#daily-time').val()} (${$('#daily-timezone').val()})`;
                break;
            case 'weekly':
                let day = $('#weekly-day option:selected').text();
                scheduleSummary = `Every ${day} at ${$('#weekly-time').val()}`;
                break;
            case 'monthly':
                scheduleSummary = `Monthly on day ${$('#monthly-day').val()} at ${$('#monthly-time').val()}`;
                break;
            case 'cron':
                scheduleSummary = `Cron: ${$('#cron-expression').val()}`;
                break;
        }

        $('#summary-schedule').text(scheduleSummary);
    }

    function createCronJob() {
        let scheduleType = $('input[name="schedule-type"]:checked').val();
        let data = {
            application: idx,
            name: $('#job-name').val(),
            description: $('#job-description').val() || null,
            schedule_type: scheduleType,
            timeout_seconds: parseInt($('#job-timeout').val()),
            enabled: parseInt($('#job-enabled').val()),
            max_retries: 3,
            retry_strategy: 'exponential'
        };

        // Add schedule-specific fields
        switch(scheduleType) {
            case 'interval':
                let intervalValue = parseInt($('#interval-value').val());
                let intervalUnit = parseInt($('#interval-unit').val());
                data.interval_seconds = intervalValue * intervalUnit;
                break;
            case 'daily':
                data.time_of_day = $('#daily-time').val() + ':00';
                data.timezone = $('#daily-timezone').val();
                break;
            case 'weekly':
                data.day_of_week = parseInt($('#weekly-day').val());
                data.time_of_day = $('#weekly-time').val() + ':00';
                data.timezone = $('#weekly-timezone').val();
                break;
            case 'monthly':
                data.day_of_month = parseInt($('#monthly-day').val());
                data.time_of_day = $('#monthly-time').val() + ':00';
                data.timezone = $('#monthly-timezone').val();
                break;
            case 'cron':
                data.cron_expression = $('#cron-expression').val();
                break;
        }

        $('#wizard-create').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Creating...');

        _ks.post('CronJob', data, null, [], function(r) {
            if (r.data[0]) {
                $('#cronJobWizard').modal('hide');
                // Redirect to detail page to add code
                let cronJobRequest = btoa(JSON.stringify({'model': 'CronJob', 'idx': r.data[0].id}));
                window.location.href = '/app/cron-job/?request=' + encodeURIComponent(cronJobRequest);
            }
        }, function(err) {
            alert('Error creating cron job: ' + JSON.stringify(err));
            $('#wizard-create').prop('disabled', false).html('<i class="fas fa-check"></i> Create Job');
        });
    }

    // =================================================================
    // TABLE INITIALIZATION
    // =================================================================

    let hidden = [
        {
            'name': 'application',
            'value': idx
        },
        {
            'name': 'max_retries',
            'value': 3
        },
        {
            'name': 'retry_strategy',
            'value': 'exponential'
        }
    ];

    // Note: elements array removed - now using custom wizard modal

    // Initialize table
    var tblCronJobs = new KyteTable(
        _ks,
        $("#cronJobs-table"),
        {'name':"CronJob",'field':'application','value':idx},
        colDefCronJobs,
        true,
        [0,"asc"],
        false,
        true,
        'id',
        '/app/cron-job/'
    );

    tblCronJobs.initComplete = function() {
        $('#pageLoaderModal').modal('hide');
    };

    tblCronJobs.init();

    // NOTE: Removed KyteForm - now using custom wizard modal for better UX
    // Edit functionality is handled in the detail page

    // =================================================================
    // OLD UNUSED CODE - COMMENTED OUT
    // =================================================================
    /*
    let elements_OLD = [
        [
            {
                'field':'name',
                'type':'text',
                'label':'Job Name',
                'required':true,
                'placeholder':'Daily Report Generator',
                'col': 6
            },
            {
                'field':'schedule_type',
                'type':'select',
                'label':'Schedule Type',
                'required':true,
                'col': 6,
                'option': {
                    'ajax': false,
                    'data': {
                        'interval': 'Interval (Recommended for new jobs)',
                        'daily': 'Daily',
                        'weekly': 'Weekly',
                        'monthly': 'Monthly',
                        'cron': 'Cron Expression (Advanced)'
                    }
                },
                'onChange': function(value) {
                    // Show/hide schedule-specific fields
                    $('.schedule-field').hide();
                    if (value === 'cron') {
                        $('#field-cron_expression').closest('.row').show();
                    } else if (value === 'interval') {
                        $('#field-interval_seconds').closest('.row').show();
                    } else if (value === 'daily') {
                        $('#field-time_of_day').closest('.row').show();
                        $('#field-timezone').closest('.row').show();
                    } else if (value === 'weekly') {
                        $('#field-day_of_week').closest('.row').show();
                        $('#field-time_of_day').closest('.row').show();
                        $('#field-timezone').closest('.row').show();
                    } else if (value === 'monthly') {
                        $('#field-day_of_month').closest('.row').show();
                        $('#field-time_of_day').closest('.row').show();
                        $('#field-timezone').closest('.row').show();
                    }
                }
            }
        ],
        [
            {
                'field':'description',
                'type':'textarea',
                'label':'Description',
                'required':false,
                'placeholder':'Brief description of what this job does',
                'col': 12
            }
        ],
        [
            {
                'field':'interval_seconds',
                'type':'number',
                'label':'Run Every (seconds)',
                'required':false,
                'placeholder':'3600',
                'default': 3600,
                'col': 12
            }
        ],
        [
            {
                'field':'cron_expression',
                'type':'text',
                'label':'Cron Expression',
                'required':false,
                'placeholder':'0 2 * * * (2 AM daily)',
                'col': 12
            }
        ],
        [
            {
                'field':'time_of_day',
                'type':'text',
                'label':'Time of Day',
                'required':false,
                'placeholder':'02:00:00',
                'col': 6
            },
            {
                'field':'timezone',
                'type':'text',
                'label':'Timezone',
                'required':false,
                'placeholder':'UTC',
                'default':'UTC',
                'col': 6
            }
        ],
        [
            {
                'field':'day_of_week',
                'type':'select',
                'label':'Day of Week',
                'required':false,
                'col': 6,
                'option': {
                    'ajax': false,
                    'data': {
                        '0': 'Sunday',
                        '1': 'Monday',
                        '2': 'Tuesday',
                        '3': 'Wednesday',
                        '4': 'Thursday',
                        '5': 'Friday',
                        '6': 'Saturday'
                    }
                }
            },
            {
                'field':'day_of_month',
                'type':'number',
                'label':'Day of Month',
                'required':false,
                'placeholder':'1 (First day of month)',
                'col': 6
            }
        ],
        [
            {
                'field':'enabled',
                'type':'select',
                'label':'Status',
                'required':false,
                'default':1,
                'col': 6,
                'option': {
                    'ajax': false,
                    'data': {
                        '1': 'Enabled',
                        '0': 'Disabled'
                    }
                }
            },
            {
                'field':'timeout_seconds',
                'type':'number',
                'label':'Timeout (seconds)',
                'required':false,
                'default':300,
                'placeholder':'300',
                'col': 6
            }
        ]
    ];
    */
    // End of old unused code

    // Custom action: Recover from DLQ (only button that remains in table)
    $(document).on('click', '.btn-recover-job', function() {
        let jobId = $(this).data('id');
        let jobName = $(this).data('name');

        if (confirm(`Recover "${jobName}" from dead letter queue?`)) {
            // Use Kyte SDK's built-in put() method
            _ks.put('CronJob', 'recover', jobId, {}, null, [], function(response) {
                alert('Job recovered successfully!');
                tblCronJobs.table.ajax.reload();
            }, function(error) {
                alert('Error: ' + (error.error || 'Failed to recover job'));
            });
        }
    });
});
