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

        // Setup filter event handlers
        setupActivityLogFilters(function() {
            const conditions = buildActivityLogFilterConditions();
            initTable(conditions);
        });

        // Column definitions for system activity log table
        let colDef = [
            {
                'targets': 0,
                'data': 'date_created',
                'label': t('ui.system_activity_log.table.timestamp', 'Timestamp'),
                render: function(data, type, row, meta) {
                    return `<span style="color:#4a5568;font-size:0.9em;">${data || '-'}</span>`;
                }
            },
            {
                'targets': 1,
                'data': 'user_email',
                'label': t('ui.system_activity_log.table.user', 'User'),
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
                'label': t('ui.system_activity_log.table.action', 'Action'),
                render: function(data, type, row, meta) {
                    return renderActionBadge(data);
                }
            },
            {
                'targets': 3,
                'data': 'model_name',
                'label': t('ui.system_activity_log.table.model', 'Model'),
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
                'data': 'application_name',
                'label': t('ui.system_activity_log.table.application', 'Application'),
                render: function(data, type, row, meta) {
                    if (data) {
                        return `<span style="display:inline-block;padding:4px 10px;background:#e2e8f0;color:#2d3748;border-radius:6px;font-size:0.75rem;font-weight:600;">${data}</span>`;
                    }
                    return '<span style="color:#cbd5e0;">Framework</span>';
                }
            },
            {
                'targets': 5,
                'data': 'response_code',
                'label': t('ui.system_activity_log.table.status', 'Status'),
                render: function(data, type, row, meta) {
                    return renderResponseCodeBadge(data);
                }
            },
            {
                'targets': 6,
                'data': 'severity',
                'label': t('ui.system_activity_log.table.severity', 'Severity'),
                render: function(data, type, row, meta) {
                    return renderSeverityBadge(data);
                }
            },
            {
                'targets': 7,
                'data': 'ip_address',
                'label': t('ui.system_activity_log.table.ip', 'IP'),
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
            if (window.tblSystemActivityLog && window.tblSystemActivityLog.destroy) {
                window.tblSystemActivityLog.destroy();
            }

            // Build query object - no app filter for system-level view
            let queryObj = {
                'name': 'KyteActivityLog',
                'field': null,
                'value': null
            };

            // Add filter conditions as additional query params
            if (conditions.length > 0) {
                conditions.forEach(function(condition) {
                    queryObj[condition.field] = condition.value;
                });
            }

            // Create new table
            window.tblSystemActivityLog = new KyteTable(
                _ks,
                $("#system-activity-log-table"),
                queryObj,
                colDef,
                true,
                [0, "desc"],
                false,
                false,
                'id',
                '/app/activity-log/'
            );

            window.tblSystemActivityLog.targetBlank = true;
            window.tblSystemActivityLog.initComplete = function() {
                $('#pageLoaderModal').modal('hide');
            };

            window.tblSystemActivityLog.init();
        }

        // Initial table load
        initTable(buildActivityLogFilterConditions());
    }); // End KyteI18nReady listener
});
