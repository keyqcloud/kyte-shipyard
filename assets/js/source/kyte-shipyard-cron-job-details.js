document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    if (!_ks.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // Get cron job ID from URL
    let idx = _ks.getPageRequest();
    idx = idx.idx;

    let cronJobData = null;
    let appId = null;
    let editors = {
        execute: null,
        setUp: null,
        tearDown: null
    };
    let functions = {
        execute: null,
        setUp: null,
        tearDown: null
    };
    let originalCode = {
        execute: '',
        setUp: '',
        tearDown: ''
    };
    let hasUnsavedChanges = {
        execute: false,
        setUp: false,
        tearDown: false
    };
    let currentFunction = 'execute';

    // Monaco Editor Configuration
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });

    require(['vs/editor/editor.main'], function () {
        // Verify PHP language is available
        const languages = monaco.languages.getLanguages();
        const phpLang = languages.find(lang => lang.id === 'php');
        console.log('Monaco PHP language available:', !!phpLang);

        // Load cron job data
        loadCronJob();
    });

    function loadCronJob() {
        _ks.get('CronJob', 'id', idx, [], function(r) {
            if (r.data[0]) {
                cronJobData = r.data[0];
                // Store both ID (for navigation) and identifier (for API context switching)
                appId = cronJobData.application.identifier;

                // Store application numeric ID for navigation
                localStorage.setItem('currentAppId', cronJobData.application.id);

                // Update UI
                $('#cron-job-name span').text(cronJobData.name);
                $('#schedule-type').text(formatScheduleType(cronJobData.schedule_type));

                // Update status
                updateJobStatus();

                // Update job info
                updateJobInfo();

                // Load cron job functions
                loadCronJobFunctions();

                // Hide loading modal
                $('#pageLoaderModal').modal('hide');
            }
        }, function(err) {
            alert('Error loading cron job: ' + JSON.stringify(err));
        });
    }

    function loadCronJobFunctions() {
        _ks.get('CronJobFunction', 'cron_job', idx, [], function(r) {
            console.log('CronJobFunction response:', r);

            if (r.data && r.data.length > 0) {
                // Store function data
                r.data.forEach(function(func) {
                    console.log('Function loaded:', func.name, 'Has body:', !!func.function_body);
                    functions[func.name] = func;
                    originalCode[func.name] = func.function_body || getDefaultFunctionBody(func.name);
                });
            } else {
                console.warn('No functions found, using defaults');
                // No functions yet (shouldn't happen with default creation, but handle it)
                originalCode.execute = getDefaultFunctionBody('execute');
                originalCode.setUp = getDefaultFunctionBody('setUp');
                originalCode.tearDown = getDefaultFunctionBody('tearDown');
            }

            console.log('Original code loaded:', originalCode);

            // Initialize all editors
            initializeEditors();
        }, function(err) {
            console.error('Error loading functions:', err);
            alert('Error loading functions: ' + JSON.stringify(err));
        });
    }

    function getDefaultFunctionBody(functionName) {
        const defaults = {
            execute: `$this->log("Job started");

// Add your job logic here
// Examples:
// - Database cleanup
// - Send scheduled emails
// - Generate reports
// - Process queued items

$this->log("Job completed");
return "Success";`,
            setUp: '// Initialize resources here (optional)',
            tearDown: '// Cleanup resources here (optional)'
        };
        return defaults[functionName] || '';
    }

    function initializeEditors() {
        console.log('Initializing Monaco editors...');
        console.log('Monaco available:', typeof monaco !== 'undefined');

        // Create editor for each function
        ['execute', 'setUp', 'tearDown'].forEach(function(functionName) {
            const editorDiv = document.getElementById('code-editor-' + functionName);
            console.log('Creating editor for', functionName, 'div:', editorDiv);

            // Dispose existing editor if it exists to avoid duplicates
            if (editors[functionName]) {
                editors[functionName].dispose();
                editors[functionName] = null;
            }

            editors[functionName] = monaco.editor.create(
                editorDiv,
                {
                    value: originalCode[functionName],
                    language: 'php',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    // PHP-specific editor options
                    tabSize: 4,
                    insertSpaces: true,
                    detectIndentation: true,
                    folding: true,
                    foldingStrategy: 'indentation',
                    showFoldingControls: 'always',
                    matchBrackets: 'always',
                    autoClosingBrackets: 'always',
                    autoClosingQuotes: 'always',
                    formatOnPaste: true,
                    formatOnType: false,
                    // Syntax highlighting
                    renderLineHighlight: 'all',
                    renderWhitespace: 'selection',
                    colorDecorators: true
                }
            );

            // Track changes
            editors[functionName].onDidChangeModelContent(function() {
                hasUnsavedChanges[functionName] = (editors[functionName].getValue() !== originalCode[functionName]);
                updateSaveButtonState();
            });

            // Keyboard shortcuts
            editors[functionName].addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
                saveCode();
            });
        });

        // Setup tab switching
        setupTabSwitching();
    }

    function setupTabSwitching() {
        $('#function-tabs a').on('click', function(e) {
            e.preventDefault();
            let functionName = $(this).data('function');
            switchToFunction(functionName);
        });
    }

    function switchToFunction(functionName) {
        // Update active tab
        $('#function-tabs a').removeClass('active');
        $('#function-tabs a[data-function="' + functionName + '"]').addClass('active');

        // Show/hide editor panels
        $('.code-editor-panel').hide();
        $('#code-editor-' + functionName).show();

        // Update current function
        currentFunction = functionName;

        // Update save button state
        updateSaveButtonState();

        // Refresh editor layout (Monaco needs this when visibility changes)
        setTimeout(function() {
            editors[functionName].layout();
        }, 10);
    }

    function updateJobStatus() {
        let statusBadge = $('#job-status');
        if (cronJobData.in_dead_letter_queue) {
            statusBadge.removeClass().addClass('badge bg-danger').text('Dead Letter Queue');
        } else if (cronJobData.enabled) {
            statusBadge.removeClass().addClass('badge bg-success').text('Enabled');
        } else {
            statusBadge.removeClass().addClass('badge bg-secondary').text('Disabled');
        }
    }

    function updateJobInfo() {
        // Last run - comes as formatted string from backend
        if (cronJobData.execution_summary && cronJobData.execution_summary.last_execution) {
            $('#last-run').text(cronJobData.execution_summary.last_execution);
        }

        // Next run - comes as Unix timestamp
        if (cronJobData.next_run) {
            let nextRun = new Date(cronJobData.next_run * 1000);
            $('#next-run').text(nextRun.toLocaleString());
        }

        // Success rate
        if (cronJobData.execution_summary && cronJobData.execution_summary.total_executions > 0) {
            let rate = cronJobData.execution_summary.success_rate;
            let rateClass = rate >= 90 ? 'text-success' : (rate >= 70 ? 'text-warning' : 'text-danger');
            $('#success-rate').html(`<span class="${rateClass}">${rate}%</span> (${cronJobData.execution_summary.successful}/${cronJobData.execution_summary.total_executions})`);
        }
    }

    function formatScheduleType(type) {
        const types = {
            'interval': 'Interval',
            'daily': 'Daily',
            'weekly': 'Weekly',
            'monthly': 'Monthly',
            'cron': 'Cron Expression'
        };
        return types[type] || type;
    }

    function updateSaveButtonState() {
        let saveBtn = $('#save-code');
        let anyChanges = hasUnsavedChanges[currentFunction];

        if (anyChanges) {
            saveBtn.removeClass('btn-primary').addClass('btn-warning');
            saveBtn.html('<i class="fas fa-save"></i> Save ' + currentFunction + '() <kbd>Ctrl+S</kbd>');
        } else {
            saveBtn.removeClass('btn-warning').addClass('btn-primary');
            saveBtn.html('<i class="fas fa-check"></i> Saved <kbd>Ctrl+S</kbd>');
        }
    }

    function saveCode() {
        if (!hasUnsavedChanges[currentFunction]) {
            return;
        }

        let newCode = editors[currentFunction].getValue();
        let saveBtn = $('#save-code');
        let func = functions[currentFunction];

        saveBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');

        // Determine if we're creating or updating
        if (func && func.id) {
            // Update existing function
            _ks.put('CronJobFunction', 'id', func.id, {
                function_body: newCode
            }, null, [], function(r) {
                handleSaveSuccess(r, newCode);
            }, function(err) {
                handleSaveError(err);
            });
        } else {
            // Create new function
            _ks.post('CronJobFunction', {
                cron_job: idx,
                name: currentFunction,
                function_body: newCode
            }, null, [], function(r) {
                if (r.data[0]) {
                    functions[currentFunction] = r.data[0];
                }
                handleSaveSuccess(r, newCode);
            }, function(err) {
                handleSaveError(err);
            });
        }
    }

    function handleSaveSuccess(r, newCode) {
        let saveBtn = $('#save-code');

        originalCode[currentFunction] = newCode;
        hasUnsavedChanges[currentFunction] = false;
        updateSaveButtonState();

        // Update version badge if returned
        if (r.data[0] && r.data[0].current_version) {
            $('#version-badge').text(currentFunction + '() v' + r.data[0].current_version.version_number);
        }

        // Show success message
        saveBtn.removeClass('btn-warning').addClass('btn-success');
        setTimeout(function() {
            saveBtn.removeClass('btn-success').addClass('btn-primary');
        }, 2000);

        saveBtn.prop('disabled', false);
    }

    function handleSaveError(err) {
        let saveBtn = $('#save-code');
        alert('Error saving function: ' + (err.error || JSON.stringify(err)));
        saveBtn.prop('disabled', false);
        updateSaveButtonState();
    }

    // Event Handlers
    $('#save-code').on('click', function() {
        saveCode();
    });

    // Help panel toggle
    $('#toggle-help').on('click', function() {
        $('#help-panel').slideToggle();
    });

    $('#close-help').on('click', function() {
        $('#help-panel').slideUp();
    });

    $('#trigger-job').on('click', function() {
        if (!cronJobData) {
            alert('Error: Job data not loaded');
            return;
        }

        if (!confirm('Trigger "' + cronJobData.name + '" now?')) {
            return;
        }

        let btn = $(this);
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Triggering...');

        // Use Kyte SDK's built-in put() method
        _ks.put('CronJob', 'trigger', idx, {}, null, [], function(response) {
            console.log('Trigger response:', response);

            if (response && response.data && response.data[0]) {
                let result = response.data[0];
                let message = `Job executed ${result.status === 'completed' ? 'successfully' : 'with errors'}!\n\n`;
                message += `Execution ID: ${result.execution_id}\n`;
                message += `Duration: ${result.duration_ms}ms\n`;
                message += `Memory: ${result.memory_peak_mb}MB\n`;

                if (result.output) {
                    message += `\nOutput:\n${result.output}`;
                }

                if (result.error) {
                    message += `\n\nError:\n${result.error}`;
                }

                alert(message);
            } else {
                alert('Job executed!');
            }

            btn.prop('disabled', false).html('<i class="fas fa-play"></i> Trigger Now');

            // Reload job data to update next run time and refresh executions table
            loadCronJob();
            if (typeof loadExecutions === 'function') {
                loadExecutions();
            }
        }, function(error) {
            alert('Error: ' + (error.error || 'Failed to trigger job'));
            btn.prop('disabled', false).html('<i class="fas fa-play"></i> Trigger Now');
        });
    });

    // Schedule type change handler for edit modal
    $('input[name="edit-schedule-type"]').on('change', function() {
        let scheduleType = $(this).val();
        $('.edit-schedule-config').addClass('d-none');
        $(`.edit-schedule-config[data-schedule="${scheduleType}"]`).removeClass('d-none');
        updateEditIntervalPreview();
    });

    // Interval preview update for edit modal
    $('#edit-interval-value, #edit-interval-unit').on('change input', function() {
        updateEditIntervalPreview();
    });

    function updateEditIntervalPreview() {
        let value = parseInt($('#edit-interval-value').val()) || 1;
        let unit = parseInt($('#edit-interval-unit').val());
        let unitName = $('#edit-interval-unit option:selected').text().toLowerCase();

        if (value === 1) {
            unitName = unitName.slice(0, -1); // Remove 's'
        }

        $('#edit-interval-preview').text(`${value} ${unitName}`);
    }

    $('#edit-settings').on('click', function() {
        if (!cronJobData) {
            alert('Error: Job data not loaded');
            return;
        }

        // Populate basic info
        $('#edit-job-name').val(cronJobData.name);
        $('#edit-job-description').val(cronJobData.description || '');

        // Set schedule type radio
        $(`#edit-schedule-${cronJobData.schedule_type}`).prop('checked', true);

        // Show/hide relevant schedule config
        $('.edit-schedule-config').addClass('d-none');
        $(`.edit-schedule-config[data-schedule="${cronJobData.schedule_type}"]`).removeClass('d-none');

        // Populate schedule-specific fields
        switch(cronJobData.schedule_type) {
            case 'interval':
                // Calculate interval value and unit
                let seconds = cronJobData.interval_seconds;
                if (seconds % 86400 === 0) {
                    $('#edit-interval-value').val(seconds / 86400);
                    $('#edit-interval-unit').val('86400');
                } else if (seconds % 3600 === 0) {
                    $('#edit-interval-value').val(seconds / 3600);
                    $('#edit-interval-unit').val('3600');
                } else if (seconds % 60 === 0) {
                    $('#edit-interval-value').val(seconds / 60);
                    $('#edit-interval-unit').val('60');
                } else {
                    $('#edit-interval-value').val(seconds);
                    $('#edit-interval-unit').val('1');
                }
                updateEditIntervalPreview();
                break;
            case 'daily':
                $('#edit-daily-time').val(cronJobData.time_of_day ? cronJobData.time_of_day.substring(0, 5) : '02:00');
                $('#edit-daily-timezone').val(cronJobData.timezone || 'UTC');
                break;
            case 'weekly':
                $('#edit-weekly-day').val(cronJobData.day_of_week || 1);
                $('#edit-weekly-time').val(cronJobData.time_of_day ? cronJobData.time_of_day.substring(0, 5) : '02:00');
                $('#edit-weekly-timezone').val(cronJobData.timezone || 'UTC');
                break;
            case 'monthly':
                $('#edit-monthly-day').val(cronJobData.day_of_month || 1);
                $('#edit-monthly-time').val(cronJobData.time_of_day ? cronJobData.time_of_day.substring(0, 5) : '02:00');
                $('#edit-monthly-timezone').val(cronJobData.timezone || 'UTC');
                break;
            case 'cron':
                $('#edit-cron-expression').val(cronJobData.cron_expression || '');
                break;
        }

        // Populate settings
        $('#edit-job-timeout').val(cronJobData.timeout_seconds || 300);
        $('#edit-job-enabled').val(cronJobData.enabled);

        // Show modal
        $('#jobSettingsModal').modal('show');
    });

    $('#save-settings').on('click', function() {
        let btn = $(this);
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');

        let scheduleType = $('input[name="edit-schedule-type"]:checked').val();

        // Gather form data
        let updateData = {
            name: $('#edit-job-name').val(),
            description: $('#edit-job-description').val() || null,
            schedule_type: scheduleType,
            timeout_seconds: parseInt($('#edit-job-timeout').val()),
            enabled: parseInt($('#edit-job-enabled').val())
        };

        // Add schedule-specific fields
        switch(scheduleType) {
            case 'interval':
                let intervalValue = parseInt($('#edit-interval-value').val());
                let intervalUnit = parseInt($('#edit-interval-unit').val());
                updateData.interval_seconds = intervalValue * intervalUnit;
                break;
            case 'daily':
                updateData.time_of_day = $('#edit-daily-time').val() + ':00';
                updateData.timezone = $('#edit-daily-timezone').val();
                break;
            case 'weekly':
                updateData.day_of_week = parseInt($('#edit-weekly-day').val());
                updateData.time_of_day = $('#edit-weekly-time').val() + ':00';
                updateData.timezone = $('#edit-weekly-timezone').val();
                break;
            case 'monthly':
                updateData.day_of_month = parseInt($('#edit-monthly-day').val());
                updateData.time_of_day = $('#edit-monthly-time').val() + ':00';
                updateData.timezone = $('#edit-monthly-timezone').val();
                break;
            case 'cron':
                updateData.cron_expression = $('#edit-cron-expression').val();
                break;
        }

        // Update via API
        _ks.put('CronJob', 'id', idx, updateData, null, [], function(r) {
            if (r.data && r.data[0]) {
                cronJobData = r.data[0];
                updateJobStatus();
                updateJobInfo();
                $('#cron-job-name span').text(cronJobData.name);
                $('#schedule-type').text(formatScheduleType(cronJobData.schedule_type));

                // Close modal
                $('#jobSettingsModal').modal('hide');

                // Show success message
                alert('Settings saved successfully!');
            }
            btn.prop('disabled', false).html('<i class="fas fa-save"></i> Save Changes');
        }, function(err) {
            alert('Error saving settings: ' + (err.error || 'Unknown error'));
            btn.prop('disabled', false).html('<i class="fas fa-save"></i> Save Changes');
        });
    });

    $('#view-executions').on('click', function() {
        loadExecutionHistory();
    });

    $('#view-versions').on('click', function() {
        loadVersionHistory();
    });

    // =================================================================
    // EXECUTION HISTORY
    // =================================================================

    function loadExecutionHistory() {
        $('#executionHistoryModal').modal('show');

        // Load execution summary
        if (cronJobData.execution_summary) {
            $('#stat-total').text(cronJobData.execution_summary.total_executions || 0);
            $('#stat-success').text(cronJobData.execution_summary.successful || 0);
            $('#stat-failed').text(cronJobData.execution_summary.failed || 0);
            $('#stat-timeout').text(cronJobData.execution_summary.timeouts || 0);
        }

        // Load execution list
        _ks.get('CronJobExecution', 'cron_job', idx, [], function(r) {
            let tbody = $('#executions-tbody');
            tbody.empty();

            if (!r.data || r.data.length === 0) {
                tbody.append('<tr><td colspan="6" class="text-center">No executions yet</td></tr>');
                return;
            }

            r.data.forEach(function(execution) {
                let statusBadge = getStatusBadge(execution.status);
                // Dates come as formatted strings (m/d/Y H:i:s) from backend
                let scheduledTime = execution.scheduled_time || 'N/A';
                let startedTime = execution.started_at || 'N/A';
                let completedTime = execution.completed_at || 'N/A';
                let duration = execution.duration_ms ? (execution.duration_ms / 1000).toFixed(2) + 's' : 'N/A';

                let row = `<tr>
                    <td>${statusBadge}</td>
                    <td>${scheduledTime}</td>
                    <td>${startedTime}</td>
                    <td>${completedTime}</td>
                    <td>${duration}</td>
                    <td>
                        <button class="btn btn-sm btn-info view-execution-detail" data-id="${execution.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>`;

                tbody.append(row);
            });
        }, function(err) {
            $('#executions-tbody').html('<tr><td colspan="6" class="text-center text-danger">Error loading executions</td></tr>');
        });
    }

    function getStatusBadge(status) {
        let badges = {
            'pending': '<span class="badge bg-secondary">Pending</span>',
            'running': '<span class="badge bg-primary">Running</span>',
            'completed': '<span class="badge bg-success">Completed</span>',
            'failed': '<span class="badge bg-danger">Failed</span>',
            'timeout': '<span class="badge bg-warning">Timeout</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">' + status + '</span>';
    }

    // View execution detail
    $(document).on('click', '.view-execution-detail', function() {
        let executionId = $(this).data('id');

        _ks.get('CronJobExecution', 'id', executionId, [], function(r) {
            if (r.data && r.data[0]) {
                let execution = r.data[0];
                let detailHtml = `
                    <div class="row">
                        <div class="col-md-6">
                            <strong>Status:</strong> ${getStatusBadge(execution.status)}<br>
                            <strong>Scheduled:</strong> ${execution.scheduled_time || 'N/A'}<br>
                            <strong>Started:</strong> ${execution.started_at || 'N/A'}<br>
                            <strong>Completed:</strong> ${execution.completed_at || 'N/A'}<br>
                        </div>
                        <div class="col-md-6">
                            <strong>Duration:</strong> ${execution.duration_ms ? (execution.duration_ms / 1000).toFixed(2) + 's' : 'N/A'}<br>
                            <strong>Retry Attempt:</strong> ${execution.retry_attempt || 0}<br>
                            <strong>Worker ID:</strong> ${execution.worker_id || 'N/A'}<br>
                        </div>
                    </div>
                    <hr>
                    <h6>Output:</h6>
                    <pre style="background: #f8f9fa; padding: 1rem; border-radius: 4px; max-height: 300px; overflow-y: auto;">${execution.output || 'No output'}</pre>
                `;

                if (execution.error) {
                    detailHtml += `
                        <h6 class="text-danger mt-3">Error:</h6>
                        <pre class="text-danger" style="background: #f8d7da; padding: 1rem; border-radius: 4px; max-height: 300px; overflow-y: auto;">${execution.error}</pre>
                    `;
                }

                $('#execution-detail-content').html(detailHtml);
                $('#executionDetailModal').modal('show');
            }
        }, function(err) {
            alert('Error loading execution details');
        });
    });

    // =================================================================
    // VERSION HISTORY
    // =================================================================

    function loadVersionHistory() {
        $('#versionHistoryModal').modal('show');

        // Load version history for all functions
        _ks.get('CronJobFunction', 'cron_job', idx, [], function(r) {
            let tbody = $('#versions-tbody');
            tbody.empty();

            if (!r.data || r.data.length === 0) {
                tbody.append('<tr><td colspan="5" class="text-center">No version history</td></tr>');
                return;
            }

            // For each function, load its versions
            let allVersions = [];
            let completed = 0;

            r.data.forEach(function(func) {
                _ks.get('CronJobFunctionVersion', 'cron_job_function', func.id, [], function(vr) {
                    if (vr.data && vr.data.length > 0) {
                        vr.data.forEach(function(version) {
                            version.function_name = func.name; // Add function name
                            allVersions.push(version);
                        });
                    }

                    completed++;
                    if (completed === r.data.length) {
                        // All versions loaded, sort and display
                        allVersions.sort((a, b) => b.date_created - a.date_created);

                        allVersions.forEach(function(version) {
                            // date_created comes as formatted string from backend
                            let dateCreated = version.date_created || 'N/A';
                            let author = version.created_by_obj ? version.created_by_obj.name : 'System';
                            let currentBadge = version.is_current ? '<span class="badge bg-success">Current</span>' : '';
                            let functionBadge = '<span class="badge bg-info">' + version.function_name + '()</span>';

                            // Extract function ID from FK (could be object or integer)
                            let functionId = typeof version.cron_job_function === 'object' && version.cron_job_function !== null
                                ? version.cron_job_function.id
                                : version.cron_job_function;

                            let row = `<tr>
                                <td>${functionBadge} <strong>v${version.version_number}</strong></td>
                                <td>${dateCreated}</td>
                                <td>${author}</td>
                                <td>${currentBadge}</td>
                                <td>
                                    <button class="btn btn-sm btn-info view-version-code" data-id="${version.id}" data-version="${version.version_number}">
                                        <i class="fas fa-code"></i> View Code
                                    </button>
                                    ${!version.is_current ? `
                                    <button class="btn btn-sm btn-warning rollback-version" data-function-id="${functionId}" data-version="${version.version_number}">
                                        <i class="fas fa-undo"></i> Rollback
                                    </button>
                                    ` : ''}
                                </td>
                            </tr>`;

                            tbody.append(row);
                        });
                    }
                }, function(err) {
                    console.error('Error loading function versions:', err);
                });
            });
        }, function(err) {
            $('#versions-tbody').html('<tr><td colspan="5" class="text-center text-danger">Error loading version history</td></tr>');
        });
    }

    // View version code
    $(document).on('click', '.view-version-code', function() {
        let versionId = $(this).data('id');

        // Get specific version by ID
        _ks.get('CronJobFunctionVersion', 'id', versionId, [], function(response) {
            if (response.data && response.data[0]) {
                let version = response.data[0];
                // Show the decompressed function_body
                if (version.function_body) {
                    showCodeDiff(version.function_body);
                } else {
                    alert('No code found for this version');
                }
            } else {
                alert('Version not found');
            }
        }, function(err) {
            alert('Error loading version code: ' + (err.error || JSON.stringify(err)));
        });
    });

    // Store the diff viewer editor instance
    let diffViewer = null;

    function showCodeDiff(code) {
        $('#codeDiffModal').modal('show');

        // Use Monaco editor for code display
        require(['vs/editor/editor.main'], function() {
            let diffContainer = document.getElementById('code-diff-container');

            // Dispose existing viewer if it exists to avoid duplicates
            if (diffViewer) {
                diffViewer.dispose();
                diffViewer = null;
            }

            diffContainer.innerHTML = '';

            diffViewer = monaco.editor.create(diffContainer, {
                value: code,
                language: 'php',
                theme: 'vs-dark',
                readOnly: true,
                automaticLayout: true,
                minimap: { enabled: false }
            });
        });
    }

    // Clean up viewer when modal is closed
    $('#codeDiffModal').on('hidden.bs.modal', function() {
        if (diffViewer) {
            diffViewer.dispose();
            diffViewer = null;
        }
    });

    // Rollback to version
    $(document).on('click', '.rollback-version', function() {
        let functionId = $(this).data('function-id');
        let versionNumber = $(this).data('version');

        if (!confirm(`Are you sure you want to rollback to version ${versionNumber}? This will update the code and create a new version.`)) {
            return;
        }

        // Use Kyte SDK's put() method - pass version in data
        // PUT /CronJobFunction/rollback/{functionId} with data: {version: X}
        _ks.put('CronJobFunction', 'rollback', functionId, {version: versionNumber}, null, [], function(response) {
            if (response && response.data && response.data[0]) {
                let result = response.data[0];
                let functionName = result.function_name;
                let newCode = result.function_body;

                alert(`Successfully rolled back ${functionName}() to version ${versionNumber}!\nNew version: ${result.new_version_number}`);

                // Update the Monaco editor with the rolled back code
                if (editors[functionName] && newCode) {
                    editors[functionName].setValue(newCode);
                    originalCode[functionName] = newCode; // Update original so it's not marked as changed
                    hasUnsavedChanges[functionName] = false;
                    updateSaveButtonState();
                }

                $('#versionHistoryModal').modal('hide');
                loadCronJob(); // Reload to update stats and version history
            } else {
                alert('Rollback succeeded but response format unexpected');
                $('#versionHistoryModal').modal('hide');
                loadCronJob();
            }
        }, function(error) {
            alert('Error: ' + (error.error || 'Failed to rollback'));
        });
    });

    // Warn about unsaved changes
    window.addEventListener('beforeunload', function(e) {
        let anyUnsaved = hasUnsavedChanges.execute || hasUnsavedChanges.setUp || hasUnsavedChanges.tearDown;
        if (anyUnsaved) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
});
