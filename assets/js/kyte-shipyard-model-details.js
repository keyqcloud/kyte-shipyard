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
                modelColDef.push({'targets':targets,'data':col.name,'label':col.name, render: function(data, type, row, meta) { return (typeof data === 'object' ? JSON.stringify(data, undefined, 4) : data ? data : ''); }});
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
        modelColDef.push({'targets':targets,'data':'date_created','label':'date_created', render: function(data, type, row, meta) { return data ? data : '';}});
        targets++;
        modelColDef.push({'targets':targets,'data':'date_modified','label':'date_modified', render: function(data, type, row, meta) { return data ? data : '';}});

        var tblData = new KyteTable(_ks, $("#data-table"), {'name':"AppModelWrapper",'field':null,'value':null}, modelColDef, true, [0,"asc"], true, true);
        tblData.httpHeaders = [{'name':'x-kyte-app-id','value':appId},{'name':'x-kyte-app-model','value':model}];

        // Custom callback to update records count after data loads
        const originalLoadData = tblData._loadData;
        tblData._loadData = function() {
            originalLoadData.call(this);
            // Update records count in sidebar after data loads
            setTimeout(() => {
                $('#records-count').text(tblData.totalRecords || 0);
            }, 100);
        };

        tblData.init();

        // init form
        const dataModalTitle = window.kyteI18n ? window.kyteI18n.t('ui.model_detail.modal.data_title') : 'Model Data';
        const submitText = window.kyteI18n ? window.kyteI18n.t('ui.model_detail.modal.submit') : 'Submit';

        var modelDataForm = new KyteForm(_ks, $("#modalDataForm"), 'AppModelWrapper', null, modelFormDef, dataModalTitle, tblData, true, $("#newData"));
        modelDataForm.submitButton = submitText;
        modelDataForm.httpHeaders = [{'name':'x-kyte-app-id','value':appId},{'name':'x-kyte-app-model','value':model}];
        modelDataForm.init();
        tblData.bindEdit(modelDataForm);

        // Refresh data table button
        $('#refreshData').click(function(e) {
            e.preventDefault();
            const btn = $(this);
            const icon = btn.find('i');

            // Add spinning animation
            icon.addClass('fa-spin');
            btn.prop('disabled', true);

            // Reload data - use internal method directly
            if (typeof tblData._loadData === 'function') {
                tblData._loadData();
            } else if (typeof tblData.draw === 'function') {
                tblData.draw();
            } else {
                console.error('Unable to refresh table - no reload method found', tblData);
            }

            // Remove spinning animation after a short delay
            setTimeout(function() {
                icon.removeClass('fa-spin');
                btn.prop('disabled', false);
            }, 500);
        });
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

// Helper function to escape CSV values (RFC 4180 compliant)
function escapeCsvValue(value) {
    if (value === null || value === undefined) {
        return '';
    }

    // Convert to string
    let str = String(value);

    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }

    return str;
}

// Helper function to flatten nested objects for export
function flattenValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'object') {
        // If it has an id property, use that (foreign key)
        if (value.hasOwnProperty('id')) {
            return value.id;
        }
        // Otherwise convert to JSON string
        return JSON.stringify(value);
    }
    return value;
}

