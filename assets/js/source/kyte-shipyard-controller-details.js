let subnavController = [
    {
        faicon:'fas fa-code',
        label:'Functions',
        selector:'#Functions'
    },
];

let controllerName = "Undefined";
let modelName = "Virtual";

// let implementationMap = {
//     // hooks
//     'hook_init':0,
//     'hook_auth':0,
//     'hook_prequery':0,
//     'hook_preprocess':0,
//     'hook_response_data':0,
//     'hook_process_get_response':0,

//     // overrides
//     'new':0,
//     'update':0,
//     'get':0,
//     'delete':0,
// }

// Function form elements will be generated with translations in the init code below
let functionFormElements = [];

let colDefFunctions = [
    {'targets':0,'data':'type','label':'Type', render: function(data, type, row, meta) { return row.name ? data+'<small class="d-block">'+row.name+'</small>' : data; }},
    {'targets':1,'data':'description','label':'Description'},
];

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    // NOTE: Sidebar navigation removed - now using Bootstrap tabs in HTML
    // Bootstrap tabs handle show/hide automatically via data-bs-toggle="tab" attributes

    $('#pageLoaderModal').modal('show');

    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        // Wait for i18n to be ready before generating form elements
        function waitForI18n(callback) {
            if (window.kyteI18n && window.kyteI18n.translations && Object.keys(window.kyteI18n.translations).length > 0) {
                callback();
            } else {
                setTimeout(() => waitForI18n(callback), 50);
            }
        }

        waitForI18n(() => {
            // Get i18n instance for translations
            const i18n = window.kyteI18n;
            const t = (key, fallback) => i18n ? i18n.t(key) : fallback;

            console.log('[Controller Detail] i18n ready, current language:', i18n.getCurrentLanguage());

            // Generate form elements with translations
            functionFormElements = [
            [
                {
                    'field':'name',
                    'type':'text',
                    'label': t('ui.controller_detail.form.name', 'Name'),
                    'required':false
                },
                {
                    'field':'type',
                    'type':'select',
                    'label': t('ui.controller_detail.form.type', 'Type') + ' <a href="#" id="function-type-help" class="text-info ms-2" title="What are these function types?"><i class="fas fa-question-circle"></i></a>',
                    'required':true,
                    'option': {
                        'ajax': false,
                        'data': {
                            'hook_init': t('ui.controller_detail.form.type_hook_init', 'hook : hook_init'),
                            'hook_auth': t('ui.controller_detail.form.type_hook_auth', 'hook : hook_auth'),
                            'hook_prequery': t('ui.controller_detail.form.type_hook_prequery', 'hook : hook_prequery'),
                            'hook_preprocess': t('ui.controller_detail.form.type_hook_preprocess', 'hook : hook_preprocess'),
                            'hook_response_data': t('ui.controller_detail.form.type_hook_response_data', 'hook : hook_response_data'),
                            'hook_process_get_response': t('ui.controller_detail.form.type_hook_process_get_response', 'hook : hook_process_get_response'),
                            'new': t('ui.controller_detail.form.type_override_new', 'override : new'),
                            'update': t('ui.controller_detail.form.type_override_update', 'override : update'),
                            'get': t('ui.controller_detail.form.type_override_get', 'override : get'),
                            'delete': t('ui.controller_detail.form.type_override_delete', 'override : delete'),
                            'custom': t('ui.controller_detail.form.type_custom', 'custom')
                        }
                    }
                }
            ],
            [
                {
                    'field':'description',
                    'type':'textarea',
                    'label': t('ui.controller_detail.form.description', 'Description'),
                    'required':false
                }
            ]
        ];

        let hidden = [
            {
                'name': 'controller',
                'value': idx
            }
        ];

        _ks.get("Controller", "id", idx, [], function(r) {
            if (r.data[0]) {
                controllerName = r.data[0].name;
                $("#controller-name span").text(controllerName);
                if (r.data[0].dataModel) {
                    modelName = r.data[0].dataModel.name;
                }
                // Store application ID for navigation
                localStorage.setItem('currentAppId', r.data[0].application.id);
                let obj = {'model': 'Application', 'idx':r.data[0].application.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));

                let appnav = generateAppNav(encoded);

                let navbar = new KyteNav("#mainnav", appnav, null, `<i class="fas fa-rocket me-2"></i>${r.data[0].application.name}`);
                navbar.create();

                // create link to model and update model name
                if (r.data[0].dataModel == 0 || !r.data[0].dataModel) {
                    $("#model-name").html(`Virtual`);
                } else {
                    obj = {'model': 'Model', 'idx':r.data[0].dataModel.id};
                    encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    $("#model-name").html(`<a href="/app/model/?request=${encoded}">${modelName}</a>`);
                }
            } else {
                $("#controller-name span").text("Undefined");
                $("#model-name").html("Undefined");
            }

            $('#pageLoaderModal').modal('hide');
        });

        var functionsTable = new KyteTable(_ks, $("#functions-table"), {'name':'Function','field':'controller','value':idx}, colDefFunctions, true, [0,"asc"], false, true, 'id', '/app/function/');
        functionsTable.init();

        // Update functions count in sidebar
        $('#functions-table').on('draw.dt', function() {
            var info = $(this).DataTable().page.info();
            $('#functions-count').text(info.recordsTotal);
        });

        // Get translated modal title
        const functionModalTitle = window.kyteI18n ? window.kyteI18n.t('ui.controller_detail.modal.function_title') : 'Function';
        const submitText = window.kyteI18n ? window.kyteI18n.t('ui.model_detail.modal.submit') : 'Submit';

        var modelFormFunction = new KyteForm(_ks, $("#modalControllerFunctionForm"), 'Function', hidden, functionFormElements, functionModalTitle, functionsTable, true, $("#assignController"));
        modelFormFunction.submitButton = submitText;
        modelFormFunction.init();
        modelFormFunction.success = function(r) {
            if (r.data[0]) {
                let obj = {'model': 'Function', 'idx':r.data[0].id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                location.href="/app/function/?request="+encoded+"#Code";
            }
        }
        functionsTable.bindEdit(modelFormFunction);

        // Add help modal for function types
        $(document).on('click', '#function-type-help', function(e) {
            e.preventDefault();
            const helpContent = `
                <div class="function-type-help">
                    <h5 class="mb-3">Function Types Explained</h5>

                    <h6 class="text-primary mt-3"><i class="fas fa-link"></i> Hooks</h6>
                    <p class="small text-muted mb-2">Lifecycle methods that let you inject custom logic at specific points in the request/response cycle:</p>
                    <ul class="small">
                        <li><strong>hook_init</strong> - Runs when the controller is initialized, before any action is executed</li>
                        <li><strong>hook_auth</strong> - Additional authentication logic that runs AFTER default session validation passes (add permission checks, IP validation, 2FA, etc.)</li>
                        <li><strong>hook_prequery</strong> - Modify database query conditions before data is retrieved</li>
                        <li><strong>hook_preprocess</strong> - Transform/validate request data before saving (create/update)</li>
                        <li><strong>hook_response_data</strong> - Transform response data before sending to client</li>
                        <li><strong>hook_process_get_response</strong> - Process GET request responses (add computed fields, etc.)</li>
                    </ul>

                    <h6 class="text-success mt-3"><i class="fas fa-edit"></i> Overrides</h6>
                    <p class="small text-muted mb-2">Replace the default CRUD operations with completely custom implementations:</p>
                    <ul class="small">
                        <li><strong>new</strong> - Override the default create operation (POST requests)</li>
                        <li><strong>update</strong> - Override the default update operation (PUT requests)</li>
                        <li><strong>get</strong> - Override the default read operation (GET requests)</li>
                        <li><strong>delete</strong> - Override the default delete operation (DELETE requests)</li>
                    </ul>

                    <h6 class="text-warning mt-3"><i class="fas fa-code"></i> Custom</h6>
                    <p class="small text-muted mb-2">Create your own custom methods that don't fit the standard CRUD pattern:</p>
                    <ul class="small">
                        <li>Define any method name (e.g., <code>sendEmail</code>, <code>processPayment</code>, <code>generateReport</code>)</li>
                        <li>Called via custom API endpoints</li>
                        <li>Useful for business logic that doesn't map to database operations</li>
                    </ul>

                    <div class="alert alert-info mt-3 small">
                        <i class="fas fa-lightbulb"></i> <strong>Tip:</strong> Use <strong>hooks</strong> when you want to extend default behavior. Use <strong>overrides</strong> when you need complete control. Use <strong>custom</strong> for non-CRUD operations.
                    </div>
                </div>
            `;

            _ks.alert('Function Types Guide', helpContent);

            // Fix z-index and close button styling after alert is created
            setTimeout(function() {
                // Find the jQuery UI dialog and ensure it's above the function creation modal
                // Bootstrap modals use z-index 1055, so we need to be higher
                const $dialog = $('.ui-dialog').last();
                $dialog.css('z-index', '10000');

                // Style the title bar
                const $titleBar = $dialog.find('.ui-dialog-titlebar');
                $titleBar.css({
                    'background': '#ff6b35',
                    'padding': '1rem 1.5rem',
                    'border': 'none'
                });

                // Style the title text
                const $title = $titleBar.find('.ui-dialog-title');
                $title.css({
                    'color': '#ffffff',
                    'font-weight': '600',
                    'font-size': '1.1rem'
                });

                // Style the jQuery UI close button with × symbol
                const $closeButton = $dialog.find('.ui-dialog-titlebar-close');
                $closeButton.css({
                    'position': 'absolute',
                    'right': '0.5rem',
                    'top': '50%',
                    'transform': 'translateY(-50%)',
                    'background': 'rgba(255, 255, 255, 0.1)',
                    'border': '1px solid rgba(255, 255, 255, 0.3)',
                    'border-radius': '4px',
                    'font-size': '1.5rem',
                    'line-height': '1',
                    'color': '#ffffff',
                    'opacity': '0.9',
                    'font-weight': '300',
                    'cursor': 'pointer',
                    'padding': '0.25rem 0.5rem',
                    'margin': '0',
                    'width': '32px',
                    'height': '32px',
                    'display': 'flex',
                    'align-items': 'center',
                    'justify-content': 'center'
                }).html('&times;').hover(
                    function() {
                        $(this).css({
                            'opacity': '1',
                            'background': 'rgba(255, 255, 255, 0.2)'
                        });
                    },
                    function() {
                        $(this).css({
                            'opacity': '0.9',
                            'background': 'rgba(255, 255, 255, 0.1)'
                        });
                    }
                );

                // Remove the default icon span if it exists
                $closeButton.find('.ui-icon').remove();
            }, 100);
        });
        }); // end waitForI18n
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});