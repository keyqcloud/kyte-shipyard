let pages = []; // empty array to old object of pages
let parentMenuItems = [];
let itemCount = 1;

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    $('#pageLoaderModal').modal('show');
    
    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        _ks.get("Navigation", "id", idx, [], function(r) {
            if (r.data[0]) {
                data = r.data[0];
                $("#site-name").html(data.site.name);
                $("#domain-name").html('<i class="fas fa-link me-2"></i>'+(data.site.aliasDomain ? data.site.aliasDomain : data.site.cfDomain));
                $("#domain-name").attr('href', 'https://'+(data.site.aliasDomain ? data.site.aliasDomain : data.site.cfDomain));
                $("#region").html(data.site.region);
                //
                $("#bgColorHex").val(data.bgColor);
                $("#fgColorHex").val(data.fgColor);
                $("#bgDropdownColorHex").val(data.bgDropdownColor);
                $("#fgDropdownColorHex").val(data.fgDropdownColor);
                $("#isStickyTop").val(data.isStickyTop);
                // update preview
                $("#colorPreview .navbar").css('background-color',data.bgColor);
                $("#colorPreview .navbar a").css('color', data.fgColor);
                $("#colorPreview .dropdown-menu").css('background-color', data.bgDropdownColor);
                $("#colorPreview .dropdown-item").css('color', data.fgDropdownColor);

                $("#navigation-name").html(data.name);

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

                // get pages
                _ks.get('KytePage', 'site', data.site.id, [], function(r) {
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
                            _ks.put('NavItems', 'NavigationItem', itemChanges.length, {'navitems':itemChanges}, null, []);
                        }
                    });
                    _ks.get('NavigationItem', 'navigation', idx, [], function(r) {
                        if (r.data.length > 0) {
                            let parentMenuSelect = '<select class="navitem-parentItem form-select"><option value="0">No Parent Menu</option>';
                            r.data.forEach(element => {
                                $("#sortable-menu-items").append(addMenuItem(element));
                                parentMenuItems.push(element);
                                parentMenuSelect += '<option value="'+element.id+'">'+element.title+'</option>';
                                itemCount++;
                            });
                            parentMenuSelect += '</select>';
                            $(".navitem-parentItem-wrapper").html(parentMenuSelect);
                            parentMenuItems.forEach(item => {
                                if (item.parentItem != null && item.parentItem.id > 0) {
                                    $(".navitem-idx-"+item.id).find('.navitem-parentItem').val(item.parentItem.id);
                                }
                            });
                        }
                        $('#pageLoaderModal').modal('hide');
                    });

                    $("#addMenuItem").click(function(e) {
                        e.preventDefault();
                        $('#pageLoaderModal').modal('show');
                        // add menu item
                        _ks.post('NavigationItem', {
                            'title': 'New Navigation Item',
                            'navigation': idx,
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
            _ks.put('Navigation', 'id', idx, {
                'bgColor':$("#bgColorHex").val(),
                'fgColor':$("#fgColorHex").val(),
                'bgDropdownColor':$("#bgDropdownColorHex").val(),
                'fgDropdownColor':$("#fgDropdownColorHex").val(),
                'isStickyTop':$("#isStickyTop").val(),
            }, null, [], function() {$('#pageLoaderModal').modal('hide');});
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }

    function addMenuItem(element) {
        let isLink = (element.page == null || element.page == 0) ? true : false;
        let isLogout = (element.isLogout == null || element.isLogout == 0) ? false : true;
        // target link type select
        let linkOpt = `
        <select class="form-select navitem-target-type">
            <option value="link"${isLink && !isLogout ? ' selected' : ''}>Link</option>
            <option value="page"${isLink && !isLogout ? '' : ' selected'}>Page</option>
            <option value="logout"${isLogout ? ' selected' : ''}>Logout</option>
        </select>`;
        // menu item position
        let linkPos = `
        <select class="form-select navitem-position">
            <option value="1"${element.center == '1' ? ' selected' : ''}>Center</option>
            <option value="0"${element.center == '0' ? ' selected' : ''}>Right</option>
        </select>`;
        // page options
        let pageOpt = `
        <select class="navitem-page-selection form-select">
            <option${(element.page == null || element.page == 0) ? ' selected' : ''} disabled>Please select</option>`;
        pages.forEach(page => {
            pageOpt += `<option value="${page.id}"${(element.page != null && element.page.id == page.id) ? ' selected' : ''}>${page.title} [${page.s3key}]</option>`;
        });
        pageOpt += `</select>`;
        // generate menu item html
        let menuItemHtml = `
        <li class="sortable-navitem-element navitem-idx-${element.id}" data-nav-idx="${element.id}">
            <div class="row navitem-row">
                <div class="col">
                    <div class="row">
                        <div class="col">
                            <small style="font-weight: 600">Label</small>
                            <input class="form-control navitem-title" type="text" value="${element.title}" />
                        </div>
                        <div class="col navitem-link-wrapper${isLink && !isLogout ? '' : ' d-none'}">
                            <small style="font-weight: 600">Link URL</small>
                            <input class="form-control navitem-link" type="text" placeholder="url or anchor" value="${element.link ? element.link : ''}" />
                        </div>
                        <div class="col navitem-target-type-wrapper${isLink || isLogout ? ' d-none' : ''}">
                            <small style="font-weight: 600">Page</small>
                            ${pageOpt}
                        </div>
                        <div class="col-2">
                            <small style="font-weight: 600">Link Type</small>
                            ${linkOpt}
                        </div>
                        <div class="col">
                            <small style="font-weight: 600">Dropdown Parent</small>
                            <div class="navitem-parentItem-wrapper"></div>
                        </div>
                    </div>
                    <div class="row mt-1">
                        <div class="col">
                            <small style="font-weight: 600">Font Awesome</small>
                            <input class="form-control navitem-faicon" type="text" placeholder="fab fa-font-awesome-flag" value="${element.faicon ? element.faicon : ''}" />
                        </div>
                        <div class="col">
                            <small style="font-weight: 600">Element ID</small>
                            <input class="form-control navitem-element-id" type="text" placeholder="MyAmazingNavItem" value="${element.element_id ? element.element_id : ''}" />
                        </div>
                        <div class="col">
                            <small style="font-weight: 600">Element Class</small>
                            <input class="form-control navitem-element-class" type="text" placeholder="my-nav-item text-primary" value="${element.element_class ? element.element_class : ''}" />
                        </div>
                        <div class="col-2">
                            <small style="font-weight: 600">Position</small>
                            ${linkPos}
                        </div>
                    </div>
                </div>
                <div class="col-auto d-flex align-items-center position-relative">
                    <i class="fas fa-arrows-alt position-absolute top-0" style="right:5px"></i>
                    <a href="#" class="text-danger navitem-delete"><i class="fas fa-trash-alt"></i></a>
                </div>
            </div>
        </li>`;
        return menuItemHtml;
    }

    $("#sortable-menu-items").on('change', '.navitem-parentItem', function() {
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        _ks.put('NavigationItem', 'id', navitemIdx, {'parentItem':$(this).val()}, null, []);
    });

    $("#sortable-menu-items").on('change', '.navitem-position', function() {
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        _ks.put('NavigationItem', 'id', navitemIdx, {'center':$(this).val()}, null, []);
    });

    $("#sortable-menu-items").on('change', '.navitem-target-type', function() {
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        if ($(this).val() == 'link') {
            $(this).closest('.navitem-row').find('.navitem-target-type-wrapper').addClass('d-none');
            $(this).closest('.navitem-row').find('.navitem-link-wrapper').removeClass('d-none');
            // update to set isLogout
            _ks.put('NavigationItem', 'id', navitemIdx, {'isLogout':0}, null, []);
        } else if ($(this).val() == 'page') {
            $(this).closest('.navitem-row').find('.navitem-target-type-wrapper').removeClass('d-none');
            $(this).closest('.navitem-row').find('.navitem-link-wrapper').addClass('d-none');
            // update to set isLogout
            _ks.put('NavigationItem', 'id', navitemIdx, {'isLogout':0}, null, []);
        } else {
            $(this).closest('.navitem-row').find('.navitem-target-type-wrapper').addClass('d-none');
            $(this).closest('.navitem-row').find('.navitem-link-wrapper').addClass('d-none');
            // update to set isLogout
            _ks.put('NavigationItem', 'id', navitemIdx, {'isLogout':1}, null, []);
        }
    });

    $("#sortable-menu-items").on('change', '.navitem-title', function() {
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        if (navitemIdx > 0) {
            _ks.put('NavigationItem', 'id', navitemIdx, {'title':$(this).val()}, null, []);
        }
    });

    $("#sortable-menu-items").on('change', '.navitem-faicon', function() {
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        if (navitemIdx > 0) {
            _ks.put('NavigationItem', 'id', navitemIdx, {'faicon':$(this).val()}, null, []);
        }
    });

    $("#sortable-menu-items").on('change', '.navitem-link', function() {
        let targetType = $(this).closest('.navitem-row').find('.navitem-target-type').val();
        if (targetType == 'link') {
            let item = $(this).closest('li');
            let navitemIdx = item.data('navIdx');
            if (navitemIdx > 0) {
                _ks.put('NavigationItem', 'id', navitemIdx, {'link':$(this).val(), 'page':null}, null, []);
            }
        }
    });

    $("#sortable-menu-items").on('change', '.navitem-page-selection', function() {
        let targetType = $(this).closest('.navitem-row').find('.navitem-target-type').val();
        if (targetType == 'page') {
            let item = $(this).closest('li');
            let navitemIdx = item.data('navIdx');
            if (navitemIdx > 0) {
                _ks.put('NavigationItem', 'id', navitemIdx, {'page':$(this).val(), 'link':null}, null, []);
            }
        }
    });

    $("#sortable-menu-items").on('change', '.navitem-element-id', function() {
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        if (navitemIdx > 0) {
            _ks.put('NavigationItem', 'id', navitemIdx, {'element_id':$(this).val()}, null, []);
        }
    });

    $("#sortable-menu-items").on('change', '.navitem-element-class', function() {
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        if (navitemIdx > 0) {
            _ks.put('NavigationItem', 'id', navitemIdx, {'element_class':$(this).val()}, null, []);
        }
    });

    $("#sortable-menu-items").on('click', '.navitem-delete', function(e) {
        e.preventDefault();
        e.stopPropagation();
        let item = $(this).closest('li');
        let navitemIdx = item.data('navIdx');
        if (navitemIdx > 0) {
            _ks.delete('NavigationItem', 'id', navitemIdx, [], function() {
                item.remove();
            }, function(err) {
                alert('Unable to delete: '+err);
            })
        } else { alert('Invalid navigation item index of '+navitemIdx); }
    });

    $("#bgColorHex").change(function() {
        $("#colorPreview .navbar").css('background-color', $(this).val());
        console.log($(this).val());
    });
    $("#fgColorHex").change(function() {
        $("#colorPreview .navbar a").css('color', $(this).val());
        console.log($(this).val());
    });
    $("#bgDropdownColorHex").change(function() {
        $("#colorPreview .dropdown-menu").css('background-color', $(this).val());
        console.log($(this).val());
    });
    $("#fgDropdownColorHex").change(function() {
        $("#colorPreview .dropdown-item").css('color', $(this).val());
        console.log($(this).val());
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
});