// Download model definition (schema)
function download_model_definition(_ks, format) {
    if (!modelStructure || modelStructure.length === 0) {
        _ks.alert('No Model Definition', 'Model definition not loaded. Please refresh the page.');
        return;
    }

    const modelDef = {
        name: model,
        attributes: modelStructure.map(attr => ({
            name: attr.name,
            type: attr.type,
            size: attr.size,
            required: attr.required === 1,
            protected: attr.protected === 1,
            unsigned: attr.unsigned === 1,
            default: attr.defaults,
            description: attr.description,
            foreignKey: attr.foreignKeyModel ? {
                model: attr.foreignKeyModel.name,
                field: attr.foreignKeyAttribute
            } : null
        }))
    };

    const jsonStr = JSON.stringify(modelDef, null, 2);
    const blob = new Blob([universalBOM + jsonStr], {type: "application/json"});
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = model + '_definition.json';
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Download all data
function download_data(_ks, format) {
    $('#pageLoaderModal').modal('show');

    const headers = [
        {'name':'x-kyte-app-id','value':appId},
        {'name':'x-kyte-app-model','value':model}
    ];

    _ks.get('AppModelWrapper', null, null, headers, function(r) {
        if (!r.data || r.data.length === 0) {
            $('#pageLoaderModal').modal('hide');
            _ks.alert('No Data', 'No records found to export.');
            return;
        }

        try {
            let blob, url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

            if (format === 'json') {
                // JSON export
                const jsonStr = JSON.stringify(r.data, null, 2);
                blob = new Blob([universalBOM + jsonStr], {type: "application/json"});
                url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = model + '_data_' + timestamp + '.json';
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

            } else if (format === 'csv') {
                // CSV export with proper escaping
                const headers = Object.keys(r.data[0]);
                const headerRow = headers.map(h => escapeCsvValue(h)).join(',');

                const rows = r.data.map(obj => {
                    return headers.map(header => {
                        const value = flattenValue(obj[header]);
                        return escapeCsvValue(value);
                    }).join(',');
                });

                const csvContent = headerRow + '\n' + rows.join('\n');
                blob = new Blob([universalBOM + csvContent], {type: "text/csv"});
                url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = model + '_data_' + timestamp + '.csv';
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

            } else if (format === 'txt') {
                // TSV export (tab-separated)
                const headers = Object.keys(r.data[0]);
                const headerRow = headers.join('\t');

                const rows = r.data.map(obj => {
                    return headers.map(header => {
                        const value = flattenValue(obj[header]);
                        // For TSV, replace tabs and newlines with spaces
                        return String(value).replace(/[\t\n\r]/g, ' ');
                    }).join('\t');
                });

                const tsvContent = headerRow + '\n' + rows.join('\n');
                blob = new Blob([universalBOM + tsvContent], {type: "text/tab-separated-values"});
                url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = model + '_data_' + timestamp + '.txt';
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

            } else if (format === 'xlsx') {
                // Excel export using SheetJS
                if (typeof XLSX === 'undefined') {
                    $('#pageLoaderModal').modal('hide');
                    _ks.alert('Library Missing', 'SheetJS library not loaded. Please refresh the page.');
                    return;
                }

                // Flatten nested objects for Excel
                const flatData = r.data.map(obj => {
                    const flatObj = {};
                    Object.keys(obj).forEach(key => {
                        flatObj[key] = flattenValue(obj[key]);
                    });
                    return flatObj;
                });

                // Create workbook and worksheet
                const ws = XLSX.utils.json_to_sheet(flatData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, model.substring(0, 31)); // Excel sheet name limit

                // Generate Excel file
                XLSX.writeFile(wb, model + '_data_' + timestamp + '.xlsx');

            } else {
                $('#pageLoaderModal').modal('hide');
                _ks.alert('Invalid Format', 'The requested export format is not supported.');
                return;
            }

            $('#pageLoaderModal').modal('hide');

            // Show success message
            console.log(`Successfully exported ${r.data.length} records as ${format.toUpperCase()}`);

        } catch (error) {
            console.error('Export error:', error);
            $('#pageLoaderModal').modal('hide');
            _ks.alert('Export Failed', 'An error occurred while exporting data: ' + error.message);
        }

    }, function(e) {
        console.error('Data fetch error:', e);
        $('#pageLoaderModal').modal('hide');
        _ks.alert('Export Failed', 'Failed to fetch data from server: ' + (e.message || e));
    });
}

// ===== IMPORT FUNCTIONALITY =====

// Global import state
let importState = {
    parsedData: [],
    validationErrors: [],
    importResults: {
        success: [],
        errors: []
    }
};

// Download import template
function download_import_template(_ks, format) {
    if (!modelStructure || modelStructure.length === 0) {
        _ks.alert('No Model Definition', 'Model structure not loaded. Please refresh the page.');
        return;
    }

    // Get field names (exclude protected fields and audit fields)
    const excludeFields = ['id', 'kyte_account', 'created_by', 'date_created', 'modified_by', 'date_modified', 'deleted', 'deleted_by', 'date_deleted'];
    const fields = modelStructure
        .filter(attr => attr.protected !== 1 && !excludeFields.includes(attr.name))
        .map(attr => attr.name);

    if (fields.length === 0) {
        _ks.alert('No Fields', 'No importable fields found in this model.');
        return;
    }

    // Create sample row with hints
    const sampleRow = {};
    modelStructure.forEach(attr => {
        if (fields.includes(attr.name)) {
            let hint = '';
            if (attr.type === 's') hint = 'text';
            else if (attr.type === 'i' || attr.type === 'bi') hint = '123';
            else if (attr.type === 'd') hint = '99.99';
            else if (attr.type === 't' || attr.type === 'tt' || attr.type === 'mt' || attr.type === 'lt') hint = 'long text';
            else if (attr.type === 'date') hint = '2026-01-25';
            else if (attr.foreignKeyModel) hint = 'FK:' + attr.foreignKeyModel.id;
            else hint = 'value';

            sampleRow[attr.name] = hint;
        }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    if (format === 'csv') {
        // CSV template
        const headerRow = fields.map(f => escapeCsvValue(f)).join(',');
        const sampleRowStr = fields.map(f => escapeCsvValue(sampleRow[f])).join(',');
        const csvContent = headerRow + '\n' + sampleRowStr;

        const blob = new Blob([universalBOM + csvContent], {type: "text/csv"});
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = model + '_import_template_' + timestamp + '.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } else if (format === 'xlsx') {
        // Excel template
        if (typeof XLSX === 'undefined') {
            _ks.alert('Library Missing', 'SheetJS library not loaded. Please refresh the page.');
            return;
        }

        const templateData = [sampleRow];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Import Template');

        XLSX.writeFile(wb, model + '_import_template_' + timestamp + '.xlsx');
    }
}

// Parse uploaded file
function parse_import_file(file, callback, errorCallback) {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    if (fileExtension === 'json') {
        // Parse JSON
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) {
                    errorCallback('JSON file must contain an array of objects.');
                    return;
                }
                callback(data);
            } catch (error) {
                errorCallback('Invalid JSON format: ' + error.message);
            }
        };
        reader.onerror = function() {
            errorCallback('Failed to read file.');
        };
        reader.readAsText(file);

    } else if (fileExtension === 'csv' || fileExtension === 'txt' || fileExtension === 'tsv') {
        // Parse CSV/TSV
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const delimiter = fileExtension === 'tsv' ? '\t' : ',';
                const lines = text.split('\n').filter(line => line.trim().length > 0);

                if (lines.length < 2) {
                    errorCallback('File must contain at least a header row and one data row.');
                    return;
                }

                // Parse header
                const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

                // Parse rows
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    data.push(row);
                }

                callback(data);
            } catch (error) {
                errorCallback('Failed to parse CSV/TSV: ' + error.message);
            }
        };
        reader.onerror = function() {
            errorCallback('Failed to read file.');
        };
        reader.readAsText(file);

    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        if (typeof XLSX === 'undefined') {
            errorCallback('SheetJS library not loaded. Please refresh the page.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                if (jsonData.length === 0) {
                    errorCallback('Excel file is empty.');
                    return;
                }

                callback(jsonData);
            } catch (error) {
                errorCallback('Failed to parse Excel file: ' + error.message);
            }
        };
        reader.onerror = function() {
            errorCallback('Failed to read file.');
        };
        reader.readAsArrayBuffer(file);

    } else {
        errorCallback('Unsupported file format. Please upload CSV, TSV, JSON, or Excel (XLSX) files.');
    }
}

