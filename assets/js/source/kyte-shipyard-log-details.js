// Enhanced log details population function
function populateLogDetails(kyteError) {
    const severity = determineSeverity(kyteError);
    const formattedDate = formatDate(kyteError.date_created);
    const dataFormatted = formatJSON(kyteError.data);
    const responseFormatted = formatJSON(kyteError.response);

    const htmlContent = `
        <!-- Page Header -->
        <div class="log-header">
            <div class="log-title">
                <h1>Error Log Details</h1>
                <div class="error-badge severity-${severity}">
                    <i class="fas fa-exclamation-triangle"></i>
                    ${severity.toUpperCase()} SEVERITY
                </div>
            </div>
            <button class="btn-close-window closeWindowButton">
                <i class="fas fa-times"></i>
                Close Window
            </button>
        </div>

        <!-- Error Summary -->
        <div class="error-summary">
            <div class="summary-card severity-${severity}">
                <h3>Error Type</h3>
                <div class="value">${kyteError.model || 'Unknown'}</div>
                <div class="label">Model/Component</div>
            </div>
            <div class="summary-card severity-${severity}">
                <h3>Request Type</h3>
                <div class="value">${kyteError.request || 'N/A'}</div>
                <div class="label">API Request</div>
            </div>
            <div class="summary-card severity-${severity}">
                <h3>Occurrence</h3>
                <div class="value">${formattedDate}</div>
                <div class="label">Date & Time</div>
            </div>
            <div class="summary-card severity-${severity}">
                <h3>Location</h3>
                <div class="value">Line ${kyteError.line || 'Unknown'}</div>
                <div class="label">${kyteError.file || 'Unknown File'}</div>
            </div>
        </div>

        <!-- Error Details -->
        <div class="detail-section">
            <div class="section-header">
                <div class="icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <h2>Error Information</h2>
            </div>
            <div class="section-content">
                <table class="error-details-table">
                    <tbody>
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
                            <th>Error Message</th>
                            <td style="color: #ef4444; font-weight: 600;">${kyteError.message || 'N/A'}</td>
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
function determineSeverity(kyteError) {
    const message = (kyteError.message || '').toLowerCase();
    if (message.includes('fatal') || message.includes('critical') || message.includes('exception')) {
        return 'high';
    } else if (message.includes('warning') || message.includes('deprecated')) {
        return 'medium';
    }
    return 'high'; // Default to high for errors
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
}

function formatJSON(data) {
    if (!data) return 'No data available';
    
    try {
        const parsed = typeof data === 'object' ? data : JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
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
            <p>The requested error log could not be found or may have been removed.</p>
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