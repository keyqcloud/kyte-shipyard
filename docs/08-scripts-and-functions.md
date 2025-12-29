# Scripts & Functions Guide

Learn how to add custom JavaScript, CSS, and PHP functions to extend your application.

## Table of Contents

1. [Understanding Scripts](#understanding-scripts)
2. [Creating Custom Scripts](#creating-custom-scripts)
3. [Global vs. Page-Specific Scripts](#global-vs-page-specific-scripts)
4. [Script Version Control](#script-version-control)
5. [External Libraries](#external-libraries)
6. [Custom PHP Functions](#custom-php-functions)
7. [Function Version Control](#function-version-control)
8. [Best Practices](#best-practices)
9. [Common Examples](#common-examples)

---

## Understanding Scripts

**Scripts** are custom JavaScript and CSS files that add functionality and styling to your pages.

### Types of Scripts

**JavaScript Scripts:**
- Add interactivity
- Process data
- Make API calls
- Manipulate the DOM

**CSS Stylesheets:**
- Custom styles
- Theme overrides
- Responsive design
- Animations

### Global vs. Page-Specific

**Global Scripts**: Loaded on every page
- Site-wide functionality
- Common styles
- Analytics tracking

**Page-Specific Scripts**: Loaded on specific pages only
- Page-unique features
- Reduces load time
- Better performance

---

## Creating Custom Scripts

### Step 1: Navigate to Scripts

From your site details page:
1. Click **Scripts** tab in the sidebar
2. Click **Add Script** button

### Step 2: Fill in Script Details

**Name:** `CustomValidation`
- Internal name for the script

**File Name:** `validation.js`
- Actual file name (will be served as this)
- Use `.js` for JavaScript, `.css` for CSS

**Script Type:** JavaScript / CSS
- Choose based on content

**Include All Pages:** Yes / No
- Global (all pages) or page-specific

**Description:** `Form validation utilities`
- Optional description

### Step 3: Write Your Code

Click **Edit** or open the script editor.

**For JavaScript:**

```javascript
// Custom form validation
function validateEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateForm(formId) {
    var form = document.getElementById(formId);
    var email = form.querySelector('input[type="email"]').value;

    if (!validateEmail(email)) {
        alert('Please enter a valid email address');
        return false;
    }

    return true;
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Custom validation loaded');
});
```

**For CSS:**

```css
/* Custom site styles */
:root {
    --primary-color: #0066cc;
    --secondary-color: #00cc66;
    --font-family: 'Inter', sans-serif;
}

body {
    font-family: var(--font-family);
    color: #333;
    line-height: 1.6;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.btn-primary:hover {
    background-color: #0052a3;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}
```

### Step 4: Save

Click **Save** or press **Ctrl+S**.

The script is saved and version controlled.

---

## Global vs. Page-Specific Scripts

### Global Scripts

**When to use:**
- Functionality needed on all pages
- Site-wide styles
- Analytics, tracking
- Common utilities

**Example: Site-wide styles**

```css
/* global-styles.css - Include All Pages: Yes */
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
}

.header, .footer {
    background-color: #333;
    color: white;
    padding: 20px;
}
```

**Example: Analytics tracking**

```javascript
// analytics.js - Include All Pages: Yes
(function() {
    // Google Analytics
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');

    // Track page views
    console.log('Page view tracked:', window.location.pathname);
})();
```

### Page-Specific Scripts

**When to use:**
- Feature unique to one page
- Reduce load time
- Page-specific functionality

**Example: Blog page script**

```javascript
// blog-functionality.js - Include All Pages: No
// Only assigned to blog.html

document.addEventListener('DOMContentLoaded', function() {
    loadBlogPosts();
    setupSearch();
    setupPagination();
});

function loadBlogPosts() {
    _ks.get('BlogPost', null, null, [], function(response) {
        displayPosts(response.data);
    });
}

function setupSearch() {
    var searchInput = document.getElementById('search');
    searchInput.addEventListener('input', function() {
        filterPosts(this.value);
    });
}
```

### Assigning Scripts to Pages

1. Go to page details
2. Click **Scripts** tab
3. Select scripts to include on this page
4. Save

Or in page settings:
- **Global Scripts**: Auto-included
- **Additional Scripts**: Select from dropdown

---

## Script Version Control

Every time you save a script, a version is created.

### Why Version Control?

- Track changes over time
- Restore if something breaks
- Collaborate with team
- Audit changes

### Viewing Versions

1. Go to your script
2. Click **Versions** or **History** button
3. See list of versions with:
   - Version number
   - Date/time
   - Change summary (if provided)

### Comparing Versions

Click **Compare** to see differences:

```diff
  function validateEmail(email) {
-     var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+     var re = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      return re.test(email);
  }
```

### Restoring a Version

1. Select version to restore
2. Click **Restore**
3. Confirm restoration

Script reverts to that version (creates new version, doesn't delete history).

### Adding Change Summaries

When saving, add a summary:

**Change Summary:** `Fixed email validation regex`

This helps track what changed and why.

---

## External Libraries

Add third-party libraries from CDN.

### Adding a Library

1. Go to site scripts
2. Click **Add Library**
3. Fill in details:

**Name:** `Chart.js`
**Type:** JavaScript
**CDN URL:** `https://cdn.jsdelivr.net/npm/chart.js`
**Include All Pages:** Yes / No

### Common Libraries

**jQuery:**
```
https://code.jquery.com/jquery-3.6.0.min.js
```

**Bootstrap:**
```
CSS: https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css
JS: https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js
```

**Chart.js:**
```
https://cdn.jsdelivr.net/npm/chart.js
```

**Moment.js:**
```
https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js
```

**Font Awesome:**
```
https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css
```

### Load Order

Libraries and scripts load in this order:
1. External libraries (CDN)
2. Global custom scripts
3. Page-specific scripts

This ensures dependencies are loaded first.

---

## Custom PHP Functions

Create reusable PHP functions that can be used across controllers.

### What are Custom Functions?

Custom functions are PHP utilities that:
- Can be called from any controller
- Perform common tasks
- Keep code DRY (Don't Repeat Yourself)
- Are version controlled

### Creating a Function

1. Go to site or application details
2. Click **Functions** tab
3. Click **Add Function**

**Function Name:** `sendNotificationEmail`

**Description:** `Sends notification emails to users`

**Function Code:**

```php
function sendNotificationEmail($userId, $subject, $message) {
    // Get user
    $userModel = new \Kyte\Core\ModelObject(constant('User'));
    $userModel->retrieve('id', $userId);
    $user = $userModel->get();

    if (!$user) {
        return false;
    }

    // Send email
    $email = new \Kyte\Core\Email();
    $email->setTemplate('Notification');
    $email->setRecipient($user['email']);
    $email->setVariables([
        'user_name' => $user['name'],
        'subject' => $subject,
        'message' => $message
    ]);

    return $email->send();
}
```

### Using Custom Functions in Controllers

Call your function from any controller:

```php
protected function hook_create($data) {
    // Create record
    // ... creation code ...

    // Send notification
    sendNotificationEmail($data['user_id'], 'New Record Created', 'Your record was created successfully.');

    return $data;
}
```

### Function Parameters

Functions can accept parameters:

```php
function calculateDiscount($originalPrice, $discountPercent) {
    $discount = ($originalPrice * $discountPercent) / 100;
    $finalPrice = $originalPrice - $discount;

    return [
        'original_price' => $originalPrice,
        'discount' => $discount,
        'final_price' => $finalPrice
    ];
}
```

Use in controller:

```php
$result = calculateDiscount(100, 20);
// Returns: ['original_price' => 100, 'discount' => 20, 'final_price' => 80]
```

---

## Function Version Control

Like scripts, custom functions are version controlled.

### Saving Versions

Each save creates a version:

1. Make changes to function
2. Add change summary: `Added error handling`
3. Click **Save**

### Viewing Function Versions

1. Go to function details
2. Click **Versions**
3. See version history

### Restoring Function Versions

Same as scripts:
1. Select version
2. Click **Restore**
3. Confirm

---

## Best Practices

### JavaScript Scripts

✅ **DO:**
- Use strict mode: `'use strict';`
- Use const/let instead of var
- Add comments for complex code
- Handle errors gracefully
- Use addEventListener (not inline onclick)

❌ **DON'T:**
- Pollute global namespace
- Use eval() or with()
- Block the main thread
- Forget to clean up event listeners
- Hard-code API endpoints

### CSS Stylesheets

✅ **DO:**
- Use CSS variables for theming
- Keep selectors specific but not overly complex
- Use BEM or similar naming convention
- Make styles responsive
- Comment sections

❌ **DON'T:**
- Use !important everywhere
- Over-nest selectors (>3 levels)
- Use inline styles
- Forget mobile styles
- Use fixed widths for everything

### PHP Functions

✅ **DO:**
- Validate input parameters
- Handle errors with try-catch
- Return meaningful values
- Add PHPDoc comments
- Keep functions focused (single purpose)

❌ **DON'T:**
- Modify global state
- Ignore error handling
- Create overly complex functions
- Forget to validate data
- Use deprecated PHP functions

### Organization

✅ **DO:**
- Group related functions
- Use descriptive names
- Add version notes
- Test before publishing
- Document dependencies

❌ **DON'T:**
- Create duplicate functions
- Use cryptic names
- Skip testing
- Forget to document
- Mix concerns (CSS in JS, etc.)

---

## Common Examples

### Example 1: Form Validation Script

```javascript
// form-validation.js

const FormValidator = {
    rules: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[\d\s\-\+\(\)]+$/,
        url: /^https?:\/\/.+/
    },

    validate: function(formId) {
        const form = document.getElementById(formId);
        const inputs = form.querySelectorAll('[data-validate]');
        let isValid = true;

        inputs.forEach(input => {
            const rule = input.dataset.validate;
            const value = input.value.trim();

            if (input.hasAttribute('required') && !value) {
                this.showError(input, 'This field is required');
                isValid = false;
            } else if (value && this.rules[rule] && !this.rules[rule].test(value)) {
                this.showError(input, `Invalid ${rule} format`);
                isValid = false;
            } else {
                this.clearError(input);
            }
        });

        return isValid;
    },

    showError: function(input, message) {
        const error = input.parentElement.querySelector('.error-message');
        if (error) {
            error.textContent = message;
        } else {
            const div = document.createElement('div');
            div.className = 'error-message';
            div.textContent = message;
            input.parentElement.appendChild(div);
        }
        input.classList.add('error');
    },

    clearError: function(input) {
        const error = input.parentElement.querySelector('.error-message');
        if (error) {
            error.remove();
        }
        input.classList.remove('error');
    }
};

// Usage: <form id="myForm" onsubmit="return FormValidator.validate('myForm')">
```

### Example 2: Loading Spinner CSS

```css
/* loading-spinner.css */

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Usage: <div class="loading-overlay"><div class="spinner"></div></div> */
```

### Example 3: Date Formatting Function

```php
// formatDate - Custom PHP Function

function formatDate($dateString, $format = 'F j, Y') {
    if (!$dateString) {
        return '';
    }

    try {
        $date = new DateTime($dateString);
        return $date->format($format);
    } catch (Exception $e) {
        error_log('Date formatting error: ' . $e->getMessage());
        return $dateString;
    }
}

// Usage in controller:
// $formattedDate = formatDate($post['created_at'], 'M d, Y'); // "Jan 15, 2024"
```

### Example 4: API Utility Script

```javascript
// api-utils.js

const API = {
    call: function(model, method, data, callback) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'block';

        _ks.call(model, method, data, function(response) {
            if (loadingEl) loadingEl.style.display = 'none';

            if (response.success) {
                callback(null, response.data);
            } else {
                callback(response.error || 'API call failed', null);
                console.error('API Error:', response);
            }
        });
    },

    get: function(model, field, value, callback) {
        this.call(model, 'get', {field: field, value: value}, callback);
    },

    post: function(model, data, callback) {
        this.call(model, 'create', data, callback);
    },

    handleError: function(error) {
        alert('An error occurred: ' + error);
        console.error(error);
    }
};

// Usage: API.get('User', 'id', 123, (err, user) => { ... });
```

---

## Summary

You now know how to:

- ✅ Create custom JavaScript and CSS scripts
- ✅ Manage global vs. page-specific scripts
- ✅ Use version control for scripts
- ✅ Add external libraries
- ✅ Create custom PHP functions
- ✅ Follow best practices

**Next**: Learn about configuration and settings! →

---

[← Back: Components & Datastores Guide](07-components-and-datastores.md) | [Documentation Home](README.md) | [Next: Configuration & Settings Guide →](09-configuration-and-settings.md)
