// menu array
let subnavModel = [
    {
        faicon:'fas fa-file-import',
        label:'Attributes',
        selector:'#Attributes'
    },
    {
        faicon:'fas fa-database',
        label:'Data',
        selector:'#Data'
    },
    {
        faicon:'fas fa-layer-group',
        label:'Controllers',
        selector:'#Controllers'
    },
    {
        faicon:'fas fa-file-export',
        label:'Export',
        selector:'#Export'
    },
    {
        faicon:'fas fa-file-import',
        label:'Import',
        selector:'#Import'
    },
];

var modelStructure = null;
var model, modelIdx, appId, swift, dart, json;
// utf8
var universalBOM = "\uFEFF";
let elements = []; //initialize for later
let controllerElements = [
    [
        {
            'field':'name',
            'type':'text',
            'label':'Name',
            'required':true
        }
    ],
    [
        {
            'field':'description',
            'type':'textarea',
            'label':'Description',
            'required':false
        }
    ]
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
        if (data == "bi") return "BigInt("+row.size+")";
        if (data == "s") return "Varchar("+row.size+")";
        if (data == "t") return "Text";
        if (data == "tt") return "TinyText";
        if (data == "mt") return "MediumText";
        if (data == "lt") return "LongText";
        if (data == "b") return "Blob";
        if (data == "tb") return "TinyBlob";
        if (data == "mb") return "MediumBlob";
        if (data == "lb") return "LongBlob";
        if (data == "date") return "Date";
        
        return data;
    } },
    {'targets':2,'data':'required','label':'Null', render: function(data, type, row, meta) { return data == 1 ? 'NO':'YES'; }},
    {'targets':3,'data':'protected','label':'Private', render: function(data, type, row, meta) { return data == 1 ? 'YES':'NO'; }},
    {'targets':4,'data':'unsigned','label':'Unsigned', render: function(data, type, row, meta) { return data == 1 ? 'YES':'NO'; }},
    {'targets':5,'data':'defaults','label':'Default'},
    {'targets':6,'data':'description','label':'Description'},
];

