/**
 * Shared utilities for Activity Log pages
 * Used by: kyte-shipyard-activity-log.js, kyte-shipyard-activity-log-details.js, kyte-shipyard-system-activity-log.js
 */

// Severity color mapping
const ACTIVITY_SEVERITY_COLORS = {
    'info': '#0dcaf0',
    'warning': '#ffc107',
    'critical': '#dc3545'
};

// Action color mapping
const ACTIVITY_ACTION_COLORS = {
    'GET': '#0dcaf0',
    'POST': '#10b981',
    'PUT': '#f59e0b',
    'DELETE': '#dc3545',
    'LOGIN': '#6f42c1',
    'LOGOUT': '#6c757d',
    'LOGIN_FAIL': '#dc3545'
};

// Action icon mapping
const ACTIVITY_ACTION_ICONS = {
    'GET': 'fas fa-eye',
    'POST': 'fas fa-plus-circle',
    'PUT': 'fas fa-edit',
    'DELETE': 'fas fa-trash-alt',
    'LOGIN': 'fas fa-sign-in-alt',
    'LOGOUT': 'fas fa-sign-out-alt',
    'LOGIN_FAIL': 'fas fa-exclamation-triangle'
};

// Severity icon mapping
const ACTIVITY_SEVERITY_ICONS = {
    'info': 'fas fa-info-circle',
    'warning': 'fas fa-exclamation-triangle',
    'critical': 'fas fa-times-circle'
};

/**
 * Render an action badge
 */
function renderActionBadge(action) {
    if (!action) return '<span style="color:#cbd5e0;">N/A</span>';
    const color = ACTIVITY_ACTION_COLORS[action] || '#6c757d';
    return `<span style="display:inline-block;padding:4px 10px;background:${color};color:white;border-radius:6px;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${action}</span>`;
}

/**
 * Render a severity badge
 */
function renderSeverityBadge(severity) {
    if (!severity) return '<span style="color:#cbd5e0;">N/A</span>';
    const color = ACTIVITY_SEVERITY_COLORS[severity] || '#6c757d';
    const textColor = severity === 'warning' ? '#2d3748' : 'white';
    return `<span style="display:inline-block;padding:4px 10px;background:${color};color:${textColor};border-radius:6px;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${severity}</span>`;
}

/**
 * Render a category badge
 */
function renderCategoryBadge(category) {
    if (!category) return '<span style="color:#cbd5e0;">N/A</span>';
    const categoryColors = {
        'auth': '#6f42c1',
        'data': '#0dcaf0',
        'config': '#f59e0b',
        'system': '#6c757d'
    };
    const color = categoryColors[category] || '#6c757d';
    return `<span style="display:inline-block;padding:4px 10px;background:${color};color:white;border-radius:6px;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${category}</span>`;
}

/**
 * Render a response code badge
 */
function renderResponseCodeBadge(code) {
    if (!code) return '<span style="color:#cbd5e0;">N/A</span>';
    let color = '#10b981'; // green for 2xx
    if (code >= 400 && code < 500) color = '#f59e0b'; // orange for 4xx
    if (code >= 500) color = '#dc3545'; // red for 5xx
    return `<span style="display:inline-block;padding:4px 10px;background:${color};color:white;border-radius:6px;font-size:0.75rem;font-weight:600;">${code}</span>`;
}

/**
 * Setup filter panel event handlers for activity log
 */
function setupActivityLogFilters(initTableFn) {
    // Initialize date pickers
    $("#filter-start-date").datepicker({
        dateFormat: 'mm/dd/yy',
        maxDate: 0,
        onSelect: function(dateText) {
            let selectedDate = $(this).datepicker('getDate');
            $("#filter-end-date").datepicker('option', 'minDate', selectedDate);
        }
    });

    $("#filter-end-date").datepicker({
        dateFormat: 'mm/dd/yy',
        maxDate: 0
    });

    // Apply filter button
    $("#btn-apply-filter").on('click', function() {
        $('#pageLoaderModal').modal('show');
        initTableFn();
    });

    // Clear filter button
    $("#btn-clear-filter").on('click', function() {
        // Reset form fields
        $("#filter-action").val('');
        $("#filter-model").val('');
        $("#filter-severity").val([]);
        $("#filter-category").val('');
        $("#filter-start-date").val('');
        $("#filter-end-date").val('');
        if ($("#filter-user").length) $("#filter-user").val('');
        if ($("#filter-application").length) $("#filter-application").val('');

        // Reset date picker constraints
        $("#filter-end-date").datepicker('option', 'minDate', null);

        // Reload table
        $('#pageLoaderModal').modal('show');
        initTableFn();
    });
}

/**
 * Build filter conditions from filter panel
 */
function buildActivityLogFilterConditions() {
    let conditions = [];

    // Action filter
    const action = $("#filter-action").val();
    if (action && action.length > 0) {
        conditions.push({ field: 'action_type', value: action });
    }

    // Model filter
    const model = $("#filter-model").val();
    if (model && model.length > 0) {
        conditions.push({ field: 'model_name', value: model });
    }

    // Severity filter
    const selectedSeverities = $("#filter-severity").val();
    if (selectedSeverities && selectedSeverities.length > 0) {
        conditions.push({ field: 'severity', value: selectedSeverities.join(',') });
    }

    // Category filter
    const category = $("#filter-category").val();
    if (category && category.length > 0) {
        conditions.push({ field: 'event_category', value: category });
    }

    // User filter (system-level only)
    const userId = $("#filter-user").val();
    if (userId && userId.length > 0) {
        conditions.push({ field: 'user_id', value: userId });
    }

    // Application filter (system-level only)
    const applicationId = $("#filter-application").val();
    if (applicationId && applicationId.length > 0) {
        conditions.push({ field: 'application_id', value: applicationId });
    }

    // Date range filters
    const startDate = $("#filter-start-date").val();
    if (startDate) {
        const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
        conditions.push({ field: 'start_date', value: startTimestamp });
    }

    const endDate = $("#filter-end-date").val();
    if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        const endTimestamp = Math.floor(endDateObj.getTime() / 1000);
        conditions.push({ field: 'end_date', value: endTimestamp });
    }

    return conditions;
}

/**
 * Format JSON for display
 */
function formatActivityJSON(data) {
    if (!data) return 'No data available';
    try {
        const parsed = typeof data === 'object' ? data : JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        return data.toString();
    }
}

/**
 * Copy content to clipboard
 */
function copyActivityToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const text = element.textContent;

    navigator.clipboard.writeText(text).then(function() {
        const button = event.target.closest('.copy-button');
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        }
    });
}

/**
 * Escape HTML for safe display
 */
function escapeActivityHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
