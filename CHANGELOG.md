## 2.3.0

### Fix: password reset works in JWT mode (KYTE-#268)

Shipyard is **platform-level** — it initializes the Kyte client with no `applicationId` — so in JWT mode its anonymous password-reset calls could ride neither the legacy HMAC-anonymous path nor the v4.11.0 `AppContextStrategy` (which requires an `x-kyte-appid`). Result: **password reset was broken on JWT-mode Shipyard** (the request failed closed before ever reaching the server).

`reset.js` and `password.js` now call the dedicated kyte-php endpoints when in JWT mode (`_ks.authMode === 'jwt'`), mirroring how login already works appid-less:

- request reset → `POST /jwt/password-reset` (no-reveal UX unchanged: same message whether or not the email exists)
- token check on password.html → `POST /jwt/password-validate` (invalid/expired → redirect to `/`, as before)
- set new password → `POST /jwt/password-update` (server also revokes every refresh-token session for the user)

HMAC mode keeps the existing `KytePasswordReset` model-CRUD calls untouched. **Requires kyte-php v4.11.0+** for the `/jwt/password-*` endpoints.

## 2.2.0

### Improvement: show the file path under the name in the IDE explorer

Pages and scripts in the IDE file tree now show their **path** (`s3key`) in a muted second line under the file name. Same-named files (common for pages) are now distinguishable at a glance without having to open each one. The full path is also available as a hover tooltip.

### Feature: "Republish all pages" + per-page republish result (KYTE-#181)

Pairs with kyte-php v4.8.1, which makes the republish hook fault-isolated and returns a `republish_summary`. On the app **configuration page**:

- A **"Republish all pages"** button (on the Authentication Mode card) — an explicit recovery action that re-stamps and re-deploys every published page with the current Kyte Connect code, then reports the result. Useful when an auto-republish half-completed.
- The **per-page result is now surfaced**: the auth-mode flip / kyte-connect update and the new button all read `republish_summary` and show how many pages succeeded/failed (failures are listed and logged to the console) — instead of a blind "it worked" toast.

### Feature: Publish action in the IDE (KYTE-#189)

The in-app IDE could only Save (which persists content); there was no way to publish from it. Added a **Publish** action for publishable file types (**pages** and **scripts** — the ones that deploy to S3):

- A green **rocket** button in the IDE tab bar, shown only when the active file is a page or script.
- **Ctrl+Shift+S** keyboard shortcut (Save remains Ctrl+S); added to the welcome-screen shortcut list.
- Publishing sends `state=1` alongside the content, so the backend runs its normal publish path (page → `publishPage` → S3 + CloudFront; script → `handleScriptPublication` → S3) and creates a version with the change summary. Unlike Save, Publish is allowed even when the file isn't dirty (re-deploy current content), and it persists any pending edits in the same request.

Pairs with kyte-php v4.8.1 (`block_layout` partial-save guard). The "IDE save didn't persist" issue from #189 was already fixed by kyte-php v4.8.0.

## 2.1.0

### Change: remove JavaScript obfuscation (pairs with kyte-php v4.7.0 — KYTE-#191)

Shipyard was the client-side obfuscation engine: it loaded the `javascript-obfuscator` CDN library and ran `JavaScriptObfuscator.obfuscate(...)` on customer page/script/section JS and the app `kyte_connect` string before sending the obfuscated copy to the API. Obfuscation has no real security value (client JS is readable in the browser), bloats stored content, and has had WAFs/firewalls block legitimate obfuscated JS. No customer asked for it.

This release removes obfuscation generation entirely:

