// menu array
let rootnav = [
    [],
    [
        {
            dropdown: true,
            // faicon:'fas fa-server',
            class:'me-2 text-light',
            label:'Account',
            items: [
                {
                    faicon:'fas fa-cog',
                    class:'me-2',
                    label:'Settings',
                    href:'/app/settings.html'
                },
                {
                    logout: true,
                    faicon:'fas fa-server',
                    class:'me-2',
                    label:'Logout'
                }
            ]
        }
    ]
]

// menu array
let nav = [
    [
        {
            faicon:'fas fa-file-import',
            class:'me-2 text-light',
            label:'Models',
            href:'/app/'
        },
        {
            faicon:'fas fa-layer-group',
            class:'me-2 text-light',
            label:'Controllers',
            href:'/app/controllers.html'
        },
        {
            faicon:'fas fa-cubes',
            class:'me-2 text-light',
            label:'Functions',
            href:'/app/functions.html'
        }
    ],
    [
        {
            dropdown: true,
            // faicon:'fas fa-server',
            class:'me-2 text-light',
            label:'Account',
            items: [
                {
                    faicon:'fas fa-cog',
                    class:'me-2',
                    label:'Settings',
                    href:'/app/settings.html'
                },
                {
                    logout: true,
                    faicon:'fas fa-server',
                    class:'me-2',
                    label:'Logout'
                }
            ]
        }
    ]
]

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
];
let subnavController = [
    {
        faicon:'fas fa-code',
        label:'Functions',
        selector:'#Functions'
    },
];
let subnavFunction = [
    {
        faicon:'fas fa-code',
        label:'Code',
        selector:'#Code'
    },
    {
        faicon:'fas fa-layer-group',
        label:'Controllers',
        selector:'#Controllers'
    },
];
let subnavSettings = [
    {
        faicon:'fas fa-user',
        label:'My Profile',
        selector:'#Profile'
    },
    {
        faicon:'fas fa-user-shield',
        label:'Administrators',
        selector:'#Administrators'
    },
    {
        faicon:'fas fa-server',
        label:'API',
        selector:'#API'
    }
];
