document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    
    if (_ks.isSession()) {
        // get url param
        let request = _ks.getPageRequest();

        _ks.get("KyteError", "id", request.idx, [], function(r) {
            if (r.data.length ==  1) {
                let kyteError = r.data[0];
                populateLogDetails(kyteError);
            } else {
                console.error("no log found");
                $('#logDetailsContainer').html('<p>No log details found.</p>');
            }
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});

function populateLogDetails(kyteError) {
    let dataFormatted = (typeof kyteError.data === 'object') ? JSON.stringify(kyteError.data, null, 4) : kyteError.data;
    let responseFormatted = (typeof kyteError.response === 'object') ? JSON.stringify(kyteError.response, null, 4) : kyteError.response;

    let htmlContent = `
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>Error Log Details</h2>
        <button class="btn btn-danger closeWindowButton">Close Window</button>
    </div>
    <div class="card mb-3">
        <div class="card-header">Error Details</div>
        <div class="card-body">
            <table class="table">
                <tbody>
                    <tr><th>Account ID</th><td>${kyteError.account_id}</td></tr>
                    <tr><th>User ID</th><td>${kyteError.user_id}</td></tr>
                    <tr><th>API Key</th><td>${kyteError.api_key || 'N/A'}</td></tr>
                    <tr><th>Application ID</th><td>${kyteError.app_id}</td></tr>
                    <tr><th>Model</th><td>${kyteError.model}</td></tr>
                    <tr><th>Request</th><td>${kyteError.request}</td></tr>
                    <tr><th>Message</th><td>${kyteError.message}</td></tr>
                    <tr><th>File</th><td>${kyteError.file}</td></tr>
                    <tr><th>Line</th><td>${kyteError.line}</td></tr>
                    <tr><th>Date Created</th><td>${kyteError.date_created}</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="card mb-3">
        <div class="card-header">Data</div>
        <div class="card-body">
            <pre>${dataFormatted}</pre>
        </div>
    </div>

    <div class="card mb-3">
        <div class="card-header">Response</div>
        <div class="card-body">
            <pre>${responseFormatted}</pre>
        </div>
    </div>

    <div class="text-end">
        <button class="btn btn-danger closeWindowButton my-3">Close Window</button>
    </div>`;

    $('#logDetailsContainer').html(htmlContent);

    $('.closeWindowButton').click(function() {
        window.close();
    });
}