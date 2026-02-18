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

    // Setup filter event handlers
    setupActivityLogFilters(function() {
        const conditions = buildActivityLogFilterConditions();
        initTable(conditions);
    });

    // Column definitions for activity log table
    let colDef = [
        {
            'targets': 0,
            'data': 'date_created',
            'label': 'Timestamp',
            render: function(data, type, row, meta) {
                return `<span style="color:#4a5568;font-size:0.9em;">${data || '-'}</span>`;
            }
        },
        {
            'targets': 1,
            'data': 'user_email',
            'label': 'User',
            render: function(data, type, row, meta) {
                if (data) {
                    let output = `<span style="display:block;font-weight:600;color:#2d3748;">${data}</span>`;
                    if (row.user_name) {
                        output += `<span style="display:block;font-size:0.85em;color:#718096;">${row.user_name}</span>`;
                    }
                    return output;
                }
                return '<span style="color:#cbd5e0;">System</span>';
            }
        },
        {
            'targets': 2,
            'data': 'action',
            'label': 'Action',
            render: function(data, type, row, meta) {
                return renderActionBadge(data);
            }
        },
        {
            'targets': 3,
            'data': 'model_name',
            'label': 'Model',
            render: function(data, type, row, meta) {
                let output = `<span style="font-weight:600;color:#2d3748;">${data || '-'}</span>`;
                if (row.record_id) {
                    output += `<span style="display:block;font-size:0.85em;color:#718096;">ID: ${row.record_id}</span>`;
                }
                return output;
            }
        },
        {
            'targets': 4,
            'data': 'response_code',
            'label': 'Status',
            render: function(data, type, row, meta) {
                return renderResponseCodeBadge(data);
            }
        },
        {
            'targets': 5,
            'data': 'severity',
            'label': 'Severity',
            render: function(data, type, row, meta) {
                return renderSeverityBadge(data);
            }
        },
        {
            'targets': 6,
            'data': 'ip_address',
            'label': 'IP',
            render: function(data, type, row, meta) {
                if (data) {
                    return `<span style="font-family:monospace;font-size:0.85em;color:#4a5568;">${data}</span>`;
                }
                return '<span style="color:#cbd5e0;">N/A</span>';
            }
        }
    ];

    // Function to initialize/refresh table with filters
    function initTable(conditions) {
        conditions = conditions || [];

        // Destroy existing table if it exists
        if (window.tblActivityLog && window.tblActivityLog.destroy) {
            window.tblActivityLog.destroy();
        }

        // Build query object
        let queryObj = {
            'name': 'KyteActivityLog',
            'field': 'application_id',
            'value': idx
        };

        // Add filter conditions as additional query params
        if (conditions.length > 0) {
            conditions.forEach(function(condition) {
                queryObj[condition.field] = condition.value;
            });
        }

        // Create new table
        window.tblActivityLog = new KyteTable(
            _ks,
            $("#activity-log-table"),
            queryObj,
            colDef,
            true,
            [0, "desc"],
            false,
            false,
            'id',
            '/app/activity-log/'
        );

        window.tblActivityLog.targetBlank = true;
        window.tblActivityLog.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        };

        window.tblActivityLog.init();
    }

    // Initial table load
    initTable(buildActivityLogFilterConditions());
});
