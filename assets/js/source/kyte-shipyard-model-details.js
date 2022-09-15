var modelStructure = null;
var model, swift, dart, json;
// utf8
var universalBOM = "\uFEFF";

let elements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Model',
            'required':true
        },
        {
            'field':'type',
            'type':'select',
            'label':'Type',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    's': 'String',
                    't': 'Text',
                    'date': 'Date',
                    'i': 'Integer',
                }
            }
        },
        {
            'field':'required',
            'type':'select',
            'label':'Required',
            'required':true,
            'option': {
                'ajax': false,
                'data': {
                    1: 'Yes',
                    0: 'No'
                }
            }
        },
        {
            'field': 'foreignKeyModel',
            'type': 'select',
            'label': 'FK Model',
            'required': false,
            'placeholder': 'N/A',
            'option': {
                'ajax': true,
                'data_model_name': 'DataModel',
                'data_model_field': '',
                'data_model_value': '',
                'data_model_attributes': ['name'],
                'data_model_default_field': 'id',
                // 'data_model_default_value': 1,
            }
        }
    ],
    [
        {
            'field':'size',
            'type':'text',
            'label':'Size',
            'required':false,
        },
        {
            'field':'unsigned',
            'type':'select',
            'label':'Unsigned',
            'required':false,
            'option': {
                'ajax': false,
                'data': {
                    "":"n/a",
                    1: 'Yes',
                    0: 'No'
                }
            }
        },
        {
            'field':'protected',
            'type':'select',
            'label':'Protected',
            'required':false,
            'option': {
                'ajax': false,
                'data': {
                    0: 'No',
                    1: 'Yes'
                }
            }
        },
        {
            'field':'defaults',
            'type':'text',
            'label':'Default',
            'required':false
        }
    ],
    [
        {
            'field':'description',
            'type':'text',
            'label':'Description',
            'required':false
        }
    ]
];

