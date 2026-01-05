document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    if (!_ks.isSession()) {
        location.href="/?redir="+encodeURIComponent(window.location);
        return;
    }

    // Wait for i18n to be ready
    document.addEventListener('KyteI18nReady', function() {
        // Translation helper
        const t = (key, fallback) => {
            if (window.kyteI18n) {
                let text = window.kyteI18n.t(key);
                return text === key ? fallback : text;
            }
            return fallback;
        };

        // Get current application ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const requestParam = urlParams.get('request');
        let appId = null;

        if (requestParam) {
            try {
                const decoded = JSON.parse(atob(requestParam));
                appId = decoded.idx;
            } catch (e) {
                console.error('Failed to parse request param:', e);
            }
        }

        // Dashboard data container
        const dashboardData = {
            resources: {},
            errors: {},
            cronJobs: {}
        };

        // Start loading indicators for each section
        showSectionLoader('resources');
        showSectionLoader('errors');
        showSectionLoader('cron');

        // Fetch all metrics in parallel (they update UI as they complete)
        Promise.all([
            fetchResourceCounts(),
            fetchErrorMetrics(),
            fetchCronJobMetrics()
        ]).then(() => {
            console.log('Dashboard loaded');
        }).catch(error => {
            console.error('Dashboard load error:', error);
        });

        function showSectionLoader(section) {
            $(`#${section}-stats`).addClass('loading');
        }

        function hideSectionLoader(section) {
            $(`#${section}-stats`).removeClass('loading');
        }

        function fetchResourceCounts() {
            return new Promise((resolve) => {
                let completed = 0;
                const total = 6;

                const checkComplete = () => {
                    completed++;
                    if (completed === total) {
                        renderResourceStats();
                        hideSectionLoader('resources');
                        resolve();
                    }
                };

                // Count DataModels (has application field)
                _ks.sign((sig) => {
                    _ks.get('DataModel', 'application', appId, [], (res) => {
                        dashboardData.resources.models = res.data ? res.data.length : 0;
                        $('#stat-models').text(dashboardData.resources.models);
                        checkComplete();
                    }, checkComplete);
                });

                // Count Controllers (has application field)
                _ks.sign((sig) => {
                    _ks.get('Controller', 'application', appId, [], (res) => {
                        dashboardData.resources.controllers = res.data ? res.data.length : 0;
                        $('#stat-controllers').text(dashboardData.resources.controllers);
                        checkComplete();
                    }, checkComplete);
                });

                // Count Pages (query by site, sites belong to application)
                _ks.sign((sig) => {
                    // First get all sites for this application
                    _ks.get('KyteSite', 'application', appId, [], (siteRes) => {
                        if (siteRes.data && siteRes.data.length > 0) {
                            const siteIds = siteRes.data.map(s => s.id);
                            let pagesCount = 0;
                            let sitesChecked = 0;

                            // Query pages for each site
                            siteIds.forEach(siteId => {
                                _ks.sign((sig2) => {
                                    _ks.get('KytePage', 'site', siteId, [], (pageRes) => {
                                        if (pageRes.data) {
                                            pagesCount += pageRes.data.length;
                                            dashboardData.resources.pages = pagesCount;
                                            $('#stat-pages').text(pagesCount);
                                        }
                                        sitesChecked++;
                                        if (sitesChecked === siteIds.length) {
                                            checkComplete();
                                        }
                                    }, () => {
                                        sitesChecked++;
                                        if (sitesChecked === siteIds.length) {
                                            dashboardData.resources.pages = pagesCount;
                                            $('#stat-pages').text(pagesCount);
                                            checkComplete();
                                        }
                                    });
                                });
                            });
                        } else {
                            dashboardData.resources.pages = 0;
                            $('#stat-pages').text(0);
                            checkComplete();
                        }
                    }, checkComplete);
                });

                // Count Sites (has application field)
                _ks.sign((sig) => {
                    _ks.get('KyteSite', 'application', appId, [], (res) => {
                        dashboardData.resources.sites = res.data ? res.data.length : 0;
                        $('#stat-sites').text(dashboardData.resources.sites);
                        checkComplete();
                    }, checkComplete);
                });

                // Count Functions (linked via controller)
                _ks.sign((sig) => {
                    // Get all controllers for this app first
                    _ks.get('Controller', 'application', appId, [], (res) => {
                        if (res.data && res.data.length > 0) {
                            const controllerIds = res.data.map(c => c.id);
                            let functionsCount = 0;
                            let controllersChecked = 0;

                            // Query functions for each controller
                            controllerIds.forEach(controllerId => {
                                _ks.sign((sig2) => {
                                    _ks.get('Function', 'controller', controllerId, [], (funcRes) => {
                                        if (funcRes.data) {
                                            functionsCount += funcRes.data.length;
                                            dashboardData.resources.functions = functionsCount;
                                            $('#stat-functions').text(functionsCount);
                                        }
                                        controllersChecked++;
                                        if (controllersChecked === controllerIds.length) {
                                            checkComplete();
                                        }
                                    }, () => {
                                        controllersChecked++;
                                        if (controllersChecked === controllerIds.length) {
                                            dashboardData.resources.functions = functionsCount;
                                            $('#stat-functions').text(functionsCount);
                                            checkComplete();
                                        }
                                    });
                                });
                            });
                        } else {
                            dashboardData.resources.functions = 0;
                            $('#stat-functions').text(0);
                            checkComplete();
                        }
                    }, checkComplete);
                });

                // Count Cron Jobs (has application field)
                _ks.sign((sig) => {
                    _ks.get('CronJob', 'application', appId, [], (res) => {
                        dashboardData.resources.cronJobs = res.data ? res.data.length : 0;
                        $('#stat-cron-jobs').text(dashboardData.resources.cronJobs);
                        checkComplete();
                    }, checkComplete);
                });
            });
        }

        function fetchErrorMetrics() {
            return new Promise((resolve) => {
                // Get errors from last 24 hours
                const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);

                _ks.sign((sig) => {
                    _ks.get('KyteError', 'app_id', appId, [], (res) => {
                        if (res.data) {
                            // Filter errors from last 24h
                            const recentErrors = res.data.filter(err => err.date_created >= oneDayAgo);

                            dashboardData.errors.total24h = recentErrors.length;
                            dashboardData.errors.critical = recentErrors.filter(e => e.log_level === 'critical').length;
                            dashboardData.errors.error = recentErrors.filter(e => e.log_level === 'error').length;
                            dashboardData.errors.warning = recentErrors.filter(e => e.log_level === 'warning').length;

                            // Get most recent critical/error entries (max 5)
                            dashboardData.errors.recent = recentErrors
                                .filter(e => e.log_level === 'critical' || e.log_level === 'error')
                                .sort((a, b) => b.date_created - a.date_created)
                                .slice(0, 5);
                        } else {
                            dashboardData.errors.total24h = 0;
                            dashboardData.errors.critical = 0;
                            dashboardData.errors.error = 0;
                            dashboardData.errors.warning = 0;
                            dashboardData.errors.recent = [];
                        }
                        renderErrorStats();
                        hideSectionLoader('errors');
                        resolve();
                    }, () => {
                        renderErrorStats();
                        hideSectionLoader('errors');
                        resolve();
                    });
                });
            });
        }

        function fetchCronJobMetrics() {
            return new Promise((resolve) => {
                // Get cron jobs first
                _ks.sign((sig) => {
                    _ks.get('CronJob', 'application', appId, [], (res) => {
                        if (res.data && res.data.length > 0) {
                            const cronJobs = res.data;
                            dashboardData.cronJobs.total = cronJobs.length;
                            dashboardData.cronJobs.enabled = cronJobs.filter(j => j.enabled === 1).length;
                            dashboardData.cronJobs.deadLetter = cronJobs.filter(j => j.in_dead_letter_queue === 1).length;

                            // Display cron job counts immediately
                            $('#stat-cron-enabled').text(dashboardData.cronJobs.enabled);
                            $('#stat-cron-dead-letter').text(dashboardData.cronJobs.deadLetter);

                            // Get executions for each cron job (limited to recent ones to avoid memory issues)
                            const cronJobIds = cronJobs.map(j => j.id);
                            const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
                            const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

                            // Query executions from last 7 days only to reduce memory usage
                            let allExecutions = [];
                            let executionsLoaded = 0;

                            if (cronJobIds.length === 0) {
                                dashboardData.cronJobs.recentExecutions = [];
                                dashboardData.cronJobs.successRate24h = 100;
                                resolve();
                                return;
                            }

                            // Fetch executions for each cron job individually to avoid loading too much data
                            cronJobIds.forEach((jobId, index) => {
                                _ks.sign((sig) => {
                                    _ks.get('CronJobExecution', 'cron_job', jobId, [], (execRes) => {
                                        if (execRes.data) {
                                            // Only keep executions from last 7 days
                                            const recentExecs = execRes.data.filter(e => e.date_created >= sevenDaysAgo);
                                            allExecutions = allExecutions.concat(recentExecs);
                                        }

                                        executionsLoaded++;
                                        if (executionsLoaded === cronJobIds.length) {
                                            // All executions loaded, now process them
                                            dashboardData.cronJobs.recentExecutions = allExecutions
                                                .sort((a, b) => b.date_created - a.date_created)
                                                .slice(0, 5);

                                            // Calculate 24h success rate
                                            const recent24h = allExecutions.filter(e => e.date_created >= oneDayAgo);
                                            const successful = recent24h.filter(e => e.status === 'completed' && e.exit_code === 0).length;
                                            dashboardData.cronJobs.successRate24h = recent24h.length > 0
                                                ? Math.round((successful / recent24h.length) * 100)
                                                : 100;

                                            // Update success rate and executions
                                            $('#stat-cron-success-rate').text(dashboardData.cronJobs.successRate24h + '%');
                                            renderRecentCronExecutions();

                                            hideSectionLoader('cron');
                                            resolve();
                                        }
                                    }, () => {
                                        executionsLoaded++;
                                        if (executionsLoaded === cronJobIds.length) {
                                            dashboardData.cronJobs.recentExecutions = allExecutions
                                                .sort((a, b) => b.date_created - a.date_created)
                                                .slice(0, 5);

                                            const recent24h = allExecutions.filter(e => e.date_created >= oneDayAgo);
                                            const successful = recent24h.filter(e => e.status === 'completed' && e.exit_code === 0).length;
                                            dashboardData.cronJobs.successRate24h = recent24h.length > 0
                                                ? Math.round((successful / recent24h.length) * 100)
                                                : 100;

                                            // Update success rate and executions
                                            $('#stat-cron-success-rate').text(dashboardData.cronJobs.successRate24h + '%');
                                            renderRecentCronExecutions();

                                            hideSectionLoader('cron');
                                            resolve();
                                        }
                                    });
                                });
                            });
                        } else {
                            dashboardData.cronJobs.total = 0;
                            dashboardData.cronJobs.enabled = 0;
                            dashboardData.cronJobs.deadLetter = 0;
                            dashboardData.cronJobs.recentExecutions = [];
                            dashboardData.cronJobs.successRate24h = 100;
                            $('#stat-cron-enabled').text(0);
                            $('#stat-cron-dead-letter').text(0);
                            $('#stat-cron-success-rate').text('100%');
                            renderRecentCronExecutions();
                            hideSectionLoader('cron');
                            resolve();
                        }
                    }, () => {
                        dashboardData.cronJobs.total = 0;
                        dashboardData.cronJobs.enabled = 0;
                        dashboardData.cronJobs.deadLetter = 0;
                        dashboardData.cronJobs.recentExecutions = [];
                        dashboardData.cronJobs.successRate24h = 100;
                        $('#stat-cron-enabled').text(0);
                        $('#stat-cron-dead-letter').text(0);
                        $('#stat-cron-success-rate').text('100%');
                        renderRecentCronExecutions();
                        hideSectionLoader('cron');
                        resolve();
                    });
                });
            });
        }

        function renderResourceStats() {
            // Resource stats are now updated progressively as data comes in
            // This function is just called to signal completion
        }

        function renderErrorStats() {
            // Render error stats
            $('#stat-errors-24h').text(dashboardData.errors.total24h || 0);
            $('#stat-errors-critical').text(dashboardData.errors.critical || 0);
            $('#stat-errors-error').text(dashboardData.errors.error || 0);
            $('#stat-errors-warning').text(dashboardData.errors.warning || 0);

            // Render recent errors
            const $errorList = $('#recent-errors-list');
            $errorList.empty();

            if (dashboardData.errors.recent && dashboardData.errors.recent.length > 0) {
                dashboardData.errors.recent.forEach(error => {
                    const icon = error.log_level === 'critical' ? '🔴' : '🟠';
                    const timeAgo = formatTimeAgo(error.date_created);
                    const message = error.message ? error.message.substring(0, 100) : t('ui.dashboard.errors.no_message', 'No message');

                    $errorList.append(`
                        <div class="error-item">
                            <span class="error-icon">${icon}</span>
                            <span class="error-level">${error.log_level.toUpperCase()}</span>
                            <span class="error-message">${message}</span>
                            <span class="error-time">${timeAgo}</span>
                        </div>
                    `);
                });
            } else {
                $errorList.append(`<div class="empty-state">${t('ui.dashboard.errors.no_errors', 'No recent errors')}</div>`);
            }
        }

        function renderCronStats() {
            // Render cron job stats (called when all cron data is ready)
            $('#stat-cron-enabled').text(dashboardData.cronJobs.enabled || 0);
            $('#stat-cron-dead-letter').text(dashboardData.cronJobs.deadLetter || 0);
            $('#stat-cron-success-rate').text((dashboardData.cronJobs.successRate24h || 100) + '%');
            renderRecentCronExecutions();
        }

        function renderRecentCronExecutions() {
            // Render recent cron executions list
            const $cronList = $('#recent-cron-list');
            $cronList.empty();

            if (dashboardData.cronJobs.recentExecutions && dashboardData.cronJobs.recentExecutions.length > 0) {
                dashboardData.cronJobs.recentExecutions.forEach(exec => {
                    const statusIcon = exec.status === 'completed' && exec.exit_code === 0 ? '✅' : '❌';
                    const duration = exec.duration_ms ? `${exec.duration_ms}ms` : '---';
                    const timeAgo = formatTimeAgo(exec.date_created);
                    const jobName = exec.cron_job_obj ? exec.cron_job_obj.name : `Job #${exec.cron_job}`;

                    $cronList.append(`
                        <div class="cron-item">
                            <span class="cron-icon">${statusIcon}</span>
                            <span class="cron-name">${jobName}</span>
                            <span class="cron-status">${exec.status}</span>
                            <span class="cron-duration">${duration}</span>
                            <span class="cron-time">${timeAgo}</span>
                        </div>
                    `);
                });
            } else {
                $cronList.append(`<div class="empty-state">${t('ui.dashboard.cron.no_executions', 'No recent executions')}</div>`);
            }
        }

        function formatTimeAgo(timestamp) {
            const now = Math.floor(Date.now() / 1000);
            const diff = now - timestamp;

            if (diff < 60) return t('ui.dashboard.time.just_now', 'Just now');
            if (diff < 3600) return Math.floor(diff / 60) + t('ui.dashboard.time.minutes_ago', 'm ago');
            if (diff < 86400) return Math.floor(diff / 3600) + t('ui.dashboard.time.hours_ago', 'h ago');
            return Math.floor(diff / 86400) + t('ui.dashboard.time.days_ago', 'd ago');
        }
    }); // End KyteI18nReady listener
});
