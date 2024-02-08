let pages = []; // empty array to old object of pages
let itemCount = 1;
let columnStyle = 0;
let navItemStyle = 0;

document.addEventListener('KyteInitialized', function(e) {
    let k = e.detail.k;
    $('#pageLoaderModal').modal('show');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        k.get("SideNav", "id", idx, [], function(r) {
            if (r.data[0]) {
                data = r.data[0];
                $("#site-name").html(data.site.name);
                $("#domain-name").html('<i class="fas fa-link me-2"></i>'+(data.site.aliasDomain ? data.site.aliasDomain : data.site.cfDomain));
                $("#domain-name").attr('href', 'https://'+(data.site.aliasDomain ? data.site.aliasDomain : data.site.cfDomain));
                $("#region").html(data.site.region);

                $("#navigation-name").html(data.name);
                $("#bgColorHex").val(data.bgColor);
                $("#fgColorHex").val(data.fgColor);
                $("#bgActiveColorHex").val(data.bgActiveColor);
                $("#fgActiveColorHex").val(data.fgActiveColor);
                columnStyle = data.columnStyle;
                navItemStyle = data.labelCenterBlock;

                $("#columnStyle"+columnStyle).addClass('active');
                $("#navItemStyle"+navItemStyle).addClass('active');

                // update preview
                $("#colorPreview").css('background-color',data.bgColor);
                $("#colorPreview button").css('color', data.fgColor);
                $("#colorPreview button.active").css('background-color', data.bgActiveColor);
                $("#colorPreview button.active").css('color', data.fgActiveColor);
                
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
                
                let appnav = generateAppNav(data.site.application.name, encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, `<i class="fas fa-rocket me-2"></i>${data.site.application.name}`);
                navbar.create();

                // get pages
                k.get('KytePage', 'site', data.site.id, [], function(r) {
                    if (r.data.length > 0) {
                        pages = r.data;
                    }

                    // get nav items
                    $("#sortable-menu-items").sortable({
                        update: function(event, ui) {
                            let itemChanges = [];
                            $('.sortable-navitem-element').each(function(index, element) {
                                let navitemIdx = $(this).data('navIdx');
                                if (navitemIdx > 0) {
                                    // Access the index and element within the iteration
                                    itemChanges.push({'id':navitemIdx, 'itemOrder':index});
                                }
                            });
                            k.put('NavItems', 'SideNavItem', itemChanges.length, {'navitems':itemChanges}, null, []);
                        }
                    });
                    k.get('SideNavItem', 'sidenav', idx, [], function(r) {
                        if (r.data.length > 0) {
                            r.data.forEach(element => {
                                $("#sortable-menu-items").append(addMenuItem(element));
                                itemCount++;
                            });
                        }
                        $('#pageLoaderModal').modal('hide');
                    });

                    $("#addMenuItem").click(function(e) {
                        e.preventDefault();
                        $('#pageLoaderModal').modal('show');
                        // add menu item
                        k.post('SideNavItem', {
                            'title': 'New Navigation Item',
                            'sidenav': idx,
                            'site': data.site.id,
                            'itemOrder': itemCount,
                        }, null, [], function(r) {
                            if (r.data.length > 0) {
                                $("#sortable-menu-items").append(addMenuItem(r.data[0]));
                                itemCount++;
                            } else {
                                alert('Failed to create new nav item.');
                            }
                            $('#pageLoaderModal').modal('hide');
                        });
                    });
                });
            }
        });

        $("#publishMenu").click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $('#pageLoaderModal').modal('show');
            k.put('SideNav', 'id', idx, {
                'bgColor':$("#bgColorHex").val(),
                'fgColor':$("#fgColorHex").val(),
                'bgActiveColor':$("#bgActiveColorHex").val(),
                'fgActiveColor':$("#fgActiveColorHex").val(),
                'columnStyle':columnStyle,
                'labelCenterBlock':navItemStyle,
            }, null, [], function() {$('#pageLoaderModal').modal('hide');});
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }

    function addMenuItem(element) {
        let isLink = (element.page == null || element.page == 0) ? true : false;
        let isLogout = (element.isLogout == null || element.isLogout == 0) ? false : true;
        let linkOpt = '<select class="form-select navitem-target-type"><option value="link"'+(isLink && !isLogout ? ' selected' : '')+'>Link</option><option value="page"'+(isLink && !isLogout ? '' : ' selected')+'>Page</option><option value="logout"'+(isLogout ? ' selected' : '')+'>Logout</option></select>';
        let pageOpt = '<select class="navitem-page-selection form-select">';
        pageOpt += '<option'+((element.page == null || element.page == 0) ? ' selected' : '')+' disabled>Please select</option>'
        pages.forEach(page => {
            pageOpt += '<option value="'+page.id+'"'+((element.page != null && element.page.id == page.id) ? ' selected' : '')+'>'+page.title+` [${page.s3key}]</option>`;
        });
        pageOpt += '</select>';
        let menuItemHtml = '<li class="sortable-navitem-element" data-nav-idx="'+element.id+'"><div class="row navitem-row"><div class="col-auto d-flex row-grip"><i class="fas fa-grip-vertical"></i></div><div class="col"><input class="form-control navitem-title" type="text" value="'+element.title+'" /></div><div class="col"><input class="form-control navitem-faicon" type="text" placeholder="fab fa-font-awesome-flag" value="'+(element.faicon ? element.faicon : '')+'" /></div><div class="col"><input class="form-control navitem-link'+(isLink && !isLogout ? '' : ' d-none')+'" type="text" placeholder="url or anchor" value="'+(element.link ? element.link : '')+'" /></div><div class="col navitem-target-type-wrapper'+(isLink || isLogout ? ' d-none' : '')+'">'+pageOpt+'</div><div class="col-2">'+linkOpt+'</div><div class="col-auto d-flex row-delete"><a href="#" class="text-danger navitem-delete"><i class="fas fa-trash-alt"></i></a></div></div></li>';
        return menuItemHtml;
    }

    $("#sortable-menu-items").on('change', '.navitem-target-type', function() {
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        if ($(this).val() == 'link') {
            $(this).closest('.navitem-row').find('.navitem-target-type-wrapper').addClass('d-none');
            $(this).closest('.navitem-row').find('.navitem-link').removeClass('d-none');
            k.put('SideNavItem', 'id', navitemIdx, {'isLogout':0}, null, []);
        } else if ($(this).val() == 'page') {
            $(this).closest('.navitem-row').find('.navitem-target-type-wrapper').removeClass('d-none');
            $(this).closest('.navitem-row').find('.navitem-link').addClass('d-none');
            k.put('SideNavItem', 'id', navitemIdx, {'isLogout':0}, null, []);
        } else {
            $(this).closest('.navitem-row').find('.navitem-target-type-wrapper').addClass('d-none');
            $(this).closest('.navitem-row').find('.navitem-link').addClass('d-none');
            k.put('SideNavItem', 'id', navitemIdx, {'isLogout':1}, null, []);
        }
    });

    $("#sortable-menu-items").on('change', '.navitem-title', function() {
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        if (navitemIdx > 0) {
            k.put('SideNavItem', 'id', navitemIdx, {'title':$(this).val()}, null, []);
        }
    });

    $("#sortable-menu-items").on('change', '.navitem-faicon', function() {
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        if (navitemIdx > 0) {
            k.put('SideNavItem', 'id', navitemIdx, {'faicon':$(this).val()}, null, []);
        }
    });

    $("#sortable-menu-items").on('change', '.navitem-link', function() {
        let targetType = $(this).closest('.navitem-row').find('.navitem-target-type').val();
        if (targetType == 'link') {
            let item = $(this).closest('li');
            let navitemIdx = item.data('navIdx');
            if (navitemIdx > 0) {
                k.put('SideNavItem', 'id', navitemIdx, {'link':$(this).val(), 'page':null}, null, []);
            }
        }
    });

    $("#sortable-menu-items").on('change', '.navitem-page-selection', function() {
        let targetType = $(this).closest('.navitem-row').find('.navitem-target-type').val();
        if (targetType == 'page') {
            let item = $(this).closest('li');
            let navitemIdx = item.data('navIdx');
            if (navitemIdx > 0) {
                k.put('SideNavItem', 'id', navitemIdx, {'page':$(this).val(), 'link':null}, null, []);
            }
        }
    });

    $("#sortable-menu-items").on('click', '.navitem-delete', function(e) {
        e.preventDefault();
        e.stopPropagation();
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        if (navitemIdx > 0) {
            k.delete('SideNavItem', 'id', navitemIdx, [], function() {
                item.remove();
            }, function(err) {
                alert('Unable to delete: '+err);
            })
        } else { alert('Invalid navigation item index of '+navitemIdx); }
    });

    $('.page-tab-link').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
    
        $('.page-tab-link').removeClass('active');
        $(this).addClass('active');
    
       $('.tab-page').addClass('d-none');
       let pageSelector = $(this).data('targetPage');
       $('#'+pageSelector).removeClass('d-none');
    });

    $("#bgColorHex").change(function() {
        $("#colorPreview").css('background-color', $(this).val());
        console.log($(this).val());
    });
    $("#fgColorHex").change(function() {
        $("#colorPreview button").css('color', $(this).val());
        console.log($(this).val());
    });
    $("#bgActiveColorHex").change(function() {
        $("#colorPreview button.active").css('background-color', $(this).val());
        console.log($(this).val());
    });
    $("#fgActiveColorHex").change(function() {
        $("#colorPreview button.active").css('color', $(this).val());
        console.log($(this).val());
    });

    $(".column-style-select").click(function(e) {
        e.preventDefault();
        columnStyle = $(this).data('columnStyle');
        $(".column-style-select").removeClass('active');
        $("#columnStyle"+columnStyle).addClass('active');
    });

    $(".nav-item-style-select").click(function(e) {
        e.preventDefault();
        navItemStyle = $(this).data('navItemStyle');
        $(".nav-item-style-select").removeClass('active');
        $("#navItemStyle"+navItemStyle).addClass('active');
    });
});
