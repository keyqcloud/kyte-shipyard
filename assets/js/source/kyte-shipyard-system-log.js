document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    if (!_ks.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // Wait for i18n to be ready before creating tables with translations
    document.addEventListener('KyteI18nReady', function() {
        // Translation helper
        const t = (key, fallback) => {
            if (window.kyteI18n) {
                let text = window.kyteI18n.t(key);
                return text === key ? fallback : text;
            }
            return fallback;
        };

        // Initialize date pickers
        $("#filter-start-date").datepicker({
            dateFormat: 'mm/dd/yy',
            maxDate: 0, // Today
            onSelect: function(dateText) {
                // Set end date min date to selected start date
                let selectedDate = $(this).datepicker('getDate');
                $("#filter-end-date").datepicker('option', 'minDate', selectedDate);
            }
        });

        $("#filter-end-date").datepicker({
            dateFormat: 'mm/dd/yy',
            maxDate: 0 // Today
        });

        // Enhanced column definitions for system logs
        let colDef = [
        {
            'targets': 0,
            'data': 'log_level',
            'label': t('ui.system_log.table.level', 'Level'),
            render: function(data, type, row, meta) {
                const levelClass = data || 'error';
                const levelText = (data || 'error').toUpperCase();
                return `<span class="log-badge ${levelClass}">${levelText}</span>`;
            }
        },
        {
            'targets': 1,
            'data': 'date_created',
            'label': t('ui.system_log.table.date', 'Date'),
            render: function(data, type, row, meta) {
                return `<span style="color:#4a5568;">${data || '-'}</span>`;
            }
        },
        {
            'targets': 2,
            'data': 'kyte_account',
            'label': t('ui.system_log.table.account', 'Account'),
            render: function(data, type, row, meta) {
                if (data) {
                    return `<span class="account-badge">ACC-${data}</span>`;
                }
                return '<span style="color:#cbd5e0;">N/A</span>';
            }
        },
        {
            'targets': 3,
            'data': 'source',
            'label': t('ui.system_log.table.source', 'Source'),
            render: function(data, type, row, meta) {
                if (!data) return '<span style="color:#cbd5e0;">unknown</span>';

                const sourceColor = {
                    'error_handler': '#3b82f6',
                    'exception_handler': '#ef4444',
                    'logger': '#10b981',
                    'output_buffer': '#f59e0b'
                };
                const color = sourceColor[data] || '#6b7280';
                const label = data.replace('_', ' ').toUpperCase();

                return `<span style="display:inline-block;padding:4px 10px;background:${color};color:white;border-radius:6px;font-size:0.75rem;font-weight:600;">${label}</span>`;
            }
        },
        {
            'targets': 4,
            'data': 'message',
            'label': t('ui.system_log.table.message', 'Message'),
            render: function(data, type, row, meta) {
                let output = '';

                // File and line info
                if (row.file || row.line) {
                    const file = row.file || 'unknown';
                    const line = row.line || '?';
                    output += `<span style="font-style: italic;display:block;font-size:0.85em;color:#718096;">${file}:${line}</span>`;
                }

                // Message
                if (data && data.length > 0) {
                    // Truncate long messages
                    const maxLength = 150;
                    const message = data.length > maxLength ? data.substring(0, maxLength) + '...' : data;
                    output += `<span style="display:block;margin-top:4px;">${message}</span>`;
                } else {
                    output += `<span style="display:block;margin-top:4px;color:#cbd5e0;">No message</span>`;
                }

                // Show request ID if available
                if (row.request_id) {
                    output += `<span style="display:block;margin-top:4px;font-size:0.75em;color:#718096;font-family:monospace;">Request: ${row.request_id}</span>`;
                }

                return output;
            }
        }
    ];

    // Function to build filter conditions
    function buildFilterConditions() {
        let conditions = [];

        // Log level filter
        const selectedLevels = $("#filter-log-level").val();
        if (selectedLevels && selectedLevels.length > 0) {
            if (selectedLevels.length === 1) {
                conditions.push({
                    field: 'log_level',
                    value: selectedLevels[0]
                });
            } else {
                conditions.push({
                    field: 'log_level',
                    value: selectedLevels.join(',')
                });
            }
        }

        // Source filter
        const selectedSource = $("#filter-source").val();
        if (selectedSource && selectedSource.length > 0) {
            conditions.push({
                field: 'source',
                value: selectedSource
            });
        }

        // Date range filters
        const startDate = $("#filter-start-date").val();
        if (startDate) {
            const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
            conditions.push({
                field: 'start_date',
                value: startTimestamp
            });
        }

        const endDate = $("#filter-end-date").val();
        if (endDate) {
            // Set to end of day (23:59:59)
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999);
            const endTimestamp = Math.floor(endDateObj.getTime() / 1000);
            conditions.push({
                field: 'end_date',
                value: endTimestamp
            });
        }

        // System type (required for system logs)
        conditions.push({
            field: 'log_type',
            value: 'system'
        });

        return conditions;
    }

    // Function to initialize/refresh table with filters
    function initTable(conditions = []) {
        // Destroy existing table if it exists
        if (window.tblSystemLog && window.tblSystemLog.destroy) {
            window.tblSystemLog.destroy();
        }

        // Build query object
        // For system logs, we don't filter by app_idx, instead we query all system logs for the account
        let queryObj = {
            'name': 'KyteError',
            'field': null,
            'value': null
        };

        // Add filter conditions as additional query params
        if (conditions.length > 0) {
            conditions.forEach(condition => {
                queryObj[condition.field] = condition.value;
            });
        }

        // Create new table
        window.tblSystemLog = new KyteTable(
            _ks,
            $("#system-log-table"),
            queryObj,
            colDef,
            true,
            [1, "desc"],
            false,
            false,
            'id',
            '/app/log/'
        );

        window.tblSystemLog.targetBlank = true;
        window.tblSystemLog.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        };

        window.tblSystemLog.init();
    }

    // Apply filter button
    $("#btn-apply-filter").on('click', function() {
        $('#pageLoaderModal').modal('show');
        const conditions = buildFilterConditions();
        initTable(conditions);
    });

    // Clear filter button
    $("#btn-clear-filter").on('click', function() {
        // Reset form
        $("#filter-log-level").val(['error', 'critical']);
        $("#filter-source").val('');
        $("#filter-start-date").val('');
        $("#filter-end-date").val('');

        // Reset date picker constraints
        $("#filter-end-date").datepicker('option', 'minDate', null);

        // Reload table with default filters
        $('#pageLoaderModal').modal('show');
        const conditions = buildFilterConditions();
        initTable(conditions);
    });

        // Initial table load with default filters (error and critical levels)
        const initialConditions = buildFilterConditions();
        initTable(initialConditions);
    }); // End KyteI18nReady listener
});
