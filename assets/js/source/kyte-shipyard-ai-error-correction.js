/**
 * Kyte Shipyard - AI Error Correction Configuration
 *
 * Manages AI Error Correction settings for applications.
 * Integrated into app/configuration.html as a new tab.
 */

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    // Only initialize if on configuration page
    if (!window.location.pathname.includes('configuration.html')) {
        return;
    }

    // Get application ID from page request (same pattern as application-configuration.js)
    if (_ks.isSession()) {
        let idx = _ks.getPageRequest();
        if (idx && idx.idx) {
            initAIErrorCorrection(_ks, idx.idx);
        }
    }
});

/**
 * Initialize AI Error Correction configuration UI
 */
function initAIErrorCorrection(_ks, applicationId) {
    let configData = null;
    let statsData = null;

    /**
     * Load configuration and statistics
     */
    function loadConfig() {
        // Show loading state
        $('#ai-config-loading').show();
        $('#ai-config-form').hide();

        // Load stats using get - for custom actions, use field/value pattern
        _ks.get('AIErrorCorrectionConfig', 'application', applicationId, [], function(response) {
            if (response.success || response.data) {
                // Check if config exists
                if (response.data && response.data.length > 0) {
                    configData = response.data[0];
                    // Calculate stats from config data
                    statsData = {
                        total_analyses: configData.total_analyses || 0,
                        total_fixes_applied: configData.total_fixes_applied || 0,
                        total_successful_fixes: configData.total_successful_fixes || 0,
                        total_failed_fixes: configData.total_failed_fixes || 0,
                        total_cost_usd: configData.total_cost_usd || '0.00',
                        success_rate: configData.total_fixes_applied > 0 ?
                            Math.round((configData.total_successful_fixes / configData.total_fixes_applied) * 100 * 100) / 100 : 0,
                        avg_confidence: configData.avg_confidence || 0
                    };
                    populateForm(configData);
                    updateStats(statsData);
                } else {
                    // No config exists, show create form with defaults
                    showCreateForm();
                    updateStats({
                        total_analyses: 0,
                        total_fixes_applied: 0,
                        total_successful_fixes: 0,
                        total_failed_fixes: 0,
                        total_cost_usd: '0.00',
                        success_rate: 0,
                        avg_confidence: 0
                    });
                }

                $('#ai-config-loading').hide();
                $('#ai-config-form').show();
            } else {
                alert('Error: Failed to load configuration - ' + (response.error || 'Unknown error'));
                $('#ai-config-loading').hide();
            }
        }, function(error) {
            alert('Error: Failed to load configuration - ' + error);
            $('#ai-config-loading').hide();
        });
    }

    /**
     * Show create form with default values
     */
    function showCreateForm() {
        configData = {
            application: applicationId,
            enabled: 0,
            auto_fix_enabled: 0,
            auto_fix_min_confidence: 90.00,
            max_analyses_per_hour: 10,
            max_analyses_per_day: 50,
            max_monthly_cost_usd: 100.00,
            cooldown_minutes: 30,
            max_fix_attempts: 5,
            loop_detection_window_minutes: 60,
            auto_disable_on_loop: 1,
            batch_size: 10,
            max_concurrent_bedrock_calls: 3,
            include_warnings: 0,
            include_model_definitions: 1,
            include_request_data: 1,
            include_framework_docs: 1
        };

        populateForm(configData);
        $('#ai-config-status').html('<span class="badge bg-secondary">Not Configured</span>');
    }

    /**
     * Populate form with configuration data
     */
    function populateForm(config) {
        // Feature toggles
        $('#ai-enabled').prop('checked', config.enabled == 1);
        $('#ai-auto-fix-enabled').prop('checked', config.auto_fix_enabled == 1);

        // Confidence threshold (convert decimal to integer for display)
        const confidence = Math.round(parseFloat(config.auto_fix_min_confidence || 90));
        $('#ai-min-confidence').val(confidence);
        $('#ai-min-confidence-value').text(confidence);

        // Rate limiting
        $('#ai-max-per-hour').val(config.max_analyses_per_hour);
        $('#ai-max-per-day').val(config.max_analyses_per_day);
        $('#ai-max-monthly-cost').val(config.max_monthly_cost_usd);
        $('#ai-cooldown-minutes').val(config.cooldown_minutes);

        // Loop detection
        $('#ai-max-attempts').val(config.max_fix_attempts);
        $('#ai-loop-window').val(config.loop_detection_window_minutes);
        $('#ai-auto-disable-loop').prop('checked', config.auto_disable_on_loop == 1);

        // Batch settings
        $('#ai-batch-size').val(config.batch_size);
        $('#ai-max-concurrent').val(config.max_concurrent_bedrock_calls);

        // Analysis preferences
        $('#ai-include-warnings').prop('checked', config.include_warnings == 1);
        $('#ai-include-models').prop('checked', config.include_model_definitions == 1);
        $('#ai-include-request').prop('checked', config.include_request_data == 1);
        $('#ai-include-framework').prop('checked', config.include_framework_docs == 1);

        // Update status badge
        updateStatusBadge(config);

        // Setup event handlers
        setupEventHandlers();
    }

    /**
     * Update status badge
     */
    function updateStatusBadge(config) {
        let badge = '';
        if (config.enabled == 1) {
            if (config.auto_fix_enabled == 1) {
                badge = '<span class="badge bg-success"><i class="fas fa-robot"></i> Enabled (Auto-Fix)</span>';
            } else {
                badge = '<span class="badge bg-primary"><i class="fas fa-lightbulb"></i> Enabled (Suggest)</span>';
            }
        } else {
            badge = '<span class="badge bg-secondary"><i class="fas fa-power-off"></i> Disabled</span>';
        }
        $('#ai-config-status').html(badge);
    }

    /**
     * Update statistics display
     */
    function updateStats(stats) {
        $('#ai-stats-total-analyses').text(stats.total_analyses || 0);
        $('#ai-stats-fixes-applied').text(stats.total_fixes_applied || 0);
        $('#ai-stats-success-rate').text(stats.success_rate || 0);
        $('#ai-stats-total-cost').text('$' + (stats.total_cost_usd || '0.00'));
        $('#ai-stats-avg-confidence').text(stats.avg_confidence || 0);

        // Update success rate card background color for better visibility
        const successRate = parseFloat(stats.success_rate || 0);
        const $statCard = $('#ai-stats-success-rate').closest('.stat-card');

        // Remove any previous inline styles
        $statCard.removeAttr('style');

        if (successRate >= 80) {
            // Green card with white text
            $statCard.css({
                'background-color': '#28a745',
                'color': '#ffffff'
            });
        } else if (successRate >= 50) {
            // Yellow card with dark text
            $statCard.css({
                'background-color': '#ffc107',
                'color': '#212529'
            });
        } else if (successRate > 0) {
            // Red card with white text
            $statCard.css({
                'background-color': '#dc3545',
                'color': '#ffffff'
            });
        } else {
            // Grey card for 0%
            $statCard.css({
                'background-color': '#6c757d',
                'color': '#ffffff'
            });
        }
    }

    /**
     * Setup event handlers
     */
    function setupEventHandlers() {
        // Initialize Bootstrap tooltips
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Remove old handlers before attaching new ones to prevent multiplication
        $('#ai-min-confidence').off('input');
        $('#ai-auto-fix-enabled').off('change');
        $('#ai-quick-enable-btn').off('click');
        $('#ai-quick-disable-btn').off('click');
        $('#ai-save-config-btn').off('click');
        $('#ai-reset-stats-btn').off('click');

        // Confidence slider
        $('#ai-min-confidence').on('input', function() {
            $('#ai-min-confidence-value').text($(this).val());
        });

        // Auto-fix toggle (disable slider if auto-fix is off)
        $('#ai-auto-fix-enabled').on('change', function() {
            $('#ai-min-confidence').prop('disabled', !$(this).prop('checked'));
        });

        // Quick enable button
        $('#ai-quick-enable-btn').on('click', function() {
            $('#ai-enabled').prop('checked', true);
            saveConfig();
        });

        // Quick disable button
        $('#ai-quick-disable-btn').on('click', function() {
            $('#ai-enabled').prop('checked', false);
            $('#ai-auto-fix-enabled').prop('checked', false);
            saveConfig();
        });

        // Save button
        $('#ai-save-config-btn').on('click', function() {
            saveConfig();
        });

        // Reset stats button
        $('#ai-reset-stats-btn').on('click', function() {
            if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
                resetStats();
            }
        });
    }

    /**
     * Save configuration
     */
    function saveConfig() {
        const formData = {
            application: applicationId,
            enabled: $('#ai-enabled').prop('checked') ? 1 : 0,
            auto_fix_enabled: $('#ai-auto-fix-enabled').prop('checked') ? 1 : 0,
            auto_fix_min_confidence: parseFloat($('#ai-min-confidence').val()),
            max_analyses_per_hour: parseInt($('#ai-max-per-hour').val()),
            max_analyses_per_day: parseInt($('#ai-max-per-day').val()),
            max_monthly_cost_usd: parseFloat($('#ai-max-monthly-cost').val()),
            cooldown_minutes: parseInt($('#ai-cooldown-minutes').val()),
            max_fix_attempts: parseInt($('#ai-max-attempts').val()),
            loop_detection_window_minutes: parseInt($('#ai-loop-window').val()),
            auto_disable_on_loop: $('#ai-auto-disable-loop').prop('checked') ? 1 : 0,
            batch_size: parseInt($('#ai-batch-size').val()),
            max_concurrent_bedrock_calls: parseInt($('#ai-max-concurrent').val()),
            include_warnings: $('#ai-include-warnings').prop('checked') ? 1 : 0,
            include_model_definitions: $('#ai-include-models').prop('checked') ? 1 : 0,
            include_request_data: $('#ai-include-request').prop('checked') ? 1 : 0,
            include_framework_docs: $('#ai-include-framework').prop('checked') ? 1 : 0
        };

        $('#ai-save-config-btn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');

        // Create or update
        if (configData && configData.id) {
            // Update existing
            _ks.put('AIErrorCorrectionConfig', 'id', configData.id, formData, null, [], function(response) {
                if (response.success || response.data) {
                    // Handle response data correctly - API returns object directly or in array
                    configData = Array.isArray(response.data) ? response.data[0] : response.data;
                    updateStatusBadge(configData);
                    alert('Configuration saved successfully');
                    loadConfig(); // Reload to get updated stats
                } else {
                    alert('Error: Failed to save - ' + (response.error || 'Unknown error'));
                }
                $('#ai-save-config-btn').prop('disabled', false).html('<i class="fas fa-save"></i> Save Configuration');
            }, function(error) {
                alert('Error: Save failed - ' + error);
                $('#ai-save-config-btn').prop('disabled', false).html('<i class="fas fa-save"></i> Save Configuration');
            });
        } else {
            // Create new
            _ks.post('AIErrorCorrectionConfig', formData, null, [], function(response) {
                if (response.success || response.data) {
                    // Handle response data correctly - API returns object directly or in array
                    configData = Array.isArray(response.data) ? response.data[0] : response.data;
                    updateStatusBadge(configData);
                    alert('Configuration created successfully');
                    loadConfig(); // Reload to get updated stats
                } else {
                    alert('Error: Failed to create - ' + (response.error || 'Unknown error'));
                }
                $('#ai-save-config-btn').prop('disabled', false).html('<i class="fas fa-save"></i> Save Configuration');
            }, function(error) {
                alert('Error: Create failed - ' + error);
                $('#ai-save-config-btn').prop('disabled', false).html('<i class="fas fa-save"></i> Save Configuration');
            });
        }
    }

    /**
     * Reset statistics
     */
    function resetStats() {
        if (!configData || !configData.id) {
            alert('Error: No configuration found to reset');
            return;
        }

        // Reset stats by updating config with zero values
        const resetData = {
            total_analyses: 0,
            total_fixes_applied: 0,
            total_successful_fixes: 0,
            total_failed_fixes: 0,
            total_cost_usd: 0.00,
            last_analysis_date: null
        };

        _ks.put('AIErrorCorrectionConfig', 'id', configData.id, resetData, null, [], function(response) {
            if (response.success || response.data) {
                alert('Statistics reset successfully');
                loadConfig(); // Reload to refresh stats
            } else {
                alert('Error: Failed to reset - ' + (response.error || 'Unknown error'));
            }
        }, function(error) {
            alert('Error: Reset failed - ' + error);
        });
    }

    // Initialize
    loadConfig();
}
