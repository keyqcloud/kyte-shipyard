function generateAppNav(appName, encodedRequest) {
    return [
        [
            {
                faicon:'fas fa-rocket',
                class:'me-2 text-light',
                label: appName,
                href: '/app/dashboard/?request='+encodedRequest
            },
            {
                faicon:'fas fa-globe',
                class:'me-2 text-light',
                label:'Sites',
                href:'/app/sites.html?request='+encodedRequest
            },
            {
                faicon:'fas fa-hdd',
                class:'me-2 text-light',
                label:'Data Store',
                href:'/app/datastores.html?request='+encodedRequest
            },
            {
                faicon:'fas fa-envelope',
                class:'me-2 text-light',
                label:'Email',
                href:'/app/emails.html?request='+encodedRequest
            },
            {
                faicon:'fas fa-table',
                class:'me-2 text-light',
                label:'Models',
                href:'/app/models.html?request='+encodedRequest
            },
            {
                faicon:'fas fa-layer-group',
                class:'me-2 text-light',
                label:'Controllers',
                href:'/app/controllers.html?request='+encodedRequest
            },
            {
                faicon: 'fas fa-cog',
                class:'me-2 text-light',
                label:'Configuration',
                href:'/app/configuration.html?request='+encodedRequest
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
                        faicon:'fas fa-power-off',
                        class:'me-2',
                        label:'Logout'
                    }
                ]
            }
        ]
    ];
}


// menu array
let rootnav = [
    [
        {
            faicon:'fas fa-rocket',
            class:'me-2 text-light',
            label: 'Applications',
            href: '/app/'
        },
        {
            faicon:'fab fa-aws',
            class:'me-2 text-light',
            label: 'AWS Keys',
            href: '/app/aws.html'
        },
        {
            faicon:'fas fa-key',
            class:'me-2 text-light',
            label: 'API Keys',
            href: '/app/keys.html'
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
                    faicon:'fas fa-power-off',
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
                    faicon:'fas fa-power-off',
                    class:'me-2',
                    label:'Logout'
                }
            ]
        }
    ]
]

let subnavPage = [
    {
        faicon:'fas fa-code',
        label:'Page',
        selector:'#Page'
    },
    {
        faicon:'fab fa-js',
        label:'JavaScript',
        selector:'#JavaScript'
    },
    {
        faicon:'fab fa-css3',
        label:'Stylesheet',
        selector:'#Stylesheet'
    },
    {
        faicon:'fas fa-scroll',
        label:'Custom Includes',
        selector:'#Scripts'
    },
    {
        faicon:'fas fa-wrench',
        label:'Settings',
        selector:'#Settings'
    },
];

let subnavSite = [
    {
        faicon:'fas fa-sitemap',
        label:'Pages',
        selector:'#Pages'
    },
    {
        faicon:'fas fa-scroll',
        label:'Scripts',
        selector:'#Scripts'
    },
    {
        faicon:'fas fa-book',
        label:'Library',
        selector:'#Library'
    },
    {
        faicon:'fas fa-photo-video',
        label:'Media',
        selector:'#Media'
    },
    {
        faicon:'fas fa-compass',
        label:'Navigation',
        selector:'#Navigation'
    },
    {
        faicon:'fas fa-bars',
        label:'Side Menu',
        selector:'#SideNav'
    },
    {
        faicon:'fas fa-puzzle-piece',
        label:'Sections',
        selector:'#Sections'
    },
    {
        faicon:'fas fa-at',
        label:'Domains',
        selector:'#Domains'
    },
    {
        faicon:'fas fa-wrench',
        label:'Settings',
        selector:'#Settings'
    },
];
