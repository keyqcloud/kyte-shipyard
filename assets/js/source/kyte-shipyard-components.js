let colDefComponents = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'identifier','label':'Identifier'},
    {'targets':2,'data':'description','label':'Description'},
];

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    $('#pageLoaderModal').modal('show');

    if (_ks.isSession()) {
        // Initialize application sidebar navigation
        if (typeof initAppSidebar === 'function') {
            initAppSidebar();
        }

        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        // Function to initialize form with translations
        function initializeForm() {
            // Define form elements with translated labels
            const t = window.kyteI18n ? (key) => window.kyteI18n.t(key) : (key) => key;
            let fldsComponent = [
                [
                    {
                        'field':'name',
                        'type':'text',
                        'label': t('ui.components.modal.field.name'),
                        'required':true
                    },
                    {
                        'field':'identifier',
                        'type':'text',
                        'label': t('ui.components.modal.field.identifier'),
                        'required':true
                    },
                ],
                [
                    {
                        'field':'description',
                        'type':'textarea',
                        'label': t('ui.components.modal.field.description'),
                        'required':false
                    }
                ]
            ];

            let hidden = [
                {
                    'name': 'application',
                    'value': idx
                }
            ];

            var frmComponent = new KyteForm(_ks, $("#modalForm"), 'KyteWebComponent', hidden, fldsComponent, t('ui.components.modal.title'), tblComponents, true, $("#new"));
            frmComponent.init();
            frmComponent.success = function(r) {
                if (r.data[0]) {
                    let obj = {'model': 'KyteWebComponent', 'idx':r.data[0].id};
                    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    location.href="/app/component/?request="+encoded+"#Code";
                }
            }
            tblComponents.bindEdit(frmComponent);
        }

        var tblComponents = new KyteTable(_ks, $("#webcomponents-table"), {'name':'KyteWebComponent','field':'application','value':idx}, colDefComponents, true, [0,"asc"], false, true, 'id', '/app/component/');
        tblComponents.init();

        // Wait for i18n to be ready before initializing form
        function waitForI18n() {
            if (window.kyteI18n && window.kyteI18n.initialized) {
                initializeForm();
            } else {
                setTimeout(waitForI18n, 50);
            }
        }
        waitForI18n();

        // Gallery View Functionality
        let currentView = 'list';
        let allComponents = [];

        // View Toggle Button
        $('#viewToggleBtn').click(function() {
            const t = window.kyteI18n ? (key) => window.kyteI18n.t(key) : (key) => key;

            if (currentView === 'list') {
                // Switch to gallery
                currentView = 'gallery';
                $('#listView').hide();
                $('#galleryView').show();
                $(this).html('<i class="fas fa-list"></i> <span data-i18n="ui.components.list_view">' + t('ui.components.list_view') + '</span>');
                renderGalleryView();
            } else {
                // Switch to list
                currentView = 'list';
                $('#galleryView').hide();
                $('#listView').show();
                $(this).html('<i class="fas fa-th"></i> <span data-i18n="ui.components.gallery_view">' + t('ui.components.gallery_view') + '</span>');
            }
        });

        // Render Gallery View
        function renderGalleryView() {
            _ks.get('KyteWebComponent', 'application', idx, [], function(response) {
                allComponents = response.data || [];
                const gallery = $('#componentsGallery');
                gallery.empty();

                if (allComponents.length === 0) {
                    gallery.html('<div class="col-12 text-center"><p class="text-muted">No components yet. Create your first component!</p></div>');
                    return;
                }

                allComponents.forEach(component => {
                    const card = createComponentCard(component);
                    gallery.append(card);
                });
            });
        }

        // Create Component Card for Gallery
        function createComponentCard(component) {
            let obj = {'model': 'KyteWebComponent', 'idx': component.id};
            let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
            let detailUrl = `/app/component/?request=${encoded}`;

            // Parse description to check for thumbnail
            let thumbnailUrl = null;
            let displayDescription = component.description || 'No description';

            try {
                if (component.description && component.description.startsWith('{')) {
                    const metadata = JSON.parse(component.description);
                    if (metadata.thumbnail) {
                        thumbnailUrl = metadata.thumbnail;
                    }
                    if (metadata.description) {
                        displayDescription = metadata.description;
                    }
                }
            } catch (e) {
                // Not JSON, use as-is
            }

            // Create preview HTML
            let previewHtml = '';
            if (thumbnailUrl) {
                // Use captured thumbnail if available
                previewHtml = `<img src="${thumbnailUrl}" alt="${component.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else if (component.html && component.stylesheet) {
                // Fall back to live iframe preview
                const previewCode = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { margin: 0; padding: 10px; font-family: sans-serif; }
                            ${component.stylesheet}
                        </style>
                    </head>
                    <body>
                        ${component.html}
                    </body>
                    </html>
                `;
                const blob = new Blob([previewCode], {type: 'text/html'});
                const url = URL.createObjectURL(blob);
                previewHtml = `<iframe src="${url}" style="pointer-events: none;"></iframe>`;
            } else {
                previewHtml = '<div class="no-preview"><i class="fas fa-code"></i></div>';
            }

            return `
                <div class="col-md-6 col-lg-4">
                    <div class="component-card">
                        <div class="component-card-preview">
                            ${previewHtml}
                        </div>
                        <div class="component-card-body">
                            <div class="component-card-title">${component.name || 'Untitled'}</div>
                            <div class="component-card-identifier">${component.identifier || 'no-identifier'}</div>
                            <div class="component-card-description">${displayDescription}</div>
                            <div class="component-card-actions">
                                <a href="${detailUrl}" class="btn btn-sm btn-primary">
                                    <i class="fas fa-edit"></i> Edit
                                </a>
                                <button class="btn btn-sm btn-danger" onclick="deleteComponent(${component.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Delete Component Function (global for onclick)
        window.deleteComponent = function(componentId) {
            if (confirm('Are you sure you want to delete this component?')) {
                _ks.delete('KyteWebComponent', 'id', componentId, function() {
                    if (currentView === 'gallery') {
                        renderGalleryView();
                    } else {
                        tblComponents.render();
                    }
                });
            }
        };

        // Import Functionality
        let importedData = null;

        $('#importBtn').click(function() {
            const modal = new bootstrap.Modal(document.getElementById('importModal'));
            modal.show();
        });

        $('#importFileInput').change(function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    importedData = JSON.parse(event.target.result);

                    // Validate required fields
                    if (!importedData.name || !importedData.identifier || !importedData.html) {
                        alert('Invalid component file. Missing required fields.');
                        return;
                    }

                    // Show preview
                    $('#importPreviewDetails').html(`
                        <li><strong>Name:</strong> ${importedData.name}</li>
                        <li><strong>Identifier:</strong> ${importedData.identifier}</li>
                        <li><strong>Description:</strong> ${importedData.description || 'None'}</li>
                    `);
                    $('#importPreview').show();
                    $('#importConfirmBtn').prop('disabled', false);
                } catch (error) {
                    alert('Error reading file: ' + error.message);
                }
            };
            reader.readAsText(file);
        });

        $('#importConfirmBtn').click(function() {
            if (!importedData) return;

            $('#pageLoaderModal').modal('show');

            const componentData = {
                name: importedData.name,
                identifier: importedData.identifier + '-imported-' + Date.now(), // Ensure unique identifier
                description: importedData.description || '',
                html: importedData.html,
                stylesheet: importedData.stylesheet || '',
                sample_data: importedData.sample_data || '[]',
                application: idx
            };

            _ks.post('KyteWebComponent', componentData, null, [], function(response) {
                $('#pageLoaderModal').modal('hide');
                bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();

                // Refresh view
                if (currentView === 'gallery') {
                    renderGalleryView();
                } else {
                    tblComponents.render();
                }

                alert('Component imported successfully!');
            }, function(error) {
                $('#pageLoaderModal').modal('hide');
                alert('Error importing component: ' + error);
            });
        });

        // Component Templates
        const componentTemplates = [
            {
                id: 'blank',
                name: 'Blank Component',
                icon: 'fas fa-file',
                description: 'Start from scratch with an empty component',
                html: '<div class="component">\n    <h3>{{title}}</h3>\n    <p>{{description}}</p>\n</div>',
                css: '.component {\n    padding: 1rem;\n    border: 1px solid #ddd;\n    border-radius: 4px;\n}\n\n.component h3 {\n    margin: 0 0 0.5rem 0;\n    color: #333;\n}\n\n.component p {\n    margin: 0;\n    color: #666;\n}',
                sample: '[{"title": "Example Title", "description": "Example description"}]'
            },
            {
                id: 'card',
                name: 'Card Component',
                icon: 'fas fa-id-card',
                description: 'Pre-built card layout with image, title, and description',
                html: '<div class="card-component">\n    <img src="{{image_url}}" alt="{{title}}" class="card-image">\n    <div class="card-content">\n        <h3 class="card-title">{{title}}</h3>\n        <p class="card-description">{{description}}</p>\n        <a href="{{link_url}}" class="card-button">Learn More</a>\n    </div>\n</div>',
                css: '.card-component {\n    border: 1px solid #e0e0e0;\n    border-radius: 8px;\n    overflow: hidden;\n    box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n    transition: transform 0.2s;\n}\n\n.card-component:hover {\n    transform: translateY(-4px);\n    box-shadow: 0 4px 8px rgba(0,0,0,0.15);\n}\n\n.card-image {\n    width: 100%;\n    height: 200px;\n    object-fit: cover;\n}\n\n.card-content {\n    padding: 1.5rem;\n}\n\n.card-title {\n    margin: 0 0 0.5rem 0;\n    font-size: 1.25rem;\n    color: #333;\n}\n\n.card-description {\n    margin: 0 0 1rem 0;\n    color: #666;\n    line-height: 1.5;\n}\n\n.card-button {\n    display: inline-block;\n    padding: 0.5rem 1rem;\n    background: #ff6b35;\n    color: white;\n    text-decoration: none;\n    border-radius: 4px;\n    transition: background 0.2s;\n}\n\n.card-button:hover {\n    background: #e55a25;\n}',
                sample: '[{"image_url": "https://via.placeholder.com/400x200", "title": "Product Name", "description": "A brief description of the product", "link_url": "#"}]'
            },
            {
                id: 'list-item',
                name: 'List Item',
                icon: 'fas fa-list',
                description: 'List item with icon, title, and metadata',
                html: '<div class="list-item">\n    <div class="list-item-icon">\n        <i class="fas fa-{{icon}}"></i>\n    </div>\n    <div class="list-item-content">\n        <h4 class="list-item-title">{{title}}</h4>\n        <p class="list-item-description">{{description}}</p>\n        <div class="list-item-meta">\n            <span class="meta-item"><i class="fas fa-calendar"></i> {{date}}</span>\n            <span class="meta-item"><i class="fas fa-user"></i> {{author}}</span>\n        </div>\n    </div>\n</div>',
                css: '.list-item {\n    display: flex;\n    gap: 1rem;\n    padding: 1rem;\n    border-bottom: 1px solid #e0e0e0;\n    transition: background 0.2s;\n}\n\n.list-item:hover {\n    background: #f5f5f5;\n}\n\n.list-item-icon {\n    width: 50px;\n    height: 50px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    background: #ff6b35;\n    color: white;\n    border-radius: 50%;\n    font-size: 1.5rem;\n    flex-shrink: 0;\n}\n\n.list-item-content {\n    flex: 1;\n}\n\n.list-item-title {\n    margin: 0 0 0.5rem 0;\n    font-size: 1.1rem;\n    color: #333;\n}\n\n.list-item-description {\n    margin: 0 0 0.5rem 0;\n    color: #666;\n    line-height: 1.5;\n}\n\n.list-item-meta {\n    display: flex;\n    gap: 1rem;\n    font-size: 0.85rem;\n    color: #999;\n}\n\n.meta-item i {\n    margin-right: 0.25rem;\n}',
                sample: '[{"icon": "check-circle", "title": "Task Completed", "description": "The task has been successfully completed", "date": "2026-01-04", "author": "John Doe"}]'
            },
            {
                id: 'alert',
                name: 'Alert/Notification',
                icon: 'fas fa-exclamation-triangle',
                description: 'Alert box with different types (success, warning, error)',
                html: '<div class="alert alert-{{type}}">\n    <div class="alert-icon">\n        <i class="fas fa-{{icon}}"></i>\n    </div>\n    <div class="alert-content">\n        <h5 class="alert-title">{{title}}</h5>\n        <p class="alert-message">{{message}}</p>\n    </div>\n</div>',
                css: '.alert {\n    display: flex;\n    gap: 1rem;\n    padding: 1rem;\n    border-radius: 4px;\n    border-left: 4px solid;\n}\n\n.alert-success {\n    background: #d4edda;\n    border-color: #28a745;\n    color: #155724;\n}\n\n.alert-warning {\n    background: #fff3cd;\n    border-color: #ffc107;\n    color: #856404;\n}\n\n.alert-error {\n    background: #f8d7da;\n    border-color: #dc3545;\n    color: #721c24;\n}\n\n.alert-icon {\n    font-size: 1.5rem;\n    flex-shrink: 0;\n}\n\n.alert-title {\n    margin: 0 0 0.5rem 0;\n    font-size: 1.1rem;\n    font-weight: 600;\n}\n\n.alert-message {\n    margin: 0;\n    line-height: 1.5;\n}',
                sample: '[{"type": "success", "icon": "check-circle", "title": "Success!", "message": "Your operation completed successfully."}]'
            }
        ];

        // Override new button to show templates modal
        $('#new').click(function(e) {
            e.preventDefault();
            showTemplatesModal();
        });

        function showTemplatesModal() {
            const templatesGrid = $('#templatesGrid');
            templatesGrid.empty();

            componentTemplates.forEach(template => {
                const card = `
                    <div class="col-md-6 col-lg-3">
                        <div class="template-card" data-template-id="${template.id}">
                            <div class="template-card-icon">
                                <i class="${template.icon}"></i>
                            </div>
                            <div class="template-card-title">${template.name}</div>
                            <div class="template-card-description">${template.description}</div>
                        </div>
                    </div>
                `;
                templatesGrid.append(card);
            });

            // Bind click events
            $('.template-card').click(function() {
                const templateId = $(this).data('template-id');
                createComponentFromTemplate(templateId);
            });

            const modal = new bootstrap.Modal(document.getElementById('templatesModal'));
            modal.show();
        }

        function createComponentFromTemplate(templateId) {
            const template = componentTemplates.find(t => t.id === templateId);
            if (!template) return;

            $('#pageLoaderModal').modal('show');

            const componentData = {
                name: template.name + ' - ' + Date.now(),
                identifier: template.id + '-' + Date.now(),
                description: template.description,
                html: template.html,
                stylesheet: template.css,
                sample_data: template.sample,
                application: idx
            };

            _ks.post('KyteWebComponent', componentData, null, [], function(response) {
                $('#pageLoaderModal').modal('hide');
                bootstrap.Modal.getInstance(document.getElementById('templatesModal')).hide();

                if (response.data && response.data[0]) {
                    let obj = {'model': 'KyteWebComponent', 'idx': response.data[0].id};
                    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    location.href = "/app/component/?request=" + encoded;
                }
            }, function(error) {
                $('#pageLoaderModal').modal('hide');
                alert('Error creating component: ' + error);
            });
        }

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});