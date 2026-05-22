// kyte-connect.example.js — TEMPLATE
//
// Copy this file to /assets/js/source/kyte-connect.js (gitignored per-
// deployment) and fill in the endpoint. The Shipyard build pipeline
// (`npm run build`) produces /assets/js/kyte-connect.js, which is what
// the install actually serves to browsers.
//
// JWT mode is the default (recommended). It requires kyte-php v4.4.0+
// with AUTH_STRATEGY_DISPATCHER='on' and KYTE_JWT_SECRET defined in
// config.php — no static credentials in the browser.

let endpoint = 'https://your-kyte-api.example.com';

// --- HMAC mode (legacy) — uncomment to use ---------------------------------
//
// Required only if your kyte-php is older than v4.4.0, or you have
// AUTH_STRATEGY_DISPATCHER unset / 'off'. The four globals below were the
// only model before v2.0.0 of Shipyard. Once you migrate kyte-php, you can
// remove the authMode line and the three credential globals — Shipyard will
// fall back to the JWT default.
//
// let authMode = 'hmac';
// let publickey = '<your-public-key>';
// let identifier = '<your-identifier>';
// let account = '<your-account-number>';
//
// ---------------------------------------------------------------------------