- **Obfuscation engine removed** from the page code editor, block editor, script editor, section editor, and application/configuration screens. The `javascript-obfuscator` CDN `<script>` include is dropped from all 9 HTML pages that carried it.
- **Payloads now send plain source.** The `*_obfuscated` fields (`javascript_obfuscated`, `content_js_obfuscated`, `kyte_connect_obfuscated`) are still sent but as empty strings, and the `obfuscate_js` / `obfuscate_kyte_connect` flags are sent as `0`. (Sending the keys — empty — keeps kyte-php's content-save guards satisfied during mixed-version rollout; kyte-php drops the columns in a later release.)
- **UI removed:** the obfuscation toggles on the page/script/section editors and the "Kyte Connect Obfuscation" settings card (and its Save button) on the app configuration page, plus the now-unused obfuscation i18n keys across en/es/ja/ko.
- **Editor fixes:** the obfuscation field is removed from the unsaved-changes (dirty) checks in the page and script editors — left in, it would have falsely reported "unsaved changes" once the toggle was gone (`parseInt(undefined)` → `NaN`/`0` mismatch).

Pairs with kyte-php v4.7.0 (which always serves plain JS and stops versioning on obfuscated content — resolving the #188 version-bloat bug). Forward/backward compatible with either kyte-php version during rollout. Minification is unrelated and unaffected (esbuild still minifies Shipyard's own bundles).

## 2.0.1

### Bug Fix: auth_mode toggle was republishing pages with the OLD (HMAC) connect string

In 2.0.0, the auth_mode toggle on /app/configuration.html called `updateKyteConnectCode(_ks)` (which sets `republish_kyte_connect=1` on the Application — the same path the obfuscation toggle uses for backend page-republish). But it did so BEFORE regenerating `systemKyteCode` against the new app.auth_mode. Result: the server triggered republish, but with the stale HMAC-shape connect string. Operators flipped HMAC → JWT in the UI, the "republish" message said it worked, but the pages out there still embedded the HMAC `new Kyte(...)` call.

Fix: call `initializeKyteConnectComparison()` (which regenerates `systemKyteCode` from the now-updated app.auth_mode) BEFORE `updateKyteConnectCode(_ks)`. The republish now carries the correct shape.

User-visible effect: flipping the Authentication Mode toggle and clicking Save now actually republishes every page with the new connect string. No need to manually republish each page through the page editor.

## 2.0.0

### Breaking Change: default to JWT bearer authentication

Shipyard's self-auth now defaults to JWT bearer tokens (kyte-php Phase 3) instead of static HMAC credentials in `kyte-connect.js`. The kyte-api-js v2 library handles `/jwt/login`, refresh-token rotation, and bearer header attachment internally — no other call sites change. `login.js`, `isSession`, `sessionDestroy` etc. continue to use the same `_ks.*` methods.

To upgrade an existing install:

**Option A — Migrate to JWT (recommended)**

1. Ensure your kyte-php backend is v4.4.0+ with `AUTH_STRATEGY_DISPATCHER='on'` and `KYTE_JWT_SECRET` defined in config.php (128 hex chars recommended)
2. Reduce your `kyte-connect.js` to a single line:
   ```js
   let endpoint = 'https://your-kyte-api.example.com';
   ```
   No publickey / identifier / account / HMAC creds required.

**Option B — Pin to legacy HMAC**

Add `let authMode = 'hmac';` to your existing `kyte-connect.js` alongside the existing publickey / identifier / account globals. Shipyard continues exactly as before.

See `assets/js/source/kyte-connect.example.js` for a template covering both modes.

### Sensitive Flags (Phase 2.5 — merged from feature/sensitive-flag-ui)

Sensitive checkbox controls on the create forms for Controller, DataModel, and ModelAttribute. Pairs with the kyte-php three-tier `sensitive` flag enforcement (drop bodies from activity logs, gate MCP read tools, suppress AI error context). See [kyte-php v4.4.0 CHANGELOG](https://github.com/keyqcloud/kyte-php/releases/tag/v4.4.0) for the full server-side semantics.

> Sensitive toggle on *existing* records (detail/edit views) lands in a follow-up release — see Tempo card #166.

### JWT-aware page generation (Phase 3 — merged from feature/jwt-aware-page-generation)

- **Auth Mode** selector on the Application create form (hmac / jwt). The selection drives generated-page connect-string shape via `kyte-shipyard-application.js`, `kyte-shipyard-application-configuration.js`, and `kyte-shipyard-page-wizard.js`.
- Generated pages get the v2 constructor when `auth_mode='jwt'`:
  ```js
  new Kyte(endpoint, null, null, null, app_identifier, { authMode: 'jwt' })
  ```
- HMAC apps continue with the v1 four-arg constructor.
- `update-kyte-loading.py` script and the pre-login HTML pages (`index.html`, `password.html`, `reset.html`, `error.html`) gain conditional `kyte.js` loading for localhost dev vs CDN prod.

### Modernization

- **Build pipeline**: switched from `javascript-obfuscator` to `esbuild` via `npm run build`. Outputs are ~50–65% smaller than the previous obfuscated artifacts and emit source maps (`.js.map`) for prod debuggability. Obfuscation never provided real security — HMAC creds in kyte-connect.js were trivially extractable via DevTools — so the size + debug win has no security downside.
- **CI builds in-pipeline**: `.github/workflows/deploy.yml` now runs `npm ci && npm run build` on tag push. Previously assumed artifacts were already committed; that risked shipping stale builds whenever someone tagged without running release.sh locally.
- **GitHub Releases**: tag push creates a GitHub Release with notes extracted from this CHANGELOG and the kyte-shipyard.zip bundle attached.
- **`release.sh` pre-flight gates**: enforces CHANGELOG section match, KS_VERSION match, clean working tree, on `main`, in-sync with origin, tag doesn't already exist. Fixes the prior `1=` typo that silently passed all version mismatches.
- **`assets/js/*.js` artifacts removed from git**: source in `assets/js/source/` is the only tracked JS. Top-level `*.js` and `*.js.map` are produced by `npm run build` and shipped to S3 from CI. Eliminates artifact drift, oversized PR diffs, and merge conflicts on generated files.
- **`obfuscate.sh` removed**: replaced by esbuild.
- **`kyte-connect.example.js` template** added under `assets/js/source/` documenting both JWT and HMAC modes.

### Build dependency

Adds `esbuild` as a devDependency. CI uses Node 24 (matches kyte-php's release pipeline). Local dev: `npm install` once, then `npm run build` or `npm run watch`.

## 1.8.0

### New Feature: MCP Tokens & Connect AI Assistant

Surface for issuing, listing, and revoking Model Context Protocol (MCP) bearer tokens, plus a guided wizard for connecting AI assistants to a Kyte tenant. Pairs with kyte-php Phase 2 (MCP server, scope-gated tools, audit logging).

- **MCP Tokens Page** (`app/tokens.html`)
  - Top-level page (account scope) with KyteTable listing tokens by name, application, scope badges, last used, expiration, and creation time
  - "Create MCP Token" modal with name, optional application binding, scope selection (read only in v1.8.0), and expiration (24h / 7d / 30d / 90d / custom date / never)
  - One-time raw-token reveal modal with copy-to-clipboard and explicit "I have saved this token" acknowledgement
  - Revoke confirmation modal with screen-reader-friendly success toast

- **Connect AI Assistant Wizard** (2-step modal)
  - Step 1: token mint with sensible defaults (`Claude Code – YYYY-MM-DD`, 30-day expiry, read scope)
  - Step 2: three install paths — Claude Code `.mcp.json` snippet, `npx @kyte/claude-assistant` command, `.mcpb` desktop bundle download (npx and .mcpb URLs are placeholders pending package release)
  - Snippet blocks carry per-block copy buttons with aria labels

- **Navigation & Empty States**
  - Root nav and per-page top nav gain an "MCP Tokens" entry between API Keys and System Log
  - Empty state surfaces a CTA opening the Connect AI Assistant wizard for first-time users

- **i18n**
  - 83 MCP-related keys per locale across en/ja/ko/es with full parity
  - Scope identifiers (read/draft/commit) remain English (protocol-level)

- **Developer Documentation**
  - `DEV-SETUP.md` gains a "KyteTable & KyteForm gotchas" section documenting positional constructor flags (the `actionView`/`actionEdit`/`actionDelete` kebab-column auto-injection), `.modal-body` zero-padding default, and the `.modal-header` orange theme/database icon override pattern
  - Windows symlink notes added for `kyte-dev.js` (Developer Mode or hard-link fallback)

## 1.7.1

### Bug Fix: KyteTable Sort Regression

- Fixed KyteTable `init()` to handle both flat `[0, "desc"]` and nested `[[0, "desc"]]` order parameter formats
- Added `_updateSortIndicators()` call during table initialization so the default sort column indicator is visible on load
- This restores server-side sorting behavior that was lost during the recent KyteTable revamp

### Enhancement: Dashboard Activity Log Card

- Added 24-hour activity log summary card to the application dashboard
- Displays counts for creates, updates, deletes, and auth events
- Shows 5 most recent activity entries with action icons and timestamps
- Card links to full activity log page
- i18n support for all 4 languages (en, ja, ko, es)

---

## 1.7.0

### New Feature: Activity/Audit Log Viewer

Comprehensive frontend for viewing and filtering activity/audit logs tracked by kyte-php v4.1.0.

- **App-Level Activity Log** (`app/activity-log.html`)
  - KyteTable with columns: Timestamp, User, Action, Model, Status, Severity, IP
  - Filter panel: action type, severity, category, model name, date range
  - Color-coded badges for actions (POST=green, PUT=blue, DELETE=red, LOGIN=purple) and severity levels
  - Row click opens detail page in new tab
  - Scoped to current application context

- **Activity Log Detail Page** (`app/activity-log/index.html`)
  - Summary cards: Action, User, Timestamp, Status
  - Activity information table with all fields
  - User & request details table (IP, user agent, session token, URI)
  - Request data section with formatted JSON and copy button
  - Changes section (PUT only) with old/new value diff table
  - Error details section for failed requests

- **System-Level Activity Log** (`app/system-activity-log.html`)
  - Cross-application view for account administrators
  - Additional Application column for multi-app visibility
  - Same filter and badge capabilities as app-level view

- **Shared Utilities** (`kyte-shipyard-activity-log-common.js`)
  - Badge rendering functions for actions, severity, category, and response codes
  - Filter setup and condition builder
  - JSON formatting and clipboard utilities
  - Color maps for all action and severity types

- **Navigation Updates**
  - App sidebar: Added "Activity Log" item with clipboard icon after Error Log
  - Root/account nav: Added "Activity Log" link after System Log

- **i18n Translations**
  - Added activity log keys for all 4 languages (English, Japanese, Korean, Spanish)
  - Covers page titles, subtitles, filter labels, table column headers, and navigation items

## 1.6.6

### Bug Fixes:
- **Settings Page Button Styling**: Added missing `btn-modern`, `btn-modern-primary`, `btn-modern-success`, and `btn-modern-outline` CSS definitions so buttons (Update Email, Update Password, Add Administrator) render with proper styling
- **Settings Page Button Spacing**: Added missing `input-group-modern` and `password-grid` CSS layouts so buttons have proper margin from adjacent inputs and borders
- **KyteTable Action Dropdown Clipping**: Fixed action dropdown menus being clipped inside `.content-section` and `.setting-card` containers by removing `overflow: hidden` and the hover `transform` that created a containing block trapping `position: fixed` dropdowns. Added explicit `border-radius` to `.section-header` and `.setting-card-header` to preserve rounded corner appearance. This fix applies to settings, site detail, and configuration pages

## 1.6.5

- Fix some hard coded source paths for internationalization and intellisense autocomplete.

## 1.6.4

### Major Enhancements:
- **Internationalization (i18n) Support**: Added comprehensive multi-language support with 4 languages (English, Japanese, Korean, Spanish)
  - Implemented KyteI18n library for dynamic language switching
  - Translated all UI elements across Model and Controller detail pages, AWS Keys, API Keys, System Log, Dashboard, and all form modals
  - Added language persistence with localStorage
  - Fixed timing issues with async i18n initialization by introducing `KyteI18nReady` event
  - Included form modals, buttons, labels, navigation elements, table columns, and filter panels

- **Application Dashboard**: Created comprehensive dashboard for application health and metrics
  - Real-time resource counts (Models, Controllers, Pages, Sites, Functions, Cron Jobs)
  - 24-hour health metrics showing Critical, Error, and Warning counts
  - Cron job monitoring (Enabled jobs, Dead letter queue, 24h success rate)
  - Recent errors list with severity indicators and timestamps
  - Recent cron executions with status, duration, and timestamps
  - Progressive data loading - stats update as queries complete for better UX
  - Individual loading indicators per stat card with shimmer effect
  - Added Dashboard link to application sidebar navigation
  - Optimized queries to avoid memory exhaustion on large datasets

- **Monaco Editor IntelliSense for Kyte PHP**: Added intelligent code completion in function editor
  - Autocomplete for `$this->` properties (user, api, model, response, etc.)
  - Autocomplete for `$this->api->` properties (user, account, session, app, field, value, etc.)
  - Autocomplete for `$this->user->` fields (id, name, email, kyte_account, etc.)
  - ModelObject and Model method suggestions with signatures
  - Environment variable (KYTE_APP_ENV) suggestions
  - All suggestions based on actual Kyte PHP framework code (verified from source)

- **Monaco Editor IntelliSense for Kyte JavaScript**: Added intelligent code completion in page editor JavaScript tab
  - Autocomplete for Kyte API JS SDK methods (k object)
  - Method signatures with parameter documentation
  - Autocomplete for KyteTable, KyteForm, KyteNav, KyteSidenav, KyteCalendar classes
  - Constructor parameter hints with documentation
  - Property and method suggestions for all Kyte JS classes
  - Signature help shows parameter hints when typing method calls

- **Monaco Editor IntelliSense for Custom Scripts**: Added intelligent code completion in custom script editor for JavaScript files
  - Full Kyte API JS SDK autocomplete (k.get, k.post, k.put, k.delete, etc.)
  - Signature help provider for parameter hints (triggers on opening parenthesis)
  - Keyboard shortcuts: Cmd+I and Cmd+Space to manually trigger suggestions
  - Trigger character support - autocomplete opens automatically when typing "k."
  - Complete method signatures with parameter names and documentation
  - Support for all Kyte JS classes (KyteTable, KyteForm, KyteNav, etc.)

- **Function Type Documentation**: Added comprehensive documentation in function editor
  - New Documentation tab with detailed explanations of all function types
  - Code examples for hooks (hook_init, hook_auth, hook_prequery, hook_preprocess, hook_response_data, hook_process_get_response)
  - Code examples for overrides (new, update, get, delete)
  - Code examples for custom functions
  - Best practices and common patterns sections
  - Popup window feature for viewing documentation on second monitor
  - GitHub documentation links

- **Function Type Helper Modal**: Added quick reference in controller detail page
  - Question mark icon in function type dropdown
  - Popup modal with concise explanations of hooks, overrides, and custom functions
  - Proper z-index handling to appear above other modals

### UI Improvements:
- **Controller Detail Page Revamp**: Replaced KyteSidenav with Bootstrap 5 native tabs
  - Fixed navigation conflicts
  - Added sidebar info panel with function count
  - Added quick actions for adding functions
  - Improved responsive design

- **Model Detail Page Revamp**: Replaced KyteSidenav with Bootstrap 5 native tabs
  - Consistent tab navigation across pages
  - Added sidebar info panels
  - Fixed content visibility issues
  - Improved export functionality

- **Modal Improvements**:
  - Fixed z-index conflicts between modals
  - Improved close button styling with proper × symbol
  - Enhanced title bar styling with Kyte brand colors
  - Better hover effects and visual feedback

### Bug Fixes:
- Fixed modal z-index issues causing help modals to appear behind other modals
- Fixed i18n translation timing issues with form generation
- Fixed popup window button event handler conflicts
- Fixed close button missing × symbol in jQuery UI dialogs
- Improved documentation footer padding to prevent content cutoff

## 1.6.3

- Reorganize menu items

## 1.6.2

- Reoganize menu items to conserve space
- Fix add controller button not working in model details view
- Update controller model link to handle virtual cases
- Update form sytles to show hidden error message
- Improve custom scripts UI
- Fix page global scripts and libraries tables missing column headers
- Add missing include all option for scripts
- Add feature to create new functions from the controller code editor
- Add support for controller funciton version control
- Add support for custom script version control

## 1.6.1

- Add feature to allow for kyte_connect updates.
- When kyte_connect changes, or kyte_connect obfuscation preference changes, forces a page republish
- Fix issue where account number was not showing in KS settings
- Fix missing option for page div wrapper settings
- Add UI for viewing page versions
- Add feature to preview and restore to past versions
- Add feature to add change summaries when saving or publishing
- Improve library and script assignment UI by separating out global vs local
- Improve navigatio and side menu management UI
- Add back navigation and side nav settings
- Change navigation logo to dropdown that uses static media assets
- Add navigation logo preview in settings

## 1.6.0

- Major UI improvement

## 1.5.11

- Update to use custom headers for application model wrapper.

## 1.5.10

### Enhancements:
- General style changes
- Add session inspector

## 1.5.9

### Enhancements:
- Add page access column to list of pages
- Add JavaScript module toggle to page settings

### Bug Fixes:
- Added back missing Page access select option in page settings.

## 1.5.8

### Enhancements:
- Add viewer for error logs generated at the application level

## 1.5.7

### Bug Fixes:
- Resolve UI issue where footer overlapped data table navigation at the bottom of models pages.

## 1.5.6

### Bug Fixes:
- Enhance UI for models by using max width instead of container for better visibility.

## 1.5.5

### Bug Fixes:
- Resolve issue where query an s3 path resulted in a CORS error

## 1.5.4

### Enhancements:
- Add support for new MySQL types: BigInt, TinyText, MediumText, LongText, Blob, TinyBlob, MediumBlob, LongBlob
- Add language configuration for site and pages.
- Add periodic checks from site detail page when site is in creation. Refreshes and loads site details once page status is active.
- Add a spinning loader when site is being created.
- Add feature for marking custom JavaScript or JavaScript included through libraries as modules
- Add custom field for nav item ID for both side and top navs

### Bug Fixes:
- Add missing lang attribute for HTML

## 1.5.3

### Enhancements:
- **Display user last login:** Add last login column to user in admin list.

### Bug Fixes
- Fix issue where update confirmation modal did not dismiss
- Fix issue where model data was not loading

## 1.5.2

### Bug Fixes
- Fix bug that prevented retrieving URL parameters
- Fix issue where logout button wasn't working

## 1.5.1

- **Update Kyte instance variable name** Update KyteShipyard's Kyte instance variable to `_ks` for interoperabililty with future preview feature
- **Refactor `table.js`** Refactor table definition code to make DRY.
- **Remove roles from admin table** Removed role column from admin table.

## 1.5.0

### New Features
- **Side Nav Logout Item**: Introduced ability to create a logout button in the sidenav.
- **Side Nav Item Layout Customization**: Ability to change the side navigation item style.

### Enhancements:
- **User element class for logout:** Update to use element class for logout handler inline with Kyte JS and Kyte PHP changes.
- **Update dark color mode background color** Update background color for better contrast.

## 1.4.3

### Enhancements:
- **Scrollable Properties Section:** Implemented a fix to make the content inside the `#properties` div scrollable. This enhancement ensures that all content within the `#properties` div is now accessible, regardless of the amount of content it holds. The overflow issue, where content was previously cut off, has been effectively resolved.
- **Clear language on update**: add modal popup with language to instruct user to open inspector for faster updates to prevent caching.

### Bug Fixes
- Address issue where custom scripts in table were not clickable to view/edit code
- Address issue where obfuscation settings in custom script editor showed for CSS but not JS
- Address issue where login screen displays session error and redirects every 30 seconds

## 1.4.2

### New Features
- **HTML Display of Changelogs**: Integrated the [marked.js library](https://github.com/markedjs/marked) to display changelogs in HTML format, enhancing readability and allowing for more dynamic content presentation within the CMS.

## 1.4.1

### New Features
- **Web Component Management**: Introduced a robust management system for web components in the CMS, enabling administrators to add, edit, and remove web components seamlessly.
- **Component Integration on Web Pages**: Enhanced the CMS to support embedding web components into web pages, allowing users to easily incorporate dynamic web components into different site areas for enriched interactivity.

### Enhancements
- **Editor User Interface**: Significantly improved the UI of the editor, making it more intuitive and user-friendly.
- **Dynamic Sidebar**: Implemented a dynamic sidebar that automatically shows or hides based on user hover, enhancing the user experience and workspace efficiency.
- **Footer Z-Index Adjustment**: Updated the footer to have a higher z-index, resolving the issue with Monaco code preview overlaying the footer.
- **Preview Feature in Page Code Editor**: Rolled out the initial iteration of a preview feature in the page code editor, enabling users to see real-time renderings of their code.
- **Session-based Redirection**: Enhanced session management to automatically redirect users to a specified URL or the main page of the application if an active session is detected.

### Bug Fixes
- Addressed various minor bugs and performance issues to improve the overall stability and functionality of the CMS.


## 1.4.0

* Major UI/UX update.
* Updates to main navigation styles
* Addition of new project specific navigation
* Change "Application" to "Project"
* Changes to side navigation styles
* Update code editor styles
* Fix page height and scroll issue with email template editor

## 1.3.12

* Check if editor content has changed and warn user before leaving editor of unsaved changes.

## 1.3.11

* Remove URI encoding for page paths in creation wizard (identified additiona URI encodings that needed to be removed)

## 1.3.10

* Add `start.bat` the windows equivalent of `start.sh` for starting a local web server at 8000
* remove uri encoding for page creation wizard as it impacted s3 file creation.

## 1.3.9

* Add support for creating/editing/delete custom scripts (javascript and stylesheets)
* Add support for including custom scripts in pages

## 1.3.8

* Fix bug where site details was missing a trailing '/'

## 1.3.7

* Handle errors from obfuscator

## 1.3.6

* Update copyright year
* No longer open controller funcitons in a new tab
* Update SectionTemplate to KyteSectionTemplate
* Add missing codicons for monaco editor

## 1.3.5

* Resolve version issue

## 1.3.4

* Add support for managing environment variables for an application

## 1.3.3

* Fix issue with mixed content by updating CHANGELOG to https

## 1.3.2

* Add ability to check for available updates
* Fix issue with non-static page loaders
* Add code to trigger an update

## 1.3.1

* Resolve medium security issue with DOM text reinterpreted as HTML

## 1.3.0

* Previous version of kyte-connect.js may cause a conflict
* Remove local copy of monaco editor
* Reorganize package folder
* Add error checking to `kyte-shipyard.js` initialization script
* Check if `kyte-connect.js` is present
* Check if required credentials are present inside `kyte-connect.js`
* Add deployment script
* Add CodeQL
* Update login and password reset styles

## 1.2.4

* Fix for loop to populate menus in page editor

## 1.2.3

* Fix issue with incorrect tagging and version number

## 1.2.2

* Add missing module attribute for monaco script

## 1.2.1

* Update monaco to use CDN and EMA
* Display path in menu selection

## 1.2.0

* Add kyte-connect.js and kyte-connect-source.js to the gitignore
* Fix responsiveness of reset and password forms and offset logo
* Update to use KytePage and KytePageData instead of Page

## 1.1.28

* Add support for custom libraries and scripts
* Correct spelling of Sao Paulo to São Paulo
* Fix missing menu items on sub pages
* Update UX and add labels to configuration page
* Staging monaco editor version 0.44

## 1.1.27

* Fix bug where page type was not updating

## 1.1.26

* Add warning to inform user about code vs block editor compatibility issues

## 1.1.25

* Add bootstrap, fontawesome, jquery, and jquery UI support in block editor
* Ability to open block pages in code editor and vice versa

## 1.1.24

* Update page creation dropdown order

## 1.1.23

* Add editor type to page list
* Update block editor to use GrapesJS

## 1.1.22

* Ability to export data as csv, json, txt (tab delimited)
* Ability to export model as json

## 1.1.21

* Temporarily hide add, delete, edit buttons for data until we have a controller that can handle requests for app-level data

## 1.1.20

* Refactor navigation js.
* Ability to view data inside an application scope
* Add placeholder and staging for import data
* Add favicon

## 1.1.19

* Fix bug where third party api keys would not populate table
* Fix navigation icon issue

## 1.1.18

* Update obfuscate utility script to also update version code
* Add support for managing third party api keys

## 1.1.17

* Fix bug where data is not defined

## 1.1.16

* Ability to customize footer background and foreground colors

## 1.1.15

* Update 404 error page image to use compressed

## 1.1.14

* Update image to use compressed

## 1.1.13

* Add logo to login and reset pages

## 1.1.12

* Fix bug where alias link was not correctly formatted

## 1.1.11

* Fix bug where alias domain did not display for site details

## 1.1.10

* Update to display alias domain if one is set, otherwise display CF domain

## 1.1.9

* Fix bug where use container selector was never populated

## 1.1.8

* Add Kyte Shipyard logo to navbar

## 1.1.7

* Fix bug with JSON string being stringified
* Clean and reorganize code
* Refactor table defs
* Improve footer style to make narrower
* Add ability to create sections, such as footers and headers

## 1.1.6

* Change Kyte JS CDN endpoint

## 1.1.5

* Add footer to platform
* Add version number to footer

## 1.1.4

* Add ability to download page from page editor
* Obfuscate model details controller

## 1.1.3

* Resolve issue where model attribute form will not load due to async call

## 1.1.2

* Fix issue where idx was being used before being defined for FK models

## 1.1.1

* Fix issue where FK models displayed all models in Shipyard

## 1.1.0

* Application level toggle for obfuscating Kyte Connect JS
* View AWS username and public key from configuration page
* Manage AWS credentials from application

## 1.0.9

* Display page title in window
* Display date modified column

## 1.0.8

* Obfuscated code for sites so changes can be reflected

## 1.0.7

* Fix bug where path preview and actual path differed

## 1.0.6

* Add support to choose a region for a new site
* Prevent duplicated .html extension in path
* Strip / from begining of path if supplied
* Fix overlapping controls in wizard layout

## 1.0.5

* Fix issue where side navigation option in page wizard displayed main navigation
* Fix issue with undefined idx when attempting to save application level configurations
* Make function name optional
* Add password attribute to models
* Add ability to toggle div container wrapper for HTML content
* Add configuration tab for navigation for customizing appearance
* Ability to change foreground and background colors of navigation
* Ability to change foreground and background colors for navigation dropdown
* Ability to specify whether navigation should stick to top of window even when scrolling

## 1.0.4

* Add support for customizing the side navigation appearance.

## 1.0.3

* Add support for integrating Google Analytics
* Add support for integrating Google Tag Manager
* Add preference for page javascript obfuscation
* New menu item management UI that allows for reordering of navigation items

## 1.0.2

* Add support for specifing sitemap inclusion preference
* Hide sitemap preference for pages that are password protected
* Add feature to specify alias domain for site

## 1.0.1

* Add key bidnings for saving on page edits and controller edits
* Add key bindings for publishing on page edits
* Bug when new page is created and html editor doesn't auto load - issue with d-none

## 1.0.0

* Add ability to specify a user table and email/password columns for SaaS-ification
* Ability to specify a org table and org foreign key attribut for SaaS-ification

## 0.1.1

* Make side nav a seperate model from navigation

## 0.1.0

* Ability to request a new SSL cert from ACM
* Add main navigation feature with center, right and subnavs
* Update KyteJS to set app id in header
* Ability to add pages and directory structure to site
* Adding a site creates new S3 bucket and corresponding cloudfront distribution

## 0.0.1

* initial development release