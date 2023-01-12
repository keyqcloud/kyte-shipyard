let colDefModels = [
    {'targets':0,'data':'name','label':'User Model'},
];

let colDefSites = [
    {'targets':0,'data':'name','label':'Site Name'},
    {'targets':1,'data':'cfDomain','label':'CF Domain'},
    {'targets':2,'data':'region','label':'region'},
    {'targets':3,'data':'description','label':'Description'},
];

let colDefPage = [
    {'targets':0,'data':'title','label':'Page Title'},
    {'targets':1,'data':'state','label':'Status', render: function(data, type, row, meta) { if (data == 0) { return 'Not Published'; } else if (data == 1) { return 'Published'; } else { return 'Published (Stale)'; }}}
];


let colDefAttributes = [
    {'targets':0,'data':'name','label':'Name', render: function(data, type, row, meta) {
        if (row.foreignKeyModel) {
            return data + " ( "+row.foreignKeyModel.name+" => id )";
        }
        return data;
    } },
    {'targets':1,'data':'type','label':'Type', render: function(data, type, row, meta) {
        if (data == "i") return "Int("+row.size+")";
        if (data == "s") return "Varchar("+row.size+")";
        if (data == "t") return "Text";
        if (data == "date") return "Date";
        
        return data;
    } },
    {'targets':2,'data':'required','label':'Null', render: function(data, type, row, meta) { return data == 1 ? 'NO':'YES'; }},
    {'targets':3,'data':'protected','label':'Private', render: function(data, type, row, meta) { return data == 1 ? 'YES':'NO'; }},
    {'targets':4,'data':'unsigned','label':'Unsigned', render: function(data, type, row, meta) { return data == 1 ? 'YES':'NO'; }},
    {'targets':5,'data':'defaults','label':'Default'},
    {'targets':6,'data':'description','label':'Description'},
];

let colDefControllers = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'dataModel.name','label':'Model', render: function(data, type, row, meta) { return data ? data:'Virtual'; }},
    {'targets':2,'data':'description','label':'Description'},
];

let colDefFunctions = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'type','label':'Type'},
    {'targets':2,'data':'description','label':'Description'},
];

let colDefAssignedFunctions = [
    {'targets':0,'data':'function.name','label':'Function', render: function(data, type, row, meta) { return data ? data:'Unknown'; }},
    {'targets':1,'data':'type','label':'Type'},
    {'targets':2,'data':'function.description','label':'Description', render: function(data, type, row, meta) { return data ? data:''; }},
];

let colDefUsers = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'email','label':'E-mail'},
    {'targets':2,'data':'role.name','label':'Role'},
];

let colDefAPI = [
    {'targets':0,'data':'identifier','label':'Identifier'},
    {'targets':1,'data':'public_key','label':'Public Key'},
    {'targets':2,'data':'secret_key','label':'Secret Key'},
];

function createTable(selector, model, colDef, field = null, value = null, has_edit = false, has_delete = false, detail_page = null, detail_idx = null, dismiss_loading = false) {
    var tbl = new KyteTable(k, $(selector), {'name':model,'field':field,'value':value}, colDef, true, [0,"asc"], has_edit, has_delete, detail_idx, detail_page);
    if (dismiss_loading) {
        tbl.initComplete = function() {
            $('#pageLoaderModal').modal('hide');
        }
    }
    tbl.init();

    return tbl;
}
