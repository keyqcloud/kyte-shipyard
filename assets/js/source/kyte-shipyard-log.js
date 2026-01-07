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

        // Add custom AI Analysis button using KyteTable's customActionButton
        window.tblErrorLog.customActionButton = [{
            'className': 'btn-ai-analysis',
            'label': 'AI Check',
            'faicon': 'fas fa-robot',
            'callback': function(data, model, row) {
                const errorId = data.id;

                // Check for AI analysis
                _ks.get('AIErrorAnalysis', 'error_id', errorId, [], function(response) {
                    // Handle both array and object responses
                    let analysisData = response.data;
                    let analysis = null;

                    if (Array.isArray(analysisData) && analysisData.length > 0) {
                        analysis = analysisData[0];
                    } else if (analysisData && typeof analysisData === 'object' && Object.keys(analysisData).length > 0) {
                        // Filter out non-analysis objects (like status_badge) by checking for id field
                        const analyses = Object.values(analysisData).filter(item => item && typeof item === 'object' && item.id);
                        if (analyses.length > 0) {
                            analysis = analyses[0];
                        }
                    }

                    if (analysis) {
                        showAIAnalysisModal(analysis);
                    } else {
                        _ks.alert('No Analysis', 'This error has not been analyzed yet by the AI Error Correction system.');
                    }
                }, function(error) {
                    _ks.alert('Error', 'Failed to check AI analysis: ' + error);
                });
            }
        }];

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

    // Note: AI Analysis button click handler is now managed by KyteTable's customActionButton

    // Function to update AI button based on analysis status
    function updateAIButton(btn, analysis) {
        const status = analysis.analysis_status;
        const fixStatus = analysis.fix_status;

        let icon = 'fa-robot';
        let text = 'View';
        let btnClass = 'btn-secondary';

        if (status === 'completed') {
            if (analysis.is_fixable == 1) {
                if (fixStatus === 'applied_auto' || fixStatus === 'applied_manual') {
                    icon = 'fa-check-circle';
                    text = 'Fixed';
                    btnClass = 'btn-success';
                } else if (fixStatus === 'suggested') {
                    icon = 'fa-lightbulb';
                    text = 'Suggestion';
                    btnClass = 'btn-warning';
                } else if (fixStatus === 'rejected') {
                    icon = 'fa-ban';
                    text = 'Rejected';
                    btnClass = 'btn-dark';
                }
            } else {
                icon = 'fa-info-circle';
                text = 'Not Fixable';
                btnClass = 'btn-secondary';
            }
        } else if (status === 'processing') {
            icon = 'fa-spinner fa-spin';
            text = 'Processing';
            btnClass = 'btn-info';
        } else if (status === 'failed') {
            icon = 'fa-exclamation-triangle';
            text = 'Failed';
            btnClass = 'btn-danger';
        }

        btn.removeClass('btn-secondary btn-primary btn-success btn-warning btn-danger btn-info btn-dark');
        btn.addClass(btnClass);
        btn.find('i').attr('class', 'fas ' + icon);
        btn.find('.ai-status-text').text(text);
    }

    // Function to show AI analysis modal (using Bootstrap modal)
    function showAIAnalysisModal(analysis) {
        // Extract error details from FK object
        const error = analysis.error_id || {};
        const errorType = error.log_level || 'N/A';
        const errorMessage = error.message || 'N/A';
        const errorFile = error.file || 'N/A';
        const errorLine = error.line || '?';

        // Build modal body content sections
        let modalBodyContent = `
            <div class="analysis-section">
                <h6><i class="fas fa-bug"></i> Error Details</h6>
                <p><strong>Type:</strong> ${errorType}</p>
                <p><strong>Message:</strong> ${errorMessage}</p>
                <p><strong>File:</strong> ${errorFile}:${errorLine}</p>
            </div>
        `;

        if (analysis.analysis_status === 'completed') {
            modalBodyContent += `
                <div class="analysis-section">
                    <h6><i class="fas fa-brain"></i> AI Analysis</h6>
                    <p><strong>Root Cause:</strong></p>
                    <div class="analysis-text">${escapeHtml(analysis.ai_diagnosis || 'N/A')}</div>
                </div>
            `;

            if (analysis.is_fixable == 1) {
                modalBodyContent += `
                    <div class="analysis-section">
                        <h6><i class="fas fa-wrench"></i> Suggested Fix</h6>
                        <p><strong>Confidence:</strong> ${analysis.fix_confidence || 0}%</p>
                        <div class="analysis-text">${escapeHtml(analysis.fix_rationale || 'N/A')}</div>

                        <p class="mt-3"><strong>Proposed Code:</strong></p>
                        <pre class="code-block"><code>${escapeHtml(analysis.ai_suggested_fix || 'N/A')}</code></pre>
                    </div>
                `;

                if (analysis.fix_status === 'failed_validation') {
                    // Show validation error and allow manual override
                    modalBodyContent += `
                        <div class="analysis-section" style="background: #fef3c7; padding: 1em; border-radius: 4px; margin-top: 1em;">
                            <h6><i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i> Validation Failed</h6>
                            <p style="margin: 0.5em 0;"><strong>Syntax Error:</strong></p>
                            <pre style="background: white; padding: 0.5em; border-radius: 4px; font-size: 0.85em;">${escapeHtml(analysis.syntax_error || 'Unknown syntax error')}</pre>
                            <p style="color: #92400e; font-size: 0.9em; margin-top: 0.5em;">⚠️ This fix contains syntax errors and may break your application if applied.</p>
                        </div>
                    `;
                }
            } else {
                modalBodyContent += `
                    <div class="analysis-section">
                        <h6><i class="fas fa-info-circle"></i> Not Automatically Fixable</h6>
                        <p>${escapeHtml(analysis.fix_rationale || 'This error requires manual intervention.')}</p>
                    </div>
                `;
            }
        } else if (analysis.analysis_status === 'failed') {
            modalBodyContent += `
                <div class="analysis-section">
                    <h6><i class="fas fa-exclamation-triangle"></i> Analysis Failed</h6>
                    <p>${escapeHtml(analysis.error_analysis || 'Unknown error')}</p>
                </div>
            `;
        }

        // Build footer buttons based on status
        let footerButtons = '';
        if (analysis.analysis_status === 'completed' && analysis.is_fixable == 1 && (analysis.fix_status === 'suggested' || analysis.fix_status === 'failed_validation')) {
            const applyButtonClass = analysis.fix_status === 'failed_validation' ? 'btn-warning' : 'btn-success';
            const applyButtonText = analysis.fix_status === 'failed_validation'
                ? '<i class="fas fa-exclamation-triangle"></i> Apply Anyway (Override)'
                : '<i class="fas fa-check"></i> Apply Fix';

            footerButtons = `
                <button type="button" class="btn ${applyButtonClass} btn-apply-fix" data-analysis-id="${analysis.id}">
                    ${applyButtonText}
                </button>
                <button type="button" class="btn btn-danger btn-reject-fix" data-analysis-id="${analysis.id}">
                    <i class="fas fa-times"></i> Reject
                </button>
            `;
        }

        // Build complete Bootstrap modal HTML
        let modalContent = `
            <div class="modal fade" id="aiAnalysisModal" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">AI Error Analysis</h5>
                            <span class="badge ${getStatusBadgeClass(analysis)} ml-2">${getStatusText(analysis)}</span>
                            <button type="button" class="close" aria-label="Close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${modalBodyContent}
                        </div>
                        <div class="modal-footer">
                            ${footerButtons}
                            <button type="button" class="btn btn-secondary btn-close-modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        $('#aiAnalysisModal').remove();

        // Add modal to body and show it
        $('body').append(modalContent);
        $('#aiAnalysisModal').modal('show');

        // Attach close button handlers
        $('#aiAnalysisModal .close, #aiAnalysisModal .btn-close-modal').off('click').on('click', function() {
            $('#aiAnalysisModal').modal('hide');
        });

        // Attach event listeners to action buttons
        $('.btn-apply-fix').off('click').on('click', function() {
            const analysisId = $(this).data('analysis-id');
            applyFix(analysisId);
        });

        $('.btn-reject-fix').off('click').on('click', function() {
            const analysisId = $(this).data('analysis-id');
            rejectFix(analysisId);
        });
    }

    // Apply fix action
    function applyFix(analysisId) {
        if (!confirm('Are you sure you want to apply this AI-suggested fix to your code?')) {
            return;
        }

        // Close the analysis modal
        $('#aiAnalysisModal').modal('hide');
        $('#pageLoaderModal').modal('show');

        _ks.put('AIErrorAnalysis', 'applyFix', analysisId, {}, null, [],
            function(response) {
                $('#pageLoaderModal').modal('hide');

                // Reload the table to show updated status
                if (window.tblErrorLog) {
                    window.tblErrorLog.reload();
                }

                alert('Fix has been applied successfully. The code has been updated.');
            },
            function(error) {
                $('#pageLoaderModal').modal('hide');
                alert('Failed to apply fix: ' + (error.message || error));
            }
        );
    }

    // Reject fix action
    function rejectFix(analysisId) {
        if (!confirm('Are you sure you want to reject this suggestion? This cannot be undone.')) {
            return;
        }

        // Close the analysis modal
        $('#aiAnalysisModal').modal('hide');
        $('#pageLoaderModal').modal('show');

        _ks.put('AIErrorAnalysis', 'rejectFix', analysisId, {}, null, [],
            function(response) {
                $('#pageLoaderModal').modal('hide');

                // Reload the table to show updated status
                if (window.tblErrorLog) {
                    window.tblErrorLog.reload();
                }

                alert('Fix has been rejected.');
            },
            function(error) {
                $('#pageLoaderModal').modal('hide');
                alert('Failed to reject fix: ' + (error.message || error));
            }
        );
    }

    // Helper functions
    function getStatusBadgeClass(analysis) {
        const status = analysis.analysis_status;
        if (status === 'completed') return 'bg-success';
        if (status === 'processing') return 'bg-info';
        if (status === 'failed') return 'bg-danger';
        return 'bg-secondary';
    }

    function getStatusText(analysis) {
        const status = analysis.analysis_status;
        if (status === 'completed') {
            if (analysis.fix_status === 'applied_auto' || analysis.fix_status === 'applied_manual') {
                return 'Fix Applied';
            }
            return 'Completed';
        }
        if (status === 'processing') return 'Processing';
        if (status === 'failed') return 'Failed';
        return 'Queued';
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

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
