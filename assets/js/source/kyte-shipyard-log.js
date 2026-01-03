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

    // Enhanced column definitions with log_level badge
    let colDef = [
        {
            'targets': 0,
            'data': 'log_level',
            'label': 'Level',
            render: function(data, type, row, meta) {
                const levelClass = data || 'error';
                const levelText = (data || 'error').toUpperCase();
                return `<span class="log-badge ${levelClass}">${levelText}</span>`;
            }
        },
        {
            'targets': 1,
            'data': 'date_created',
            'label': 'Date',
            render: function(data, type, row, meta) {
                return `<span style="color:#4a5568;">${data || '-'}</span>`;
            }
        },
        {
            'targets': 2,
            'data': 'request',
            'label': 'Request',
            render: function(data, type, row, meta) {
                let output = `<span style="display:block">${data || '-'}</span>`;

                if (row.contentType && row.contentType.length > 0) {
                    output += `<span style="display:block;font-size:0.85em;color:#718096;">${row.contentType}</span>`;
                }

                let pathParts = [];
                if (row.model && row.model.length > 0) pathParts.push(row.model);
                if (row.field && row.field.length > 0) pathParts.push(row.field);
                if (row.value && row.value.length > 0) pathParts.push(row.value);

                if (pathParts.length > 0) {
                    output += `<span style="font-style:italic;display:block;font-size:0.85em;color:#4a5568;">/${pathParts.join('/')}</span>`;
                }

                return output;
            }
        },
        {
            'targets': 3,
            'data': 'message',
            'label': 'Details',
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
                    const maxLength = 200;
                    const message = data.length > maxLength ? data.substring(0, maxLength) + '...' : data;
                    output += `<span style="display:block;margin-top:4px;">${message}</span>`;
                } else {
                    output += `<span style="display:block;margin-top:4px;color:#cbd5e0;">No message</span>`;
                }

                // Show source badge if available
                if (row.source) {
                    const sourceColor = {
                        'error_handler': '#3b82f6',
                        'exception_handler': '#ef4444',
                        'logger': '#10b981',
                        'output_buffer': '#f59e0b'
                    };
                    const color = sourceColor[row.source] || '#6b7280';
                    output += `<span style="display:inline-block;margin-top:4px;padding:2px 8px;background:${color};color:white;border-radius:4px;font-size:0.75em;">${row.source}</span>`;
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

        // Application type (default)
        conditions.push({
            field: 'log_type',
            value: 'application'
        });

        return conditions;
    }

    // Function to initialize/refresh table with filters
    function initTable(conditions = []) {
        // Destroy existing table if it exists
        if (window.tblErrorLog && window.tblErrorLog.destroy) {
            window.tblErrorLog.destroy();
        }

        // Build query object
        let queryObj = {
            'name': 'KyteError',
            'field': 'app_idx',
            'value': idx
        };

        // Add filter conditions as additional query params
        if (conditions.length > 0) {
            conditions.forEach(condition => {
                queryObj[condition.field] = condition.value;
            });
        }

        // Create new table
        window.tblErrorLog = new KyteTable(
            _ks,
            $("#log-table"),
            queryObj,
            colDef,
            true,
            [1, "desc"],
            false,
            false,
            'id',
            '/app/log/'
        );

        window.tblErrorLog.targetBlank = true;
        window.tblErrorLog.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        };

        window.tblErrorLog.init();
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
});
