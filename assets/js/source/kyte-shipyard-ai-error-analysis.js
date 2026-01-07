/**
 * Kyte Shipyard - AI Error Analysis Dashboard
 * Handles the AI Error Assistant dashboard page functionality
 */

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    // Only run on AI Error Assistant page
    if (!window.location.pathname.includes('/app/ai-error-assistant.html')) {
        return;
    }

    // Check if user has session
    if (!_ks.isSession()) {
        location.href = "/?redir=" + encodeURIComponent(window.location);
        return;
    }

    // Initialize application sidebar navigation
    if (typeof initAppSidebar === 'function') {
        initAppSidebar();
    }

    // Get application ID from URL
    let idx = _ks.getPageRequest();
    if (!idx || !idx.idx) {
        console.error('No application ID provided');
        return;
    }

    const applicationId = idx.idx;
    let trendsChart = null;

    // Translation helper function
    const t = (key) => {
        return window.kyteI18n ? window.kyteI18n.t(key) : key;
    };

    // Wait for i18n to be ready before initializing
    const initializePage = () => {
        loadStatistics();
        loadRecentAnalyses();
        loadTrends();
    };

    // Check if i18n is already ready, or wait for the event
    if (window.kyteI18n && window.kyteI18n.isReady) {
        initializePage();
    } else {
        document.addEventListener('KyteI18nReady', initializePage);
    }

    /**
     * Load statistics for the dashboard
     */
    function loadStatistics() {
        _ks.get('AIErrorAnalysis', 'application', applicationId, [], function(response) {
            if (response.success || response.data) {
                // Convert object to array if needed (API returns {"0": {...}, "1": {...}})
                let analyses = [];
                if (Array.isArray(response.data)) {
                    analyses = response.data;
                } else if (response.data && typeof response.data === 'object') {
                    // Filter out non-analysis objects (like status_badge) by checking for id field
                    analyses = Object.values(response.data).filter(item => item && typeof item === 'object' && item.id);
                }

                // Calculate statistics
                const stats = {
                    total: analyses.length,
                    completed: analyses.filter(a => a.analysis_status === 'completed').length,
                    queued: analyses.filter(a => a.analysis_status === 'queued').length,
                    processing: analyses.filter(a => a.analysis_status === 'processing').length,
                    fixesAppliedAuto: analyses.filter(a => a.fix_status === 'applied_auto').length,
                    fixesAppliedManual: analyses.filter(a => a.fix_status === 'applied_manual').length,
                    fixesSuggested: analyses.filter(a => a.fix_status === 'suggested').length,
                    fixable: analyses.filter(a => a.is_fixable == 1).length,
                    totalCost: analyses.reduce((sum, a) => sum + (parseFloat(a.estimated_cost_usd) || 0), 0)
                };

                // Calculate success rate (completed / total)
                stats.successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

                // Calculate average confidence
                const completedWithConfidence = analyses.filter(a => a.analysis_status === 'completed' && a.fix_confidence);
                stats.avgConfidence = completedWithConfidence.length > 0
                    ? Math.round(completedWithConfidence.reduce((sum, a) => sum + parseFloat(a.fix_confidence), 0) / completedWithConfidence.length)
                    : 0;

                // Calculate fixable rate
                stats.fixableRate = stats.completed > 0 ? Math.round((stats.fixable / stats.completed) * 100) : 0;

                // Calculate monthly and weekly costs
                const now = Date.now() / 1000;
                const weekAgo = now - (7 * 24 * 60 * 60);
                const monthAgo = now - (30 * 24 * 60 * 60);

                stats.costWeek = analyses
                    .filter(a => (a.date_created_raw || a.date_created) >= weekAgo)
                    .reduce((sum, a) => sum + (parseFloat(a.estimated_cost_usd) || 0), 0);

                stats.costMonth = analyses
                    .filter(a => (a.date_created_raw || a.date_created) >= monthAgo)
                    .reduce((sum, a) => sum + (parseFloat(a.estimated_cost_usd) || 0), 0);

                // Update UI
                updateStatistics(stats);

                // Remove loading state
                $('.stat-card').removeClass('loading');
            }
        }, function(error) {
            console.error('Error loading statistics:', error);
            $('.stat-card').removeClass('loading');
        });
    }

    /**
     * Update statistics in the UI
     */
    function updateStatistics(stats) {
        $('#stat-total-analyses').text(stats.total);
        $('#stat-completed').text(stats.completed);
        $('#stat-queued').text(stats.queued);
        $('#stat-processing').text(stats.processing);

        $('#stat-fixes-applied').text(stats.fixesAppliedAuto + stats.fixesAppliedManual);
        $('#stat-fixes-auto').text(stats.fixesAppliedAuto);
        $('#stat-fixes-manual').text(stats.fixesAppliedManual);
        $('#stat-fixes-suggested').text(stats.fixesSuggested);

        $('#stat-success-rate').text(stats.successRate);
        $('#stat-avg-confidence').text(stats.avgConfidence);
        $('#stat-fixable-rate').text(stats.fixableRate);

        $('#stat-total-cost').text(stats.totalCost.toFixed(2));
        $('#stat-cost-month').text(stats.costMonth.toFixed(2));
        $('#stat-cost-week').text(stats.costWeek.toFixed(2));
    }

    /**
     * Load recent analyses list
     */
    function loadRecentAnalyses() {
        // Build query conditions based on filters
        const conditions = buildFilterConditions();

        // Get analyses with conditions
        _ks.get('AIErrorAnalysis', 'application', applicationId, [], function(response) {
            if (response.success || response.data) {
                // Convert object to array if needed (API returns {"0": {...}, "1": {...}})
                let analyses = [];
                if (Array.isArray(response.data)) {
                    analyses = response.data;
                } else if (response.data && typeof response.data === 'object') {
                    // Filter out non-analysis objects (like status_badge) by checking for id field
                    analyses = Object.values(response.data).filter(item => item && typeof item === 'object' && item.id);
                }

                // Apply filters
                analyses = applyFilters(analyses);

                // Sort by date (most recent first)
                analyses.sort((a, b) => b.date_created - a.date_created);

                // Take only the most recent 20
                analyses = analyses.slice(0, 20);

                // Render list
                renderAnalysesList(analyses);
            }
        }, function(error) {
            console.error('Error loading analyses:', error);
            $('#recent-analyses-list').html(`
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="empty-state-title">Error Loading Analyses</div>
                    <div class="empty-state-text">${error}</div>
                </div>
            `);
        });
    }

    /**
     * Build filter conditions from UI
     */
    function buildFilterConditions() {
        return {
            status: $('#filter-status').val(),
            fixable: $('#filter-fixable').val(),
            fixStatus: $('#filter-fix-status').val()
        };
    }

    /**
     * Apply filters to analyses array
     */
    function applyFilters(analyses) {
        const filters = buildFilterConditions();

        return analyses.filter(analysis => {
            // Status filter
            if (filters.status !== 'all' && analysis.analysis_status !== filters.status) {
                return false;
            }

            // Fixable filter
            if (filters.fixable !== 'all') {
                const isFixable = analysis.is_fixable == 1;
                if ((filters.fixable === 'yes' && !isFixable) || (filters.fixable === 'no' && isFixable)) {
                    return false;
                }
            }

            // Fix status filter
            if (filters.fixStatus !== 'all' && analysis.fix_status !== filters.fixStatus) {
                return false;
            }

            return true;
        });
    }

    /**
     * Render analyses list
     */
    function renderAnalysesList(analyses) {
        if (analyses.length === 0) {
            $('#recent-analyses-list').html(`
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <div class="empty-state-title">${t('ui.ai_assistant.filters.no_match')}</div>
                    <div class="empty-state-text">${t('ui.ai_assistant.filters.adjust')}</div>
                </div>
            `);
            return;
        }

        let html = '';
        analyses.forEach(analysis => {
            // Extract error details from FK object
            const error = analysis.error_id || {};
            const errorType = error.log_level || 'Error';
            const errorMessage = error.message || 'Unknown error';
            const errorFile = error.file || 'Unknown file';
            const errorLine = error.line || '?';

            const statusIcon = getStatusIcon(analysis.analysis_status);
            const statusClass = analysis.analysis_status;
            const confidenceClass = getConfidenceClass(analysis.fix_confidence);
            const confidenceText = analysis.fix_confidence ? `${analysis.fix_confidence}%` : 'N/A';

            // Use raw Unix timestamp for reliable timezone-independent calculation
            const timeAgo = formatTimeAgo(analysis.date_created_raw || analysis.date_created);

            html += `
                <div class="analysis-item" data-analysis-id="${analysis.id}">
                    <div class="analysis-status ${statusClass}">
                        ${statusIcon}
                    </div>
                    <div class="analysis-info">
                        <div class="analysis-error">${escapeHtml(errorType)}: ${escapeHtml(truncate(errorMessage, 80))}</div>
                        <div class="analysis-meta">
                            ${escapeHtml(errorFile)}:${errorLine}
                            ${analysis.is_fixable == 1 ? '• <i class="fas fa-wrench"></i> Fixable' : ''}
                            ${analysis.fix_status ? '• ' + getFixStatusBadge(analysis.fix_status) : ''}
                        </div>
                    </div>
                    <div class="analysis-confidence ${confidenceClass}">
                        ${confidenceText}
                    </div>
                    <div class="analysis-time">
                        ${timeAgo}
                    </div>
                </div>
            `;
        });

        $('#recent-analyses-list').html(html);
    }

    /**
     * Get status icon based on analysis status
     */
    function getStatusIcon(status) {
        switch(status) {
            case 'completed': return '<i class="fas fa-check-circle"></i>';
            case 'processing': return '<i class="fas fa-spinner fa-spin"></i>';
            case 'queued': return '<i class="fas fa-clock"></i>';
            case 'failed': return '<i class="fas fa-exclamation-triangle"></i>';
            default: return '<i class="fas fa-question-circle"></i>';
        }
    }

    /**
     * Get confidence class based on percentage
     */
    function getConfidenceClass(confidence) {
        if (!confidence) return '';
        const conf = parseFloat(confidence);
        if (conf >= 80) return 'high';
        if (conf >= 50) return 'medium';
        return 'low';
    }

    /**
     * Get fix status badge HTML
     */
    function getFixStatusBadge(status) {
        const badges = {
            'suggested': '<span style="color: #f59e0b;">💡 Suggested</span>',
            'applied_auto': '<span style="color: #10b981;">✅ Auto Applied</span>',
            'applied_manual': '<span style="color: #3b82f6;">👤 Manual Applied</span>',
            'rejected': '<span style="color: #ef4444;">❌ Rejected</span>'
        };
        return badges[status] || status;
    }

    /**
     * Format timestamp as time ago
     * Handles Unix timestamps (in seconds)
     */
    function formatTimeAgo(timestamp) {
        // Handle invalid timestamps
        if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
            return 'Unknown';
        }

        const unixTime = parseInt(timestamp);
        const now = Date.now() / 1000;
        const diff = now - unixTime;

        // Handle negative diff (future dates)
        if (diff < 0) return 'Just now';

        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
        return Math.floor(diff / 604800) + 'w ago';
    }

    /**
     * Truncate string to max length
     */
    function truncate(str, maxLength) {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '...';
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Load trends data and render chart
     */
    function loadTrends() {
        _ks.get('AIErrorAnalysis', 'application', applicationId, [], function(response) {
            if (response.success || response.data) {
                // Convert object to array if needed (API returns {"0": {...}, "1": {...}})
                let analyses = [];
                if (Array.isArray(response.data)) {
                    analyses = response.data;
                } else if (response.data && typeof response.data === 'object') {
                    // Filter out non-analysis objects (like status_badge) by checking for id field
                    analyses = Object.values(response.data).filter(item => item && typeof item === 'object' && item.id);
                }

                // Group by day for the last 7 days
                const now = Date.now() / 1000;
                const days = [];
                const labels = [];

                for (let i = 6; i >= 0; i--) {
                    const dayStart = now - (i * 86400);
                    const dayEnd = dayStart + 86400;
                    const date = new Date(dayStart * 1000);

                    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

                    const dayAnalyses = analyses.filter(a => {
                        // Use raw Unix timestamp for reliable timezone-independent comparison
                        const timestamp = parseInt(a.date_created_raw || a.date_created);
                        if (isNaN(timestamp) || timestamp <= 0) return false;

                        return timestamp >= dayStart && timestamp < dayEnd;
                    });

                    days.push({
                        total: dayAnalyses.length,
                        completed: dayAnalyses.filter(a => a.analysis_status === 'completed').length,
                        fixed: dayAnalyses.filter(a => a.fix_status === 'applied_auto' || a.fix_status === 'applied_manual').length
                    });
                }

                // Render chart
                renderTrendsChart(labels, days);
            }
        }, function(error) {
            console.error('Error loading trends:', error);
        });
    }

    /**
     * Render trends chart using Chart.js
     */
    function renderTrendsChart(labels, days) {
        const ctx = document.getElementById('trends-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (trendsChart) {
            trendsChart.destroy();
        }

        trendsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: t('ui.ai_assistant.chart.total_analyses'),
                        data: days.map(d => d.total),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: t('ui.ai_assistant.chart.completed'),
                        data: days.map(d => d.completed),
                        borderColor: '#43e97b',
                        backgroundColor: 'rgba(67, 233, 123, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: t('ui.ai_assistant.chart.fixes_applied'),
                        data: days.map(d => d.fixed),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    /**
     * Show analysis detail modal (using Bootstrap modal)
     */
    function showAnalysisDetail(analysisId) {
        _ks.get('AIErrorAnalysis', 'id', analysisId, [], function(response) {
            if (response.success || response.data) {
                const analysis = response.data[0];

                // Extract error details from FK object
                const error = analysis.error_id || {};
                const errorType = error.log_level || 'N/A';
                const errorMessage = error.message || 'N/A';
                const errorFile = error.file || 'N/A';
                const errorLine = error.line || '?';

                // Build modal content sections
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

                // Remove any existing modal and add new one
                $('#aiAnalysisModal').remove();
                $('body').append(modalContent);

                // Show the modal
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
        }, function(error) {
            alert('Failed to load analysis details: ' + error);
        });
    }

    // Apply fix action
    function applyFix(analysisId) {
        if (!confirm('Are you sure you want to apply this AI-suggested fix to your code?')) {
            return;
        }

        $('#aiAnalysisModal').modal('hide');
        $('#pageLoaderModal').modal('show');

        _ks.put('AIErrorAnalysis', 'applyFix', analysisId, {}, null, [],
            function(response) {
                $('#pageLoaderModal').modal('hide');

                // Reload the data to show updated status
                loadRecentAnalyses();
                loadStatistics();

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

        $('#aiAnalysisModal').modal('hide');
        $('#pageLoaderModal').modal('show');

        _ks.put('AIErrorAnalysis', 'rejectFix', analysisId, {}, null, [],
            function(response) {
                $('#pageLoaderModal').modal('hide');

                // Reload the data to show updated status
                loadRecentAnalyses();
                loadStatistics();

                alert('Fix has been rejected.');
            },
            function(error) {
                $('#pageLoaderModal').modal('hide');
                alert('Failed to reject fix: ' + (error.message || error));
            }
        );
    }

    /**
     * Helper functions for modal (reused from log page)
     */
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

    /**
     * Event Handlers
     */

    // Refresh button
    $('#btn-refresh').on('click', function() {
        loadStatistics();
        loadRecentAnalyses();
        loadTrends();
    });

    // Filter change
    $('#filter-status, #filter-fixable, #filter-fix-status').on('change', function() {
        loadRecentAnalyses();
    });

    // Analysis item click
    $(document).on('click', '.analysis-item', function() {
        const analysisId = $(this).data('analysis-id');
        showAnalysisDetail(analysisId);
    });

    // Initialize Bootstrap tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Note: Dashboard initialization is now handled by initializePage()
    // which waits for KyteI18nReady event (see top of file)
});
