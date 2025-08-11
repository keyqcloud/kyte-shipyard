// Updated kyte-shipyard-settings.js
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

let fldsAdmin = [
    [
        {
            'field': 'name',
            'type': 'text',
            'label': 'Name (*)',
            'required': true
        },
    ],
    [
        {
            'field': 'email',
            'type': 'text',
            'label': 'E-mail (*)',
            'required': true
        }
    ],
    [
        {
            'field': 'password',
            'type': 'password',
            'label': 'Password (leave blank for user to setup)',
            'required': false
        }
    ]
];

let colDefUsers = [
    { 'targets': 0, 'data': 'name', 'label': 'Name' },
    { 'targets': 1, 'data': 'email', 'label': 'E-mail' },
    { 'targets': 2, 'data': 'lastLogin', 'label': 'Last Login' },
];

let colDefAPI = [
    { 'targets': 0, 'data': 'username', 'label': 'Key Name' },
    { 'targets': 1, 'data': 'public_key', 'label': 'Public Key' },
    { 'targets': 2, 'data': 'date_created', 'label': 'Created' },
];

var kyte_api_version = "unknown";

class SettingsManager {
    constructor(kyteSession) {
        this._ks = kyteSession;
        this.profile = null;
        this.reloadTimeout = null;
        this.init();
    }

    init() {
        // Setup password requirements
        this.setupPasswordRequirements();
        
        // Load profile data
        this.loadProfile();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Initialize update checking
        this.initializeUpdateSystem();
        
        // Load external content
        this.loadExternalContent();
    }

    setupPasswordRequirements() {
        // Initialize password requirement validator
        if (typeof KytePasswordRequirement !== 'undefined') {
            this.passreq = new KytePasswordRequirement(
                this._ks, 
                $("#passwordRequirements"), 
                $("#new_password"), 
                $("#confirm_password")
            );
            this.passreq.init();
        }
    }

    loadProfile() {
        $('#pageLoaderModal').modal('show');
        
        this._ks.get("KyteProfile", null, null, [], (response) => {
            kyte_api_version = response.engine_version;
            $("#currentKytePHPVersion").text(kyte_api_version);
            
            if (response.data && response.data[0]) {
                this.profile = response.data[0];
                $("#profile_email").val(this.profile['email']);
                $("#accountNumber").text(this.profile['kyte_account']['number']);
            }
            
            // Initialize data tables
            this.initializeDataTables();
            
            $('#pageLoaderModal').modal('hide');
        }, (error) => {
            this.showError("Error retrieving profile information: " + error.error);
            $('#pageLoaderModal').modal('hide');
        });
    }

    initializeDataTables() {
        // Admin table setup
        const hidden = [
            { 'name': 'kyte_account', 'value': 1 },
            { 'name': 'role', 'value': 1 }
        ];

        if (typeof KyteTable !== 'undefined' && typeof KyteForm !== 'undefined') {
            // Admin table
            this.tblAdmin = new KyteTable(
                this._ks, 
                $("#admin-table"), 
                { 'name': "KyteUser", 'field': "kyte_account", 'value': 1 }, 
                colDefUsers, 
                true, 
                [0, "asc"], 
                true, 
                true
            );
            this.tblAdmin.init();

            // Admin form
            this.frmUser = new KyteForm(
                this._ks, 
                $("#adminForm"), 
                "KyteUser", 
                hidden, 
                fldsAdmin, 
                "Administrator", 
                this.tblAdmin, 
                true, 
                $("#newAdmin")
            );
            this.frmUser.init();
            this.tblAdmin.bindEdit(this.frmUser);

            // API table
            this.tblAPI = new KyteTable(
                this._ks, 
                $("#api-table"), 
                { 'name': "KyteAPIKey", 'field': null, 'value': null }, 
                colDefAPI, 
                true, 
                [0, "asc"], 
                false, 
                false
            );
            this.tblAPI.init();
        }
    }

    setupEventHandlers() {
        // Email update handler
        $("#updateEmail").click((e) => {
            e.preventDefault();
            e.stopPropagation();
            this.updateEmail();
        });

        // Password update handler
        $("#updatePassword").click((e) => {
            e.preventDefault();
            e.stopPropagation();
            this.updatePassword();
        });

        // Update system handlers
        $("#updateKyteShipyard").click(() => {
            $("#cacheInstructionModal").modal('show');
        });

        $("#updateNow").click(() => {
            this.startUpdate();
        });
    }

