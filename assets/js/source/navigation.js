// Store global Kyte instance for navigation
let _kyteGlobal = null;

// Generate Application Sidebar Navigation (Phase 2)
function generateAppSidebar(encodedRequest) {
    return {
        sections: [
            {
                title: 'Overview',
                titleKey: 'sidebar.overview',
                items: [
                    {
                        faicon: 'fas fa-tachometer-alt',
                        label: 'Dashboard',
                        labelKey: 'sidebar.dashboard',
                        href: '/app/dashboard/?request=' + encodedRequest
                    }
                ]
            },
            {
                title: 'Sites',
                titleKey: 'sidebar.sites',
                items: [
                    {
                        faicon: 'fas fa-globe',
                        label: 'Sites',
                        labelKey: 'sidebar.sites',
                        href: '/app/sites.html?request=' + encodedRequest
                    }
                ]
            },
            {
                title: 'API',
                titleKey: 'sidebar.api',
                items: [
                    {
                        faicon: 'fas fa-table',
                        label: 'Models',
                        labelKey: 'sidebar.models',
                        href: '/app/models.html?request=' + encodedRequest
                    },
                    {
                        faicon: 'fas fa-layer-group',
                        label: 'Controllers',
                        labelKey: 'sidebar.controllers',
                        href: '/app/controllers.html?request=' + encodedRequest
                    },
                    {
                        faicon: 'fas fa-clock',
                        label: 'Cron Jobs',
                        labelKey: 'sidebar.cron_jobs',
                        href: '/app/cron-jobs.html?request=' + encodedRequest
                    }
                ]
            },
            {
                title: 'Storage',
                titleKey: 'sidebar.storage',
                items: [
                    {
                        faicon: 'fas fa-hdd',
                        label: 'Datastores',
                        labelKey: 'sidebar.datastores',
                        href: '/app/datastores.html?request=' + encodedRequest
                    }
                ]
            },
            {
                title: 'Components',
                titleKey: 'sidebar.components',
                items: [
                    {
                        faicon: 'fas fa-envelope',
                        label: 'Email Templates',
                        labelKey: 'sidebar.email_templates',
                        href: '/app/emails.html?request=' + encodedRequest
                    },
                    {
                        faicon: 'fas fa-puzzle-piece',
                        label: 'Web Components',
                        labelKey: 'sidebar.web_components',
                        href: '/app/components.html?request=' + encodedRequest
                    }
                ]
            },
            {
                title: 'System',
                titleKey: 'sidebar.system',
                items: [
                    {
                        faicon: 'fas fa-key',
                        label: 'Sessions',
                        labelKey: 'sidebar.sessions',
                        href: '/app/sessions.html?request=' + encodedRequest
                    },
                    {
                        faicon: 'fas fa-bomb',
                        label: 'Error Log',
                        labelKey: 'sidebar.error_log',
                        href: '/app/log.html?request=' + encodedRequest
                    },
                    {
                        faicon: 'fas fa-clipboard-list',
                        label: 'Activity Log',
                        labelKey: 'sidebar.activity_log',
                        href: '/app/activity-log.html?request=' + encodedRequest
                    },
                    {
                        faicon: 'fas fa-robot',
                        label: 'AI Error Assistant',
                        labelKey: 'sidebar.ai_error_assistant',
                        href: '/app/ai-error-assistant.html?request=' + encodedRequest
                    },
                    {
                        faicon: 'fas fa-cog',
                        label: 'Configuration',
                        labelKey: 'sidebar.configuration',
                        href: '/app/configuration.html?request=' + encodedRequest
                    }
                ]
            }
        ]
    };
}

