# Developer Guide

This guide is for developers who want to contribute to Kyte Shipyard itself or understand its internal architecture.

## Table of Contents

1. [For Contributors](#for-contributors)
2. [Codebase Architecture](#codebase-architecture)
3. [Development Setup](#development-setup)
4. [Code Organization](#code-organization)
5. [Development Workflow](#development-workflow)
6. [Code Obfuscation](#code-obfuscation)
7. [Release Process](#release-process)
8. [Testing](#testing)
9. [Contributing Guidelines](#contributing-guidelines)
10. [Deployment Architecture](#deployment-architecture)

---

## For Contributors

Thank you for your interest in contributing to Kyte Shipyard!

### What is Kyte Shipyard?

Kyte Shipyard is the web-based admin interface for managing Kyte-PHP applications. It's built as a **static frontend** with vanilla JavaScript (no build system) that connects to a Kyte API backend.

### Who Should Read This?

- Developers contributing to Kyte Shipyard
- DevOps engineers deploying Kyte Shipyard
- Advanced users wanting to understand internals
- Anyone curious about the architecture

---

## Codebase Architecture

### Technology Stack

**Frontend:**
- **Vanilla JavaScript** (ES6+) - No frameworks
- **jQuery 3.5.1** - DOM manipulation, AJAX
- **Bootstrap 5.0.2** - UI components
- **DataTables 1.10.23** - Data tables
- **Monaco Editor 0.45.0** - Code editing (VS Code engine)
- **Font Awesome 5.12.0** - Icons

**No Build System:**
- Intentionally no webpack, vite, or bundlers
- Source files → Obfuscation → Production files
- Simpler deployment and debugging

### Directory Structure

```
/
├── index.html               # Login page
├── password.html           # Password reset
├── reset.html              # Password reset form
│
├── app/                    # Main application pages
│   ├── index.html          # Dashboard
│   ├── models.html         # Models list
│   ├── model/              # Model details
│   │   └── index.html
│   ├── controllers.html    # Controllers list
│   ├── controller/         # Controller details
│   │   └── index.html
│   ├── sites.html          # Sites list
│   ├── site/               # Site details
│   │   └── index.html
│   ├── page/               # Page editors
│   │   ├── index.html      # Code editor
│   │   ├── wizard.html     # Page wizard
│   │   └── blockeditor.html # Block editor
│   ├── script/             # Script editor
│   ├── function/           # Function editor
│   ├── dashboard/          # Dashboard
│   ├── emails.html         # Email templates list
│   ├── email/              # Email template editor
│   ├── datastores.html     # Datastores list
│   ├── datastore/          # Datastore wizard
│   ├── components.html     # Components list
│   ├── component/          # Component editor
│   ├── configuration.html  # App configuration
│   ├── settings.html       # Account settings
│   ├── aws.html            # AWS keys
│   ├── keys.html           # API keys
│   ├── log.html            # Logs
│   ├── sessions.html       # Sessions
│   └── section/            # Section management
│
├── assets/
│   ├── js/                 # Obfuscated production JS
│   ├── js/source/          # Source JS files (EDIT THESE!)
│   │   ├── kyte-shipyard.js               # Core initialization
│   │   ├── navigation.js                  # Navigation generation
│   │   ├── kyte-shipyard-*.js             # Feature modules
│   │   └── kyte-connect.js                # API credentials (create manually)
│   ├── css/                # Stylesheets
│   └── images/             # Images and assets
│
├── docs/                   # Documentation (this!)
├── kyte-php-docs/          # Backend framework docs
│
├── start.sh / start.bat    # Local dev server
├── obfuscate.sh / .bat     # Obfuscation script
├── release.sh / .bat       # Release script
├── CLAUDE.md               # AI assistant guide
└── README.md               # Project README
```

### File Naming Convention

**Pages:** `{feature}.html` or `{feature}/index.html`
- `models.html` - Models list
- `model/index.html` - Model details

**JavaScript:** `kyte-shipyard-{feature}.js` or `kyte-shipyard-{feature}-{subfeature}.js`
- `kyte-shipyard-model.js` - Models list logic
- `kyte-shipyard-model-details.js` - Model details logic
- `kyte-shipyard-page-wizard.js` - Page wizard logic

**Pattern:**
- List pages: `{features}.html` + `kyte-shipyard-{feature}.js`
- Detail pages: `{feature}/index.html` + `kyte-shipyard-{feature}-details.js`

---

## Development Setup

### Prerequisites

- **Python** 2.7+ or 3.x (for local server)
- **Node.js** and **npm** (for JavaScript obfuscator)
- **Git** (for version control)
- **Text editor** (VS Code recommended)

### Step 1: Clone Repository

```bash
git clone https://github.com/keyqcloud/kyte-shipyard.git
cd kyte-shipyard
```

### Step 2: Install JavaScript Obfuscator

```bash
npm install -g javascript-obfuscator
```

### Step 3: Create API Credentials File

Create `assets/js/source/kyte-connect.js`:

```javascript
let endpoint = 'https://api-dev.example.com';
let publickey = 'your-dev-public-key';
let identifier = 'your-dev-identifier';
let account = 'your-dev-account-number';
```

**Important:** This file is in `.gitignore` and should never be committed!

### Step 4: Start Local Server

**macOS/Linux:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

Server starts on `http://localhost:8000`.

### Step 5: Access Kyte Shipyard

Open browser to `http://localhost:8000`.

---

## Code Organization

### JavaScript Module Pattern

Each feature has its own JavaScript file that follows this pattern:

```javascript
// kyte-shipyard-feature.js

// Global variables for this feature
let featureData = [];
let currentFeature = null;

// Initialize on Kyte ready
document.addEventListener('KyteInitialized', function(e) {
    let _ks = e.detail._ks;

    if (!_ks.isSession()) {
        location.href = "/?redir=" + encodeURIComponent(window.location);
        return;
    }

    // Initialize feature
    initFeature(_ks);
});

function initFeature(_ks) {
    // Feature initialization logic
    loadFeatureData(_ks);
    setupEventHandlers();
}

function loadFeatureData(_ks) {
    _ks.get('Model', null, null, [], function(response) {
        featureData = response.data;
        renderFeature(featureData);
    });
}

function setupEventHandlers() {
    $('#addButton').click(function() {
        // Handle button click
    });
}

function renderFeature(data) {
    // Render UI
}
```

### HTML Page Structure

Each page follows this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kyte - Feature Name</title>

    <!-- Stylesheets -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.12.0/css/all.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.10.23/css/jquery.dataTables.min.css">
    <link rel="stylesheet" href="/assets/css/kyte-form.css">

    <!-- JavaScript -->
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.datatables.net/1.10.23/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.keyqcloud.com/kyte/js/stable/kyte.js"></script>

    <!-- Kyte Shipyard Scripts -->
    <script src="/assets/js/kyte-shipyard.js"></script>
    <script src="/assets/js/navigation.js"></script>
    <script src="/assets/js/kyte-shipyard-feature.js"></script>

    <!-- Page Styles -->
    <style>
        /* Page-specific styles */
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav id="application-nav"></nav>
    <nav id="mainnav"></nav>

    <!-- Main Content -->
    <div id="wrapper">
        <main>
            <!-- Page content here -->
        </main>
    </div>

    <!-- Modals -->
    <div class="modal" id="pageLoaderModal">
        <!-- Loading spinner -->
    </div>
</body>
</html>
```

### Key Files Explained

**kyte-shipyard.js**
- Core initialization
- Loads `kyte-connect.js` credentials
- Initializes Kyte API client
- Dispatches `KyteInitialized` event
- Sets version number

**navigation.js**
- Generates navigation menus
- `generateAppNav()` - Application-level navigation
- `generateSubNav()` - Feature-level navigation
- Uses `KyteNav` class for rendering

**kyte-source.js** (symlink)
- Kyte.js library (from kyte-api-js repo)
- Provides API client functionality
- Linked to local Kyte API JS repo for development

---

## Development Workflow

### Making Changes

1. **Edit source files** in `assets/js/source/`
   - Never edit files in `assets/js/` directly!

2. **Test locally**
   ```bash
   ./start.sh
   ```
   - Open browser to `http://localhost:8000`
   - Test your changes

3. **Obfuscate for testing**
   ```bash
   ./obfuscate.sh assets/js/source/your-file.js
   ```
   - Test with obfuscated code

4. **Commit changes**
   ```bash
   git add assets/js/source/your-file.js
   git add assets/js/your-file.js  # Obfuscated version
   git commit -m "Add feature: description"
   ```

### Adding a New Feature

1. **Create HTML page**
   - `app/newfeature.html` or `app/newfeature/index.html`

2. **Create JavaScript file**
   - `assets/js/source/kyte-shipyard-newfeature.js`

3. **Add navigation entry**
   - Edit `assets/js/source/navigation.js`
   - Add item to `generateAppNav()` or `generateSubNav()`

4. **Obfuscate**
   ```bash
   ./obfuscate.sh assets/js/source/kyte-shipyard-newfeature.js
   ./obfuscate.sh assets/js/source/navigation.js
   ```

5. **Test**
6. **Commit**

---

## Code Obfuscation

### Why Obfuscation?

Kyte Shipyard obfuscates JavaScript for:
- **Code protection**: Makes code harder to reverse engineer
- **Intellectual property**: Protects proprietary logic
- **Security**: Obscures API patterns and logic

**Note:** Obfuscation is NOT encryption and provides limited protection.

### Obfuscation Process

**Source files:** `assets/js/source/*.js`
**Obfuscated files:** `assets/js/*.js`

### Obfuscating Files

**All files:**
```bash
./obfuscate.sh
```

**Single file:**
```bash
./obfuscate.sh assets/js/source/filename.js
```

**With version update:**
```bash
./obfuscate.sh assets/js/source/kyte-shipyard.js 1.6.3
```

### Obfuscation Settings

Defined in `obfuscate.sh`:

```bash
javascript-obfuscator "$filename" \
    --output ${filename//source/} \
    --compact true \
    --string-array-encoding 'base64' \
    --string-array-wrappers-type variable
```

**Settings:**
- `--compact true`: Remove whitespace
- `--string-array-encoding 'base64'`: Encode strings
- `--string-array-wrappers-type variable`: Wrap string arrays

### Debugging Obfuscated Code

If issues occur after obfuscation:

1. Test with source files first
2. Check browser console for errors
3. Try obfuscating with different settings
4. Use source maps (if enabled)

---

## Release Process

### Pre-Release Checklist

Before creating a release:

- [ ] All changes tested locally
- [ ] All source files obfuscated
- [ ] CHANGELOG.md updated with version and changes
- [ ] Version in `kyte-shipyard.js` updated (line 1)
- [ ] No uncommitted changes
- [ ] Tests pass (if any)

### Version Numbering

Kyte Shipyard uses semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Example: `1.6.3`

### Creating a Release

**Automated (recommended):**

```bash
./release.sh 1.6.3
```

This script:
1. Verifies version in CHANGELOG.md matches
2. Verifies version in kyte-shipyard.js matches
3. Reobfuscates all JavaScript files
4. Commits with message "release 1.6.3"
5. Creates git tag "v1.6.3"
6. Pushes to GitHub
7. Triggers GitHub Actions deployment

**Manual:**

1. Update CHANGELOG.md:
   ```markdown
   ## 1.6.3

   - Add new feature X
   - Fix bug Y
   - Improve performance Z
   ```

2. Update version in `assets/js/source/kyte-shipyard.js`:
   ```javascript
   var KS_VERSION = '1.6.3';
   ```

3. Reobfuscate all files:
   ```bash
   ./obfuscate.sh
   ```

4. Commit and tag:
   ```bash
   git add .
   git commit -m "release 1.6.3"
   git tag v1.6.3
   git push
   git push --tags
   ```

### GitHub Actions Deployment

When you push a tag, GitHub Actions automatically:

1. Packages files (HTML, app/, assets/)
2. Excludes source JS files
3. Uploads to S3: `s3://{bucket}/kyte/shipyard/stable/kyte-shipyard.zip`
4. Uploads to archive: `s3://{bucket}/kyte/shipyard/archive/kyte-shipyard-1.6.3.zip`
5. Uploads CHANGELOG.md
6. Invalidates CloudFront cache

See `.github/workflows/deploy.yml` for details.

---

## Testing

### Manual Testing

Currently, Kyte Shipyard relies on manual testing:

1. **Feature testing**: Test each feature you change
2. **Regression testing**: Test related features
3. **Browser testing**: Test in Chrome, Firefox, Safari
4. **Mobile testing**: Test responsive design

### Testing Checklist

For each change:

- [ ] Feature works as expected
- [ ] No console errors
- [ ] No network errors (check Network tab)
- [ ] Works on mobile
- [ ] Obfuscated version works
- [ ] No broken links or images

### Future: Automated Testing

Consider adding:
- Unit tests (Jest)
- Integration tests (Cypress, Playwright)
- Visual regression tests

---

## Contributing Guidelines

### Code Style

**JavaScript:**
- Use ES6+ features (const, let, arrow functions)
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

**Example:**

```javascript
// Good
const activeUsers = users.filter(user => user.status === 'active');

// Avoid
var x = users.filter(u => u.status === 'active');
```

**HTML:**
- Use semantic HTML
- Proper indentation (4 spaces)
- Add comments for sections

**CSS:**
- Use classes, not IDs for styling
- Follow BEM or similar methodology
- Group related styles

### Git Workflow

1. Create a branch for your feature:
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "Add: description of feature"
   ```

3. Push to GitHub:
   ```bash
   git push origin feature/my-new-feature
   ```

4. Create Pull Request on GitHub

5. Wait for review and approval

6. Merge to main

### Commit Message Format

Use clear, descriptive commit messages:

- `Add: new feature description`
- `Fix: bug description`
- `Update: improvement description`
- `Remove: removed feature description`
- `Refactor: code refactoring description`

---

## Deployment Architecture

### Static File Hosting

Kyte Shipyard is deployed as static files:

**S3 Bucket:**
- Hosts HTML, CSS, JS, images
- Configured for website hosting
- Public read access

**CloudFront Distribution:**
- CDN for fast delivery
- HTTPS/SSL
- Cache headers
- Custom domain

### Deployment Flow

```
Developer              GitHub              GitHub Actions        AWS
    |                    |                       |                |
    |-- git push tag --> |                       |                |
    |                    |-- webhook trigger --> |                |
    |                    |                       |-- build -----> |
    |                    |                       |                |
    |                    |                       |-- upload S3 -> |
    |                    |                       |                |
    |                    |                       |-- invalidate ->|
    |                    |                       |   CloudFront   |
```

### Environment Variables (GitHub Secrets)

Required secrets in GitHub:

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_REGION`: AWS region (e.g., us-east-1)
- `S3_BUCKET`: S3 bucket name
- `CF_DISTRIBUTION_ID`: CloudFront distribution ID

---

## Summary

You now understand:

- ✅ Kyte Shipyard's architecture
- ✅ How to set up development environment
- ✅ Code organization and patterns
- ✅ Development workflow
- ✅ Code obfuscation process
- ✅ Release process
- ✅ How to contribute

**Ready to contribute?** Check out the [issues on GitHub](https://github.com/keyqcloud/kyte-shipyard/issues)!

---

[← Back: Configuration & Settings Guide](09-configuration-and-settings.md) | [Documentation Home](README.md)

---

## Additional Resources

- **CLAUDE.md**: Technical guide for AI assistants working with the code
- **Kyte-PHP Documentation**: [kyte-php-docs/](../kyte-php-docs/README.md)
- **GitHub Repository**: https://github.com/keyqcloud/kyte-shipyard
- **Issues**: https://github.com/keyqcloud/kyte-shipyard/issues
- **CHANGELOG**: [../CHANGELOG.md](../CHANGELOG.md)