    updateEmail() {
        const newEmail = $("#profile_email").val();
        
        if (!this.validateEmail(newEmail)) {
            this.showError("Please enter a valid email address.");
            return;
        }

        this._ks.put("KyteProfile", null, null, { "email": newEmail }, null, [], (response) => {
            if (response.data && response.data[0]) {
                this.profile = response.data[0];
                $("#profile_email").val(this.profile['email']);
            }
            this.showSuccess("Email successfully updated!");
        }, (error) => {
            this.showError("Unable to update email: " + error.error);
            // Revert to old email
            $("#profile_email").val(this.profile['email']);
        });
    }

    updatePassword() {
        const newPassword = $("#new_password").val();
        const confirmPassword = $("#confirm_password").val();

        if (confirmPassword !== newPassword) {
            this.showError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            this.showError("Password must be at least 8 characters long.");
            return;
        }

        if (this.passreq && !this.passreq.validatePassword($("#new_password"))) {
            this.showError("Password does not meet the requirements.");
            return;
        }

        this._ks.put('KyteProfile', null, null, { 'password': newPassword }, null, [], (response) => {
            this.showSuccess("Your password has been successfully updated.");
            $("#new_password").val('');
            $("#confirm_password").val('');
        }, (error) => {
            this.showError("Unable to update your password. Please try again later.");
        });
    }

    initializeUpdateSystem() {
        // Set current version
        if (typeof KS_VERSION !== 'undefined') {
            document.getElementById("currentKSVERSION").textContent = KS_VERSION;
        }

        // Check for updates on load
        this.checkForUpdates();
        
        // Check for update in progress
        this.checkForUpdateAndOpenModal();
    }

