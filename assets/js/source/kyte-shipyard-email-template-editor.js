import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/+esm';

let subnavEmail = [
    {
        faicon:'fas fa-code',
        label:'HTML',
        selector:'#HTML'
    },
    {
        faicon:'fas fa-eye',
        label:'Preview',
        selector:'#Preview'
    },
    {
        faicon:'fas fa-wrench',
        label:'Settings',
        selector:'#Settings'
    },
];

var htmlEditor;
var emailTemplate;
var iframe;

var isDirty = false;

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    htmlEditor.editor.setTheme(colorMode);
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
    var codeContainer = document.getElementById("previewEmailTemplate");
    // Create an iframe element
    iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    // Append the iframe to the code container
    codeContainer.innerHTML = "";
    codeContainer.appendChild(iframe);
}

function renderHtmlCode() {    
    // Get the HTML code from the textarea
    var code = htmlEditor.getValue()
    
    var blob = new Blob([code], {type: "text/html; charset=utf-8"});
    iframe.src = URL.createObjectURL(blob);
}

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let sidenav = new KyteSidenav("#sidenav", subnavEmail, "#HTML");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#HTML' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');

    $("#Preview-nav-link").click(function() {
        renderHtmlCode();
    });
    
    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        idx = idx.idx;

        _ks.get("EmailTemplate", "id", idx, [], function(r) {
            if (r.data[0]) {
                emailTemplate = r.data[0];

                $("#setting-email-title").val(emailTemplate.title);
                $("#setting-email-identifier").val(emailTemplate.identifier);
                $("#setting-email-description").val(emailTemplate.description);

                htmlEditor = monaco.editor.create(document.getElementById("htmlEditor"), {
                    value: emailTemplate.html,
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

                htmlEditor.onDidChangeModelContent(function(e) {
                    isDirty = true;
                });
                
                // hide after editor generation
                if (hash != '#HTML') {
                    $("#HTML").addClass('d-none');
                }

                let obj = {'model': 'Application', 'idx':emailTemplate.application.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/emails.html?request='+encoded);

                $("#email-title").html(emailTemplate.title);
                $("#email-identifier").html(emailTemplate.identifier);

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    let payload = {
                        'html': htmlEditor.getValue(),
                        'title':$("#setting-email-title").val(),
                        'description':$("#setting-email-description").val(),
                    };
                    _ks.put('EmailTemplate', 'id', idx, payload, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                        isDirty = false;
                    }, function(err) {
                        alert(err);
                        console.error(err)
                        $('#pageLoaderModal').modal('hide');
                    });
                });

            } else {
                alert("ERROR");
            }
            initializeIFrame();
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