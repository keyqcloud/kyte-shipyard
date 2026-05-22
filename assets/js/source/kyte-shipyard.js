var KS_VERSION = '2.0.1';

function loadScript(url, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    script.onload = function() {
        callback(null);
    };

    script.onerror = function() {
        callback(new Error('Failed to load script ' + url));
    };

    document.head.appendChild(script);
}

function initializeKyte(callback) {
    if (typeof endpoint === 'undefined') {
        callback(new Error('endpoint is not defined.'));
        return;
    }

    // Default to JWT bearer auth — no static credentials required client-side.
    // To opt into legacy HMAC, kyte-connect.js must set authMode='hmac' AND
    // provide publickey, identifier, account globals.
    // Shipyard is platform-level (not scoped to a single Kyte Application),
    // so applicationId is null — JwtEndpoint.login treats app_identifier as
    // optional and falls back to KyteUser + default username/password fields.
    // The kyte-api-js v2 library handles /jwt/login, refresh-token rotation,
    // and bearer header attachment internally — no other call sites change.
    var mode = (typeof authMode !== 'undefined') ? authMode : 'jwt';

    var _ks;
    if (mode === 'hmac') {
        if (typeof publickey === 'undefined' || typeof identifier === 'undefined' || typeof account === 'undefined') {
            callback(new Error('HMAC mode requires publickey, identifier, and account globals in kyte-connect.js.'));
            return;
        }
        _ks = new Kyte(endpoint, publickey, identifier, account);
    } else {
        _ks = new Kyte(endpoint, null, null, null, null, { authMode: 'jwt' });
    }

    _ks.init();
    _ks.addLogoutHandler(".logout");

    // Dispatch a custom event after 'k' is initialized
    var kyteInitializedEvent = new CustomEvent('KyteInitialized', { detail: { _ks: _ks } });
    document.dispatchEvent(kyteInitializedEvent);
}

// function displayKyteInitializationError(message) {
//     var errorMessage = '<div style="text-align:center; margin-top:20px; color: white !important;">' +
//                         '<i class="fas fa-exclamation-triangle fa-4x mb-3"></i>' +
//                         '<h1>Error Initializing Kyte</h1>' +
//                         message +
//                         '</div>';

//     document.body.innerHTML = errorMessage;
// }
function displayKyteInitializationError(message) {
    var errorMessage = `
        <div style="text-align:center; margin-top:50px; color: #333; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ff6f61; margin-bottom: 20px;"></i>
            <h1>Error Initializing Kyte</h1>
            <div style="margin-top: 20px; font-size: 1.2rem;">${message}</div>
        </div>`;

    document.body.style = 'display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #eaeaea;';
    document.body.innerHTML = errorMessage;
}

$(document).ready(function() {
    var versionEl = document.getElementById("kyteShipyardVersion");
    if (versionEl) versionEl.textContent = KS_VERSION;
    var jsVersionEl = document.getElementById("kyteJSVersion");
    if (jsVersionEl) jsVersionEl.textContent = typeof Kyte.VERSION !== 'undefined' ? Kyte.VERSION : 'pre-1.0.5';

    loadScript('/assets/js/kyte-connect.js', function(error) {
        if (error) {
            console.error(error);
            displayKyteInitializationError('There was a problem loading <code>kyte-connect.js</code>. Please ensure the script is correctly placed and configured with necessary credentials.');
        } else {
            initializeKyte(function(error) {
                if (error) {
                    console.error(error);
                    displayKyteInitializationError('Failed to initialize Kyte with the provided credentials. Please verify the configuration in <code>kyte-connect.js</code>.');
                }
            });
        }
    });
});