    checkForUpdates() {
        const changelogUrl = 'https://cdn.keyqcloud.com/kyte/shipyard/archive/CHANGELOG.md';

        fetch(changelogUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                this.processChangelog(data);
                document.getElementById('changelogContent').innerHTML = marked.parse(data);
                document.getElementById('changelogContent').style.display = 'block';
            })
            .catch(error => {
                this.showUpdateError('Error checking for updates. Please try again later.');
                console.error('Update check error:', error);
            });
    }

    processChangelog(changelogContent) {
        const lines = changelogContent.split('\n');
        let latestVersion = '';
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('## ')) {
                latestVersion = lines[i].substring(3).trim();
                break;
            }
        }

        const currentVersion = typeof KS_VERSION !== 'undefined' ? KS_VERSION : '0.0.0';
        
        if (this.isNewerVersion(latestVersion, currentVersion)) {
            this.showUpdateAvailable(latestVersion);
        } else if (latestVersion === currentVersion) {
            this.showUpToDate();
        } else {
            this.showUpdateError('Unable to determine the latest version.');
        }
    }

    showUpdateAvailable(version) {
        const wrapper = document.getElementById('updateResultsWrapper');
        wrapper.innerHTML = `
            <div class="update-status warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Newer version available: <strong>${version}</strong>
            </div>
        `;
        document.getElementById('updateKyteShipyard').classList.remove('d-none');
    }

    showUpToDate() {
        const wrapper = document.getElementById('updateResultsWrapper');
        wrapper.innerHTML = `
            <div class="update-status success">
                <i class="fas fa-check-circle me-2"></i>
                You are already using the latest version.
            </div>
        `;
        document.getElementById('updateKyteShipyard').classList.add('d-none');
        this.deleteUpdateCookieAndCloseModal();
    }

    showUpdateError(message) {
        const wrapper = document.getElementById('updateResultsWrapper');
        wrapper.innerHTML = `
            <div class="update-status warning">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${message}
            </div>
        `;
        document.getElementById('updateKyteShipyard').classList.add('d-none');
        this.deleteUpdateCookieAndCloseModal();
    }

    isNewerVersion(newVersion, oldVersion) {
        const newParts = newVersion.split('.').map(Number);
        const oldParts = oldVersion.split('.').map(Number);

        for (let i = 0; i < Math.max(newParts.length, oldParts.length); i++) {
            const newPart = newParts[i] || 0;
            const oldPart = oldParts[i] || 0;
            
            if (newPart > oldPart) return true;
            if (newPart < oldPart) return false;
        }
        return false;
    }

    startUpdate() {
        $("#cacheInstructionModal").modal('hide');
        $('#updateLoadingModal').modal('show');
        
        const currentVersion = typeof KS_VERSION !== 'undefined' ? KS_VERSION : '0.0.0';
        
        this._ks.post('KyteShipyardUpdate', { 'current_version': currentVersion }, null, [], (response) => {
            // Set a cookie that Kyte is being updated
            document.cookie = "kyte_update_in_progress=true; path=/";
        
            // Refresh the page after 6 seconds
            this.reloadTimeout = setTimeout(() => {
                location.reload();
            }, 6000);
        }, (error) => {
            console.error(error);
            $('#updateLoadingModal').modal('hide');
            this.showError("FAILED TO UPDATE: " + error);
        });
    }

    checkForUpdateAndOpenModal() {
        const updateInProgress = this.getCookie("kyte_update_in_progress");
        if (updateInProgress && updateInProgress === "true") {
            $('#updateLoadingModal').modal('show');
            // Refresh the page after 6 seconds
            this.reloadTimeout = setTimeout(() => {
                location.reload();
            }, 6000);
        }
    }

    deleteUpdateCookieAndCloseModal() {
        // Delete the cookie by setting its expiry to a past date
        document.cookie = "kyte_update_in_progress=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
        // Dismiss the modal
        $('#updateLoadingModal').modal('hide');

        if (this.reloadTimeout) {
            clearTimeout(this.reloadTimeout);
        }
    }

    loadExternalContent() {
        // Load Kyte PHP changelog and license
        this.getKytePHPChangelog();
        this.getKytePHPLicense();
        this.getKyteShipyardLicense();
    }

    getKytePHPChangelog() {
        const changelogUrl = 'https://raw.githubusercontent.com/keyqcloud/kyte-php/master/CHANGELOG.md';

        fetch(changelogUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(data => {
                document.getElementById('kyteChangelogContent').innerHTML = marked.parse(data);
                document.getElementById('kyteChangelogContent').style.display = 'block';
            })
            .catch(error => {
                console.error('Kyte PHP changelog fetch error:', error);
            });
    }

    getKytePHPLicense() {
        const licenseUrl = 'https://raw.githubusercontent.com/keyqcloud/kyte-php/master/LICENSE';

        fetch(licenseUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(data => {
                document.getElementById('kyteLicenseContent').innerHTML = marked.parse(data);
                document.getElementById('kyteLicenseContent').style.display = 'block';
            })
            .catch(error => {
                console.error('Kyte PHP license fetch error:', error);
            });
    }

    getKyteShipyardLicense() {
        const licenseUrl = 'https://raw.githubusercontent.com/keyqcloud/kyte-shipyard/main/LICENSE';

        fetch(licenseUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(data => {
                document.getElementById('ksLicenseContent').innerHTML = marked.parse(data);
                document.getElementById('ksLicenseContent').style.display = 'block';
            })
            .catch(error => {
                console.error('Kyte Shipyard license fetch error:', error);
            });
    }

    // Utility methods
    getCookie(name) {
        const cookieArr = document.cookie.split(";");
        
        for (let i = 0; i < cookieArr.length; i++) {
            const cookiePair = cookieArr[i].split("=");
            if (name === cookiePair[0].trim()) {
                return decodeURIComponent(cookiePair[1]);
            }
        }
        return null;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showSuccess(message) {
        // You can implement a toast notification system here
        alert(message);
    }

    showError(message) {
        alert(message);
    }
}

// Global instance
window.SettingsManager = null;

// Main initialization
document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    
    if (_ks.isSession()) {
        // Initialize the settings manager
        window.SettingsManager = new SettingsManager(_ks);
    } else {
        location.href = "/?redir=" + encodeURIComponent(window.location);
    }
});


// Navigation functionality
document.querySelectorAll('[data-target]').forEach(button => {
    button.addEventListener('click', function() {
        const target = this.dataset.target;
        
        // Update active nav item
        document.querySelectorAll('[data-target]').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(target).classList.add('active');
    });
});

// Initialize tooltips and other Bootstrap components
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});