function getData(_ks, idx, model, appId) {
    // get attributes _ks.get() and iterate over to create table def and elements
    _ks.get("ModelAttribute", "dataModel", idx, [], function(r) {
        let targets = 0;
        let modelJsonDef = [];
        let modelFormDef = [];
        let modelColDef = [{'targets':targets,'data':'id','label':'#'}];
        if (r.data.length > 0) {
            modelStructure = r.data;
            r.data.forEach(col => {
                targets++;
                modelColDef.push({'targets':targets,'data':col.name,'label':col.name, render: function(data, type, row, meta) { return (typeof data === 'object' ? JSON.stringify(data, undefined, 4) : data); }});
                if (col.foreignKeyModel !== null && col.foreignKeyModel.id > 0 && col.foreignKeyAttribute.length > 0) {
                    modelFormDef.push([{
                        'field':col.name,
                        'type':'select',
                        'label':col.name,
                        'required':col.required == 1 ? true : false,
                        'option': {
                            'ajax': true,
                            'data_model_name': col.foreignKeyModel.name,
                            'data_model_field': null,
                            'data_model_value': null,
                            'data_model_attributes': ['name'],
                            'data_model_default_field': col.foreignKeyAttribute,
                        }
                    }]);
                } else {
                    let dataType = "text";
                    if (col.type == 't') dataType = "textarea";
                    if (col.type == 'date') dataType = "date";
                    modelFormDef.push([{
                        'field':col.name,
                        'type':dataType,
                        'label':col.name,
                        'required':col.required == 1 ? true : false
                    }]);
                }
                
                modelJsonDef.push({
                    'name':col.name,
                    'type':col.type,
                    'size':col.size,
                    'unsigned':col.unsigned,
                    'protected':col.protected,
                    'password':col.password,
                    'description':col.description,
                    'defaults':col.defaults,
                    'required':col.required,
                    'foreignKeyModel': (col.foreignKeyModel !== null && col.foreignKeyModel.id > 0 && col.foreignKeyAttribute.length > 0 ? col.foreignKeyModel.name : null),
                    'foreignKeyAttribute': (col.foreignKeyModel !== null && col.foreignKeyModel.id > 0 && col.foreignKeyAttribute.length > 0 ? col.foreignKeyAttribute : null),
                });
            });
            json = {
                'name':model,
                'struct':modelJsonDef,
            };
            // generate swift code
            swift = generate_swift(model);
            // generate dart code
            dart = generate_dart(model);
        }
        targets++;
        modelColDef.push({'targets':targets,'data':'date_created','label':'date_created'});
        targets++;
        modelColDef.push({'targets':targets,'data':'date_modified','label':'date_modified'});

        var tblData = new KyteTable(_ks, $("#data-table"), {'name':"AppModelWrapper",'field':appId,'value':model}, modelColDef, true, [0,"asc"], false, false);
        tblData.init();
        // var modelDataForm = new KyteForm(_ks, $("#modalDataForm"), model, null, modelFormDef, model, tblData, true, $("#newData"));
        // modelDataForm.init();
        // tblData.bindEdit(modelDataForm);
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
    code += definitions;
    // kyte model and audit attributes
    code += "\tString? id;\r\n";
    code += "\tString? kyte_account;\r\n";
    code += "\tString? created_by;\r\n";
    code += "\tString? date_created;\r\n";
    code += "\tString? modified_by;\r\n";
    code += "\tString? date_modified;\r\n";
    code += "\tString? deleted_by;\r\n";
    code += "\tString? date_deleted;\r\n";
    code += "\tString? deleted;\r\n\r\n";

    // initializer
    code += "\t"+model+"Data({\r\n";
    code += initializers.replace(/(^,)|(,$)/g, '').replace(/,/g, ",\r\n")+",\r\n";
    // kyte model and audit attributes
    code += "\t\tthis.id,\r\n";
    code += "\t\tthis.kyte_account,\r\n";
    code += "\t\tthis.created_by,\r\n";
    code += "\t\tthis.date_created,\r\n";
    code += "\t\tthis.modified_by,\r\n";
    code += "\t\tthis.date_modified,\r\n";
    code += "\t\tthis.deleted_by,\r\n";
    code += "\t\tthis.date_deleted,\r\n";
    code += "\t\tthis.deleted,\r\n";
    code += "\t});\r\n\r\n";

    // mapping from json
    code += "\t"+model+"Data.fromJson(Map<String, dynamic> json) {\r\n"
    code += mappingsFromJson;
    // kyte model and audti attributes
    code += "\t\tid = json['id'];\r\n";
    code += "\t\tkyte_account = json['kyte_account'];\r\n";
    code += "\t\tcreated_by = json['created_by'];\r\n";
    code += "\t\tdate_created = json['date_created'];\r\n";
    code += "\t\tmodified_by = json['modified_by'];\r\n";
    code += "\t\tdate_modified = json['date_modified'];\r\n";
    code += "\t\tdeleted_by = json['deleted_by'];\r\n";
    code += "\t\tdate_deleted = json['date_deleted'];\r\n";
    code += "\t\tdeleted = json['deleted'];\r\n";
    code += "\t}\r\n\r\n";

    // mapping to json
    code += "\tMap<String, dynamic> toJson() {\r\n";
    code += "\t\tfinal Map<String, dynamic> data = new Map<String, dynamic>();\r\n";
    code += mappingsToJson;
    // kyte model and audti attributes
    code += "\t\tdata['id'] = this.id;\r\n";
    code += "\t\tdata['kyte_account'] = this.kyte_account;\r\n";
    code += "\t\tdata['created_by'] = this.created_by;\r\n";
    code += "\t\tdata['date_created'] = this.date_created;\r\n";
    code += "\t\tdata['modified_by'] = this.modified_by;\r\n";
    code += "\t\tdata['date_modified'] = this.date_modified;\r\n";
    code += "\t\tdata['deleted_by'] = this.deleted_by;\r\n";
    code += "\t\tdata['date_deleted'] = this.date_deleted;\r\n";
    code += "\t\tdata['deleted'] = this.deleted;\r\n";
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
    // kyte model and audit attributes
    code += "\t// kyte model and audit attributes\r\n";
    code += "\tlet id: String\r\n";
    code += "\tlet kyte_account: String\r\n";
    code += "\tlet created_by: String?\r\n";
    code += "\tlet date_created: String?\r\n";
    code += "\tlet modified_by: String?\r\n";
    code += "\tlet date_modified: String?\r\n";
    code += "\tlet deleted_by: String?\r\n";
    code += "\tlet date_deleted: String?\r\n";
    code += "\tlet deleted: String?\r\n";

    // enum
    code += "\r\n\tenum CodingKeys: String, CodingKey {\r\n"
    code += enumCases.replace(/(^,)|(,$)/g, '') + "\r\n";
    // kyte model and audit attributes
    code += "\t\tcase id, kyte_account, created_by, date_created, modified_by, date_modified, deleted_by, date_deleted, deleted\r\n";
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

function download_data(_ks, format) {
    $('#pageLoaderModal').modal('show');
    _ks.get('AppModelWrapper', appId, model, [], function(r) {
        if(r.data.length > 0) {

            if (format == 'json') {
                blob = new Blob([universalBOM+JSON.stringify(r.data)], {type: "octet/stream"});
                url = window.URL.createObjectURL(blob);
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = model+'.json';
                a.click();
                window.URL.revokeObjectURL(url);
            } else if (format == 'csv') {
                const header = Object.keys(r.data[0]).join(',');
                const csv = r.data.map(obj => {
                    if (typeof obj === 'object' && obj !== null && obj.hasOwnProperty('id')) {
                        return Object.values(obj).map(value => {
                            return typeof value === 'object' ? value.id : value;
                        }).join(',');
                    } else {
                      return Object.values(obj).join(',');
                    }
                }).join('\n');
                const csvContent = `${header}\n${csv}`;
                blob = new Blob([universalBOM+csvContent], {type: "octet/stream"});
                url = window.URL.createObjectURL(blob);
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = model+'.csv';
                a.click();
                window.URL.revokeObjectURL(url);
            } else if (format == 'txt') {
                const header = Object.keys(r.data[0]).join('\t');
                const txt = r.data.map(obj => {
                    if (typeof obj === 'object' && obj !== null && obj.hasOwnProperty('id')) {
                        return Object.values(obj).map(value => {
                            return typeof value === 'object' ? value.id : value;
                        }).join('\t');
                    } else {
                      return Object.values(obj).join('\t');
                    }
                }).join('\n');
                const txtContent = `${header}\n${txt}`;
                blob = new Blob([universalBOM+txtContent], {type: "octet/stream"});
                url = window.URL.createObjectURL(blob);
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = model+'.txt';
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert("Invalid output format requested");
            }
        } else {
            alert("No data found to download");
        }
        $('#pageLoaderModal').modal('hide');
    }, function(e) {
        console.error(e);
        alert(e);
        $('#pageLoaderModal').modal('hide');
    });
}

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;
    let sidenav = new KyteSidenav("#sidenav", subnavModel, "#Attributes");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Attributes' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (_ks.isSession()) {
        // get url param
        let idx = _ks.getPageRequest();
        modelIdx = idx.idx;

        let hidden = [
            {
                'name': 'dataModel',
                'value': modelIdx
            }
        ];

        _ks.get("DataModel", "id", modelIdx, [], function(r) {
            if (r.data[0]) {
                model = r.data[0].name;
                $("#model-name").html(model);
                appId = r.data[0].application.id;
                getData(_ks, modelIdx, model, r.data[0].application.id);
                let obj = {'model': 'Application', 'idx':r.data[0].application.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                
                let appnav = generateAppNav(encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, `<i class="fas fa-rocket me-2"></i>${r.data[0].application.name}`);
                navbar.create();

                elements = [
                    [
                        {
                            'field':'name',
                            'type':'text',
                            'label':'Name',
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
                                    'tt': 'TinyText',
                                    'mt': 'MediumText',
                                    'lt': 'LongText',
                                    'b': 'Blob',
                                    'tb': 'TinyBlob',
                                    'mb': 'MediumBlob',
                                    'lb': 'LongBlob',
                                    'date': 'Date',
                                    'i': 'Integer',
                                    'bi': 'BigInt',
                                }
                            }
                        },
                        {
                            'field':'size',
                            'type':'text',
                            'label':'Size',
                            'required':false,
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
                            },
                            'col': 2
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
                                'data_model_field': 'application',
                                'data_model_value': r.data[0].application.id,
                                'data_model_attributes': ['name'],
                                'data_model_default_field': 'id',
                                // 'data_model_default_value': 1,
                            }
                        }
                    ],
                    [
                        
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
                            },
                            'col': 2
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
                            },
                            'col': 2
                        },
                        {
                            'field':'password',
                            'type':'select',
                            'label':'Password',
                            'required':false,
                            'option': {
                                'ajax': false,
                                'data': {
                                    0: 'No',
                                    1: 'Yes'
                                }
                            },
                            'col': 2
                        },
                        {
                            'field':'encrypt',
                            'type':'select',
                            'label':'Encrypt',
                            'required':false,
                            'option': {
                                'ajax': false,
                                'data': {
                                    0: 'No',
                                    1: 'Yes'
                                }
                            },
                            'col': 2
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

                // attribute table and form
                var tblAttributes = new KyteTable(_ks, $("#attributes-table"), {'name':"ModelAttribute",'field':'dataModel','value':modelIdx}, colDefAttributes, true, [0,"asc"], true, true);
                tblAttributes.init();
                var modalForm = new KyteForm(_ks, $("#modalForm"), 'ModelAttribute', hidden, elements, 'Model Attribute', tblAttributes, true, $("#newAttribute"));
                modalForm.init();
                tblAttributes.bindEdit(modalForm);
            } else {
                $("#model-name").html("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });

        // controller table and form
        var tblController = new KyteTable(_ks, $("#controllers-table"), {'name':"Controller",'field':"dataModel",'value':modelIdx}, colDefControllers, true, [0,"asc"], true, true, 'id', '/app/controller/');
        tblController.init();

        $(".downloadCodeBtn").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            let format = $(this).data('downloadFormat');
            switch (format) {
                case 'swift':
                    download_code(model, swift, 'swift');
                    break;
                
                case 'dart':
                    download_code(model, dart, 'dart');
                    break;
                    
                case 'json':
                    download_code(model, JSON.stringify(json), 'json');
                    break;
            
                default:
                    break;
            }
            
        });
        $(".downloadDataBtn").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            let format = $(this).data('downloadFormat');

            download_data(_ks, format);
        });
    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});