var cfDomain = '';
const rePath = /[^A-Za-z0-9_.-\/]/g;

let siteIdx = null;
let kyte_endpoint = '';
let kyte_pub = '';
let kyte_iden = '';
let kyte_num = '';
let kyte_app = '';

let page_path = '';

$(document).ready(function() {
    $('#pageLoaderModal').modal('show');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        siteIdx = idx;

        k.get("Site", "id", idx, [], function(r) {
            if (r.data[0]) {
                let site = r.data[0];
                let hidden = [
                    {
                        'name': 'site',
                        'value': site.id
                    }
                ];

                kyte_endpoint = r.kyte_api;
                console.log(kyte_endpoint);
                kyte_pub = r.kyte_pub;
                kyte_iden = r.kyte_iden;
                kyte_num = r.kyte_num;
                kyte_app = site.application.identifier;

                cfDomain = site.cfDomain;
                $("#path-preview").html('https://'+cfDomain+'/index.html');

                if (($("#page-path").val()).length == 0) {
                    $("#path-preview").html('https://'+cfDomain+'/index.html');
                } else {
                    $("#path-preview").html('https://'+cfDomain+'/'+$("#page-path").val().replace(rePath, '-').toLowerCase()+'.html');
                }

                let obj = {'model': 'Site', 'idx':site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $(".backToSite").attr('href', '/app/site/?request='+encoded);

                obj = {'model': 'Application', 'idx':site.application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

                let appnav = generateAppNav(site.application.name, encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Sites');

                k.get('DataModel', 'application', site.application.id, [], function(r) {
                    for (data of r.data) {
                        $("#page-model").append('<option value="'+data.id+'">'+data.name+'</option>');
                    }
                });

                k.get('Navigation', 'site', site.id, [], function(r) {
                    for (data of r.data) {
                        $("#page-main-navigation").append('<option value="'+data.id+'">'+data.name+'</option>');
                        //
                        $("#page-side-navigation").append('<option value="'+data.id+'">'+data.name+'</option>');
                    }
                });

                k.get('Page', 'site', site.id, [], function(r) {
                    for (data of r.data) {
                        $("#page-login-success-target").append('<option value="'+data.s3key+'">'+data.title+' (/'+data.s3key+')'+'</option>');
                        $("#page-table-click").append('<option value="'+data.s3key+'">'+data.title+' (/'+data.s3key+')'+'</option>');
                    }
                });

                $("#page-path").keyup(function() {
                    if (($(this).val()).length == 0) {
                        $("#path-preview").html('https://'+cfDomain+'/index.html');
                    } else {
                        $("#path-preview").html('https://'+cfDomain+'/'+$(this).val().replace(rePath, '-').toLowerCase()+'.html');
                    }
                });
                navbar.create();
            } else {
                alert("ERROR");
            }
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }

    $("#wizard-1-next").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        if (!$("#page-type").val()) {
            $("#page-type").addClass('is-invalid');
            return;
        }
        $("#page-type").removeClass('is-invalid');

        $("#wizard-1").addClass('d-none');
        $("#wizard-2").removeClass('d-none');
    });

    $("#wizard-2-back").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        $("#wizard-2").addClass('d-none');
        $("#wizard-1").removeClass('d-none');
    });

    $("#wizard-2-next").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        if (($("#page-path").val()).length < 1) {
            $("#page-path").val('index');
        }

        page_path = ($("#page-path").val()).length > 0 ? $("#page-path").val().replace(rePath, '-').toLowerCase()+'.html': 'index.html';

        // display model
        $('#pageLoaderModal').modal('show');

        $condition = btoa(JSON.stringify('[{"field":"site","value":"'+siteIdx+'"}]'));
        // check if page already exists
        k.get('Page', 's3key', page_path, [{'name':'x-kyte-query-conditions', 'value':$condition}], function(r) {
            $('#pageLoaderModal').modal('hide');
            if (r.data.length > 0) {
                $("#page-path").addClass('is-invalid');
                $("#path-preview").addClass('text-danger');
                $("#path-preview").html('Page with the same path already exists.');
            } else {
                $("#page-path").removeClass('is-invalid');
                $("#path-preview").removeClass('text-danger');

                $("#wizard-2").addClass('d-none');
                $("#wizard-3").removeClass('d-none');
            }
        });
    });

    function getModelAttributes() {
        if ($("#page-model").val()) {
            // clear wrapper
            $("#data-model-columns-wrapper").html('');
            $("#data-model-form-fields-wrapper").html('');
            // start modal
            $('#pageLoaderModal').modal('show');
            // initialize variable to hold html
            let sortable = '';
            let fields = '';
            k.get('ModelAttribute', 'dataModel', $("#page-model").val(), [], function(r) {
                // create start of sortables
                sortable = '<ul id="data-model-columns">';
                // column headers for fields
                fields += '<div class="row">';
                fields += '<div class="col-3 text-center"><h5>Col 1</h5></div>'
                fields += '<div class="col-3 text-center"><h5>Col 2</h5></div>'
                fields += '<div class="col-3 text-center"><h5>Col 3</h5></div>'
                fields += '<div class="col-3 text-center"><h5>Col 4</h5></div>'
                fields += '</div>';
                fields += '<div class="row"><div class="col-3"><ul id="data-model-fields-1" class="connectedSortable">';
                // initialize counter
                let i = 1;
                for (data of r.data) {
                    // create draggable column using jquery sortable
                    sortable += '<li class="p-2 my-2 data-attr-'+data.id+'" data-attr-name="'+data.name+'" data-column-order="'+i+'"><div class="card bg-light"><div class="card-body p-1"><div class="row"><div class="col-1"><i class="fas fa-sort me-2 text-secondary"></i></div><div class="col"><small class="d-block">attribute</small><b class="attribute-name">'+data.name+'</b></div><div class="col-2"><small class="d-block">include?</small><select class="column-include-opt form-select" data-column-idx="'+data.id+'"><option value="0">No</option><option value="1" selected>Yes</option></select></div><div class="col"><small class="d-block">label</small><input type="text" class="column-label form-control" data-column-idx="'+data.id+'" value="'+data.name[0].toUpperCase() + data.name.slice(1)+'"></div></div></div></div></li>';

                    // create draggable fields using jquery sotable
                    fields += '<li class="p-2 my-2 data-field-'+data.id+'"><div class="card bg-light"><div class="card-body p-1"><div class="row"><div class="col"><i class="fas fa-arrows-alt me-2 text-secondary"></i></div><div class="col"><small class="d-block">attribute</small><b class="attribute-name">'+data.name+'</b></div></div><div class="row"><div class="col"><small class="d-block">include?</small><select class="field-include-opt form-select" data-field-idx="'+data.id+'"><option value="0">No</option><option value="1" selected>Yes</option></select></div></div><div class="row"><div class="col"><small class="d-block">field type</small><select class="form-select form-field-type" data-field-idx="'+data.id+'"><option value="text" selected>Text</option><option value="date">Date</option><option value="select">Dropdown (select)</option><option value="textarea">Textarea</option><option value="email">Email</option><option value="password">Password</option></select></div></div><div class="row"><div class="col"><small class="d-block">label</small><input type="text" class="field-label form-control" data-field-idx="'+data.id+'" value="'+data.name[0].toUpperCase() + data.name.slice(1)+'"></div></div></div></div></li>';

                    // increment counter
                    i++;
                }
                // close sortables
                sortable += '</ul>';
                fields += '</ul></div>';
                fields += '<div class="col-3"><ul id="data-model-fields-2" class="connectedSortable"></ul></div>';
                fields += '<div class="col-3"><ul id="data-model-fields-3" class="connectedSortable"></ul></div>';
                fields += '<div class="col-3"><ul id="data-model-fields-4" class="connectedSortable"></ul></div>';
                fields += '</div>'; // close row
                // update html
                $("#data-model-columns-wrapper").html(sortable);
                $("#data-model-form-fields-wrapper").html(fields);
                // create sortables
                $("#data-model-columns").sortable();
                $("#data-model-fields-1, #data-model-fields-2, #data-model-fields-3, #data-model-fields-4").sortable({
                    connectWith: ".connectedSortable"
                });
                // add listener for update events
                $( "#data-model-columns" ).on("sortupdate", function( event, ui ) {
                    // update order index
                    $("#data-model-columns li").each(function(index) {
                        $(this).data('columnOrder', index+1);
                    });
                });

                $("#addBlankFieldCard").click(function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    $("#data-model-fields-1").prepend('<li class="p-2 my-2"><div class="card bg-secondary blank-card"><div class="card-body p-1"></div></div></li>');
                });

                // hid modal
                $('#pageLoaderModal').modal('hide');
            });
        }
    }

    // add listener
    $("#customization-table-columns").on('change', '.column-include-opt', function() {
        if ($(this).val() == 0) {
            $(".data-attr-"+$(this).data('columnIdx')+" .card").removeClass('bg-light');
            $(".data-attr-"+$(this).data('columnIdx')+" .card").addClass('text-secondary');
            $(".data-attr-"+$(this).data('columnIdx')+" .attribute-name").addClass('text-strike');
            $(".data-attr-"+$(this).data('columnIdx')+" .column-label").prop('disabled', true);
        } else {
            $(".data-attr-"+$(this).data('columnIdx')+" .card").removeClass('text-secondary');
            $(".data-attr-"+$(this).data('columnIdx')+" .card").addClass('bg-light');
            $(".data-attr-"+$(this).data('columnIdx')+" .attribute-name").removeClass('text-strike');
            $(".data-attr-"+$(this).data('columnIdx')+" .column-label").prop('disabled', false);
        }
    });
    $("#customization-form-fields").on('change', '.field-include-opt', function() {
        if ($(this).val() == 0) {
            $(".data-field-"+$(this).data('fieldIdx')+" .card").removeClass('bg-light');
            $(".data-field-"+$(this).data('fieldIdx')+" .card").addClass('text-secondary');
            $(".data-field-"+$(this).data('fieldIdx')+" .attribute-name").addClass('text-strike');
            $(".data-field-"+$(this).data('fieldIdx')+" .field-label").prop('disabled', true);
        } else {
            $(".data-field-"+$(this).data('fieldIdx')+" .card").removeClass('text-secondary');
            $(".data-field-"+$(this).data('fieldIdx')+" .card").addClass('bg-light');
            $(".data-field-"+$(this).data('fieldIdx')+" .attribute-name").removeClass('text-strike');
            $(".data-field-"+$(this).data('fieldIdx')+" .field-label").prop('disabled', false);
        }
    });

    $("#page-model").change(function() {
        getModelAttributes();
    });

    $("#wizard-3-back").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        // hide page type specific customizations
        $("#customization-login").addClass('d-none');
        $("#customization-table").addClass('d-none');
        $("#customize-page-form-title").addClass('d-none');
        $("#customize-page-table-add").addClass('d-none');
        $("#customize-page-table-edit").addClass('d-none');
        $("#customization-table-columns").addClass('d-none');
        $("#customization-form-fields").addClass('d-none');
        $("#customization-custom").addClass('d-none');
        $("#customization-block").addClass('d-none');
        $("#image-placeholder").removeClass('d-none');
        $("#data-model-columns-wrapper").html('');

        // reset col width
        $("#customization-left-panel").removeClass('col-3');
        $("#customization-right-panel").removeClass('col-9');
        $("#customization-left-panel").addClass('col-5');
        $("#customization-right-panel").addClass('col-7');

        // toggle wizard
        $("#wizard-3").addClass('d-none');
        $("#wizard-2").removeClass('d-none');
    });

    $("#wizard-3-next").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        if (($("#page-title").val()).length < 1) {
            $("#page-title").addClass('is-invalid');
            return;
        }
        $("#page-title").removeClass('is-invalid');

        switch ($("#page-type").val()) {
            case 'login':
                $("#label-page-type").html('login page');
                $("#customization-login").removeClass('d-none');
                break;

            case 'table':
                $("#customization-left-panel").removeClass('col-5');
                $("#customization-right-panel").removeClass('col-7');    
                $("#customization-left-panel").addClass('col-3');
                $("#customization-right-panel").addClass('col-9');
                getModelAttributes();
                $("#label-page-type").html('table page');
                $("#customization-table").removeClass('d-none');
                $("#image-placeholder").addClass('d-none');
                $("#customization-table-columns").removeClass('d-none');
                break;

            case 'form':
                $("#customization-left-panel").removeClass('col-5');
                $("#customization-right-panel").removeClass('col-7');    
                $("#customization-left-panel").addClass('col-3');
                $("#customization-right-panel").addClass('col-9');
                getModelAttributes();
                $("#label-page-type").html('table page with form');
                $("#customization-table").removeClass('d-none');
                $("#customize-page-form-title").removeClass('d-none');
                $("#customize-page-table-add").removeClass('d-none');
                $("#customize-page-table-edit").removeClass('d-none');
                $("#image-placeholder").addClass('d-none');
                $("#customization-table-columns").removeClass('d-none');
                $("#customization-form-fields").removeClass('d-none');
                break;

            case 'sidenav':
                $("#label-page-type").html('page with side nav');
                break;

            case 'block':
                $("#label-page-type").html('custom page');
                $("#customization-block").removeClass('d-none');
                break;
        
            default:
                $("#label-page-type").html('custom page');
                $("#customization-custom").removeClass('d-none');
                break;
        }

        $("#wizard-3").addClass('d-none');
        $("#wizard-4").removeClass('d-none');
        $("#wizard-step-1").removeClass('active');
        $("#wizard-step-1").addClass('complete');
        $("#wizard-step-2").addClass('active');
    });

    $("#wizard-4-back").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        $("#wizard-4").addClass('d-none');
        $("#wizard-3").removeClass('d-none');
        $("#wizard-step-1").removeClass('complete');
        $("#wizard-step-1").addClass('active');
        $("#wizard-step-2").removeClass('active');
    });

    $("#wizard-4-next").click(function(e) {
        e.stopPropagation();
        e.preventDefault();

        let html = '';
        let javascript = '';
        let stylesheet = '';
        let layout = {};
        let main_navigation = $("#page-main-navigation").val() == 0 ? null : $("#page-main-navigation").val();
        let side_navigation = $("#page-side-navigation").val() == 0 ? null : $("#page-side-navigation").val();
        let page_title = $("#page-title").val();
        let page_description = $("#page-description").val();
        let page_protected = $("#page-requires-session").val();
        //
        let page_table_title = $("#page-table-title").val();
        let page_form_title = $("#page-form-title").val();
        //
        let page_model = $("#page-model option:selected" ).text();
        let page_table_add = $("#page-table-add").val();
        let page_table_edit = $("#page-table-edit").val();
        let page_table_delete = $("#page-table-delete").val();
        let page_table_click = $("#page-table-click").val();
        //
        let page_login_heading = $("#page-login-heading").val();
        let page_login_field_name = $("#page-login-field-name").val() ? $("#page-login-field-name").val() : 'email';
        let page_login_success_target = $("#page-login-success-target").val();

        // page path
        if (page_path.length < 1) {
            alert("Your page path is empty... please go back and check.");
            return;
        }
        // page title
        if (page_title.length < 1) {
            alert("Your page title is empty... please go back and check.");
            return;
        }

        //
        let columns = [];
        let fields = [];
        let hidden = [];
        let colIdx = 0;

        $("#newPageUrl").attr('href', 'https://'+cfDomain+'/'+page_path);
        $("#newPageUrl").html('https://'+cfDomain+'/'+page_path);

        switch ($("#page-type").val()) {
            case 'login':
                // perform validation
                if (page_login_heading.length < 1) {
                    $("#page-login-heading").addClass('is-invalid');
                    return;
                }
                $("#page-login-heading").removeClass('is-invalid');
                layout = {
                    'page_type': $("#page-type").val(),
                    'page_login_heading': page_login_heading,
                    'page_login_field_name': page_login_field_name,
                    'page_login_success_target': page_login_success_target
                }
                // generate javascript
                javascript = '$("#login-form").submit(function(e) {e.preventDefault();e.stopPropagation();$("#errorMsg").addClass(\'d-none\');$("#errorMsg").html("");if (($("#'+page_login_field_name+'").val()).length > 0 || ($("#password").val()).length > 0) { k.sessionCreate({\''+page_login_field_name+'\':$("#'+page_login_field_name+'").val(), \'password\':$("#password").val()}, function(session) { if (session.data[0]) {location.href="/'+page_login_success_target+'"; } else {$("#errorMsg").html("Something went wrong with the login. Please contact your administrator.");$("#errorMsg").removeClass("d-none\");}}, function() {$("#errorMsg").html("Incorrect email and password combination.");$("#errorMsg").removeClass("d-none");});} else {$("#errorMsg").html("Email and password are required.");$("#errorMsg").removeClass("d-none");}});';

                // generate html
                html = '<div class="py-3"><div class="row"><div class="col-md-4 pt-4 mx-auto"><div class="card p-3"><div class="card-body"><h1 class="text-center mb-3">'+page_login_heading+'</h1><form id="login-form" class="text-center"><p class="text-danger text-center d-none" id="errorMsg"></p><!-- username --><input id="'+page_login_field_name+'" type="'+(page_login_field_name == 'username' ? 'text' : page_login_field_name)+'" class="form-control d-block mb-3" placeholder="keyq@flykyte.io"><!-- password --><input id="password" type="password" class="form-control d-block mb-4" placeholder="password"><!-- submit button --><button type="submit" id="signin" class="btn btn-warning btn-lg d-block mx-auto mb-4 w-100">Login</button><!-- reset --><!-- <small><a href="/reset.html">Forgot your password?</a></small> --></form></div></div></div></div></div>';
                break;

            case 'table':
                // perform validation
                side_navigation = null;
                if (page_table_title.length < 1) {
                    $("#page-table-title").addClass('is-invalid');
                    return;
                }
                $("#page-table-title").removeClass('is-invalid');
                // generate the table columns
                $("#data-model-columns li").each(function(index) {
                    columns.push({'targets':colIdx, 'data':$(this).data('attrName'), 'label':$(this).find('.column-label').val()});
                    colIdx++;
                });
                layout = {
                    'model': page_model,
                    'page_type': $("#page-type").val(),
                    'main_navigation': main_navigation,
                    'page_table_title': page_table_title,
                    'page_table_delete': page_table_delete,
                    'page_table_click': page_table_click,
                    'page_table_columns': columns
                };
                // generate javascript
                javascript = 'let colDef'+page_model+' = JSON.parse(\''+JSON.stringify(columns)+'\'); let tbl'+page_model+' = new KyteTable(k, $("#dt'+page_model+'"),{"name":"'+page_model+'","field":null,"value":null}, colDef'+page_model+', true, [0, "asc"], false, false'+(page_table_click.length > 1 ? ', "id", "/'+page_table_click+'"' : '')+');tbl'+page_model+'.init();';
                // generate html
                html = '<div class="py-3"><div class="d-flex justify-content-between"><h1>'+page_table_title+'</h1><div></div></div><div class="mt-2 table-responsive"><table id="dt'+page_model+'" class="table table-striped w-100"></table></div></div>';
                break;

            case 'form':
                // perform validation
                side_navigation = null;
                if (page_table_title.length < 1) {
                    $("#page-table-title").addClass('is-invalid');
                    return;
                }
                $("#page-table-title").removeClass('is-invalid');
                // generate the table columns
                $("#data-model-columns li").each(function(index) {
                    columns.push({'targets':colIdx, 'data':$(this).data('attrName'), 'label':$(this).find('.column-label').val()});
                    colIdx++;
                });
                layout = {
                    'model': page_model,
                    'page_type': $("#page-type").val(),
                    'main_navigation': main_navigation,
                    'page_table_title': page_table_title,
                    'page_table_add': page_table_add,
                    'page_table_edit': page_table_edit,
                    'page_table_delete': page_table_delete,
                    'page_table_click': page_table_click,
                    'page_table_columns': columns,
                    'page_form_title': page_form_title,
                };
                // generate javascript
                javascript = 'let colDef'+page_model+' = JSON.parse(\''+JSON.stringify(columns)+'\'); let tbl'+page_model+' = new KyteTable(k, $("#dt'+page_model+'"),{"name":"'+page_model+'","field":null,"value":null}, colDef'+page_model+', true, [0, "asc"], false, false'+(page_table_click.length > 1 ? ', "id", "/'+page_table_click+'"' : '')+');tbl'+page_model+'.init();';
                // form javascript
                javascript += 'let fldsHidden'+page_model+' = null; let flds'+page_model+' = JSON.parse(\''+JSON.stringify(fields)+'\'); var form'+page_model+' = new KyteForm(k, $("#modalForm'+page_model+'"), "'+page_model+'", fldsHidden'+page_model+', flds'+page_model+', "'+page_form_title+'", tbl'+page_model+', true, '+(page_table_add == 1 ? '$("#addEntry'+page_model+'")':'null')+');form'+page_model+'.init();'+(page_table_edit == 1 ? 'tbl'+page_model+'.bindEdit(form'+page_model+');' : '');
                
                // generate html
                html = '<div class="py-3"><div class="d-flex justify-content-between"><h1>'+page_table_title+'</h1><div>'+(page_table_add == 1 ? '<a class="btn btn-primary btn-sm" id="addEntry'+page_model+'"><i class="fas fa-plus fs-sm"></i> Create</a>' : '')+'</div></div><div class="mt-2 table-responsive"><table id="dt'+page_model+'" class="table table-striped w-100"></table></div></div><div id="modalForm'+page_model+'"></div>';
                alert("I'm sorry Dave, I'm afraid I can't do that.");
                return;
                break;

            case 'sidenav':
                // perform validation
                // generate code
                alert("I'm sorry Dave, I'm afraid I can't do that.");
                return;
                break;

            case 'block':
                // perform validation
                // generate code
                alert("I'm sorry Dave, I'm afraid I can't do that.");
                return;
                break;
        
            default:
                layout = {
                    'page_type': $("#page-type").val(),
                    protected: page_protected
                }
                break;
        }

        $('#pageLoaderModal').modal('show');

        // upload code
        k.post('Page', {
            'html': html,
            'javascript': javascript,
            'stylesheet': stylesheet,
            'layout': JSON.stringify(layout),
            'main_navigation':main_navigation,
            'side_navigation':side_navigation,
            'title':page_title,
            's3key':page_path,
            'description':page_description,
            'protected': page_protected,
            'site': siteIdx
        }, null, [], function(r) {
            if (r.data.length > 0) {
                // generate kyte connect
                let connect = "let endpoint = 'https://"+kyte_endpoint+"';var k = new Kyte(endpoint, '"+kyte_pub+"', '"+kyte_iden+"', '"+kyte_num+"', '"+kyte_app+"');k.init();\n\n";
                // create s3 file and invalidate
                k.put('Page', 'id', r.data[0].id, {'state': 1, 'kyte_connect': connect}, null, [], function(r) {
                    $('#pageLoaderModal').modal('hide');
                    $("#wizard-4").addClass('d-none');
                    $("#wizard-final").removeClass('d-none');
                    $("#wizard-step-2").removeClass('active');
                    $("#wizard-step-2").addClass('complete');
                    $("#wizard-step-3").addClass('complete');
                }, function(err) {
                    $('#pageLoaderModal').modal('hide');
                    console.log(err);
                    alert("Somethign wen't wrong while publishing and invalidating cache...page has been saved so nothing is lost.");
                });
            } else {
                $('#pageLoaderModal').modal('hide');
                console.log(err);
                alert("Somethign wen't wrong while trying to save your page...");
            }
            
        }, function(err) {
            $('#pageLoaderModal').modal('hide');
            console.log(err);
            alert("Somethign wen't terribly wrong while trying to save your page...");
        });        
    });
});