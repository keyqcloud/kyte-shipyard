let count = 1;
function customBlock(location, label) {
    return '<div class="custom-wrapper"><div class="block-wrapper data-block"><div class="block-heading d-flex justify-content-between"><div class="block-title"><i class="fas fa-box"></i> '+label+'</div><a class="delete-preprocess text-danger" href="#"><i class="fas fa-times-circle"></i></a></div></div><div class="text-center my-3"><div class="dropdown d-inline-block"><a class="btn btn-sm btn-outline-primary dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"><i class="fas fa-arrow-down"></i></a><ul class="dropdown-menu"><li><a class="dropdown-item add-item" data-hook-location="'+location+'" data-method-type="transformation" href="#">Add "Transformation"</a></li><li><a class="dropdown-item add-item" data-hook-location="'+location+'" data-method-type="crud" href="#">Add "CRUD"</a></li><li><a class="dropdown-item add-item" data-hook-location="'+location+'" data-method-type="email" href="#">Add "Send email"</a></li></ul></div></div></div>';
}

$(document).ready(function() {
    $("#flow-diagram").on('click', ".add-item", function(e) {
        e.preventDefault();
        e.stopPropagation();

        switch ($(this).data('hookLocation')) {
            case "prequery":
                $(".prequery-wrapper").append(customBlock("prequery", $(this).data('methodType').charAt(0).toUpperCase() + $(this).data('methodType').slice(1) + " " + count));
                break;

            case "postquery":
                $(".postquery-wrapper").append(customBlock("postquery", $(this).data('methodType').charAt(0).toUpperCase() + $(this).data('methodType').slice(1) + " " + count));
                break;
        
            default:
                break;
        }
        
        count++;
    });

    $("#flow-diagram").on('click', ".delete-preprocess", function(e) {
        e.preventDefault();
        e.stopPropagation();

        $(this).closest(".custom-wrapper").remove();
    });
});