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

        // Consider jobs overdue only if they're more than 5 minutes late
        // This handles normal scheduling delays and frequent jobs gracefully
        if (diff < -300) {
            // More than 5 minutes overdue
            let minutesLate = Math.abs(Math.floor(diff / 60));
            return '<span style="color: #e53e3e;">Overdue (' + minutesLate + ' min)</span>';
        } else if (diff < 0) {
            // Less than 5 minutes overdue - likely running or about to run
            return '<span style="color: #f6ad55;">Running soon</span>';
        } else if (diff < 60) {
            // Less than 1 minute away
            return '<span style="color: #48bb78;">In ' + diff + ' sec</span>';
        } else if (diff < 3600) {
            // Less than 1 hour away
            return '<span style="color: #48bb78;">In ' + Math.floor(diff / 60) + ' min</span>';
        } else {
            // More than 1 hour away
            return date.toLocaleString();
        }
    }},
    {'targets':5,'data':'id','label':'Actions', 'orderable': false, render: function(data, type, row, meta) {
        // Recover button (only if in DLQ) - keep this since it's critical
        if (row.in_dead_letter_queue) {
            return '<button class="action-btn btn-recover btn-recover-job" data-id="' + data + '" data-name="' + row.name + '" title="Recover from DLQ"><i class="fas fa-life-ring"></i></button>';
        }
        return ''; // No actions - click row to view details
    }}
];