// Render Application Sidebar (Phase 2)
function renderAppSidebar(encodedRequest) {
    const sidebarData = generateAppSidebar(encodedRequest);
    const currentPath = window.location.pathname;

    let sidebarHTML = '<nav class="sidebar-nav">';

    sidebarData.sections.forEach(section => {
        sidebarHTML += '<div class="nav-section">';
        sidebarHTML += `<div class="nav-section-title" data-i18n="${section.titleKey}">${section.title}</div>`;

        section.items.forEach(item => {
            const isActive = currentPath.includes(item.href.split('?')[0]);
            const activeClass = isActive ? 'active' : '';

            sidebarHTML += `
                <a href="${item.href}" class="nav-link ${activeClass}">
                    <i class="${item.faicon}"></i>
                    <span data-i18n="${item.labelKey}">${item.label}</span>
                </a>
            `;
        });

        sidebarHTML += '</div>';
    });

    sidebarHTML += '</nav>';

    return sidebarHTML;
}

// Legacy function kept for backward compatibility (now deprecated)
function generateAppNav(encodedRequest) {
    return [
        [
            {
                faicon:'fas fa-globe',
                class:'me-2 text-light',
                label:'Sites',
                href:'/app/sites.html?request='+encodedRequest
            },
            {
                dropdown: true,
                faicon:'fas fa-code',
                class:'me-2 text-light',
                label:'API',
                items: [
                    {
                        faicon:'fas fa-table',
                        class:'me-2',
                        label:'Models',
                        href:'/app/models.html?request='+encodedRequest
                    },
                    {
                        faicon:'fas fa-layer-group',
                        class:'me-2',
                        label:'Controllers',
                        href:'/app/controllers.html?request='+encodedRequest
                    }
                ]
            },
            {
                faicon:'fas fa-hdd',
                class:'me-2 text-light',
                label:'Storage',
                href:'/app/datastores.html?request='+encodedRequest
            },
            {
                dropdown: true,
                faicon:'fas fa-cubes',
                class:'me-2 text-light',
                label:'Components',
                items: [
                    {
                        faicon:'fas fa-envelope',
                        class:'me-2',
                        label:'Email Templates',
                        href:'/app/emails.html?request='+encodedRequest
                    },
                    {
                        faicon:'fas fa-puzzle-piece',
                        class:'me-2',
                        label:'Web Components',
                        href:'/app/components.html?request='+encodedRequest
                    }
                ]
            }
        ],
        [
            {
                dropdown: true,
                faicon:'fas fa-tools',
                class:'me-2 text-light',
                label:'System',
                items: [
                    {
                        faicon:'fas fa-key',
                        class:'me-2',
                        label:'Sessions',
                        href:'/app/sessions.html?request='+encodedRequest
                    },
                    {
                        faicon:'fas fa-bomb',
                        class:'me-2',
                        label:'Error Log',
                        href:'/app/log.html?request='+encodedRequest
                    },
                    {
                        faicon:'fas fa-clipboard-list',
                        class:'me-2',
                        label:'Activity Log',
                        href:'/app/activity-log.html?request='+encodedRequest
                    },
                    {
                        faicon:'fas fa-robot',
                        class:'me-2',
                        label:'AI Error Assistant',
                        href:'/app/ai-error-assistant.html?request='+encodedRequest
                    },
                    {
                        faicon:'fas fa-cog',
                        class:'me-2',
                        label:'Configuration',
                        href:'/app/configuration.html?request='+encodedRequest
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
        },
        {
            faicon:'fas fa-list-alt',
            class:'me-2 text-light',
            label: 'System Log',
            href: '/app/system-log.html'
        },
        {
            faicon:'fas fa-clipboard-list',
            class:'me-2 text-light',
            label: 'Activity Log',
            href: '/app/system-activity-log.html'
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
        faicon:'fas fa-eye',
        label:'Preview',
        selector:'#Preview'
    },
    {
        faicon:'fas fa-scroll',
        label:'Custom Scripts',
        selector:'#Scripts'
    },
    {
        faicon:'fas fa-puzzle-piece',
        label:'Web Components',
        selector:'#Components'
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

// Mobile Drawer Toggle Functionality (Phase 3)
function initSidebarToggle() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupSidebarToggle);
    } else {
        setupSidebarToggle();
    }
}

function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const appSidebar = document.getElementById('app-sidebar');
    const sidenav = document.getElementById('sidenav');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (!sidebarToggle) return;

    // Toggle button click
    sidebarToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Toggle both sidebars (only one will exist on any given page)
        if (appSidebar) {
            appSidebar.classList.toggle('active');
        }
        if (sidenav) {
            sidenav.classList.toggle('active');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle('active');
        }
    });

    // Overlay click closes sidebar
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            if (appSidebar) {
                appSidebar.classList.remove('active');
            }
            if (sidenav) {
                sidenav.classList.remove('active');
            }
            sidebarOverlay.classList.remove('active');
        });
    }

    // Close sidebar when clicking links (mobile only)
    function closeSidebarOnLinkClick() {
        if (window.innerWidth <= 768) {
            if (appSidebar) {
                appSidebar.classList.remove('active');
            }
            if (sidenav) {
                sidenav.classList.remove('active');
            }
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        }
    }

    // Add click handlers to all sidebar links
    document.querySelectorAll('#app-sidebar a, #sidenav a').forEach(link => {
        link.addEventListener('click', closeSidebarOnLinkClick);
    });

    // Close sidebar on window resize if desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            if (appSidebar) {
                appSidebar.classList.remove('active');
            }
            if (sidenav) {
                sidenav.classList.remove('active');
            }
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        }
    });
}

