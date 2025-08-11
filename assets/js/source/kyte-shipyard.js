var KS_VERSION = '1.6.0-preview';

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
    if (typeof endpoint === 'undefined' || typeof publickey === 'undefined' || 
        typeof identifier === 'undefined' || typeof account === 'undefined') {
        callback(new Error('Required credentials are not defined properly.'));
        return;
    }

    var _ks = new Kyte(endpoint, publickey, identifier, account);
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
    document.getElementById("kyteShipyardVersion").textContent = KS_VERSION;
    document.getElementById("kyteJSVersion").textContent = typeof Kyte.VERSION !== 'undefined' ? Kyte.VERSION : 'pre-1.0.5';

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