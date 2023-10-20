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

var colorMode = 'vs';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    colorMode = 'vs-dark';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    colorMode = event.matches ? "vs-dark" : "vs";
    htmlEditor.editor.setTheme(colorMode);
    jsEditor.editor.setTheme(colorMode);
    cssEditor.editor.setTheme(colorMode);
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

function renderHtmlCode() {
    var codeContainer = document.getElementById("previewEmailTemplate");
    
    // Get the HTML code from the textarea
    var code = htmlEditor.getValue()
    
    // Create an iframe element
    var iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    
    var blob = new Blob([code], {type: "text/html; charset=utf-8"});
    iframe.src = URL.createObjectURL(blob);
    
    // Append the iframe to the code container
    codeContainer.innerHTML = "";
    codeContainer.appendChild(iframe);
}

$(document).ready(function() {
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
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        k.get("EmailTemplate", "id", idx, [], function(r) {
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

                // render preview on load
                renderHtmlCode();
                
                // hide after editor generation
                if (hash != '#HTML') {
                    $("#HTML").addClass('d-none');
                }

                let obj = {'model': 'Application', 'idx':emailTemplate.application.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/emails.html?request='+encoded);

                $("#email-title").html(emailTemplate.title);

                let appnav = generateAppNav(emailTemplate.application.name, encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup><img src="/assets/images/kyte_shipyard_light.png">', 'Email');
                navbar.create();

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    renderHtmlCode();
                    let payload = {
                        'html': htmlEditor.getValue(),
                        'title':$("#setting-email-title").val(),
                        'description':$("#setting-email-description").val(),
                    };
                    k.put('EmailTemplate', 'id', idx, payload, null, [], function(r) {
                        $('#pageLoaderModal').modal('hide');
                    });
                });

            } else {
                alert("ERROR");
            }
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});