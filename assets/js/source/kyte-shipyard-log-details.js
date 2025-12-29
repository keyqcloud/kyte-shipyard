// Enhanced log details population function
function populateLogDetails(kyteError) {
    const logLevel = kyteError.log_level || 'error';
    const logType = kyteError.log_type || 'application';
    const source = kyteError.source || 'error_handler';
    const formattedDate = kyteError.date_created;
    const dataFormatted = formatJSON(kyteError.data);
    const responseFormatted = formatJSON(kyteError.response);
    const contextFormatted = formatJSON(kyteError.context);
    const traceFormatted = kyteError.trace || null;

    // Get log level styling
    const levelConfig = getLogLevelConfig(logLevel);

    const htmlContent = `
        <!-- Page Header -->
        <div class="log-header">
            <div class="log-title">
                <h1>Log Details</h1>
                <div class="log-badges">
                    <span class="log-badge ${logLevel}">
                        <i class="${levelConfig.icon}"></i>
                        ${logLevel.toUpperCase()}
                    </span>
                    <span class="log-badge ${logType === 'system' ? 'system' : 'application'}">
                        <i class="fas fa-${logType === 'system' ? 'server' : 'layer-group'}"></i>
                        ${logType.toUpperCase()}
                    </span>
                    <span class="log-badge source-${source}">
                        <i class="fas fa-tag"></i>
                        ${source.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
            </div>
            <button class="btn-close-window closeWindowButton">
                <i class="fas fa-times"></i>
                Close Window
            </button>
        </div>

        <!-- Error Summary -->
        <div class="error-summary">
            <div class="summary-card level-${logLevel}">
                <h3>Level</h3>
                <div class="value">${logLevel}</div>
                <div class="label">Severity</div>
            </div>
            <div class="summary-card level-${logLevel}">
                <h3>Request Type</h3>
                <div class="value">${kyteError.request || 'N/A'}</div>
                <div class="label">API Request</div>
            </div>
            <div class="summary-card level-${logLevel}">
                <h3>Occurrence</h3>
                <div class="value">${formattedDate}</div>
                <div class="label">Date & Time</div>
            </div>
            <div class="summary-card level-${logLevel}">
                <h3>Location</h3>
                <div class="value">Line ${kyteError.line || 'Unknown'}</div>
                <div class="label">${kyteError.file || 'Unknown File'}</div>
            </div>
        </div>

        <!-- Log Information -->
        <div class="detail-section">
            <div class="section-header">
                <div class="icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <h2>Log Information</h2>
            </div>
            <div class="section-content">
                <table class="error-details-table">
                    <tbody>
                        ${kyteError.request_id ? `
                        <tr>
                            <th>Request ID</th>
                            <td><code>${kyteError.request_id}</code></td>
                        </tr>
                        ` : ''}
                        <tr>
                            <th>Log Level</th>
                            <td><span class="log-badge ${logLevel}">${logLevel.toUpperCase()}</span></td>
                        </tr>
                        <tr>
                            <th>Log Type</th>
                            <td><span class="log-badge ${logType === 'system' ? 'system' : 'application'}">${logType.toUpperCase()}</span></td>
                        </tr>
                        <tr>
                            <th>Source</th>
                            <td><span class="log-badge source-${source}">${source.replace('_', ' ')}</span></td>
                        </tr>
                        <tr>
                            <th>Account ID</th>
                            <td>${kyteError.account_id || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>User ID</th>
                            <td>${kyteError.user_id || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>API Key</th>
                            <td>${kyteError.api_key || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Application ID</th>
                            <td>${kyteError.app_id || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Model</th>
                            <td>${kyteError.model || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Request</th>
                            <td>${kyteError.request || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Message</th>
                            <td style="color: ${levelConfig.color}; font-weight: 600;">${kyteError.message || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>File Path</th>
                            <td>${kyteError.file || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Line Number</th>
                            <td>${kyteError.line || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Date Created</th>
                            <td>${formattedDate}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Context Data -->
        ${kyteError.context ? `
        <div class="detail-section">
            <div class="section-header">
                <div class="icon">
                    <i class="fas fa-code"></i>
                </div>
                <h2>Context Data</h2>
            </div>
            <div class="section-content">
                <div class="code-block">
                    <div class="code-block-header">
                        <span class="code-block-title">Structured Context</span>
                        <button class="copy-button" onclick="copyToClipboard('context-content')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre id="context-content">${contextFormatted}</pre>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Stack Trace -->
        ${traceFormatted ? `
        <div class="detail-section">
            <div class="section-header">
                <div class="icon">
                    <i class="fas fa-stream"></i>
                </div>
                <h2>Stack Trace</h2>
            </div>
            <div class="section-content">
                <div class="code-block">
                    <div class="code-block-header">
                        <span class="code-block-title">Full Stack Trace</span>
                        <button class="copy-button" onclick="copyToClipboard('trace-content')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre id="trace-content">${traceFormatted}</pre>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Request Data -->
        ${kyteError.data ? `
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
                        <span class="code-block-title">Request Payload</span>
                        <button class="copy-button" onclick="copyToClipboard('data-content')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre id="data-content">${dataFormatted}</pre>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Response Data -->
        ${kyteError.response ? `
        <div class="detail-section">
            <div class="section-header">
                <div class="icon">
                    <i class="fas fa-reply"></i>
                </div>
                <h2>Response Data</h2>
            </div>
            <div class="section-content">
                <div class="code-block">
                    <div class="code-block-header">
                        <span class="code-block-title">Server Response</span>
                        <button class="copy-button" onclick="copyToClipboard('response-content')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre id="response-content">${responseFormatted}</pre>
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

    $('#logDetailsContainer').html(htmlContent);

    $('.closeWindowButton').click(function() {
        window.close();
    });
}

// Helper functions
function getLogLevelConfig(level) {
    const configs = {
        'debug': {
            color: '#6c757d',
            icon: 'fas fa-bug'
        },
        'info': {
            color: '#0dcaf0',
            icon: 'fas fa-info-circle'
        },
        'warning': {
            color: '#ffc107',
            icon: 'fas fa-exclamation-triangle'
        },
        'error': {
            color: '#dc3545',
            icon: 'fas fa-times-circle'
        },
        'critical': {
            color: '#6f42c1',
            icon: 'fas fa-skull-crossbones'
        }
    };

    return configs[level] || configs['error'];
}

function formatJSON(data) {
    if (!data) return 'No data available';

    try {
        const parsed = typeof data === 'object' ? data : JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        // If not JSON, return as-is (might be a string)
        return data.toString();
    }
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;

    navigator.clipboard.writeText(text).then(function() {
        // Show feedback
        const button = event.target.closest('.copy-button');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    });
}

// Handle no log found case
function showNoLogFound() {
    const htmlContent = `
        <div class="no-data">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>No Log Details Found</h3>
            <p>The requested log entry could not be found or may have been removed.</p>
            <button class="btn-close-window" onclick="window.close()">
                <i class="fas fa-times"></i>
                Close Window
            </button>
        </div>
    `;
    $('#logDetailsContainer').html(htmlContent);
}

// Original JavaScript integration
document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    if (_ks.isSession()) {
        let request = _ks.getPageRequest();

        _ks.get("KyteError", "id", request.idx, [], function(r) {
            if (r.data.length == 1) {
                let kyteError = r.data[0];
                populateLogDetails(kyteError);
            } else {
                console.error("no log found");
                showNoLogFound();
            }
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});
