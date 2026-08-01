/**
 * OAuth 2.1 consent page (KYTE-#551, hosted MCP connector).
 *
 * This is the interactive `authorization_endpoint` — where Claude / ChatGPT
 * send the user during "Connect". It reuses the Shipyard login the user
 * already has, shows what the client is asking for, and on Approve calls the
 * kyte-php consent endpoints to mint a single-use auth code, then redirects
 * back to the client.
 *
 * Flow:
 *   1. Require a Shipyard session (bounce to /?redir=… login, which returns here).
 *   2. GET  {api}/oauth/consent/client  (Bearer JWT) -> client name + scopes.
 *   3. Render "Authorize <client> to access Kyte" + the requested scopes.
 *   4. Approve -> POST {api}/oauth/consent/approve -> {redirect_uri, code, state}
 *      -> redirect to redirect_uri?code=…&state=…
 *      Cancel  -> redirect_uri?error=access_denied&state=…
 *
 * The connection is to the user's ACCOUNT (account-wide, v1) — an account may
 * own many apps, so the copy says "access Kyte", not a single app.
 */
document.addEventListener('KyteInitialized', function (e) {
    var _ks = e.detail._ks;

    var returnHere = function () {
        return '/?redir=' + encodeURIComponent(window.location.pathname + window.location.search);
    };

    // 1. Require a Shipyard session.
    if (!_ks.isSession(false, false)) {
        window.location.href = returnHere();
        return;
    }

    // Gather the OAuth authorize params from the query string.
    var q = new URLSearchParams(window.location.search);
    var params = {
        client_id:             q.get('client_id') || '',
        redirect_uri:          q.get('redirect_uri') || '',
        response_type:         q.get('response_type') || 'code',
        scope:                 q.get('scope') || '',
        state:                 q.get('state') || '',
        code_challenge:        q.get('code_challenge') || '',
        code_challenge_method: q.get('code_challenge_method') || ''
    };

    var apiBase = _ks.url;              // kyte-php base URL (from kyte-connect.js)
    var bearer  = _ks.jwtAccessToken;   // the Shipyard session JWT

    var SCOPE_LABELS = {
        read:      'View your applications, data models, pages, and content',
        schema:    'Create and modify data models',
        provision: 'Create and manage sites',
        draft:     'Create draft changes to pages, scripts, and functions',
        commit:    'Publish changes to your live sites'
    };

    function showError(msg) {
        document.getElementById('consent-loading').classList.add('d-none');
        document.getElementById('consent-card').classList.add('d-none');
        var el = document.getElementById('consent-error');
        el.querySelector('.error-text').textContent = msg;
        el.classList.remove('d-none');
    }

    function backToClient(redirectUri, extraQuery) {
        var sep = redirectUri.indexOf('?') >= 0 ? '&' : '?';
        var url = redirectUri + sep + extraQuery;
        if (params.state) { url += '&state=' + encodeURIComponent(params.state); }
        window.location.href = url;
    }

    // 2. Fetch client info (validates the request too).
    fetch(apiBase + '/oauth/consent/client?' + new URLSearchParams(params).toString(), {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + bearer }
    })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (res) {
            if (res.status === 401) { window.location.href = returnHere(); return; }
            if (res.status !== 200) {
                showError((res.body && res.body.error_description) || 'This authorization request is invalid.');
                return;
            }
            renderConsent(res.body);
        })
        .catch(function () { showError('Could not reach the authorization server. Please try again.'); });

    function renderConsent(info) {
        var name = info.client_name || 'The application';
        document.getElementById('client-name').textContent = name;
        var n2 = document.getElementById('client-name-2');
        if (n2) { n2.textContent = name + ' '; }

        var list = document.getElementById('scope-list');
        list.innerHTML = '';
        (info.scopes || []).forEach(function (s) {
            var li = document.createElement('li');
            li.textContent = SCOPE_LABELS[s] || s;
            list.appendChild(li);
        });

        document.getElementById('consent-loading').classList.add('d-none');
        document.getElementById('consent-card').classList.remove('d-none');

        document.getElementById('btn-authorize').addEventListener('click', approve);
        document.getElementById('btn-cancel').addEventListener('click', function () {
            if (params.redirect_uri) { backToClient(params.redirect_uri, 'error=access_denied'); }
            else { window.location.href = '/app/'; }
        });
    }

    // 3. Approve -> mint the code -> redirect back to the client.
    function approve() {
        var btn = document.getElementById('btn-authorize');
        btn.disabled = true;
        btn.textContent = 'Authorizing…';

        fetch(apiBase + '/oauth/consent/approve', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + bearer, 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        })
            .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
            .then(function (res) {
                if (res.status === 401) { window.location.href = returnHere(); return; }
                if (res.status !== 200 || !res.body.code) {
                    showError((res.body && res.body.error_description) || 'Authorization failed.');
                    btn.disabled = false;
                    btn.textContent = 'Authorize';
                    return;
                }
                backToClient(res.body.redirect_uri, 'code=' + encodeURIComponent(res.body.code));
            })
            .catch(function () {
                showError('Authorization failed. Please try again.');
                btn.disabled = false;
                btn.textContent = 'Authorize';
            });
    }
});
