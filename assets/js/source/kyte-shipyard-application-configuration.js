$(document).ready(function() {
    let navbar = new KyteNav("#mainnav", rootnav, null, 'Kyte Shipyard<sup>&trade;</sup>');
    navbar.create();

    let idx;

    $('#pageLoaderModal').modal('show');
    if (k.isSession()) {

        idx = k.getPageRequest();
        idx = idx.idx;

        k.get("Application", "id", idx, [], function(r) {
            if (r.data.length == 0) {
                alert('Failed to retrieve app data.');
                exit();
            }
            let app = r.data[0];
            let obj = {'model': 'Application', 'idx':idx};
            let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
            
            let appnav = generateAppNav(app.name, encoded);
        
            let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Models');
            navbar.create();
            // application setting
            $("#userorg_colname").val(app.userorg_colname);

            let modelIdx = null;
            let orgIdx = null;

            k.get('DataModel', 'application', idx, [], function(r) {
                if(r.data.length > 0) {
                    r.data.forEach(element => {
                        if (element.name == app.user_model) {
                            modelIdx = element.id;
                        }
                        if (element.name == app.org_model) {
                            orgIdx = element.id;
                        }
                        $("#user_model").append('<option value="'+element.id+'" '+(element.name == app.user_model ? 'selected' : '')+'>'+element.name+'</option>');
                        $("#org_model").append('<option value="'+element.id+'" '+(element.name == app.org_model ? 'selected' : '')+'>'+element.name+'</option>');
                    });

                    if (modelIdx != null) {
                        k.get('ModelAttribute', 'dataModel', modelIdx, [], function(r) {
                            if(r.data.length > 0) {
                                if (orgIdx != null) {
                                    $("#userorg_colname").append('<option value="0">None</option>');
                                }
                                r.data.forEach(element => {
                                    $("#username_colname").append('<option value="'+element.id+'" '+(element.name == app.username_colname ? 'selected' : '')+'>'+element.name+'</option>');
                                    $("#password_colname").append('<option value="'+element.id+'" '+(element.name == app.password_colname ? 'selected' : '')+'>'+element.name+'</option>');
                                    if (orgIdx != null) {
                                        $("#userorg_colname").append('<option value="'+element.id+'" '+(element.name == app.userorg_colname ? 'selected' : '')+'>'+element.name+'</option>');
                                    }
                                });
                            }
                            $("#username_colname").prop('disabled', false);
                            $("#password_colname").prop('disabled', false);
                            $("#userorg_colname").prop('disabled', false);
                            $("#org_model").prop('disabled', false);
                            $("#default_org_model").html('None');
                        });
                    } else {
                        $("#username_colname").prop('disabled', true);
                        $("#password_colname").prop('disabled', true);
                        $("#org_model").prop('disabled', true);
                        $("#default_org_model").html('Kyte Framework Account (Default)');
                        $("#userorg_colname").prop('disabled', true);
                        $("#org_model").val(0);
                    }
                }
                $('#pageLoaderModal').modal('hide');
            });
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }

    // onchange event listener for org and user dropdown
    $("#user_model").change(function(e) {
        let userModelIdx = parseInt($(this).val());
        let orgModelIdx = parseInt($("#org_model").val());

        if (userModelIdx == 0) {
            // if returning to default, reset values
            $("#username_colname").prop('disabled', true);
            $("#password_colname").prop('disabled', true);
            $("#username_colname").html('');
            $("#password_colname").html('');
            $("#userorg_colname").html('');
            $("#default_org_model").html('Kyte Framework Account (Default)');
            $("#userorg_colname").prop('disabled', true);
            $("#org_model").val(0);
            $("#org_model").prop('disabled', true);
        } else {
            if (userModelIdx != orgModelIdx && typeof userModelIdx === 'number') {
                $('#pageLoaderModal').modal('show');
                k.get('ModelAttribute', 'dataModel', userModelIdx, [], function(r) {
                    $("#username_colname").html('');
                    $("#password_colname").html('');
                    $("#userorg_colname").html('');
                    if(r.data.length > 0) {
                        $("#username_colname").prop('disabled', false);
                        $("#password_colname").prop('disabled', false);
                        $("#userorg_colname").prop('disabled', false);
                        $("#userorg_colname").append('<option value="0">None</option>');
                        r.data.forEach(element => {
                            $("#username_colname").append('<option value="'+element.id+'">'+element.name+'</option>');
                            $("#password_colname").append('<option value="'+element.id+'">'+element.name+'</option>');
                            $("#userorg_colname").append('<option value="'+element.id+'">'+element.name+'</option>');
                        });
                    }
                    $("#org_model").prop('disabled', false);
                    $("#default_org_model").html('None');
                    if (orgModelIdx == 0) {
                        $("#userorg_colname").val(0);
                        $("#userorg_colname").prop('disabled', true);
                    } else {
                        $("#userorg_colname").prop('disabled', false);
                    }
                    $('#pageLoaderModal').modal('hide');
                });
            } else {
                alert("User table and org tabe must be different")
            }
        }
    });
    $("#org_model").change(function(e) {
        let userModelIdx = parseInt($("#user_model").val());
        let orgModelIdx = parseInt($(this).val());

        if (userModelIdx == orgModelIdx) {
            alert("User table and org tabe must be different")
        }
        if (orgModelIdx == 0) {
            $("#userorg_colname").val(0);
            $("#userorg_colname").prop('disabled', true);
        } else {
            $("#userorg_colname").prop('disabled', false);
        }
    });
    $("#username_colname").change(function(e) {
        let usernameColname = parseInt($(this).val());
        let passwordColname = parseInt($("#password_colname").val());
        let userorgColname = parseInt($("#userorg_colname").val());

        if (usernameColname == passwordColname) {
            alert("Username/email column cannot be the same as the password column.");
        }
        if (usernameColname == userorgColname) {
            alert("Username/email column cannot be the same as the user organization column.");
        }
        if (passwordColname == userorgColname) {
            alert("Password column cannot be the same as the user organization column.");
        }
    });
    $("#password_colname").change(function(e) {
        let usernameColname = parseInt($("#username_colname").val());
        let passwordColname = parseInt($(this).val());
        let userorgColname = parseInt($("#userorg_colname").val());

        if (usernameColname == passwordColname) {
            alert("Username/email column cannot be the same as the password column.");
        }
        if (usernameColname == userorgColname) {
            alert("Username/email column cannot be the same as the user organization column.");
        }
        if (passwordColname == userorgColname) {
            alert("Password column cannot be the same as the user organization column.");
        }
    });
    $("#userorg_colname").change(function(e) {
        let usernameColname = parseInt($("#username_colname").val());
        let passwordColname = parseInt($("#password_colname").val());
        let userorgColname = parseInt($(this).val());

        if (usernameColname == passwordColname) {
            alert("Username/email column cannot be the same as the password column.");
        }
        if (usernameColname == userorgColname) {
            alert("Username/email column cannot be the same as the user organization column.");
        }
        if (passwordColname == userorgColname) {
            alert("Password column cannot be the same as the user organization column.");
        }
    });

    // update org and user model in backend
    $("#saveSettings").click(function(e) {
        e.preventDefault();

        let userModelIdx = parseInt($("#user_model").val());
        let userModelName = $('#user_model option:selected').text();
        let orgModelIdx = parseInt($("#org_model").val());
        let orgModelName = $('#org_model option:selected').text();

        let usernameColname = parseInt($("#username_colname").val());
        let usernameColnameLabel = $("#username_colname option:selected").text();
        let passwordColname = parseInt($("#password_colname").val());
        let passwordColnameLabel = $("#password_colname option:selected").text();
        let userorgColname = parseInt($("#userorg_colname").val());
        let userorgColnameLabel = $("#userorg_colname option:selected").text();

        if (userModelIdx != 0) {
            // validate the changes
            if (usernameColname == passwordColname) {
                alert("Username/email column cannot be the same as the password column.");
                return;
            }
            if (orgModelIdx != 0) {
                if (userorgColname == 0) {
                    alert("Please choose an organization column.");
                    return;
                }
                if (usernameColname == userorgColname) {
                    alert("Username/email column cannot be the same as the user organization column.");
                    return;
                }
                if (passwordColname == userorgColname) {
                    alert("Password column cannot be the same as the user organization column.");
                    return;
                }
            }
        }

        k.put('Application', 'id', idx,
        {
            'user_model':userModelIdx == 0 ? null : userModelName,
            'username_colname':userModelIdx == 0 ? null : usernameColnameLabel,
            'password_colname':userModelIdx == 0 ? null : passwordColnameLabel,
            'org_model':userModelIdx == 0 || orgModelIdx == 0 ? null : orgModelName,
            'userorg_colname':userModelIdx == 0 || orgModelIdx == 0 ? null : userorgColnameLabel,
        }, null, [], function(r) {
            if (r.data.length > 0) {
                alert("Application settings successfully updated");
            } else {
                alert("Unable to update application settings. Please try again or contact support.");
            }
        }, function(err) {
            alert("Unable to update application settings. Please try again or contact support. "+err);
        });
    });
});