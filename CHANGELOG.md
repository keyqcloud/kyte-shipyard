## 1.5.1

- **Update Kyte instance variable name** Update KyteShipyard's Kyte instance variable to `_ks` for interoperabililty with future preview feature
- **Refactor `table.js`** - Refactor table definition code to make DRY.

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