// Validate import data
function validate_import_data(data) {
    if (!modelStructure || modelStructure.length === 0) {
        return {valid: false, errors: ['Model structure not loaded']};
    }

    const errors = [];
    const requiredFields = modelStructure
        .filter(attr => attr.required === 1 && attr.name !== 'id' && attr.name !== 'kyte_account')
        .map(attr => attr.name);

    // Check each row
    data.forEach((row, index) => {
        const rowNum = index + 1;

        // Check required fields
        requiredFields.forEach(field => {
            if (!row[field] || row[field] === '') {
                errors.push({
                    row: rowNum,
                    field: field,
                    error: `Required field '${field}' is missing or empty`
                });
            }
        });

        // Check data types (basic validation)
        modelStructure.forEach(attr => {
            if (row.hasOwnProperty(attr.name) && row[attr.name] !== '') {
                const value = row[attr.name];

                // Integer validation
                if ((attr.type === 'i' || attr.type === 'bi') && isNaN(parseInt(value))) {
                    errors.push({
                        row: rowNum,
                        field: attr.name,
                        error: `Field '${attr.name}' must be a number, got '${value}'`
                    });
                }

                // Decimal validation
                if (attr.type === 'd' && isNaN(parseFloat(value))) {
                    errors.push({
                        row: rowNum,
                        field: attr.name,
                        error: `Field '${attr.name}' must be a decimal number, got '${value}'`
                    });
                }
            }
        });
    });

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Perform import with progress tracking
async function perform_import(_ks, data, progressCallback, completeCallback) {
    const total = data.length;
    let processed = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Sequential import (one at a time)
    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        try {
            // Create promise wrapper for kyte.post
            await new Promise((resolve, reject) => {
                const headers = [
                    {'name': 'x-kyte-app-id', 'value': appId},
                    {'name': 'x-kyte-app-model', 'value': model}
                ];

                _ks.post('AppModelWrapper', row, null, headers,
                    function(response) {
                        successCount++;
                        processed++;
                        progressCallback({
                            processed: processed,
                            total: total,
                            successCount: successCount,
                            errorCount: errorCount
                        });
                        resolve(response);
                    },
                    function(error) {
                        errorCount++;
                        processed++;
                        errors.push({
                            row: i + 1,
                            data: row,
                            error: error.error || error.message || error
                        });
                        progressCallback({
                            processed: processed,
                            total: total,
                            successCount: successCount,
                            errorCount: errorCount
                        });
                        resolve(); // Don't reject, continue with next row
                    }
                );
            });

            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error('Import error:', error);
        }
    }

    completeCallback({
        total: total,
        successCount: successCount,
        errorCount: errorCount,
        errors: errors
    });
}

