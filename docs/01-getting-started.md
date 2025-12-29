# Getting Started with Kyte Shipyard

Welcome! This guide will help you set up and start using Kyte Shipyard for the first time.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Options](#installation-options)
3. [Initial Setup](#initial-setup)
4. [First Login](#first-login)
5. [Understanding the Interface](#understanding-the-interface)
6. [Creating Your First Application](#creating-your-first-application)
7. [Next Steps](#next-steps)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

### For Users (Using Kyte Shipyard)

- **A modern web browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Kyte API credentials**: You'll need:
  - API endpoint URL
  - Public key
  - Account identifier
  - Account number
- **Internet connection**: Required to connect to your Kyte API

### For Developers (Running Locally)

- **Python**: Version 2.7 or 3.x installed
- **Node.js and npm**: For the JavaScript obfuscator
- **Text editor**: VS Code, Sublime Text, or your preferred editor
- **Git**: For version control (optional but recommended)

---

## Installation Options

There are two ways to use Kyte Shipyard:

### Option 1: Hosted Version (Recommended for Most Users)

If your organization provides a hosted Kyte Shipyard instance:

1. Open your web browser
2. Navigate to your organization's Kyte Shipyard URL (e.g., `https://shipyard.yourcompany.com`)
3. You're ready to log in! Skip to [First Login](#first-login)

### Option 2: Local Development

If you're a developer running Kyte Shipyard locally:

#### Step 1: Clone the Repository

```bash
git clone https://github.com/keyqcloud/kyte-shipyard.git
cd kyte-shipyard
```

#### Step 2: Install JavaScript Obfuscator

```bash
npm install -g javascript-obfuscator
```

#### Step 3: Start the Local Server

**On macOS/Linux:**
```bash
./start.sh
```

**On Windows:**
```bash
start.bat
```

This will start a local web server on port 8000. You can access Kyte Shipyard at:
```
http://localhost:8000
```

---

## Initial Setup

Before you can use Kyte Shipyard, you need to configure your API connection.

### Creating the kyte-connect.js File

Kyte Shipyard needs to know how to connect to your Kyte API backend. This is configured in a file called `kyte-connect.js`.

#### Step 1: Create the File

Navigate to the `assets/js/source/` directory and create a new file called `kyte-connect.js`:

```javascript
let endpoint = 'https://api.yourdomain.com';
let publickey = 'your-public-key-here';
let identifier = 'your-identifier-here';
let account = 'your-account-number-here';
```

**Important:** Replace the placeholder values with your actual Kyte API credentials.

#### Step 2: Obfuscate the File (For Production)

For security, this file should be obfuscated:

```bash
./obfuscate.sh assets/js/source/kyte-connect.js
```

This creates an obfuscated version at `assets/js/kyte-connect.js` that the application will use.

**Note:** For local development, you can skip obfuscation initially, but remember to create both files eventually.

### Understanding Your Credentials

Let's break down what each credential means:

- **endpoint**: The URL where your Kyte API is hosted (e.g., `https://api.example.com`)
- **publickey**: Your API public key for authentication
- **identifier**: Your account identifier (unique to your organization)
- **account**: Your account number

**Where do I get these?** Contact your Kyte administrator or check your organization's documentation.

---

## First Login

Now that Kyte Shipyard is configured, let's log in!

### Step 1: Open Kyte Shipyard

Open your web browser and navigate to your Kyte Shipyard URL (or `http://localhost:8000` if running locally).

### Step 2: Enter Your Credentials

You'll see a login screen with two fields:

1. **Email/Username**: Enter your Kyte account email or username
2. **Password**: Enter your password

### Step 3: Click "Sign In"

If your credentials are correct, you'll be redirected to the Kyte Shipyard dashboard!

### What If Login Fails?

If you see an error:

1. **"Invalid credentials"**: Double-check your email and password
2. **"Cannot connect to API"**: Verify your `kyte-connect.js` file has the correct endpoint
3. **"Error initializing Kyte"**: Check that your API credentials are correct

See [Troubleshooting](#troubleshooting) for more help.

---

## Understanding the Interface

After logging in, you'll see the Kyte Shipyard interface. Let's understand the main areas:

### Top Navigation Bar

The top navigation bar (dark gray) contains:

- **Kyte Logo**: Click to return to the dashboard
- **Sites**: Manage your websites
- **API** (dropdown):
  - **Models**: Define database structures
  - **Controllers**: Create API endpoints
- **Storage**: Manage S3 datastores
- **Components** (dropdown):
  - **Email Templates**: Create email templates
  - **Reusable Components**: Build UI components
- **Settings** (dropdown):
  - **Configuration**: App settings
  - **AWS Keys**: Manage AWS credentials
  - **Sessions**: View active sessions
  - **Logs**: View system logs
- **User Menu** (right side):
  - **Account Settings**: Your account preferences
  - **Logout**: Sign out

### Main Content Area

The center area displays:

- **Dashboard**: When you first log in
- **List Views**: When viewing models, controllers, pages, etc.
- **Editors**: When editing specific items
- **Wizards**: Step-by-step creation tools

### Side Navigation (Context-Specific)

Some pages show a side navigation for sub-sections:

- **Model Details**: Attributes, Data, Controllers, Export, Import
- **Page Editor**: Sections, Settings, Media, Scripts
- **Site Details**: Pages, Navigation, Domains, Scripts

### Status Indicators

Look for these visual cues:

- **Version Numbers** (bottom of sidebar): Shows Kyte Shipyard and Kyte.js versions
- **Breadcrumbs**: Show your current location in the app
- **Loading Spinners**: Indicate operations in progress
- **Success/Error Messages**: Appear at the top when actions complete

---

## Creating Your First Application

Let's walk through creating your first application in Kyte Shipyard!

### What is an Application?

An **application** in Kyte is a container for your project. It includes:
- **Models**: Your database structure
- **Controllers**: Your API endpoints
- **Sites**: Your web pages
- **Settings**: Configuration specific to this project

One Kyte account can have multiple applications (e.g., one for production, one for development).

### Step-by-Step: Create an Application

#### Step 1: Navigate to Configuration

From the top menu, click **Settings → Configuration**.

#### Step 2: Click "Add Application"

Look for the "Add Application" or "+" button (usually near the top right).

#### Step 3: Fill in Application Details

You'll see a form with these fields:

- **Name**: Give your application a name (e.g., "My Blog", "E-commerce Site")
- **Identifier**: A unique slug (e.g., "my-blog", "ecommerce-prod")
- **Description**: Optional description of what this application does

**Example:**
```
Name: My First Blog
Identifier: my-first-blog
Description: A simple blog application
```

#### Step 4: Click "Create"

Once created, you'll see your application in the list!

### Step 5: Select Your Application

Click on your newly created application. You'll see options to:
- **Models**: Define database tables
- **Sites**: Create web pages
- **Configuration**: Set up AWS, email, etc.

---

## Next Steps

Congratulations! You've set up Kyte Shipyard and created your first application. Here's what to learn next:

### Learn the Core Concepts

Read the [Core Concepts Guide](02-core-concepts.md) to understand:
- How Kyte Shipyard works
- The relationship between applications, models, controllers, and pages
- The publish workflow

### Create Your First Model

Models define your database structure. Follow the [Models Guide](03-models.md) to:
- Create a simple model (e.g., "BlogPost")
- Add fields (title, content, date)
- View and manage data

### Build Your First Page

Learn to create web pages with the [Pages & Sites Guide](05-pages-and-sites.md):
- Create a site
- Build a page using the wizard
- Publish your site

### Explore Other Features

- [Controllers](04-controllers.md): Create API endpoints
- [Email Templates](06-email-templates.md): Set up email notifications
- [Components](07-components-and-datastores.md): Build reusable UI elements

---

## Troubleshooting

### Login Issues

#### Problem: "Error initializing Kyte"

**Solution:**
1. Check that `assets/js/kyte-connect.js` exists
2. Verify the credentials in `kyte-connect.js` are correct
3. Ensure your API endpoint is reachable
4. Try clearing your browser cache

#### Problem: "Failed to load script kyte-connect.js"

**Solution:**
1. Make sure you created the file in the correct location: `assets/js/kyte-connect.js`
2. If running locally, you may need to obfuscate: `./obfuscate.sh assets/js/source/kyte-connect.js`
3. Check file permissions (should be readable)

#### Problem: "Invalid credentials"

**Solution:**
1. Double-check your email and password
2. Ensure Caps Lock is off
3. Try resetting your password (use the "Forgot Password" link)

### Connection Issues

#### Problem: Cannot connect to API

**Solution:**
1. Verify the `endpoint` in `kyte-connect.js` is correct
2. Check that the API server is running
3. Ensure there are no firewall or network issues
4. Try accessing the endpoint URL directly in your browser

#### Problem: API requests fail with CORS errors

**Solution:**
1. CORS must be configured on your Kyte API server
2. Contact your backend administrator
3. Ensure your domain is whitelisted in the API CORS settings

### Local Development Issues

#### Problem: "./start.sh" won't run

**Solution:**
1. Make sure Python is installed: `python --version` or `python3 --version`
2. Make the script executable: `chmod +x start.sh`
3. Try running directly: `python -m http.server` or `python3 -m http.server`

#### Problem: Port 8000 already in use

**Solution:**
1. Stop other services using port 8000
2. Use a different port: `python -m http.server 8080`
3. Access Kyte Shipyard at `http://localhost:8080`

### Browser Issues

#### Problem: Page looks broken or doesn't load correctly

**Solution:**
1. Hard refresh: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache and cookies
3. Try a different browser
4. Disable browser extensions that might interfere

#### Problem: JavaScript errors in console

**Solution:**
1. Open browser console (F12) and check for errors
2. Ensure all CDN resources are loading (jQuery, Bootstrap, etc.)
3. Check your internet connection
4. Try disabling ad blockers

---

## Getting Help

If you're still stuck:

1. **Check the documentation**: Search other guides in this documentation
2. **Review the CHANGELOG**: See if your issue is mentioned in [CHANGELOG.md](../CHANGELOG.md)
3. **Report an issue**: [GitHub Issues](https://github.com/keyqcloud/kyte-shipyard/issues)
4. **Contact your administrator**: If using a company instance

---

## Summary

You've learned how to:
- ✅ Install and set up Kyte Shipyard
- ✅ Configure API credentials
- ✅ Log in for the first time
- ✅ Navigate the interface
- ✅ Create your first application
- ✅ Troubleshoot common issues

**Next:** Continue to the [Core Concepts Guide](02-core-concepts.md) to deepen your understanding! →

---

[← Back to Documentation Home](README.md) | [Next: Core Concepts →](02-core-concepts.md)
