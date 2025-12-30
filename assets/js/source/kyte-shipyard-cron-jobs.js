document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    if (!_ks.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // Get url param
    let idx = _ks.getPageRequest();
    idx = idx.idx;

    // Form elements for creating/editing cron jobs
    let elements = [
        [
            {
                'field':'name',
                'type':'text',
                'label':'Job Name',
                'required':true,
                'placeholder':'Daily Report Generator'
            },
            {
                'field':'schedule_type',
                'type':'select',
                'label':'Schedule Type',
                'required':true,
                'option': {
                    'values': [
                        {'value':'cron', 'label':'Cron Expression'},
                        {'value':'interval', 'label':'Interval'},
                        {'value':'daily', 'label':'Daily'},
                        {'value':'weekly', 'label':'Weekly'},
                        {'value':'monthly', 'label':'Monthly'}
                    ]
                },
                'onChange': function(value) {
                    // Show/hide schedule-specific fields
                    $('.schedule-field').hide();
                    if (value === 'cron') {
                        $('#field-cron_expression').closest('.schedule-field').show();
                    } else if (value === 'interval') {
                        $('#field-interval_seconds').closest('.schedule-field').show();
                    } else if (value === 'daily') {
                        $('#field-time_of_day').closest('.schedule-field').show();
                        $('#field-timezone').closest('.schedule-field').show();
                    } else if (value === 'weekly') {
                        $('#field-day_of_week').closest('.schedule-field').show();
                        $('#field-time_of_day').closest('.schedule-field').show();
                        $('#field-timezone').closest('.schedule-field').show();
                    } else if (value === 'monthly') {
                        $('#field-day_of_month').closest('.schedule-field').show();
                        $('#field-time_of_day').closest('.schedule-field').show();
                        $('#field-timezone').closest('.schedule-field').show();
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
                'placeholder':'Brief description of what this job does'
            }
        ],
        [
            {
                'field':'code',
                'type':'textarea',
                'label':'Job Code (PHP)',
                'required':true,
                'class':'code-editor',
                'placeholder':'class MyJob extends \\Kyte\\Core\\CronJobBase {\n  public function execute() {\n    $this->log("Processing...");\n    // Your code here\n  }\n}'
            }
        ],
        [
            {
                'field':'cron_expression',
                'type':'text',
                'label':'Cron Expression',
                'required':false,
                'placeholder':'0 2 * * * (2 AM daily)',
                'class':'schedule-field',
                'style':'display:none;'
            },
            {
                'field':'interval_seconds',
                'type':'number',
                'label':'Interval (seconds)',
                'required':false,
                'placeholder':'300 (5 minutes)',
                'class':'schedule-field',
                'style':'display:none;'
            }
        ],
        [
            {
                'field':'time_of_day',
                'type':'text',
                'label':'Time of Day',
                'required':false,
                'placeholder':'02:00:00',
                'class':'schedule-field',
                'style':'display:none;'
            },
            {
                'field':'timezone',
                'type':'text',
                'label':'Timezone',
                'required':false,
                'placeholder':'UTC',
                'default':'UTC',
                'class':'schedule-field',
                'style':'display:none;'
            }
        ],
        [
            {
                'field':'day_of_week',
                'type':'select',
                'label':'Day of Week',
                'required':false,
                'class':'schedule-field',
                'style':'display:none;',
                'option': {
                    'values': [
                        {'value':'0', 'label':'Sunday'},
                        {'value':'1', 'label':'Monday'},
                        {'value':'2', 'label':'Tuesday'},
                        {'value':'3', 'label':'Wednesday'},
                        {'value':'4', 'label':'Thursday'},
                        {'value':'5', 'label':'Friday'},
                        {'value':'6', 'label':'Saturday'}
                    ]
                }
            },
            {
                'field':'day_of_month',
                'type':'number',
                'label':'Day of Month (1-31)',
                'required':false,
                'placeholder':'1',
                'class':'schedule-field',
                'style':'display:none;'
            }
        ],
        [
            {
                'field':'timeout_seconds',
                'type':'number',
                'label':'Timeout (seconds)',
                'required':false,
                'default':300,
                'placeholder':'300'
            },
            {
                'field':'enabled',
                'type':'select',
                'label':'Enabled',
                'required':false,
                'default':1,
                'option': {
                    'values': [
                        {'value':'1', 'label':'Yes'},
                        {'value':'0', 'label':'No'}
                    ]
                }
            }
        ],
        [
            {
                'field':'max_retries',
                'type':'number',
                'label':'Max Retries',
                'required':false,
                'default':3,
                'placeholder':'3'
            },
            {
                'field':'retry_strategy',
                'type':'select',
                'label':'Retry Strategy',
                'required':false,
                'default':'exponential',
                'option': {
                    'values': [
                        {'value':'exponential', 'label':'Exponential Backoff'},
                        {'value':'fixed', 'label':'Fixed Delay'},
                        {'value':'immediate', 'label':'Immediate'}
                    ]
                }
            }
        ],
        [
            {
                'field':'notify_on_failure',
                'type':'select',
                'label':'Notify on Failure',
                'required':false,
                'default':0,
                'option': {
                    'values': [
                        {'value':'1', 'label':'Yes'},
                        {'value':'0', 'label':'No'}
                    ]
                }
            },
            {
                'field':'slack_webhook',
                'type':'text',
                'label':'Slack Webhook URL',
                'required':false,
                'placeholder':'https://hooks.slack.com/services/...'
            }
        ]
    ];

    let hidden = [
        {
            'name': 'application',
            'value': idx
        }
    ];

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
        null // No detail page, handle in table
    );

    tblCronJobs.initComplete = function() {
        $('#pageLoaderModal').modal('hide');
    };

    tblCronJobs.init();

    // Initialize form
    var modalForm = new KyteForm(
        _ks,
        $("#modalForm"),
        'CronJob',
        hidden,
        elements,
        'Cron Job',
        tblCronJobs,
        true,
        $("#new")
    );

    modalForm.init();

    modalForm.success = function(r) {
        if (r.data[0]) {
            // Reload table to show new job
            tblCronJobs.table.ajax.reload();
        }
    };

    tblCronJobs.bindEdit(modalForm);

    // Custom action: Trigger job
    $(document).on('click', '.btn-trigger-job', function() {
        let jobId = $(this).data('id');
        let jobName = $(this).data('name');

        if (confirm(`Trigger "${jobName}" job now?`)) {
            $.ajax({
                url: '/CronJob/trigger/' + jobId,
                method: 'POST',
                success: function(response) {
                    alert('Job queued for execution! Execution ID: ' + response.execution_id);
                    tblCronJobs.table.ajax.reload();
                },
                error: function(xhr) {
                    let error = xhr.responseJSON?.error || 'Failed to trigger job';
                    alert('Error: ' + error);
                }
            });
        }
    });

    // Custom action: Recover from DLQ
    $(document).on('click', '.btn-recover-job', function() {
        let jobId = $(this).data('id');
        let jobName = $(this).data('name');

        if (confirm(`Recover "${jobName}" from dead letter queue?`)) {
            $.ajax({
                url: '/CronJob/recover/' + jobId,
                method: 'POST',
                success: function(response) {
                    alert('Job recovered successfully!');
                    tblCronJobs.table.ajax.reload();
                },
                error: function(xhr) {
                    let error = xhr.responseJSON?.error || 'Failed to recover job';
                    alert('Error: ' + error);
                }
            });
        }
    });

    // Custom action: View execution history
    $(document).on('click', '.btn-view-executions', function() {
        let jobId = $(this).data('id');
        window.location.href = '/app/cron-executions.html?job_id=' + jobId;
    });

    // Custom action: View version history
    $(document).on('click', '.btn-view-versions', function() {
        let jobId = $(this).data('id');
        window.location.href = '/app/cron-versions.html?job_id=' + jobId;
    });
});
