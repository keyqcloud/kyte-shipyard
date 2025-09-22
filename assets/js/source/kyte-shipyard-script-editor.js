import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

var _ks; // Kyte SDK instance
var scriptEditor;
var script;
var isDirty = false;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    if (scriptEditor) {
        scriptEditor.setTheme(colorMode);
    }
});

// Check if there are actual changes
function hasActualChanges() {
    if (!script || !scriptEditor) return false;
    
    const currentContent = scriptEditor.getValue();
    const currentName = $("#setting-script-name").val();
    const currentIncludeAll = $("#setting-include-all").val();
    const currentDescription = $("#setting-script-description").val();
    const currentObfuscate = parseInt($("#setting-obfuscatejs").val()) || 0;
    const currentModule = parseInt($("#setting-jsmodule").val()) || 0;
    
    return (
        currentContent !== script.content ||
        currentName !== script.name ||
        currentIncludeAll !== script.include_all ||
        currentDescription !== script.description ||
        currentObfuscate !== (script.obfuscate_js || 0) ||
        currentModule !== (script.is_js_module || 0)
    );
}

// Key bindings for saving
document.addEventListener("keydown", function(event) {
    var isCtrlPressed = event.ctrlKey || event.metaKey;
    var isSPressed = event.key === "s";
    var isPPressed = event.key === "p";
    var isShiftOrAltPressed = event.altKey || event.shiftKey;

    // Ctrl+S or Cmd+S to save
    if (isCtrlPressed && isSPressed) {
        event.preventDefault();
        if (hasActualChanges()) {
            $("#saveCode").click();
        } else {
            showNotification('info', 'No changes to save', 'Script is already up to date');
        }
    }

    // Ctrl+P or Cmd+P to publish
    if (isCtrlPressed && isPPressed) {
        event.preventDefault();
        $("#publishPage").click();
    }

    // Ctrl+1, Ctrl+2, Ctrl+3 for tab switching
    if (event.ctrlKey || event.metaKey) {
        const tabMap = {
            '1': 'Content',
            '2': 'Pages', 
            '3': 'Settings'
        };
        
        if (tabMap[event.key]) {
            event.preventDefault();
            const targetTab = document.querySelector(`[data-target="${tabMap[event.key]}"]`);
            if (targetTab) {
                targetTab.click();
            }
        }
    }
});

// Navigation functionality
document.querySelectorAll('[data-target]').forEach(button => {
    button.addEventListener('click', function() {
        const target = this.dataset.target;
        
        // Update active nav item
        document.querySelectorAll('[data-target]').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding content
        document.querySelectorAll('.editor-container, .secondary-content').forEach(container => {
            container.classList.remove('active');
        });
        document.getElementById(target).classList.add('active');
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidenav').classList.remove('show');
        }
    });
});

// Mobile sidebar toggle
document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidenav').classList.add('show');
});

document.getElementById('closeSidebar')?.addEventListener('click', function() {
    document.getElementById('sidenav').classList.remove('show');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidenav');
    const toggle = document.getElementById('sidebarToggle');
    
    if (window.innerWidth <= 768 && 
        !sidebar.contains(e.target) && 
        !toggle.contains(e.target) && 
        sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
    }
});

