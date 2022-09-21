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
let subnavModels = [
    {
        faicon:'fas fa-users',
        label:'Team',
        selector:'#Team'
    },
    {
        faicon:'fas fa-map-marked-alt',
        label:'Sites',
        selector:'#Sites'
    },
    {
        faicon:'fas fa-briefcase-medical',
        label:'Trays',
        selector:'#Trays'
    },
    {
        faicon:'fas fa-search-location',
        label:'Tray Locations',
        selector:'#TrayLocations'
    },
    {
        faicon:'fas fa-address-card',
        label:'Invitation Code',
        selector:'#Invitations'
    }
];
let subnavSettings = [
    {
        faicon:'fas fa-user',
        label:'My Profile',
        selector:'#Profile'
    }
];
