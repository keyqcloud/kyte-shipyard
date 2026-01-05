import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

let fldsAdmin = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name (*)',
            'required':true
        },
    ],
    [
        {
            'field':'email',
            'type':'text',
            'label':'E-mail (*)',
            'required':true
        }
    ],
    [
        {
            'field':'password',
            'type':'password',
            'label':'Password (leave blank for user to setup)',
            'required':false
        }
    ]
];

let colDefUsers = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'email','label':'E-mail'},
    {'targets':2,'data':'lastLogin','label':'Last Login'},
];

var kyte_api_version = "unknown";

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let profile = null;

    // setup password requirements
    var passreq = new KytePasswordRequirement(_ks, $("#passwordRequirements"), $("#new_password"), $("#confirm_password"));
    passreq.init();

    $('#pageLoaderModal').modal('show');
    if (_ks.isSession()) {        
        _ks.get("KyteProfile", null, null, [], function(r) {
            kyte_api_version = r.engine_version;
            $("#currentKytePHPVersion").html(kyte_api_version);
            if (r.data[0]) {
                profile = r.data[0];
                $("#profile_email").val(profile['email']);
                $("#accountNumber").html(profile['kyte_account']['number']);

                // Initialize i18n and language selector
                initializeLanguagePreference(_ks, profile);

                // Initialize account-level language selector
                initializeAccountLanguagePreference(_ks, profile);
            }
            $('#pageLoaderModal').modal('hide');
        }, function(err) {
            alert("Error retrieving profile information."+err.error);
            $('#pageLoaderModal').modal('hide');
        });

        let hidden = [
            {
                'name': 'kyte_account',
                'value': 1
            },
            {
                'name': 'role',
                'value': 1
            }
        ];

        var tblAdmin = new KyteTable(_ks, $("#admin-table"), {'name':"KyteUser",'field':"kyte_account",'value':1}, colDefUsers, true, [0,"asc"], true, true);
        tblAdmin.init();
        var frmUser = new KyteForm(_ks, $("#adminForm"), "KyteUser", hidden, fldsAdmin, "Administrator", tblAdmin, true, $("#newAdmin"));
        frmUser.init();
        tblAdmin.bindEdit(frmUser);

        var tblAPI = new KyteTable(_ks, $("#api-table"), {'name':"KyteAPIKey",'field':null,'value':null}, colDefAPI, true, [0,"asc"], false, false);
        tblAPI.init();

        $("#updateEmail").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            _ks.put("KyteProfile", null, null, {"email":$("#profile_email").val()}, null, [], function(r) {
                if (r.data[0]) {
                    profile = r.data[0];
                    $("#profile_email").val(profile['email']);
                }
                alert("E-mail successfully updated!");
            }, function(err) {
                alert("Unable to update e-mail. "+err.error);
                // revert to old
                $("#profile_email").val(profile['email']);
            })
        });

        $("#updatePassword").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            let p = $("#new_password").val();
            let c = $("#confirm_password").val()

            if (c == p && c.length >= 8 && passreq.validatePassword($("#password"))) {    
                _ks.put('KyteProfile', null, null, {'password':$("#new_password").val()}, null, [], function(r) {
                    alert("Your password has been successfully update.");
                }, function() {
                    alert("Unable to update your password. Please try again later.");
                });
            } else alert("Passwords do not match or they do not meet the password requirement.");
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }

    $("#updateKyteShipyard").click(function() {
        $("#cacheInstructionModal").modal('show');
    });

    var reloadTimeout;
    $("#updateNow").click(function() {
        // Open the loading modal
        $("#cacheInstructionModal").modal('hide');
        $('#updateLoadingModal').modal('show');
        _ks.post('KyteShipyardUpdate', {'current_version':KS_VERSION}, null, [], function(r) {
            // Set a cookie that Kyte is being updated
            document.cookie = "kyte_update_in_progress=true; path=/";
        
            // Refresh the page after 6 seconds
            reloadTimeout = setTimeout(function() {
                location.reload();
            }, 6000);
        }, function(e) {
            console.error(e);
            $('#updateLoadingModal').modal('hide');
            alert("FAILED TO UPDATE: "+e);
        });
    });
    
    function getCookie(name) {
        var cookieArr = document.cookie.split(";");
        
        for(var i = 0; i < cookieArr.length; i++) {
            var cookiePair = cookieArr[i].split("=");
            if(name == cookiePair[0].trim()) {
                return decodeURIComponent(cookiePair[1]);
            }
        }
        return null;
    }
    
    function checkForUpdateAndOpenModal() {
        var updateInProgress = getCookie("kyte_update_in_progress");
        if(updateInProgress && updateInProgress === "true") {
            $('#updateLoadingModal').modal('show');
            // Refresh the page after 6 seconds
            reloadTimeout = setTimeout(function() {
                location.reload();
            }, 6000);
        }
    }
    checkForUpdateAndOpenModal();

    function deleteUpdateCookieAndCloseModal() {
        // Delete the cookie by setting its expiry to a past date
        document.cookie = "kyte_update_in_progress=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
        // Dismiss the modal
        $('#updateLoadingModal').modal('hide');

        if (reloadTimeout) {
            clearTimeout(reloadTimeout);
        }
    }

    document.getElementById("currentKSVERSION").textContent = KS_VERSION;

    function checkForUpdates() {
        var changelogUrl = 'https://cdn.keyqcloud.com/kyte/shipyard/archive/CHANGELOG.md';
    
        fetch(changelogUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                processChangelog(data);
                document.getElementById('changelogContent').innerHTML = marked.parse( data );
                document.getElementById('changelogContent').style.display = 'block';
            })
            .catch(error => {
                document.getElementById('updateResultsWrapper').innerHTML = '<p>Error checking for updates. Please try again later.</p>';
                console.error('There has been a problem with your fetch operation:', error);
            });
    }
    
    function processChangelog(changelogContent) {
        var lines = changelogContent.split('\n');
        var latestVersion = '';
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('## ')) {
                latestVersion = lines[i].substring(3).trim();
                break;
            }
        }
        
        if (isNewerVersion(latestVersion, KS_VERSION)) {
            document.getElementById('updateResultsWrapper').innerHTML = '<p>Newer version available: ' + latestVersion + '</p>';
            document.getElementById('updateKyteShipyard').classList.remove('d-none');
        } else if (latestVersion === KS_VERSION) {
            document.getElementById('updateResultsWrapper').innerHTML = '<p>You are already using the latest version.</p>';
            document.getElementById('updateKyteShipyard').classList.add('d-none');
            deleteUpdateCookieAndCloseModal();
        } else {
            document.getElementById('updateResultsWrapper').innerHTML = '<p>Unable to determine the latest version.</p>';
            document.getElementById('updateKyteShipyard').classList.add('d-none');
            deleteUpdateCookieAndCloseModal();
        }
    }
    
    function isNewerVersion(newVersion, oldVersion) {
        var newParts = newVersion.split('.').map(Number);
        var oldParts = oldVersion.split('.').map(Number);
    
        for (var i = 0; i < newParts.length; i++) {
            if (newParts[i] > (oldParts[i] || 0)) {
                return true;
            } else if (newParts[i] < (oldParts[i] || 0)) {
                return false;
            }
        }
        return false;
    }

    function getKytePHPChangelog() {
        var changelogUrl = 'https://raw.githubusercontent.com/keyqcloud/kyte-php/master/CHANGELOG.md';
    
        fetch(changelogUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                document.getElementById('kyteChangelogContent').innerHTML = marked.parse( data );
                document.getElementById('kyteChangelogContent').style.display = 'block';
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    }

    function getKytePHPLicense() {
        var changelogUrl = 'https://raw.githubusercontent.com/keyqcloud/kyte-php/master/LICENSE';
    
        fetch(changelogUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                document.getElementById('kyteLicenseContent').innerHTML = marked.parse( data );
                document.getElementById('kyteLicenseContent').style.display = 'block';
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    }

    function getKyteShipyardLicense() {
        var changelogUrl = 'https://raw.githubusercontent.com/keyqcloud/kyte-shipyard/main/LICENSE';
    
        fetch(changelogUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                document.getElementById('ksLicenseContent').innerHTML = marked.parse( data );
                document.getElementById('ksLicenseContent').style.display = 'block';
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    }
    
    setupNavigationHandlers();

    // Run the check
    checkForUpdates();

    getKytePHPChangelog();
    getKytePHPLicense();
    getKyteShipyardLicense();
});


// Initialize language preference and selector
function initializeLanguagePreference(_ks, profile) {
    // Initialize KyteI18n library
    const kyteI18n = new KyteI18n('en', '/assets/i18n/');

    // Get user's language preference from profile (if set)
    const userLanguage = profile.language || null;

    // Initialize with user's preference or browser detection
    kyteI18n.init(userLanguage).then(() => {
        console.log('KyteI18n initialized with language:', kyteI18n.getCurrentLanguage());

        // Translate the page
        kyteI18n.translateDOM();

        // Initialize language selector in settings page
        const languageSelector = new KyteLanguageSelector({
            container: '#language-selector-container',
            kyte: _ks,
            i18n: kyteI18n,
            style: 'dropdown',
            showLabel: true,
            updateUserPreference: true,
            onChange: (langCode) => {
                console.log('Language changed to:', langCode);

                // Cache language preference in localStorage for immediate use across pages
                localStorage.setItem('kyte_user_language', langCode);

                // Retranslate the page immediately
                kyteI18n.translateDOM();

                // Show success message
                const langName = KyteLanguageSelector.getLanguageName(langCode);
                const successMsg = `Language preference updated to ${langName}. The interface has been updated immediately.`;

                // You could use a toast notification here instead of alert
                // For now, using a styled alert
                setTimeout(() => {
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
                    alertDiv.setAttribute('role', 'alert');
                    alertDiv.innerHTML = `
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>Success!</strong> ${successMsg}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    `;

                    const container = document.querySelector('#language-selector-container');
                    if (container && container.parentNode) {
                        container.parentNode.insertBefore(alertDiv, container.nextSibling);

                        // Auto-dismiss after 5 seconds
                        setTimeout(() => {
                            alertDiv.classList.remove('show');
                            setTimeout(() => alertDiv.remove(), 150);
                        }, 5000);
                    }
                }, 100);
            }
        });

        console.log('Language selector initialized successfully');

    }).catch(error => {
        console.error('Failed to initialize i18n:', error);

        // Show error message in the container
        const container = document.querySelector('#language-selector-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> Failed to load language preferences.
                    Translation files may be missing.
                </div>
            `;
        }
    });
}


// Initialize account-level language preference and selector
function initializeAccountLanguagePreference(_ks, profile) {
    // Initialize KyteI18n library
    const kyteI18n = new KyteI18n('en', '/assets/i18n/');

    // Get account's default language from profile
    const accountLanguage = profile.kyte_account.default_language || 'en';
    const accountId = profile.kyte_account.id;

    // Initialize with account's current language
    kyteI18n.init(accountLanguage).then(() => {
        console.log('Account language selector initialized with:', kyteI18n.getCurrentLanguage());

        // Initialize language selector for account
        const accountLanguageSelector = new KyteLanguageSelector({
            container: '#account-language-selector-container',
            kyte: _ks,
            i18n: kyteI18n,
            style: 'dropdown',
            showLabel: true,
            updateUserPreference: false,  // We'll handle update manually
            onChange: (langCode) => {
                console.log('Account language changed to:', langCode);

                // Retranslate the page immediately
                kyteI18n.translateDOM();

                // Update KyteAccount record
                _ks.put('KyteAccount', 'id', accountId, {
                    'default_language': langCode
                }, null, [], function(r) {
                    if (r.data[0]) {
                        // Update local profile cache
                        profile.kyte_account.default_language = langCode;

                        // Show success message
                        const langName = KyteLanguageSelector.getLanguageName(langCode);
                        const successMsg = `Account default language updated to ${langName}. This will apply to all users who haven't set their own language preference.`;

                        setTimeout(() => {
                            const alertDiv = document.createElement('div');
                            alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
                            alertDiv.setAttribute('role', 'alert');
                            alertDiv.innerHTML = `
                                <i class="fas fa-check-circle me-2"></i>
                                <strong>Success!</strong> ${successMsg}
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            `;

                            const container = document.querySelector('#account-language-selector-container');
                            if (container && container.parentNode) {
                                container.parentNode.insertBefore(alertDiv, container.nextSibling);

                                // Auto-dismiss after 5 seconds
                                setTimeout(() => {
                                    alertDiv.classList.remove('show');
                                    setTimeout(() => alertDiv.remove(), 150);
                                }, 5000);
                            }
                        }, 100);
                    }
                }, function(err) {
                    console.error('Failed to update account language:', err);

                    // Show error message
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
                    alertDiv.setAttribute('role', 'alert');
                    alertDiv.innerHTML = `
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Error:</strong> Failed to update account language preference. ${err.error || 'Please try again.'}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    `;

                    const container = document.querySelector('#account-language-selector-container');
                    if (container && container.parentNode) {
                        container.parentNode.insertBefore(alertDiv, container.nextSibling);
                    }
                });
            }
        });

        console.log('Account language selector initialized successfully');

    }).catch(error => {
        console.error('Failed to initialize account language selector:', error);

        // Show error message in the container
        const container = document.querySelector('#account-language-selector-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> Failed to load language preferences.
                    Translation files may be missing.
                </div>
            `;
        }
    });
}


// Setup navigation handlers
function setupNavigationHandlers() {
    document.querySelectorAll('[data-section]').forEach(button => {
        button.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // Update active nav item
            document.querySelectorAll('[data-section]').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(section).classList.add('active');
        });
    });
}