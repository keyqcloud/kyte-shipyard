var KS_VERSION = '1.1.27';

$(document).ready(function() {
    document.getElementById("kyteShipyardVersion").textContent = KS_VERSION;
    document.getElementById("kyteJSVersion").textContent = typeof Kyte.VERSION !== 'undefined' ? Kyte.VERSION : 'pre-1.0.5';
});