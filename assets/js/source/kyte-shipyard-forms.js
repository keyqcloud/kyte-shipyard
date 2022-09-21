
let fldsAdmin = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name (*)',
            'required':true
        },
        {
            'field':'email',
            'type':'text',
            'label':'E-mail (*)',
            'required':true
        }
    ]
];

function createForm(form_selector, title, model, elements, hidden = null, tbl = null, btn_add_selector, modal = true) {
    var form = new KyteForm(k, $(form_selector), model, hidden, elements, title, tbl, modal, $(btn_add_selector));
    form.init();
    if (tbl) {
        tbl.bindEdit(form);
    }

    return form;
}
