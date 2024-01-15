let subnavSettings = [
    {
        faicon:'fas fa-user',
        label:'My Profile',
        selector:'#Profile'
    },
    {
        faicon:'fas fa-user-shield',
        label:'Administrators',
        selector:'#Administrators'
    },
    {
        faicon:'fas fa-server',
        label:'API',
        selector:'#API'
    },
    {
        faicon:'fas fa-rocket',
        label:'Kyte Shipyard<sup>&trade;</sup>',
        selector:'#KyteShipyard'
    }
];

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

document.addEventListener('KyteInitialized', function(e) {
    let k = e.detail.k;
    let profile = null;
    let acc = null;

    // setup password requirements
    var passreq = new KytePasswordRequirement(k, $("#passwordRequirements"), $("#new_password"), $("#confirm_password"));
    passreq.init();

    let navbar = new KyteNav("#mainnav", rootnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">');
    navbar.create();

    let sidenav = new KyteSidenav("#sidenav", subnavSettings, "#Profile");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {        
        k.get("KyteProfile", null, null, [], function(r) {
            if (r.data[0]) {
                profile = r.data[0];
                $("#profile_email").val(profile['email']);
                $("#accountNumber").val(profile['kyte_account']['number']);
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

        var tblAdmin = new KyteTable(k, $("#admin-table"), {'name':"KyteUser",'field':"kyte_account",'value':1}, colDefUsers, true, [0,"asc"], true, true);
        tblAdmin.init();
        var frmUser = new KyteForm(k, $("#adminForm"), "KyteUser", hidden, fldsAdmin, "Administrator", tblAdmin, true, $("#newAdmin"));
        frmUser.init();
        tblAdmin.bindEdit(frmUser);

        var tblAPI = new KyteTable(k, $("#api-table"), {'name':"KyteAPIKey",'field':null,'value':null}, colDefAPI, true, [0,"asc"], false, false);
        tblAPI.init();

        $("#updateEmail").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            k.put("KyteProfile", null, null, {"email":$("#profile_email").val()}, null, [], function(r) {
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
                k.put('KyteProfile', null, null, {'password':$("#new_password").val()}, null, [], function(r) {
                    alert("Your password has been successfully update.");
                }, function() {
                    alert("Unable to update your password. Please try again later.");
                });
            } else alert("Passwords do not match or they do not meet the password requirement.");
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }

    $("#checkForUpdates").click(function() {
        checkForUpdates();
    });

    document.getElementById("currentKSVERSION").textContent = KS_VERSION;

    function checkForUpdates() {
        var changelogUrl = 'http://cdn.keyqcloud.com/kyte/shipyard/archive/CHANGELOG.md';
    
        fetch(changelogUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                processChangelog(data);
                document.getElementById('changelogContent').innerHTML = '<pre>' + data + '</pre>';
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
            document.getElementById('checkForUpdates').classList.remove('d-none');
        } else if (latestVersion === KS_VERSION) {
            document.getElementById('updateResultsWrapper').innerHTML = '<p>You are already using the latest version.</p>';
            document.getElementById('checkForUpdates').classList.add('d-none');
        } else {
            document.getElementById('updateResultsWrapper').innerHTML = '<p>Unable to determine the latest version.</p>';
            document.getElementById('checkForUpdates').classList.add('d-none');
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
    
    // Run the check
    checkForUpdates();
});
