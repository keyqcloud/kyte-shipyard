var editor;
let functionName = "Undefined";

let elements = [
    [
    ]
];

let colDef = [
    {'targets':0,'data':'name','label':'Name'},
];

$(document).ready(function() {
    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Code' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        k.get("Function", "id", idx, [], function(r) {
            if (r.data[0]) {
                functionName = r.data[0].name;
                $("#function-name").html(functionName);
                $("#function-type").html(r.data[0].type);
                editor = monaco.editor.create(document.getElementById('container'), {
                    value: r.data[0].code,
                    language: "php"
                });
            } else {
                $("#model-name").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });

        $("#saveCode").click(function() {
            $('#pageLoaderModal').modal('show');
            k.put('Function', 'id', idx, {'code':editor.getValue()}, null, [], function(r) {
                $('#pageLoaderModal').modal('hide');
            });
        });

        // navigation listners
        $("#Code-nav-link").click(function(e) {
            history.pushState({}, '', this.href);

            e.preventDefault();
            e.stopPropagation();
            
            $("#Code-nav-link").addClass("active");
            $("#Code").removeClass('d-none');

            $("#Controllers-nav-link").removeClass("active");
            $("#Controllers").addClass('d-none');
        });
        $("#Controllers-nav-link").click(function(e) {
            history.pushState({}, '', this.href);

            e.preventDefault();
            e.stopPropagation();
            
            $("#Controllers-nav-link").addClass("active");
            $("#Controllers").removeClass('d-none');

            $("#Code-nav-link").removeClass("active");
            $("#Code").addClass('d-none');
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});