document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    // Wait for i18n to be ready before creating sidebar
    function waitForI18n(callback) {
        if (window.kyteI18n && window.kyteI18n.initialized) {
            callback();
        } else {
            setTimeout(() => waitForI18n(callback), 50);
        }
    }

    // NOTE: Sidebar navigation removed - now using Bootstrap tabs in HTML
    // Bootstrap tabs handle show/hide automatically via data-bs-toggle="tab" attributes
    // Translations are handled in HTML via data-i18n attributes

    $('#pageLoaderModal').modal('show');

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
                $("#model-name span").text(model);
                appId = r.data[0].application.id;
                // Store application ID for navigation
                localStorage.setItem('currentAppId', appId);
                getData(_ks, modelIdx, model, r.data[0].application.id);
                let obj = {'model': 'Application', 'idx':r.data[0].application.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                
                let appnav = generateAppNav(encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, `<i class="fas fa-rocket me-2"></i>${r.data[0].application.name}`);
                navbar.create();

                // Get i18n instance for translations
                const i18n = window.kyteI18n;
                const t = (key, fallback) => i18n ? i18n.t(key) : fallback;

                elements = [
                    [
                        {
                            'field':'name',
                            'type':'text',
                            'label': t('ui.model_detail.form.name', 'Name'),
                            'required':true
                        },
                        {
                            'field':'type',
                            'type':'select',
                            'label': t('ui.model_detail.form.type', 'Type'),
                            'required':true,
                            'option': {
                                'ajax': false,
                                'data': {
                                    's': t('ui.model_detail.form.type_string', 'String'),
                                    't': t('ui.model_detail.form.type_text', 'Text'),
                                    'tt': t('ui.model_detail.form.type_tinytext', 'TinyText'),
                                    'mt': t('ui.model_detail.form.type_mediumtext', 'MediumText'),
                                    'lt': t('ui.model_detail.form.type_longtext', 'LongText'),
                                    'b': t('ui.model_detail.form.type_blob', 'Blob'),
                                    'tb': t('ui.model_detail.form.type_tinyblob', 'TinyBlob'),
                                    'mb': t('ui.model_detail.form.type_mediumblob', 'MediumBlob'),
                                    'lb': t('ui.model_detail.form.type_longblob', 'LongBlob'),
                                    'date': t('ui.model_detail.form.type_date', 'Date'),
                                    'i': t('ui.model_detail.form.type_integer', 'Integer'),
                                    'bi': t('ui.model_detail.form.type_bigint', 'BigInt'),
                                }
                            }
                        },
                        {
                            'field':'required',
                            'type':'select',
                            'label': t('ui.model_detail.form.required', 'Required'),
                            'required':true,
                            'option': {
                                'ajax': false,
                                'data': {
                                    1: t('ui.model_detail.form.yes', 'Yes'),
                                    0: t('ui.model_detail.form.no', 'No')
                                }
                            }
                        },
                        {
                            'field': 'foreignKeyModel',
                            'type': 'select',
                            'label': t('ui.model_detail.form.fk_model', 'FK Model'),
                            'required': false,
                            'placeholder': t('ui.model_detail.form.na', 'N/A'),
                            'option': {
                                'ajax': true,
                                'data_model_name': 'DataModel',
                                'data_model_field': 'application',
                                'data_model_value': r.data[0].application.id,
                                'data_model_attributes': ['name'],
                                'data_model_default_field': 'id',
                            }
                        }
                    ],
                    [
                        {
                            'field':'size',
                            'type':'text',
                            'label': t('ui.model_detail.form.size', 'Size'),
                            'required':false,
                        },
                        {
                            'field':'unsigned',
                            'type':'select',
                            'label': t('ui.model_detail.form.unsigned', 'Unsigned'),
                            'required':false,
                            'option': {
                                'ajax': false,
                                'data': {
                                    "": t('ui.model_detail.form.na', 'n/a'),
                                    1: t('ui.model_detail.form.yes', 'Yes'),
                                    0: t('ui.model_detail.form.no', 'No')
                                }
                            }
                        },
                        {
                            'field':'protected',
                            'type':'select',
                            'label': t('ui.model_detail.form.protected', 'Protected'),
                            'required':false,
                            'option': {
                                'ajax': false,
                                'data': {
                                    0: t('ui.model_detail.form.no', 'No'),
                                    1: t('ui.model_detail.form.yes', 'Yes')
                                }
                            }
                        },
                        {
                            'field':'password',
                            'type':'select',
                            'label': t('ui.model_detail.form.password', 'Password'),
                            'required':false,
                            'option': {
                                'ajax': false,
                                'data': {
                                    0: t('ui.model_detail.form.no', 'No'),
                                    1: t('ui.model_detail.form.yes', 'Yes')
                                }
                            }
                        },
                        {
                            'field':'defaults',
                            'type':'text',
                            'label': t('ui.model_detail.form.default', 'Default'),
                            'required':false
                        }
                    ],
                    [
                        {
                            'field':'description',
                            'type':'text',
                            'label': t('ui.model_detail.form.description', 'Description'),
                            'required':false
                        }
                    ]
                ];

                // attribute table and form
                var tblAttributes = new KyteTable(_ks, $("#attributes-table"), {'name':"ModelAttribute",'field':'dataModel','value':modelIdx}, colDefAttributes, true, [0,"asc"], true, true);
                tblAttributes.init();

                // Update attributes count in sidebar
                $('#attributes-table').on('draw.dt', function() {
                    var info = $(this).DataTable().page.info();
                    $('#attributes-count').text(info.recordsTotal);
                });

                // Get translated modal title
                const attributeModalTitle = window.kyteI18n ? window.kyteI18n.t('ui.model_detail.modal.attribute_title') : 'Model Attribute';
                const submitText = window.kyteI18n ? window.kyteI18n.t('ui.model_detail.modal.submit') : 'Submit';

                var modalForm = new KyteForm(_ks, $("#modalForm"), 'ModelAttribute', hidden, elements, attributeModalTitle, tblAttributes, true, $("#newAttribute"));
                modalForm.submitButton = submitText;
                modalForm.init();
                tblAttributes.bindEdit(modalForm);

                // controller table and form
                let elementsController = [
                [
                    {
                        'field':'name',
                        'type':'text',
                        'label': t('ui.model_detail.form.name', 'Name'),
                        'required':true
                    }
                ],
                [
                    {
                        'field':'description',
                        'type':'textarea',
                        'label': t('ui.model_detail.form.description', 'Description'),
                        'required':false
                    }
                ]
            ];

            let hiddenElementsController = [
                {
                    'name': 'application',
                    'value': r.data[0].application.id
                },
                {
                    'name': 'dataModel',
                    'value': modelIdx
                }
            ];
            // controller table and form
            var tblController = new KyteTable(_ks, $("#controllers-table"), {'name':"Controller",'field':"dataModel",'value':modelIdx}, colDefControllers, true, [0,"asc"], true, true, 'id', '/app/controller/');
            tblController.init();

            // Update controllers count in sidebar
            $('#controllers-table').on('draw.dt', function() {
                var info = $(this).DataTable().page.info();
                $('#controllers-count').text(info.recordsTotal);
            });

            // Get translated modal title
            const controllerModalTitle = window.kyteI18n ? window.kyteI18n.t('ui.model_detail.modal.controller_title') : 'Controller';
            const controllerSubmitText = window.kyteI18n ? window.kyteI18n.t('ui.model_detail.modal.submit') : 'Submit';

            var modalFormController = new KyteForm(_ks, $("#modalFormController"), 'Controller', hiddenElementsController, elementsController, controllerModalTitle, tblController, true, $("#newController"));
            modalFormController.submitButton = controllerSubmitText;
            modalFormController.init();
            modalFormController.success = function(r) {
                if (r.data[0]) {
                    let obj = {'model': 'Controller', 'idx':r.data[0].id};
                    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    location.href="/app/controller/?request="+encoded;
                }
            }
            tblController.bindEdit(modalFormController);
            } else {
                $("#model-name span").text("Undefined");
            }
            $('#pageLoaderModal').modal('hide');
        });

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

        $(".downloadModelDefBtn").click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            let format = $(this).data('downloadFormat');

            download_model_definition(_ks, format);
        });

        // ===== IMPORT EVENT HANDLERS =====

        // Download template
        $(".downloadTemplateBtn").click(function(e) {
            e.preventDefault();
            let format = $(this).data('templateFormat');
            download_import_template(_ks, format);
        });

        // Drag & drop file upload
        const dropzone = document.getElementById('import-dropzone');
        const fileInput = document.getElementById('import-file-input');

        dropzone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass('border-primary bg-light');
        });

        dropzone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('border-primary bg-light');
        });

        dropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('border-primary bg-light');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleImportFile(files[0]);
            }
        });

        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files.length > 0) {
                handleImportFile(files[0]);
            }
        });

        // Handle file upload
        function handleImportFile(file) {
            // Show file info
            $('#import-filename').text(file.name);
            $('#import-filesize').text((file.size / 1024).toFixed(2) + ' KB');
            $('#import-file-info').show();

            // Parse file
            $('#pageLoaderModal').modal('show');
            parse_import_file(file,
                function(data) {
                    // Success
                    $('#pageLoaderModal').modal('hide');
                    importState.parsedData = data;

                    // Validate
                    const validation = validate_import_data(data);
                    importState.validationErrors = validation.errors;

                    // Show preview
                    showImportPreview(data, validation);

                    // Move to step 2
                    $('#import-step-1').hide();
                    $('#import-step-2').show();
                },
                function(error) {
                    // Error
                    $('#pageLoaderModal').modal('hide');
                    _ks.alert('Parse Error', error);
                }
            );
        }

        // Show import preview
        function showImportPreview(data, validation) {
            const previewTable = $('#import-preview-table');
            previewTable.find('thead').empty();
            previewTable.find('tbody').empty();

            // Show validation summary
            const summaryDiv = $('#import-validation-summary');
            if (validation.valid) {
                summaryDiv.html(`
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>Validation Passed!</strong> All ${data.length} rows are valid and ready to import.
                    </div>
                `);
                $('#import-start-btn').prop('disabled', false);
            } else {
                summaryDiv.html(`
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Validation Issues Found:</strong> ${validation.errors.length} error(s) in ${data.length} row(s).
                        You can still proceed, but rows with errors will be skipped.
                        <button class="btn btn-sm btn-warning ms-2" onclick="$('#validation-details').toggle()">
                            <i class="fas fa-list me-1"></i>Show Details
                        </button>
                    </div>
                    <div id="validation-details" style="display: none;" class="mt-2">
                        <table class="table table-sm table-bordered">
                            <thead class="table-warning">
                                <tr><th>Row</th><th>Field</th><th>Error</th></tr>
                            </thead>
                            <tbody>
                                ${validation.errors.map(err => `
                                    <tr>
                                        <td>${err.row}</td>
                                        <td>${err.field}</td>
                                        <td>${err.error}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `);
                $('#import-start-btn').prop('disabled', false); // Allow import anyway
            }

            // Show preview (first 10 rows)
            if (data.length > 0) {
                const headers = Object.keys(data[0]);
                const headerRow = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
                previewTable.find('thead').html(headerRow);

                const previewRows = data.slice(0, 10);
                const bodyRows = previewRows.map((row, index) => {
                    const cells = headers.map(h => `<td>${row[h] || ''}</td>`).join('');
                    return `<tr><td class="text-muted small">${index + 1}</td>${cells}</tr>`;
                }).join('');

                previewTable.find('thead tr').prepend('<th>#</th>');
                previewTable.find('tbody').html(bodyRows);

                if (data.length > 10) {
                    previewTable.find('tbody').append(`
                        <tr>
                            <td colspan="${headers.length + 1}" class="text-center text-muted">
                                ... and ${data.length - 10} more rows
                            </td>
                        </tr>
                    `);
                }
            }
        }

        // Back to upload
        $('#import-back-btn').click(function() {
            $('#import-step-2').hide();
            $('#import-step-1').show();
            // Reset file input
            $('#import-file-input').val('');
            $('#import-file-info').hide();
        });

        // Start import
        $('#import-start-btn').click(function() {
            // Move to step 3
            $('#import-step-2').hide();
            $('#import-step-3').show();

            // Initialize progress
            const total = importState.parsedData.length;
            $('#import-total-count').text(total);
            $('#import-progress-text').text('0 / ' + total);
            $('#import-progress-percent').text('0%');
            $('#import-progress-bar').css('width', '0%');
            $('#import-success-count').text('0');
            $('#import-error-count').text('0');

            // Start import
            perform_import(_ks, importState.parsedData,
                function(progress) {
                    // Progress callback
                    const percent = Math.round((progress.processed / progress.total) * 100);
                    $('#import-progress-text').text(progress.processed + ' / ' + progress.total);
                    $('#import-progress-percent').text(percent + '%');
                    $('#import-progress-bar').css('width', percent + '%');
                    $('#import-success-count').text(progress.successCount);
                    $('#import-error-count').text(progress.errorCount);
                },
                function(results) {
                    // Complete callback
                    importState.importResults = results;

                    // Show results
                    showImportResults(results);

                    // Move to step 4
                    $('#import-step-3').hide();
                    $('#import-step-4').show();
                }
            );
        });

        // Show import results
        function showImportResults(results) {
            const summaryDiv = $('#import-results-summary');

            if (results.errorCount === 0) {
                summaryDiv.html(`
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>Import Successful!</strong> All ${results.successCount} records were imported successfully.
                    </div>
                `);
                $('#import-errors-section').hide();
            } else {
                summaryDiv.html(`
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Import Completed with Errors:</strong>
                        ${results.successCount} successful, ${results.errorCount} failed out of ${results.total} total.
                    </div>
                `);

                // Show errors
                const errorsTable = $('#import-errors-table tbody');
                errorsTable.empty();
                results.errors.forEach(err => {
                    errorsTable.append(`
                        <tr>
                            <td>${err.row}</td>
                            <td><code>${JSON.stringify(err.data)}</code></td>
                            <td class="text-danger">${err.error}</td>
                        </tr>
                    `);
                });
                $('#import-errors-section').show();
            }
        }

        // Download error report
        $('#download-error-report-btn').click(function() {
            const errors = importState.importResults.errors;
            if (errors.length === 0) return;

            const csvHeader = 'Row,Data,Error\n';
            const csvRows = errors.map(err => {
                return `${err.row},"${JSON.stringify(err.data).replace(/"/g, '""')}","${String(err.error).replace(/"/g, '""')}"`;
            }).join('\n');

            const csvContent = universalBOM + csvHeader + csvRows;
            const blob = new Blob([csvContent], {type: "text/csv"});
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            a.href = url;
            a.download = model + '_import_errors_' + new Date().toISOString().slice(0, 10) + '.csv';
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });

        // Import another file
        $('#import-new-btn').click(function() {
            // Reset state
            importState = {
                parsedData: [],
                validationErrors: [],
                importResults: {success: [], errors: []}
            };

            // Reset UI
            $('#import-step-4').hide();
            $('#import-step-1').show();
            $('#import-file-input').val('');
            $('#import-file-info').hide();
        });

        // Refresh data table
        $('#import-refresh-data-btn').click(function() {
            // Switch to data tab
            $('#model-tabs a[href="#data-tab"]').tab('show');

            // Reload data table if it exists
            if (typeof tblData !== 'undefined') {
                if (typeof tblData._loadData === 'function') {
                    tblData._loadData();
                } else if (typeof tblData.draw === 'function') {
                    tblData.draw();
                }
            }
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});

// Kyte Form overrides
// Wait for KyteForm to be initialized, then enhance it
document.addEventListener('DOMContentLoaded', function() {
    // Function to enhance KyteForm after it's created
    function enhanceKyteForm() {
        // Wait for modal to be in DOM
        const modalObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if this is a KyteForm modal
                        const modal = node.querySelector('.modal') || (node.classList && node.classList.contains('modal') ? node : null);
                        if (modal && modal.querySelector('form[id*="form_ModelAttribute"]')) {
                            enhanceModalForm(modal);
                        }
                    }
                });
            });
        });

        modalObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Function to enhance the modal form
    function enhanceModalForm(modal) {
        console.log('Enhancing KyteForm modal...');
        
        // Add modern classes to modal
        const modalContent = modal.querySelector('.modal-content');
        const modalHeader = modal.querySelector('.modal-header');
        const modalBody = modal.querySelector('.modal-body');
        
        if (modalContent) {
            modalContent.style.borderRadius = '20px';
            modalContent.style.border = 'none';
            modalContent.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)';
            modalContent.style.overflow = 'hidden';
        }

        // Add real-time validation
        addRealTimeValidation(modal);
        
        // Add help text to specific fields
        addHelpText(modal);
        
        // Enhance form submission
        enhanceFormSubmission(modal);
        
        // Add field-specific enhancements
        addFieldEnhancements(modal);
    }

    // Add real-time validation
    function addRealTimeValidation(modal) {
        const requiredFields = modal.querySelectorAll('input[required], select[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', function() {
                validateField(this);
            });
            
            field.addEventListener('input', function() {
                if (this.classList.contains('is-invalid')) {
                    validateField(this);
                }
            });
        });
    }

    // Field validation function
    function validateField(field) {
        const value = field.value.trim();
        const isValid = field.type === 'select-one' ? value !== '' : value.length > 0;
        
        if (isValid) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            removeErrorMessage(field);
        } else {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            addErrorMessage(field);
        }
    }

    // Add error message
    function addErrorMessage(field) {
        removeErrorMessage(field); // Remove existing first
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> This field is required`;
        
        field.parentNode.appendChild(errorDiv);
    }

    // Remove error message
    function removeErrorMessage(field) {
        const existingError = field.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
    }

    // Add help text to specific fields
    function addHelpText(modal) {
        const helpTexts = {
            'name': 'Choose a descriptive name for your attribute',
            'type': 'Select the appropriate data type for your needs',
            'size': 'Maximum length or precision (leave empty for default)',
            'foreignKeyModel': 'Link to another model for relational data',
            'defaults': 'Default value when creating new records',
            'description': 'Help others understand what this attribute is used for'
        };

        Object.keys(helpTexts).forEach(fieldName => {
            const field = modal.querySelector(`[name="${fieldName}"]`);
            if (field && !field.parentNode.querySelector('.form-help')) {
                const helpDiv = document.createElement('div');
                helpDiv.className = 'form-help';
                helpDiv.innerHTML = `<i class="fas fa-lightbulb"></i> ${helpTexts[fieldName]}`;
                field.parentNode.appendChild(helpDiv);
            }
        });
    }

    // Enhance form submission
    function enhanceFormSubmission(modal) {
        const form = modal.querySelector('form');
        const submitBtn = modal.querySelector('input[type="submit"], button[type="submit"]');
        
        if (form && submitBtn) {
            // Store original submit handler
            const originalSubmit = submitBtn.onclick;
            
            submitBtn.onclick = function(e) {
                // Add loading state
                addLoadingState(modal);
                
                // Validate all required fields before submission
                const requiredFields = form.querySelectorAll('input[required], select[required]');
                let isFormValid = true;
                
                requiredFields.forEach(field => {
                    validateField(field);
                    if (field.classList.contains('is-invalid')) {
                        isFormValid = false;
                    }
                });

                if (!isFormValid) {
                    removeLoadingState(modal);
                    e.preventDefault();
                    showFormError(modal, 'Please fill in all required fields');
                    return false;
                }

                // Call original submit handler if it exists
                if (originalSubmit) {
                    const result = originalSubmit.call(this, e);
                    
                    // Add success handling
                    setTimeout(() => {
                        removeLoadingState(modal);
                        if (result !== false) {
                            showFormSuccess(modal);
                        }
                    }, 1000);
                    
                    return result;
                }
            };
        }
    }

    // Add loading state
    function addLoadingState(modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent && !modalContent.classList.contains('form-loading')) {
            modalContent.classList.add('form-loading');
        }
    }

    // Remove loading state
    function removeLoadingState(modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('form-loading');
        }
    }

    // Show form error
    function showFormError(modal, message) {
        const errorMsgDiv = modal.querySelector('.error-msg');
        if (errorMsgDiv) {
            errorMsgDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
            errorMsgDiv.style.display = 'block';
        }
    }

    // Show form success
    function showFormSuccess(modal) {
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 1rem 1.5rem;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            animation: slideInRight 0.4s ease-out;
        `;
        successDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            Model attribute saved successfully!
        `;
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.4s ease-out forwards';
            setTimeout(() => successDiv.remove(), 400);
        }, 3000);
    }

    // Add field-specific enhancements
    function addFieldEnhancements(modal) {
        // Type field enhancement - show relevant size field
        const typeField = modal.querySelector('[name="type"]');
        const sizeField = modal.querySelector('[name="size"]');
        
        if (typeField && sizeField) {
            typeField.addEventListener('change', function() {
                const sizeFormGroup = sizeField.closest('.form-group');
                const typesNeedingSize = ['s', 'i', 'bi']; // String, Integer, BigInt
                
                if (typesNeedingSize.includes(this.value)) {
                    sizeFormGroup.style.opacity = '1';
                    sizeField.removeAttribute('disabled');
                    
                    // Add placeholder based on type
                    if (this.value === 's') {
                        sizeField.placeholder = 'e.g., 255';
                    } else if (this.value === 'i') {
                        sizeField.placeholder = 'e.g., 11';
                    } else if (this.value === 'bi') {
                        sizeField.placeholder = 'e.g., 20';
                    }
                } else {
                    sizeFormGroup.style.opacity = '0.5';
                    sizeField.setAttribute('disabled', 'disabled');
                    sizeField.placeholder = 'Not applicable';
                    sizeField.value = '';
                }
            });
            
            // Trigger on load
            typeField.dispatchEvent(new Event('change'));
        }

        // Foreign key field enhancement
        const fkField = modal.querySelector('[name="foreignKeyModel"]');
        if (fkField) {
            fkField.addEventListener('change', function() {
                const nameField = modal.querySelector('[name="name"]');
                if (this.value && nameField && !nameField.value.trim()) {
                    const selectedOption = this.options[this.selectedIndex];
                    if (selectedOption.text && selectedOption.text !== 'N/A') {
                        nameField.value = selectedOption.text.toLowerCase() + '_id';
                        nameField.dispatchEvent(new Event('input'));
                    }
                }
            });
        }
    }

    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .form-loading::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            z-index: 1000;
            border-radius: 20px;
        }
        .form-loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 32px;
            height: 32px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #ff6b35;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            transform: translate(-50%, -50%);
            z-index: 1001;
        }
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Initialize the enhancement
    enhanceKyteForm();
});

// Override KyteForm creation to add enhancements
// This assumes KyteForm is a global object that can be extended
if (typeof window.KyteForm !== 'undefined') {
    const originalKyteFormInit = window.KyteForm.prototype.init;
    
    window.KyteForm.prototype.init = function() {
        const result = originalKyteFormInit.apply(this, arguments);
        
        // Add enhancement after form is created
        setTimeout(() => {
            const modal = document.querySelector(`#${this.modalId}`);
            if (modal) {
                enhanceModalForm(modal);
            }
        }, 100);
        
        return result;
    };
}