let colDef = [
    {'targets':0,'data':'name','label':'Name'},
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

function getData(idx, model) {
    // get attributes k.get() and iterate over to create table def and elements
    k.get("ModelAttribute", "dataModel", idx, [], function(r) {
        let targets = 0;
        let modelFormDef = [];
        let modelColDef = [{'targets':targets,'data':'id','label':'#'}];
        if (r.data.length > 0) {
            modelStructure = r.data;
            r.data.forEach(col => {
                targets++;
                let dataType = "text";
                if (col.type == 't') dataType = "textarea";
                if (col.type == 'date') dataType = "date";
                modelColDef.push({'targets':targets,'data':col.name,'label':col.name});
                modelFormDef.push([{
                    'field':col.name,
                    'type':dataType,
                    'label':col.name,
                    'required':col.required == 1 ? true : false
                }]);
            })
        }
        targets++;
        modelColDef.push({'targets':targets,'data':'date_created','label':'date_created'});
        targets++;
        modelColDef.push({'targets':targets,'data':'date_modified','label':'date_modified'});

        var tblData = new KyteTable(k, $("#data-table"), {'name':model,'field':null,'value':null}, modelColDef, true, [0,"asc"], true, true);
        tblData.init();

        var modelDataForm = new KyteForm(k, $("#modalDataForm"), model, null, modelFormDef, model, tblData, true, $("#newData"));
        modelDataForm.init();
        tblData.bindEdit(modelDataForm);

        // generate swift code
        swift = generate_swift(model);
        // generate dart code
        dart = generate_dart(model);
    });
}

function generate_dart(mode) {
    let date = new Date().toLocaleDateString("en", {year:"numeric", day:"2-digit", month:"2-digit"});
    let code = "//\r\n// "+model+".swift\r\n//\r\n// Created by Kyte Shipyard on "+date+"\r\n\r\n";
    // class name
    code += "class "+model+" {\r\n";
    // kyte api level
    code += "\tint? responseCode;\r\n";
    code += "\tString? session;\r\n";
    code += "\tString? token;\r\n";
    code += "\tString? uid;\r\n";
    code += "\tString? sessionPermission;\r\n";
    code += "\tString? txTimestamp;\r\n";
    code += "\tint? draw;\r\n";
    code += "\tString? cONTENTTYPE;\r\n";
    code += "\tString? transaction;\r\n";
    code += "\tString? engineVersion;\r\n";
    code += "\tString? model;\r\n";
    code += "\tString? kytePub;\r\n";
    code += "\tString? kyteNum;\r\n";
    code += "\tString? kyteIden;\r\n";
    code += "\tString? accountId;\r\n";

    // data list
    code += "\tList<"+model+"Data>? data;\r\n\r\n";

    // initializer
    code += "\t"+model+"({\r\n";
    code += "\t\tthis.responseCode,\r\n";
    code += "\t\tthis.session,\r\n";
    code += "\t\tthis.token,\r\n";
    code += "\t\tthis.uid,\r\n";
    code += "\t\tthis.sessionPermission,\r\n";
    code += "\t\tthis.txTimestamp,\r\n";
    code += "\t\tthis.draw,\r\n";
    code += "\t\tthis.cONTENTTYPE,\r\n";
    code += "\t\tthis.transaction,\r\n";
    code += "\t\tthis.engineVersion,\r\n";
    code += "\t\tthis.model,\r\n";
    code += "\t\tthis.kytePub,\r\n";
    code += "\t\tthis.kyteNum,\r\n";
    code += "\t\tthis.kyteIden,\r\n";
    code += "\t\tthis.accountId,\r\n";
    code += "\t\tthis.data\r\n";
    code += "\t});\r\n\r\n";

    // mapping from json
    code += "\t"+model+".fromJson(Map<String, dynamic> json) {\r\n"
    code += "\t\tresponseCode = json['response_code'];\r\n";
    code += "\t\tsession = json['session'];\r\n";
    code += "\t\ttoken = json['token'];\r\n";
    code += "\t\tuid = json['uid'];\r\n";
    code += "\t\tsessionPermission = json['sessionPermission'];\r\n";
    code += "\t\ttxTimestamp = json['txTimestamp'];\r\n";
    code += "\t\tdraw = json['draw'];\r\n";
    code += "\t\tcONTENTTYPE = json['CONTENT_TYPE'];\r\n";
    code += "\t\ttransaction = json['transaction'];\r\n";
    code += "\t\tengineVersion = json['engine_version'];\r\n";
    code += "\t\tmodel = json['model'];\r\n";
    code += "\t\tkytePub = json['kyte_pub'];\r\n";
    code += "\t\tkyteNum = json['kyte_num'];\r\n";
    code += "\t\tkyteIden = json['kyte_iden'];\r\n";
    code += "\t\taccountId = json['account_id'];\r\n";
    code += "\t\tif (json['data'] != null) {\r\n";
    code += "\t\t\tdata = <"+model+"Data>[];\r\n";
    code += "\t\t\tjson['data'].forEach((v) {\r\n";
    code += "\t\t\t\tdata!.add(new "+model+"Data.fromJson(v));\r\n"
    code += "\t\t\t});\r\n";
    code += "\t\t}\r\n";
    code += "\t}\r\n\r\n";

    // mapping to json
    code += "\tMap<String, dynamic> toJson() {\r\n";
    code += "\t\tfinal Map<String, dynamic> data = new Map<String, dynamic>();\r\n";
    code += "\t\tdata['response_code'] = this.responseCode;\r\n";
    code += "\t\tdata['session'] = this.session;\r\n";
    code += "\t\tdata['token'] = this.token;\r\n";
    code += "\t\tdata['uid'] = this.uid;\r\n";
    code += "\t\tdata['sessionPermission'] = this.sessionPermission;\r\n";
    code += "\t\tdata['txTimestamp'] = this.txTimestamp;\r\n";
    code += "\t\tdata['draw'] = this.draw;\r\n";
    code += "\t\tdata['CONTENT_TYPE'] = this.cONTENTTYPE;\r\n";
    code += "\t\tdata['transaction'] = this.transaction;\r\n";
    code += "\t\tdata['engine_version'] = this.engineVersion;\r\n";
    code += "\t\tdata['model'] = this.model;\r\n";
    code += "\t\tdata['kyte_pub'] = this.kytePub;\r\n";
    code += "\t\tdata['kyte_num'] = this.kyteNum;\r\n";
    code += "\t\tdata['kyte_iden'] = this.kyteIden;\r\n";
    code += "\t\tdata['account_id'] = this.accountId;\r\n";
    code += "\t\tif (this.data != null) {\r\n";
    code += "\t\t\tdata['data'] = this.data!.map((v) => v.toJson()).toList();\r\n";
    code += "\t\t}\r\n";
    code += "\t\treturn data;\r\n";
    code += "\t}\r\n";
    // end class
    code += "}\r\n\r\n";


    // iterate through col and create defs
    let definitions = "";
    let initializers = "";
    let mappingsFromJson = "";
    let mappingsToJson = "";
    modelStructure.forEach(attr => {
        initializers += "\t\tthis."+attr.name+","
        let datatype = "String";
        if (attr.type == "i") datatype = "int";
        definitions += "\t"+datatype+"? "+attr.name+";\r\n";
        mappingsFromJson += "\t\t"+attr.name+" = json['"+attr.name+"'];\r\n";
        mappingsToJson += "\t\tdata['"+attr.name+"'] = this."+attr.name+";\r\n";
    });

    // data class
    code += "class "+model+"Data {\r\n";
    code += definitions+"\r\n";

    // initializer
    code += "\t"+model+"Data({\r\n";
    code += initializers.replace(/(^,)|(,$)/g, '').replace(/,/g, ",\r\n")+"\r\n";
    code += "\t});\r\n\r\n";

    // mapping from json
    code += "\t"+model+"Data.fromJson(Map<String, dynamic> json) {\r\n"
    code += mappingsFromJson;
    code += "\t}\r\n\r\n";

    // mapping to json
    code += "\tMap<String, dynamic> toJson() {\r\n";
    code += "\t\tfinal Map<String, dynamic> data = new Map<String, dynamic>();\r\n";
    code += mappingsToJson;
    code += "\t\treturn data;\r\n";
    code += "\t}\r\n";

    // end class
    code += "}\r\n";

    return code;
}

function generate_swift(model) {
    let date = new Date().toLocaleDateString("en", {year:"numeric", day:"2-digit", month:"2-digit"});
    // comment header and import
    let code = "//\r\n// "+model+".swift\r\n//\r\n// Created by Kyte Shipyard on "+date+"\r\n\r\nimport Foundation\r\n\r\n";
    // struct
    code += "struct "+model+"Data : Codable {\r\n";

    // iterate through column
    let enumCases = "\t\tcase";
    let structItems = "";
    modelStructure.forEach(attr => {
        enumCases += " "+attr.name+","
        let datatype = "String";
        if (attr.type == "i") datatype = "Int";
        structItems += "\tlet "+attr.name+": "+datatype+(attr.required == 0 ? "?" : "")+"\r\n";
    });
    code += structItems;

    // enum
    code += "\r\n\tenum CodingKeys: String, CodingKey {\r\n"
    code += enumCases.replace(/(^,)|(,$)/g, '') + "\r\n";
    code += "\t}\r\n";
    // end struct
    code += "}\r\n";

    return code;
}

function download_code(model, code, ext) {
    blob = new Blob([universalBOM+code], {type: "octet/stream"});
    url = window.URL.createObjectURL(blob);
    $('#pageLoaderModal').modal('hide');

    // create hidden link
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = model+'.'+ext;
    a.click();
    window.URL.revokeObjectURL(url);
}

$(document).ready(function() {
    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Attributes' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        let hidden = [
            {
                'name': 'dataModel',
                'value': idx
            }
        ];

        k.get("DataModel", "id", idx, [], function(r) {
            if (r.data[0]) {
                model = r.data[0].name;
                $("#model-name").html(model);
                getData(idx, model);
            } else {
                $("#model-name").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });

        var tblAttributes = new KyteTable(k, $("#attribute-table"), {'name':'ModelAttribute','field':'dataModel','value':idx}, colDef, true, [0,"asc"], true, true);
        tblAttributes.init();
        var modalForm = new KyteForm(k, $("#modalForm"), 'ModelAttribute', hidden, elements, 'Model Attribute', tblAttributes, true, $("#newAttribute"));
        modalForm.init();
        tblAttributes.bindEdit(modalForm);

        $("#downloadSwift").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            download_code(model, swift, 'swift');
        });
        $("#downloadDart").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            download_code(model, dart, 'dart');
        });
        $("#downloadJSON").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            download_code(model, json, 'json');
        });

        // navigation listners
        $("#Attributes-nav-link").click(function() {
            $("#Attributes-nav-link").addClass("active");
            $("#Attributes").removeClass('d-none');

            $("#Data-nav-link").removeClass("active");
            $("#Data").addClass('d-none');

            $("#Controllers-nav-link").removeClass("active");
            $("#Controllers").addClass('d-none');
            
            $("#Export-nav-link").removeClass("active");
            $("#Export").addClass('d-none');
        });
        $("#Data-nav-link").click(function() {
            $("#Data-nav-link").addClass("active");
            $("#Data").removeClass('d-none');

            $("#Attributes-nav-link").removeClass("active");
            $("#Attributes").addClass('d-none');

            $("#Controllers-nav-link").removeClass("active");
            $("#Controllers").addClass('d-none');
            
            $("#Export-nav-link").removeClass("active");
            $("#Export").addClass('d-none');
        });
        $("#Controllers-nav-link").click(function() {
            $("#Controllers-nav-link").addClass("active");
            $("#Controllers").removeClass('d-none');

            $("#Data-nav-link").removeClass("active");
            $("#Data").addClass('d-none');

            $("#Attributes-nav-link").removeClass("active");
            $("#Attributes").addClass('d-none');
            
            $("#Export-nav-link").removeClass("active");
            $("#Export").addClass('d-none');
        });
        $("#Export-nav-link").click(function() {
            $("#Export-nav-link").addClass("active");
            $("#Export").removeClass('d-none');

            $("#Data-nav-link").removeClass("active");
            $("#Data").addClass('d-none');

            $("#Controllers-nav-link").removeClass("active");
            $("#Controllers").addClass('d-none');
            
            $("#Attributes-nav-link").removeClass("active");
            $("#Attributes").addClass('d-none');
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});