let colDefControllers = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'dataModel.name','label':'Model', render: function(data, type, row, meta) { return data ? data:'Virtual'; }},
    {'targets':2,'data':'description','label':'Description'},
];

let colDefAPI = [
    {'targets':0,'data':'identifier','label':'Identifier'},
    {'targets':1,'data':'public_key','label':'Public Key'},
    {'targets':2,'data':'secret_key','label':'Secret Key'},
];

let colDefCronJobs = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'schedule_type','label':'Schedule', render: function(data, type, row, meta) {
        let badge = '<span class="schedule-badge">' + data.toUpperCase() + '</span>';
        if (data === 'cron' && row.cron_expression) {
            badge += '<br><small>' + row.cron_expression + '</small>';
        } else if (data === 'interval' && row.interval_seconds) {
            badge += '<br><small>' + row.interval_seconds + 's</small>';
        } else if (data === 'daily' && row.time_of_day) {
            badge += '<br><small>' + row.time_of_day + ' (' + (row.timezone || 'UTC') + ')</small>';
        } else if (data === 'weekly' && row.time_of_day) {
            let days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            badge += '<br><small>' + days[row.day_of_week] + ' ' + row.time_of_day + '</small>';
        } else if (data === 'monthly' && row.time_of_day) {
            badge += '<br><small>Day ' + row.day_of_month + ' @ ' + row.time_of_day + '</small>';
        }
        return badge;
    }},
    {'targets':2,'data':'enabled','label':'Status', render: function(data, type, row, meta) {
        if (row.in_dead_letter_queue) {
            return '<span class="status-badge status-dlq" title="' + (row.dead_letter_reason || '') + '">DEAD LETTER QUEUE</span>';
        }
        return data == 1 ? '<span class="status-badge status-enabled">ENABLED</span>' : '<span class="status-badge status-disabled">DISABLED</span>';
    }},
    {'targets':3,'data':'execution_summary.success_rate','label':'Success Rate', render: function(data, type, row, meta) {
        if (!row.execution_summary || row.execution_summary.total_executions === 0) {
            return '<span style="color: #a0aec0;">No executions</span>';
        }
        let rate = row.execution_summary.success_rate || 0;
        let total = row.execution_summary.total_executions || 0;
        let successful = row.execution_summary.successful || 0;
        let cssClass = rate >= 90 ? 'success-high' : (rate >= 70 ? 'success-medium' : 'success-low');
        return '<span class="' + cssClass + '">' + rate + '%</span><br><small>' + successful + '/' + total + ' runs</small>';
    }},
    {'targets':4,'data':'next_run','label':'Next Run', render: function(data, type, row, meta) {
        if (!data) return '<span style="color: #a0aec0;">Not scheduled</span>';
        let date = new Date(data * 1000);
        let now = new Date();
        let diff = Math.floor((date - now) / 1000);

        if (diff < 0) {
            return '<span style="color: #e53e3e;">Overdue</span>';
        } else if (diff < 3600) {
            return '<span style="color: #48bb78;">In ' + Math.floor(diff / 60) + ' min</span>';
        } else {
            return date.toLocaleString();
        }
    }},
    {'targets':5,'data':'id','label':'Actions', orderable: false, render: function(data, type, row, meta) {
        let actions = '';

        // Trigger button (only if enabled and not in DLQ)
        if (row.enabled && !row.in_dead_letter_queue) {
            actions += '<button class="action-btn btn-trigger btn-trigger-job" data-id="' + data + '" data-name="' + row.name + '" title="Trigger Now"><i class="fas fa-play"></i></button>';
        }

        // Recover button (only if in DLQ)
        if (row.in_dead_letter_queue) {
            actions += '<button class="action-btn btn-recover btn-recover-job" data-id="' + data + '" data-name="' + row.name + '" title="Recover from DLQ"><i class="fas fa-life-ring"></i></button>';
        }

        // View executions button
        actions += '<button class="action-btn btn-view btn-view-executions" data-id="' + data + '" title="View Executions"><i class="fas fa-history"></i></button>';

        // View versions button
        actions += '<button class="action-btn btn-view btn-view-versions" data-id="' + data + '" title="Version History"><i class="fas fa-code-branch"></i></button>';

        return actions;
    }}
];