// Initialize sidebar toggle
initSidebarToggle();

// Initialize Application Sidebar (Called from application pages)
function initAppSidebar() {
    // Wait for the page to fully load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAppSidebar);
    } else {
        loadAppSidebar();
    }
}

function loadAppSidebar() {
    const sidebarElement = document.getElementById('app-sidebar');
    if (!sidebarElement) return;

    // Get the request parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const request = urlParams.get('request');

    if (!request) {
        console.warn('No request parameter found in URL');
        return;
    }

    // Render the sidebar
    const sidebarHTML = renderAppSidebar(request);
    sidebarElement.innerHTML = sidebarHTML;

    // Translate sidebar content if KyteI18n is available
    if (window.kyteI18n) {
        window.kyteI18n.translateDOM();
    }

    // Try to get application name from the request
    try {
        const decoded = JSON.parse(atob(decodeURIComponent(request)));
        if (decoded.idx && _kyteGlobal) {
            // Fetch application details to populate app selector
            fetchApplicationName(decoded.idx, _kyteGlobal);
        }
    } catch (e) {
        console.warn('Could not decode request parameter:', e);
    }

    // Re-initialize sidebar toggle to bind to new elements
    setupSidebarToggle();
}

// Fetch and display application name in top nav
function fetchApplicationName(appId, kyteInstance) {
    const appSelectorElement = document.getElementById('app-selector');
    const appNameElement = document.getElementById('app-name');

    if (!appNameElement) return;

    // Fetch application details from API
    kyteInstance.get('Application', 'id', appId, [], (response) => {
        if (response.data && response.data.length > 0) {
            const app = response.data[0];
            appNameElement.textContent = app.name;
        } else {
            appNameElement.textContent = 'Application';
        }
    }, (error) => {
        console.error('Failed to fetch application name:', error);
        appNameElement.textContent = 'Application';
    });

    // Update the link to go back to project list
    if (appSelectorElement) {
        appSelectorElement.href = '/app/?request=' + encodeURIComponent(btoa(JSON.stringify({'model': 'Application', 'idx': appId})));
    }
}

// Initialize application name on page load for all pages
document.addEventListener('KyteInitialized', function(e) {
    const _ks = e.detail._ks;

    // Store Kyte instance globally for use by loadAppSidebar
    _kyteGlobal = _ks;

    const appNameElement = document.getElementById('app-name');

    // Only run if the app-name element exists
    if (!appNameElement) return;

    // Get the request parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const request = urlParams.get('request');

    if (request) {
        try {
            const decoded = JSON.parse(atob(decodeURIComponent(request)));
            if (decoded.idx) {
                // Fetch application name
                fetchApplicationName(decoded.idx, _ks);
            }
        } catch (e) {
            console.warn('Could not decode request parameter for app name:', e);
        }
    }
});
