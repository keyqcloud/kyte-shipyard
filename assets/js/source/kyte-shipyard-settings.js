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
        form.init();
        tblAdmin.bindEdit(frmUser);
        
        var tblAPI = new KyteTable(k, $("#api-table"), {'name':"APIKey",'field':"kyte_account",'value':1}, colDefAPI, true, [0,"asc"], false, false);
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
});
