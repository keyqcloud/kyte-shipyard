# Pages & Sites Guide

Learn how to build and manage websites using Kyte Shipyard's visual page builders and editors.

## Table of Contents

1. [Understanding Sites and Pages](#understanding-sites-and-pages)
2. [Creating a Site](#creating-a-site)
3. [Page Creation Methods](#page-creation-methods)
4. [Using the Page Wizard](#using-the-page-wizard)
5. [Using the Block Editor](#using-the-block-editor)
6. [Using the Code Editor](#using-the-code-editor)
7. [Navigation Menus](#navigation-menus)
8. [Media Management](#media-management)
9. [Scripts and Libraries](#scripts-and-libraries)
10. [Publishing Your Site](#publishing-your-site)
11. [Version Control](#version-control)
12. [Domain Management](#domain-management)
13. [Best Practices](#best-practices)

---

## Understanding Sites and Pages

### What is a Site?

A **site** is a collection of related web pages that make up a complete website. Examples:

- **Public Website**: Your main www.example.com site
- **Admin Dashboard**: An internal management interface
- **Landing Page**: A marketing or promotional page

### What is a Page?

A **page** is a single HTML document in your site. Each page:

- Has a unique URL path (e.g., `/index.html`, `/about.html`)
- Can display data from your models
- Can include forms that submit to your API
- Can use custom components and scripts
- Can be connected to navigation menus

### Site Structure Example

```
Site: "My Blog"
├── index.html (Homepage)
├── about.html (About page)
├── blog.html (Blog list)
├── post.html (Individual post)
└── contact.html (Contact form)
```

---

## Creating a Site

### Step 1: Navigate to Sites

1. Log in to Kyte Shipyard
2. Click **Sites** from the top navigation
3. Select your application

### Step 2: Click "Add Site"

Click the **+ Add Site** button.

### Step 3: Fill in Site Details

**Name:** `My Blog`
- The display name for your site

**Description:** `Public-facing blog website`
- Optional description

**CloudFront Domain:** `myblog.example.com`
- Where your site will be hosted
- This is typically an S3 + CloudFront URL
- Contact your administrator if unsure

**Application:** Select your application
- Which application this site belongs to

### Step 4: Create

Click **Create Site**.

Your site is created! Now you can add pages.

---

## Page Creation Methods

Kyte Shipyard offers three ways to create pages:

### 1. Page Wizard (Recommended for Beginners)

**Best for:**
- Quick page creation
- Common page types (lists, forms, detail pages)
- Beginners who want guided setup

**Features:**
- Step-by-step wizard
- Visual form builder
- Automatic code generation
- Pre-built templates

### 2. Block Editor

**Best for:**
- Component-based design
- Reusing page sections
- Medium complexity pages

**Features:**
- Drag-and-drop components
- Visual layout
- Reusable blocks
- Some code editing

### 3. Code Editor (Most Control)

**Best for:**
- Advanced customization
- Complex layouts
- Experienced developers

**Features:**
- Direct HTML/CSS/JS editing
- Monaco code editor (VS Code style)
- Full control
- Syntax highlighting

**Choose based on your needs:**
- New to web development? → **Page Wizard**
- Want visual editing? → **Block Editor**
- Need full control? → **Code Editor**

---

## Using the Page Wizard

The Page Wizard guides you through creating common page types.

### Step 1: Start the Wizard

1. Go to your site details
2. Click **Add Page** or **Page Wizard**
3. The wizard opens

### Step 2: Choose Page Type

Select from:

**Table Page**: Display a list of records
- Example: Blog post list, product catalog
- Shows data in a table or grid
- Includes search and pagination

**Form Page**: Create a data entry form
- Example: Contact form, registration form
- Collects user input
- Submits to your API

**Detail Page**: Show a single record
- Example: Blog post detail, product page
- Displays full information about one item
- Gets ID from URL parameter

**Custom Page**: Blank page
- Start from scratch
- Full customization

### Step 3: Configure Page Settings

**Page Title:** `Blog Posts`
- Display title for the page

**Page Path:** `blog.html`
- URL path (e.g., `https://yoursite.com/blog.html`)
- Must end with `.html`
- Use lowercase, no spaces

**Model:** Select `BlogPost`
- Which model to display data from
- Only for table/form/detail pages

**Navigation:** Optional
- Add this page to a navigation menu

### Step 4: Configure Page Features

Depending on page type, you'll configure:

**For Table Pages:**
- Which fields to display
- Search functionality
- Click action (link to detail page)
- Pagination settings

**For Form Pages:**
- Which fields to include
- Required fields
- Success message
- Redirect after submission

**For Detail Pages:**
- Which fields to display
- Layout template
- Related data to include

### Step 5: Review and Create

The wizard shows a preview. Click **Create Page** to finish.

The page is generated with all the HTML, CSS, and JavaScript needed!

### Example: Creating a Blog List Page

**Settings:**
- Type: Table Page
- Title: "Our Blog"
- Path: blog.html
- Model: BlogPost

**Table Configuration:**
- Display fields: title, excerpt, created_at
- Enable search: Yes
- Click action: Go to post.html (detail page)
- Per page: 10

**Result**: A fully functional blog list page with search and pagination!

---

## Using the Block Editor

The Block Editor lets you build pages using reusable components.

### Opening the Block Editor

1. Go to your site
2. Click on a page or create a new one
3. Click **Block Editor** button

### The Block Editor Interface

**Left Sidebar**: Available blocks
- **Components**: Reusable UI elements
- **Sections**: Page sections (header, footer, etc.)
- **Custom Blocks**: Your custom components

**Center Canvas**: Page preview
- See how your page looks
- Click blocks to select them
- Drag to reorder

**Right Sidebar**: Block settings
- Configure selected block
- Edit content
- Style options

### Adding Blocks

1. Drag a block from the left sidebar
2. Drop it on the canvas
3. Click the block to configure it
4. Edit content in right sidebar

### Block Types

**Layout Blocks:**
- Container: Wraps content
- Row: Horizontal layout
- Column: Vertical layout
- Divider: Visual separator

**Content Blocks:**
- Heading: Page titles
- Text: Paragraphs
- Image: Pictures
- Button: Call-to-action buttons
- List: Bullet/numbered lists

**Data Blocks:**
- Table: Display model data
- Form: Data entry forms
- Detail: Show single record

**Custom Blocks:**
- Your reusable components from the Components section

### Configuring Blocks

Each block has settings:

**Content:**
- Text, images, data sources

**Style:**
- Colors, fonts, spacing
- CSS classes

**Behavior:**
- Click actions
- Links
- Conditions (show/hide based on data)

### Saving

Click **Save** to save your changes.

Your page is updated but not yet published (see [Publishing](#publishing-your-site)).

---

## Using the Code Editor

The Code Editor gives you complete control over HTML, CSS, and JavaScript.

### Opening the Code Editor

1. Go to your site
2. Click on a page
3. Click **Code Editor** button

### The Code Editor Interface

**Left Sidebar**: Page sections
- HTML
- CSS
- JavaScript
- Settings

**Center**: Monaco Editor
- Syntax highlighting
- Auto-completion
- Error detection
- Keyboard shortcuts (Ctrl+S to save)

**Right Panel**: Preview (optional)
- Live preview of your page
- Updates as you type

### Editing HTML

Click the **HTML** section:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
    <h1>Hello World</h1>
    <p>This is my page.</p>

    <script src="https://cdn.keyqcloud.com/kyte/js/stable/kyte.js"></script>
    <script src="/assets/js/myscript.js"></script>
</body>
</html>
```

### Editing CSS

Click the **CSS** section:

```css
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}

h1 {
    color: #333;
    font-size: 2rem;
}
```

### Editing JavaScript

Click the **JavaScript** section:

```javascript
// Load blog posts
document.addEventListener('DOMContentLoaded', function() {
    var _ks = new Kyte(endpoint, publickey, identifier, account);
    _ks.init();

    _ks.get('BlogPost', null, null, [], function(response) {
        displayPosts(response.data);
    });
});

function displayPosts(posts) {
    var container = document.getElementById('posts');
    posts.forEach(function(post) {
        var html = '<div class="post">';
        html += '<h2>' + post.title + '</h2>';
        html += '<p>' + post.excerpt + '</p>';
        html += '</div>';
        container.innerHTML += html;
    });
}
```

### Using Kyte.js in Your Pages

All pages can use Kyte.js to interact with your API:

```javascript
// Initialize Kyte
var _ks = new Kyte(endpoint, publickey, identifier, account);
_ks.init();

// Fetch data
_ks.get('Model', 'field', 'value', [], function(response) {
    console.log(response.data);
});

// Submit form
_ks.post('Model', formData, function(response) {
    if (response.success) {
        alert('Success!');
    }
});
```

### Keyboard Shortcuts

- **Ctrl+S** / **Cmd+S**: Save
- **Ctrl+F** / **Cmd+F**: Find
- **Ctrl+H** / **Cmd+H**: Find and replace
- **Ctrl+/**: Comment/uncomment
- **Alt+Up/Down**: Move line up/down

### Saving

Click **Save** or press **Ctrl+S** to save changes.

---

## Navigation Menus

Navigation menus help users navigate your site.

### Creating a Navigation Menu

1. Go to your site details
2. Click **Navigation** tab
3. Click **Add Navigation**

**Name:** `Main Menu`

**Type:** Header / Footer / Sidebar

### Adding Menu Items

Click **Add Item** to add links:

**Label:** `Home`
**Link:** `/index.html` or select a page
**Icon:** Optional Font Awesome icon (e.g., `fa-home`)
**Order:** Display order (1, 2, 3...)

### Dropdown Menus

Create nested menus:

1. Add a parent item: "Products"
2. Add child items with parent set to "Products"
   - "Product A"
   - "Product B"

Result:
```
Products ▼
├── Product A
└── Product B
```

### Using Navigation on Pages

In your page, add:

```html
<div id="main-navigation"></div>

<script>
// Navigation is automatically included if you selected it in page settings
</script>
```

Or manually load:

```javascript
_ks.get('Navigation', 'id', NAVIGATION_ID, [], function(response) {
    renderNavigation(response.data[0]);
});
```

---

## Media Management

Manage images and files for your site.

### Uploading Media

1. Go to your site details
2. Click **Media** tab
3. Click **Upload** button
4. Select files from your computer

Files are uploaded to your S3 bucket.

### Using Media in Pages

After uploading, you get a URL:

```
https://yourdomain.cloudfront.net/media/logo.png
```

Use in your HTML:

```html
<img src="https://yourdomain.cloudfront.net/media/logo.png" alt="Logo">
```

Or dynamically:

```javascript
var imageUrl = site.cfMediaDomain + '/media/logo.png';
document.getElementById('logo').src = imageUrl;
```

### Media Types

Supported file types:
- **Images**: JPG, PNG, GIF, SVG, WebP
- **Documents**: PDF
- **Videos**: MP4, WebM
- **Other**: Any file type

### Organizing Media

Create folders to organize:
- `/media/images/`
- `/media/documents/`
- `/media/videos/`

---

## Scripts and Libraries

Add custom JavaScript and CSS to your site.

### Global vs. Page-Specific

**Global Scripts**: Loaded on all pages
- Site-wide styles
- Common functionality
- Analytics tracking

**Page-Specific Scripts**: Loaded on one page only
- Page-unique functionality
- Reduces load time

### Adding a Global Script

1. Go to your site details
2. Click **Scripts** tab
3. Click **Add Script**

**Name:** `Custom Styles`
**Type:** CSS / JavaScript
**File Name:** `custom.css`
**Include All Pages:** Yes

Click **Edit** to write your code:

```css
/* Custom site-wide styles */
body {
    font-family: 'Open Sans', sans-serif;
}

.btn-primary {
    background-color: #0066cc;
}
```

### Adding a Page-Specific Script

Same process but:
- **Include All Pages:** No
- Assign to specific pages in page settings

### External Libraries

Add external libraries (CDN):

1. Click **Add Library**
2. **Name:** `jQuery`
3. **Type:** JavaScript
4. **CDN URL:** `https://code.jquery.com/jquery-3.5.1.min.js`
5. **Include All Pages:** Yes / No

Libraries are loaded before your custom scripts.

### Script Order

Scripts load in this order:
1. External libraries (CDN)
2. Global custom scripts
3. Page-specific scripts

---

## Publishing Your Site

Publishing deploys your site to production.

### What Happens When You Publish?

1. **Pages are generated**: HTML/CSS/JS compiled
2. **Files uploaded to S3**: All pages and assets
3. **CloudFront cache cleared**: Changes go live immediately
4. **Version created**: Snapshot saved for rollback

### Publishing Process

1. Go to your site details
2. Review pages (make sure all are ready)
3. Click **Publish** button
4. Add optional **Change Summary**: "Added new blog page"
5. Click **Confirm Publish**

Publishing typically takes 30-60 seconds.

### What Gets Published?

- ✅ All pages in the site
- ✅ Custom scripts and CSS
- ✅ Navigation menus
- ✅ Configuration settings
- ✅ Media files (if changed)

### Testing Before Publishing

**Preview mode**: Some systems offer preview URLs to test before publishing.

**Staging site**: Create a separate site for testing:
- `staging.example.com` (test here)
- `www.example.com` (publish when ready)

---

## Version Control

Track changes and restore previous versions.

### Page Versions

Every time you save a page, a version is created.

### Viewing Versions

1. Go to page details
2. Click **Versions** or **History**

You'll see:
- Version number
- Date/time
- User who made changes
- Change summary

### Comparing Versions

Click **Compare** to see differences:

```diff
- <h1>Old Title</h1>
+ <h1>New Title</h1>
```

### Restoring a Version

1. Select version to restore
2. Click **Restore**
3. Confirm

The page reverts to that version.

**Note**: Restoring creates a new version (doesn't delete history).

---

## Domain Management

Configure custom domains for your site.

### Adding a Domain

1. Go to site settings
2. Click **Domains** tab
3. Click **Add Domain**

**Domain:** `www.example.com`
**Type:** Primary / Alias
**SSL Certificate:** Select certificate (if configured)

### Domain Types

**Primary**: Main domain for your site
**Alias**: Alternative domain (redirects to primary)

Example:
- Primary: `www.example.com`
- Alias: `example.com` (redirects to www)

### DNS Configuration

After adding domain, configure DNS:

**CNAME Record:**
```
www.example.com  →  your-cloudfront-domain.cloudfront.net
```

Contact your DNS provider or administrator.

### SSL/HTTPS

SSL certificates must be configured in AWS:
- Certificate Manager (ACM)
- Associated with CloudFront distribution

See [Configuration Guide](09-configuration-and-settings.md) for AWS setup.

---

## Best Practices

### Page Design

✅ **DO:**
- Use semantic HTML (`<header>`, `<main>`, `<footer>`)
- Keep pages focused (one purpose per page)
- Make pages mobile-responsive
- Use consistent navigation
- Optimize images (compress before uploading)

❌ **DON'T:**
- Use inline styles everywhere (use CSS)
- Create overly complex pages
- Forget alt text on images
- Hard-code data (use API calls)

### Performance

✅ **DO:**
- Minify CSS and JavaScript
- Use CDN for libraries
- Lazy-load images
- Limit global scripts
- Cache API responses

❌ **DON'T:**
- Load huge libraries for small features
- Include unused scripts
- Make unnecessary API calls
- Forget to compress images

### SEO

✅ **DO:**
- Use descriptive page titles
- Add meta descriptions
- Use heading hierarchy (h1, h2, h3)
- Include alt text on images
- Use semantic URLs (/blog/my-post, not /page?id=123)

❌ **DON'T:**
- Use generic titles ("Page 1")
- Forget meta tags
- Use non-descriptive URLs

### Maintenance

✅ **DO:**
- Add change summaries when publishing
- Test before publishing
- Use version control
- Keep backups
- Document custom code

❌ **DON'T:**
- Publish without testing
- Make changes directly in production
- Forget to document

---

## Troubleshooting Publishing

### Problem: "Publish failed"

**Causes:**
- AWS credentials not configured
- S3 bucket permissions issue
- Network error

**Solutions:**
- Check AWS keys in Settings
- Verify S3 bucket exists and is accessible
- Check CloudFront distribution
- Contact administrator

### Problem: "Changes not appearing"

**Causes:**
- CloudFront cache not cleared
- Browser cache
- Wrong URL

**Solutions:**
- Wait 5-10 minutes for cache to clear
- Hard refresh browser: Ctrl+Shift+R
- Verify correct URL
- Invalidate CloudFront cache manually

### Problem: "Page shows 404"

**Causes:**
- Page not published
- Wrong path
- S3 configuration issue

**Solutions:**
- Make sure page is published
- Check page path spelling
- Verify S3 bucket is configured for website hosting

---

## Summary

You now know how to:

- ✅ Create sites and pages
- ✅ Use the Page Wizard, Block Editor, and Code Editor
- ✅ Create navigation menus
- ✅ Manage media files
- ✅ Add custom scripts
- ✅ Publish your site
- ✅ Use version control
- ✅ Configure domains

**Next**: Learn how to create email templates! →

---

[← Back: Controllers Guide](04-controllers.md) | [Documentation Home](README.md) | [Next: Email Templates Guide →](06-email-templates.md)
