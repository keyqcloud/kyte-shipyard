var cfDomain = '';
const rePath = /[^A-Za-z0-9_.-\/]/g;

$(document).ready(function() {
    $('#pageLoaderModal').modal('show');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        k.get("Site", "id", idx, [], function(r) {
            if (r.data[0]) {
                let site = r.data[0];
                let hidden = [
                    {
                        'name': 'site',
                        'value': site.id
                    }
                ];

                cfDomain = site.cfDomain;
                $("#path-preview").html('https://'+cfDomain+'/index.html');

                if (($("#page-path").val()).length == 0) {
                    $("#path-preview").html('https://'+cfDomain+'/index.html');
                } else {
                    $("#path-preview").html('https://'+cfDomain+'/'+$("#page-path").val().replace(rePath, '-')+'.html');
                }

                let obj = {'model': 'Site', 'idx':site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request='+encoded);

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
                        $("#page-login-success-target").append('<option value="'+data.id+'">'+data.title+' (/'+data.s3key+')'+'</option>');
                        $("#page-table-click").append('<option value="'+data.id+'">'+data.title+' (/'+data.s3key+')'+'</option>');
                    }
                });

                $("#page-path").keyup(function() {
                    if (($(this).val()).length == 0) {
                        $("#path-preview").html('https://'+cfDomain+'/index.html');
                    } else {
                        $("#path-preview").html('https://'+cfDomain+'/'+$(this).val().replace(rePath, '-')+'.html');
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

        let path = ($("#page-path").val()).length > 0 ? $("#page-path").val().replace(rePath, '-')+'.html': 'index.html';

        // display model
        $('#pageLoaderModal').modal('show');

        // check if page already exists
        k.get('Page', 's3key', path, [], function(r) {
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
            $("#data-model-columns-wrapper").html('');
            $('#pageLoaderModal').modal('show');
            let sortable = '';
            k.get('ModelAttribute', 'dataModel', $("#page-model").val(), [], function(r) {
                sortable = '<ul id="data-model-columns">';
                let i = 1;
                for (data of r.data) {
                    sortable += '<li class="p-2 my-2 data-attr-'+data.id+'" data-column-order="'+i+'"><div class="card bg-light"><div class="card-body p-1"><div class="row"><div class="col-1"><i class="fas fa-sort me-2 text-secondary"></i></div><div class="col"><small class="d-block">attribute</small><b class="attribute-name">'+data.name+'</b></div><div class="col-2"><small class="d-block">include?</small><select class="column-include-opt" data-column-idx="'+data.id+'"><option value="0">No</option><option value="1" selected>Yes</option></select></div><div class="col"><small class="d-block">label</small><input type="text" class="column-label form-control" data-column-idx="'+data.id+'" value="'+data.name[0].toUpperCase() + data.name.slice(1)+'"></div></div></div></div></li>';
                    i++;
                }
                sortable += '</ul>';
                $("#data-model-columns-wrapper").html(sortable);
                $("#data-model-columns").sortable();
                $( "#data-model-columns" ).on("sortupdate", function( event, ui ) {
                    // update order index
                    $("#data-model-columns li").each(function(index) {
                        $(this).data('columnOrder', index+1);
                    });
                });
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
                getModelAttributes();
                $("#label-page-type").html('table page');
                $("#customization-table").removeClass('d-none');
                $("#image-placeholder").addClass('d-none');
                $("#customization-table-columns").removeClass('d-none');
                break;

            case 'form':
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
});