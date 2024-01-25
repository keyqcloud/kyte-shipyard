document.addEventListener('KyteInitialized', function(e) {
    let k = e.detail.k;
    $('#pageLoaderModal').modal('show');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        let hidden = [
            {
                'name': 'site',
                'value': idx
            }
        ];

        k.get("Domain", "id", idx, [], function(r) {
            if (r.data[0]) {
                data = r.data[0];
                $("#site-name").html(data.site.name);
                $("#domain-name").html('<i class="fas fa-link me-2"></i>'+(data.site.aliasDomain ? data.site.aliasDomain : data.site.cfDomain));
                $("#domain-name").attr('href', 'https://'+(data.site.aliasDomain ? data.site.aliasDomain : data.site.cfDomain));
                $("#region").html(data.site.region);

                if (data.assigned) {
                    $("#assign").html('<i class="fas fa-certificate me-2"></i> Unassign');
                    $("#assign").addClass('btn-outline-danger');
                    $("#assign").removeClass('d-none');
                } else {
                    $("#assign").html('<i class="fas fa-certificate me-2"></i> Assign');
                    $("#assign").addClass('btn-outline-primary');
                    $("#assign").removeClass('d-none');
                }

                $("#assign").click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (data.assigned) {
                        // remove domain
                        k.put('Domain', 'id', idx, {'assigned':null}, null, [], function(r) {
                            $("#assign").html('<i class="fas fa-certificate me-2"></i> Assign');
                            $("#assign").removeClass('btn-outline-danger');
                            $("#assign").addClass('btn-outline-primary');
                        });
                    } else {
                        // assign domain
                        k.put('Domain', 'id', idx, {'assigned':data.site.cfDistributionId}, null, [], function(r) {
                            $("#assign").html('<i class="fas fa-certificate me-2"></i> Unassign');
                            $("#assign").removeClass('btn-outline-primary');
                            $("#assign").addClass('btn-outline-danger');
                        });
                    }
                });

                // PENDING_VALIDATION|ISSUED|INACTIVE|EXPIRED|VALIDATION_TIMED_OUT|REVOKED|FAILED
                $("#status").html(data.status.replace('_', ' '));
                if (data.status == 'FAILED' || data.status == 'REVOKED' || data.status == 'EXPIRED') {
                    $("#status-icon").removeClass("text-secondary");
                    $("#status-icon").addClass("text-danger");
                }
                if (data.status == 'ISSUED') {
                    $("#status-icon").removeClass("text-secondary");
                    $("#status-icon").addClass("text-success");
                }
                if (data.status == 'PENDING_VALIDATION') {
                    $("#status-icon").removeClass("text-secondary");
                    $("#status-icon").addClass("text-warning");
                }

                for (record of data.dns_validation) {
                    let statusColor = 'text-secondary';
                    if (record.ValidationStatus == 'PENDING_VALIDATION') {
                        statusColor = 'text-warning';
                    }
                    if (record.ValidationStatus == 'SUCCESS') {
                        statusColor = 'text-success';
                    }
                    if (record.ValidationStatus == 'FAILED') {
                        statusColor = 'text-danger';
                    }
                    
                    // Validation Status => PENDING_VALIDATION|SUCCESS|FAILED
                    $("#dns-validation-list").append('<div class="card mb-3"><div class="card-header"><i class="fas fa-circle mx-2 '+statusColor+'"></i>'+record.ValidationStatus.replace('_', ' ')+'</div><div class="card-body"><h5 class="card-title">'+record.DomainName+'</h5><div class="row mt-2" style="border-bottom:1px solid grey;"><div class="col"><b>Name</b></div><div class="col-2"><b>Type</b></div><div class="col"><b>Target</b></div></div><div class="row"><div class="col"><a onclick="navigator.clipboard.writeText(\''+record.ResourceRecord.Name+'\');$(this).addClass(\'text-success\');setTimeout(() => {$(this).removeClass(\'text-success\')}, 1000);" onmouseover="this.style.cursor=\'pointer\';"><i class="far fa-copy me-2"></i></a>'+record.ResourceRecord.Name+'</div><div class="col-2">'+record.ResourceRecord.Type+'</div><div class="col"><a onclick="navigator.clipboard.writeText(\''+record.ResourceRecord.Value+'\');$(this).addClass(\'text-success\');setTimeout(() => {$(this).removeClass(\'text-success\')}, 1000);" onmouseover="this.style.cursor=\'pointer\';"><i class="far fa-copy me-2"></i></a>'+record.ResourceRecord.Value+'</div></div></div></div>');
                }

                let obj = {'model': 'KyteSite', 'idx':data.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

                let subnavSite = [
                    {
                        faicon:'fas fa-sitemap',
                        label:'Pages',
                        href:'/app/site/?request='+encoded+'#Pages',
                        selector:'#Pages'
                    },
                    {
                        faicon:'fas fa-scroll',
                        label:'Scripts',
                        href:'/app/site/?request='+encoded+'#Scripts',
                        selector:'#Scripts'
                    },
                    {
                        faicon:'fas fa-book',
                        label:'Library',
                        href:'/app/site/?request='+encoded+'#Library',
                        selector:'#Library'
                    },
                    {
                        faicon:'fas fa-photo-video',
                        label:'Media',
                        href:'/app/site/?request='+encoded+'#Media',
                        selector:'#Media'
                    },
                    {
                        faicon:'fas fa-compass',
                        label:'Navigation',
                        href:'/app/site/?request='+encoded+'#Navigation',
                        selector:'#Navigation'
                    },
                    {
                        faicon:'fas fa-bars',
                        label:'Side Menu',
                        href:'/app/site/?request='+encoded+'#SideNav',
                        selector:'#SideNav'
                    },
                    {
                        faicon:'fas fa-puzzle-piece',
                        label:'Sections',
                        href:'/app/site/?request='+encoded+'#Sections',
                        selector:'#Sections'
                    },
                    {
                        faicon:'fas fa-at',
                        label:'Domains',
                        href:'/app/site/?request='+encoded+'#Domains',
                        selector:'#Domains'
                    },
                    {
                        faicon:'fas fa-wrench',
                        label:'Settings',
                        href:'/app/site/?request='+encoded+'#Settings',
                        selector:'#Settings'
                    },
                ];

                let sidenav = new KyteSidenav("#sidenav", subnavSite);
                sidenav.create();

                obj = {'model': 'Application', 'idx':data.site.application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                
                let appnav = generateAppNav(encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, `<i class="fas fa-rocket me-2"></i>${data.site.application.name}`);
                navbar.create();
            } else {
                $("#model-name").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});