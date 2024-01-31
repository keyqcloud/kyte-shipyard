import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';
var htmlEditor;
var cssEditor;
var libraries;
var iframe;

var isDirty = false;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    editor.editor.setTheme(colorMode);
});

// key bindings for saving
document.addEventListener("keydown", function(event) {
    // Check if the Ctrl key (Windows) or the Command key (Mac) is pressed
    var isCtrlPressed = event.ctrlKey || event.metaKey;
  
    // Check if the S key is pressed
    var isSPressed = event.key === "s";
  
    // Check if both the Ctrl key and the S key are pressed
    if (isCtrlPressed && isSPressed) {
      event.preventDefault(); // Prevent the default browser save action
  
      // Call your function here
      $("#saveCode").click();
    }
});

function initializeIFrame() {
    var codeContainer = document.getElementById("preview");
    // Create an iframe element
    iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    // Append the iframe to the code container
    codeContainer.innerHTML = "";
    codeContainer.appendChild(iframe);
}

function renderHtmlCode() {
    // Get the HTML code from the editor
    var htmlCode = htmlEditor.getValue();

    // Replace placeholders with values from the inputs
    const inputs = document.querySelectorAll('#placeholderWrapper input');
    inputs.forEach(input => {
        const placeholder = `{{${input.name}}}`;
        const value = input.value;
        // Replace all occurrences of this placeholder in the HTML code
        htmlCode = htmlCode.split(placeholder).join(value);
    });

    // Continue constructing the full HTML code
    var css = cssEditor.getValue();
    var code = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no"><title>Kyte Shipyard - Page Preview</title>`;
    code += `<style>${css}</style>`;
    code += `</head><body>`;
    code += htmlCode; // Use the updated HTML code with placeholders replaced
    code += `</body></html>`;

    var blob = new Blob([code], {type: "text/html; charset=utf-8"});
    iframe.src = URL.createObjectURL(blob);
}


function populatePropertiesPanel(htmlCode) {
    const placeholderWrapper = document.getElementById('placeholderWrapper');

    const regex = /{{\s*(\w+)\s*}}/g; 
    let match;
    let placeholders = new Set(); 

    // Collect all placeholders in the HTML code
    while ((match = regex.exec(htmlCode)) !== null) {
        placeholders.add(match[1]);
    }

    // Create a set of existing input names for comparison
    const existingInputs = new Set();
    document.querySelectorAll('#placeholderWrapper input').forEach(input => {
        existingInputs.add(input.name);
    });

    // Add new inputs for new placeholders
    placeholders.forEach(placeholder => {
        if (!existingInputs.has(placeholder)) {
            // Create label
            const label = document.createElement('label');
            label.textContent = placeholder;
            label.htmlFor = `input-${placeholder}`;
            label.style.display = 'block';

            // Create input
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `input-${placeholder}`;
            input.name = placeholder;

            input.addEventListener('input', function() {
                renderHtmlCode();
            });

            // Append label and input to the wrapper
            placeholderWrapper.appendChild(label);
            placeholderWrapper.appendChild(input);
        }
    });

    // Remove inputs for placeholders that no longer exist
    existingInputs.forEach(inputName => {
        if (!placeholders.has(inputName)) {
            const inputToRemove = document.getElementById(`input-${inputName}`);
            const labelToRemove = inputToRemove.previousElementSibling;
            placeholderWrapper.removeChild(inputToRemove);
            placeholderWrapper.removeChild(labelToRemove);
        }
    });
}

document.addEventListener('KyteInitialized', function(e) {
    let k = e.detail.k;
    
    $('#pageLoaderModal').modal('show');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        k.get("KyteWebComponent", "id", idx, [], function(r) {
            if (r.data[0]) {
                $("#component-name").html(r.data[0].name);
                $("#component-identifier").html(r.data[0].identifier);

                htmlEditor = monaco.editor.create(document.getElementById("htmlEditor"), {
                    value: r.data[0].html,
                    theme: colorMode,
                    language: "html",
                    automaticLayout: true,
                    wordWrap: true,
                    // wordWrapColumn: 40,
                    // Set this to false to not auto word wrap minified files
                    wordWrapMinified: true,
                    // try "same", "indent" or "none"
                    wrappingIndent: 'indent'
                });

                cssEditor = monaco.editor.create(document.getElementById("cssEditor"), {
                    value: r.data[0].stylesheet,
                    theme: colorMode,
                    language: "css",
                    automaticLayout: true,
                    wordWrap: true,
                    // wordWrapColumn: 40,
                    // Set this to false to not auto word wrap minified files
                    wordWrapMinified: true,
                    // try "same", "indent" or "none"
                    wrappingIndent: 'indent'
                });

                htmlEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                    populatePropertiesPanel(htmlEditor.getValue());
                    renderHtmlCode();
                });
                cssEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                    populatePropertiesPanel(htmlEditor.getValue());
                    renderHtmlCode();
                });

                initializeIFrame();
                populatePropertiesPanel(htmlEditor.getValue());
                renderHtmlCode();

                let obj = {'model': 'KyteWebComponent', 'idx':r.data[0].application.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToController").attr('href', '/app/components.html?request='+encoded);

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    k.put('KyteWebComponent', 'id', idx, {'html':htmlEditor.getValue(),'stylesheet':cssEditor.getValue()}, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                        isDirty = false;
                    }, function(err) {
                        alert(err);
                        console.error(err)
                        $('#pageLoaderModal').modal('hide');
                    });
                });
            } else {
                $("#function-name").html("Undefined");
                $("#function-type").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});

window.onbeforeunload = function() {
    if (isDirty) {
        return "You have unsaved changes. Are you sure you want to leave?";
    }
};