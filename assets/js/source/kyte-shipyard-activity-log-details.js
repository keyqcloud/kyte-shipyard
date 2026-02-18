// Activity log detail page population
function populateActivityDetails(activity) {
    const formattedDate = activity.date_created;
    const action = activity.action || 'UNKNOWN';
    const severity = activity.severity || 'info';
    const category = activity.event_category || 'data';

    const requestDataFormatted = formatActivityJSON(activity.request_data);
    const changesFormatted = activity.changes ? JSON.parse(activity.changes) : null;

    const htmlContent = `
        <!-- Page Header -->
        <div class="activity-header">
            <div class="activity-title">
                <h1>Activity Details</h1>
                <div class="activity-badges">
                    ${renderActionBadge(action)}
                    ${renderSeverityBadge(severity)}
                    ${renderCategoryBadge(category)}
                    ${renderResponseCodeBadge(activity.response_code)}
                </div>
            </div>
            <button class="btn-close-window closeWindowButton">
                <i class="fas fa-times"></i>
                Close Window
            </button>
        </div>

        <!-- Summary Cards -->
        <div class="activity-summary">
            <div class="summary-card" style="--card-accent: ${ACTIVITY_ACTION_COLORS[action] || '#6c757d'}">
                <h3>Action</h3>
                <div class="value">${action}</div>
                <div class="label">${activity.model_name || 'N/A'}</div>
            </div>
            <div class="summary-card" style="--card-accent: #6f42c1">
                <h3>User</h3>
                <div class="value">${activity.user_email || 'System'}</div>
                <div class="label">${activity.user_name || ''}</div>
            </div>
            <div class="summary-card" style="--card-accent: #0dcaf0">
                <h3>Timestamp</h3>
                <div class="value">${formattedDate}</div>
                <div class="label">${activity.duration_ms ? activity.duration_ms + 'ms' : ''}</div>
            </div>
            <div class="summary-card" style="--card-accent: ${ACTIVITY_SEVERITY_COLORS[severity] || '#0dcaf0'}">
                <h3>Status</h3>
                <div class="value">${activity.response_code || 'N/A'}</div>
                <div class="label">${activity.response_status || ''}</div>
            </div>
        </div>

        <!-- Activity Information -->
        <div class="detail-section">
            <div class="section-header">
                <div class="icon">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h2>Activity Information</h2>
            </div>
            <div class="section-content">
                <table class="activity-details-table">
                    <tbody>
                        <tr>
                            <th>Action</th>
                            <td>${renderActionBadge(action)}</td>
                        </tr>
                        <tr>
                            <th>Model</th>
                            <td>${activity.model_name || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Record ID</th>
                            <td>${activity.record_id || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Field</th>
                            <td>${activity.field || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Value</th>
                            <td>${activity.value || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Severity</th>
                            <td>${renderSeverityBadge(severity)}</td>
                        </tr>
                        <tr>
                            <th>Category</th>
                            <td>${renderCategoryBadge(category)}</td>
                        </tr>
                        <tr>
                            <th>Duration</th>
                            <td>${activity.duration_ms ? activity.duration_ms + ' ms' : 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Response Code</th>
                            <td>${renderResponseCodeBadge(activity.response_code)}</td>
                        </tr>
                        ${activity.error_message ? `
                        <tr>
                            <th>Error Message</th>
                            <td style="color: #dc3545; font-weight: 600;">${escapeActivityHtml(activity.error_message)}</td>
                        </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- User & Request Details -->
        <div class="detail-section">
            <div class="section-header">
                <div class="icon">
                    <i class="fas fa-user"></i>
                </div>
                <h2>User & Request Details</h2>
            </div>
            <div class="section-content">
                <table class="activity-details-table">
                    <tbody>
                        <tr>
                            <th>User Email</th>
                            <td>${activity.user_email || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>User Name</th>
                            <td>${activity.user_name || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>User ID</th>
                            <td>${activity.user_id || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Account</th>
                            <td>${activity.account_name || 'N/A'} ${activity.account_id ? '(ID: ' + activity.account_id + ')' : ''}</td>
                        </tr>
                        <tr>
                            <th>Application</th>
                            <td>${activity.application_name || 'N/A'} ${activity.application_id ? '(ID: ' + activity.application_id + ')' : ''}</td>
                        </tr>
                        <tr>
                            <th>IP Address</th>
                            <td><code>${activity.ip_address || 'N/A'}</code></td>
                        </tr>
                        <tr>
                            <th>User Agent</th>
                            <td style="word-break:break-word;font-size:0.85em;">${activity.user_agent || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Session Token</th>
                            <td><code>${activity.session_token || 'N/A'}</code></td>
                        </tr>
                        <tr>
                            <th>Request URI</th>
                            <td><code>${activity.request_uri || 'N/A'}</code></td>
                        </tr>
                        <tr>
                            <th>Request Method</th>
                            <td>${activity.request_method || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Date Created</th>
                            <td>${formattedDate}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Request Data -->
        ${activity.request_data ? `
        <div class="detail-section">
            <div class="section-header">
                <div class="icon">
                    <i class="fas fa-database"></i>
                </div>
                <h2>Request Data</h2>
            </div>
            <div class="section-content">
                <div class="code-block">
                    <div class="code-block-header">
                        <span class="code-block-title">Request Payload (Redacted)</span>
                        <button class="copy-button" onclick="copyActivityToClipboard('request-data-content')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre id="request-data-content">${requestDataFormatted}</pre>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Changes (PUT only) -->
        ${changesFormatted ? `
        <div class="detail-section">
            <div class="section-header">
                <div class="icon">
                    <i class="fas fa-exchange-alt"></i>
                </div>
                <h2>Changes</h2>
            </div>
            <div class="section-content">
                <table class="changes-table">
                    <thead>
                        <tr>
                            <th>Field</th>
                            <th>Old Value</th>
                            <th>New Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.keys(changesFormatted).map(function(field) {
                            const change = changesFormatted[field];
                            return `
                                <tr>
                                    <td style="font-weight:600;">${escapeActivityHtml(field)}</td>
                                    <td class="change-old">${escapeActivityHtml(String(change.old !== null ? change.old : 'null'))}</td>
                                    <td class="change-new">${escapeActivityHtml(String(change.new !== null ? change.new : 'null'))}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                <div style="margin-top:1rem;">
                    <div class="code-block">
                        <div class="code-block-header">
                            <span class="code-block-title">Raw Changes JSON</span>
                            <button class="copy-button" onclick="copyActivityToClipboard('changes-content')">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <pre id="changes-content">${JSON.stringify(changesFormatted, null, 2)}</pre>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Error Details (if failed) -->
        ${activity.error_message ? `
        <div class="detail-section">
            <div class="section-header">
                <div class="icon" style="background: linear-gradient(135deg, #dc3545, #ef4444);">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h2>Error Details</h2>
            </div>
            <div class="section-content">
                <div class="code-block">
                    <div class="code-block-header">
                        <span class="code-block-title">Error Message</span>
                        <button class="copy-button" onclick="copyActivityToClipboard('error-content')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre id="error-content">${escapeActivityHtml(activity.error_message)}</pre>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Actions -->
        <div class="text-center mt-4">
            <button class="btn-close-window closeWindowButton">
                <i class="fas fa-times"></i>
                Close Window
            </button>
        </div>
    `;

    $('#activityDetailsContainer').html(htmlContent);

    $('.closeWindowButton').click(function() {
        window.close();
    });
}

// Handle no log found case
function showNoActivityFound() {
    const htmlContent = `
        <div class="no-data">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>No Activity Details Found</h3>
            <p>The requested activity log entry could not be found or may have been removed.</p>
            <button class="btn-close-window" onclick="window.close()">
                <i class="fas fa-times"></i>
                Close Window
            </button>
        </div>
    `;
    $('#activityDetailsContainer').html(htmlContent);
}

// Initialize page
document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    if (_ks.isSession()) {
        let request = _ks.getPageRequest();

        _ks.get("KyteActivityLog", "id", request.idx, [], function(r) {
            if (r.data.length == 1) {
                let activity = r.data[0];
                populateActivityDetails(activity);
            } else {
                console.error("no activity log found");
                showNoActivityFound();
            }
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});