// Show notification function
function showNotification(type, message, summary) {
    const toastHtml = `
        <div class="toast align-items-center border-0 show" style="background: ${type === 'success' ? '#238636' : type === 'info' ? '#0969da' : '#f85149'}; color: white; position: fixed; top: 2rem; right: 2rem; z-index: 9999;">
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${message}</strong>
                    ${summary ? `<br><small>${summary}</small>` : ''}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        const toasts = document.querySelectorAll('.toast');
        if (toasts.length > 0) {
            toasts[toasts.length - 1].remove();
        }
    }, 4000);
}

// Save function
function saveScript() {
    if (!hasActualChanges()) {
        showNotification('info', 'No changes to save', 'Script is already up to date');
        return;
    }

    $('#pageLoaderModal').modal('show');
    
    try {
        let obfuscatedJS = script.script_type == 'js' ? JavaScriptObfuscator.obfuscate(scriptEditor.getValue(), {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayEncoding: ['base64'],
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayWrappersType: 'variable',
            stringArrayThreshold: 1
        }).getObfuscatedCode() : '';

        let payload = {
            'content': scriptEditor.getValue(),
            'content_js_obfuscated': obfuscatedJS,
            'name': $("#setting-script-name").val(),
            'include_all': $("#setting-include-all").val(),
            'description': $("#setting-script-description").val(),
            'obfuscate_js': $("#setting-obfuscatejs").val(),
            'is_js_module': $("#setting-jsmodule").val(),
        };

        _ks.put('KyteScript', 'id', script.id, payload, null, [], function(r) {
            $('#pageLoaderModal').modal('hide');
            isDirty = false;
            
            // Update the script object with current values
            script.content = scriptEditor.getValue();
            script.name = $("#setting-script-name").val();
            script.include_all = $("#setting-include-all").val();
            script.description = $("#setting-script-description").val();
            script.obfuscate_js = parseInt($("#setting-obfuscatejs").val());
            script.is_js_module = parseInt($("#setting-jsmodule").val());
            
            showNotification('success', 'Script saved successfully!', 'Changes have been saved as draft');
        }, function(err) {
            alert(err);
            console.error(err);
            $('#pageLoaderModal').modal('hide');
        });
    } catch (error) {
        alert("An error occurred: " + error.message);
        console.error(error.message);
        $('#pageLoaderModal').modal('hide');
    }
}

// Publish function
function publishScript() {
    $('#pageLoaderModal').modal('show');

    try {
        let obfuscatedJS = script.script_type == 'js' ? JavaScriptObfuscator.obfuscate(scriptEditor.getValue(), {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayEncoding: ['base64'],
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayWrappersType: 'variable',
            stringArrayThreshold: 1
        }).getObfuscatedCode() : '';

        let payload = {
            'content': scriptEditor.getValue(),
            'content_js_obfuscated': obfuscatedJS,
            'name': $("#setting-script-name").val(),
            'include_all': $("#setting-include-all").val(),
            'description': $("#setting-script-description").val(),
            'obfuscate_js': $("#setting-obfuscatejs").val(),
            'is_js_module': $("#setting-jsmodule").val(),
            'state': 1,
        };

        _ks.put('KyteScript', 'id', script.id, payload, null, [], function(r) {
            $('#pageLoaderModal').modal('hide');
            isDirty = false;
            
            // Update the script object with current values
            script.content = scriptEditor.getValue();
            script.name = $("#setting-script-name").val();
            script.include_all = $("#setting-include-all").val();
            script.description = $("#setting-script-description").val();
            script.obfuscate_js = parseInt($("#setting-obfuscatejs").val());
            script.is_js_module = parseInt($("#setting-jsmodule").val());
            
            showNotification('success', 'Script published successfully!', 'Changes are now live');
        }, function(err) {
            alert(err);
            console.error(err);
            $('#pageLoaderModal').modal('hide');
        });
    } catch (error) {
        alert("An error occurred: " + error.message);
        console.error(error.message);
        $('#pageLoaderModal').modal('hide');
    }
}

document.addEventListener('KyteInitialized', function(e) {
    _ks = e.detail._ks;

    $('#pageLoaderModal').modal('show');

    if (_ks.isSession()) {
        // Get URL param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        _ks.get("KyteScript", "id", idx, [], function(r) {
            if (r.data[0]) {
                script = r.data[0];

                // Display script title in window
                document.title = document.title + " - " + script.name;
                
                // Set script info in header
                $("#script-name").html(script.name);
                $("#script-type").html(script.script_type === 'js' ? 'JavaScript' : 'CSS');
                
                // Set form values
                $("#setting-script-name").val(script.name);
                $("#setting-include-all").val(script.include_all);
                $("#setting-script-description").val(script.description);
                
                if (script.script_type == 'js') {
                    $("#setting-obfuscatejs").val(script.obfuscate_js || 0);
                    $('#obfuscatejs-option-wrapper').removeClass('d-none');
                    
                    $("#setting-jsmodule").val(script.is_js_module || 0);
                    $("#jsmodule-option-wrapper").removeClass('d-none');
                }

                // Create Monaco editor
                scriptEditor = monaco.editor.create(document.getElementById("scriptEditor"), {
                    value: script.content,
                    theme: colorMode,
                    language: script.script_type == 'js' ? 'javascript' : 'css',
                    automaticLayout: true,
                    wordWrap: true,
                    wordWrapMinified: true,
                    wrappingIndent: 'indent'
                });

                scriptEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });

                // Set up back to site link
                let obj = {'model': 'KyteSite', 'idx': script.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request=' + encoded + '#Scripts');

                // Page assignment table and form
                let hiddenScriptAssignment = [
                    {
                        'name': 'site',
                        'value': script.site.id
                    },
                    {
                        'name': 'script',
                        'value': idx
                    }
                ];
                
                let fldsPages = [
                    [
                        {
                            'field': 'page',
                            'type': 'select',
                            'label': 'Page',
                            'required': false,
                            'option': {
                                'ajax': true,
                                'data_model_name': 'KytePage',
                                'data_model_field': 'site',
                                'data_model_value': script.site.id,
                                'data_model_attributes': ['title', 's3key'],
                                'data_model_default_field': 'id',
                            }
                        },
                    ],
                ];
                
                let colDefPages = [
                    {'targets': 0, 'data': 'page.title', 'label': 'Page'},
                    {'targets': 1, 'data': 'page.s3key', 'label': 'Path'},
                ];
                
                var tblPages = new KyteTable(_ks, $("#pages-table"), 
                    {'name': "KyteScriptAssignment", 'field': "script", 'value': idx}, 
                    colDefPages, true, [0, "asc"], false, true);
                tblPages.init();
                
                var frmPages = new KyteForm(_ks, $("#modalFormPages"), 'KyteScriptAssignment', 
                    hiddenScriptAssignment, fldsPages, 'Script Assignment', tblPages, true, $("#addPage"));
                frmPages.init();
                tblPages.bindEdit(frmPages);

                // Bind save and publish handlers
                $("#saveCode").off('click').on('click', saveScript);
                $("#publishPage").off('click').on('click', publishScript);

                // Bind download handler
                $("#downloadPage").off('click').on('click', function(e) {
                    e.preventDefault();
                    
                    if (script.download_link) {
                        fetch(script.download_link).then(res => res.blob()).then(file => {
                            const filename = script.name + (script.script_type === 'js' ? '.js' : '.css');
                            
                            let tempUrl = URL.createObjectURL(file);
                            const aTag = document.createElement("a");
                            aTag.href = tempUrl;
                            aTag.download = filename;
                            document.body.appendChild(aTag);
                            aTag.click();
                            URL.revokeObjectURL(tempUrl);
                            aTag.remove();
                        }).catch((e) => {
                            alert("Failed to download file! " + e);
                        });
                    } else {
                        // Fallback: create file from current content
                        const content = scriptEditor.getValue();
                        const filename = script.name + (script.script_type === 'js' ? '.js' : '.css');
                        const blob = new Blob([content], { type: 'text/plain' });
                        
                        const tempUrl = URL.createObjectURL(blob);
                        const aTag = document.createElement("a");
                        aTag.href = tempUrl;
                        aTag.download = filename;
                        document.body.appendChild(aTag);
                        aTag.click();
                        URL.revokeObjectURL(tempUrl);
                        aTag.remove();
                    }
                });

                // Form change handlers to mark as dirty
                $("#setting-script-name, #setting-script-description, #setting-include-all, #setting-obfuscatejs, #setting-jsmodule").on('change input', function() {
                    isDirty = true;
                });

            } else {
                alert("ERROR: Script not found");
            }
            $('#pageLoaderModal').modal('hide');
        }, function(err) {
            alert("ERROR: " + err);
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href = "/?redir=" + encodeURIComponent(window.location);
    }
});

// Warn user about unsaved changes
window.onbeforeunload = function() {
    if (isDirty) {
        return "You have unsaved changes. Are you sure you want to leave?";
    }
};