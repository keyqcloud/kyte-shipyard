## 1.2.5

* Remove local copy of monaco editor
* Reorganize package folder

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