let colDefControllers = [
    {'targets':0,'data':'name','label':'Name'},
    {'targets':1,'data':'dataModel.name','label':'Model', render: function(data, type, row, meta) { return data ? data:'Virtual'; }},
    {'targets':2,'data':'description','label':'Description'},
];

let colDefAPI = [
    {'targets':0,'data':'identifier','label':'Identifier'},
    {'targets':1,'data':'public_key','label':'Public Key'},
    {'targets':2,'data':'secret_key','label':'Secret Key'},
];
