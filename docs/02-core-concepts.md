# Core Concepts

This guide explains the fundamental concepts you need to understand to work effectively with Kyte Shipyard.

## Table of Contents

1. [The Big Picture](#the-big-picture)
2. [Architecture Overview](#architecture-overview)
3. [Applications](#applications)
4. [Models - Your Database Structure](#models---your-database-structure)
5. [Controllers - Your API Endpoints](#controllers---your-api-endpoints)
6. [Sites and Pages](#sites-and-pages)
7. [The Publish Workflow](#the-publish-workflow)
8. [Data Flow](#data-flow)
9. [Security Model](#security-model)
10. [Common Patterns](#common-patterns)

---

## The Big Picture

### What is Kyte?

**Kyte** is a complete web application framework consisting of:

1. **Kyte-PHP**: The backend framework (PHP) that handles:
   - Database operations
   - API endpoints
   - Business logic
   - Authentication

2. **Kyte Shipyard**: The admin interface (this application) that lets you:
   - Define models visually
   - Create controllers
   - Build web pages
   - Manage content

3. **Kyte.js**: The frontend SDK that connects:
   - Your web pages to the API
   - User authentication
   - Data fetching

### How They Work Together

```
┌─────────────────┐
│ Kyte Shipyard   │  (Admin Interface)
│ You work here   │  - Define models
│                 │  - Create pages
└────────┬────────┘  - Configure settings
         │
         │ Manages
         ▼
┌─────────────────┐
│  Kyte-PHP API   │  (Backend)
│                 │  - Stores data
│                 │  - Processes requests
└────────┬────────┘  - Runs business logic
         │
         │ Serves
         ▼
┌─────────────────┐
│  Your Website   │  (Frontend)
│                 │  - Users visit here
│  Uses Kyte.js   │  - Displays content
└─────────────────┘  - Submits forms
```

---

## Architecture Overview

### Frontend: Kyte Shipyard

**Technology Stack:**
- Vanilla JavaScript (ES6+)
- jQuery for DOM manipulation
- Bootstrap 5 for UI
- DataTables for data grids
- Monaco Editor for code editing

**No Build System:**
Kyte Shipyard intentionally uses no build tools (webpack, vite, etc.). JavaScript files are:
- Written in `assets/js/source/`
- Obfuscated to `assets/js/` for production
- Loaded directly in HTML via `<script>` tags

### Backend: Kyte-PHP

**Technology Stack:**
- PHP 7.4+
- MySQL/MariaDB database
- AWS SDK (for S3, SES, KMS)
- RESTful API architecture

**Key Components:**
- **Models**: PHP arrays defining database tables
- **ModelObject**: Class for single record operations
- **Model**: Class for multiple record operations
- **Controllers**: Handle HTTP requests and business logic

For detailed backend information, see [Kyte-PHP Documentation](../kyte-php-docs/README.md).

### Connection: Kyte.js

The **Kyte.js** library bridges the frontend and backend:

```javascript
// Initialize Kyte
var _ks = new Kyte(endpoint, publickey, identifier, account);
_ks.init();

// Fetch data
_ks.get('User', 'email', 'john@example.com', [], function(response) {
    console.log(response.data);
});

// Create data
_ks.post('BlogPost', {title: 'Hello', content: '...'}, function(response) {
    console.log('Created:', response);
});
```

---

## Applications

### What is an Application?

An **Application** is a container for a complete project. Think of it as a workspace that includes:

- **Models**: All database tables
- **Controllers**: All API endpoints
- **Sites**: All websites
- **Configuration**: AWS keys, settings, etc.

### Why Multiple Applications?

You might have multiple applications for:

- **Development vs. Production**: Separate environments
- **Different Projects**: Blog app, E-commerce app, Admin app
- **Client Projects**: Each client gets their own application

### Application Structure

```
Application: "My Blog"
├── Models
│   ├── User
│   ├── BlogPost
│   └── Comment
├── Controllers
│   ├── UserController
│   ├── BlogPostController
│   └── CommentController
└── Sites
    ├── Public Website
    └── Admin Dashboard
```

### Switching Applications

In Kyte Shipyard:
1. Click **Settings → Configuration**
2. Select your application from the list
3. All subsequent actions apply to that application

---

## Models - Your Database Structure

### What is a Model?

A **Model** defines the structure of a database table. It specifies:

- Table name
- Columns (fields)
- Data types
- Validation rules
- Relationships

### Model Example

Imagine a simple "User" model:

| Field      | Type    | Description              |
|------------|---------|--------------------------|
| id         | INT     | Unique identifier        |
| email      | VARCHAR | User's email address     |
| password   | VARCHAR | Hashed password          |
| name       | VARCHAR | User's full name         |
| created_at | DATE    | When user was created    |

In Kyte, this is defined as:

```php
$User = [
    'name' => 'User',
    'struct' => [
        'email' => [
            'type' => 's',      // String
            'size' => 255,
            'required' => true,
            'date' => false
        ],
        'password' => [
            'type' => 's',
            'size' => 255,
            'required' => true,
            'password' => true,  // Auto-hash
            'protected' => true  // Hide in API
        ],
        'name' => [
            'type' => 's',
            'size' => 255,
            'required' => true
        ]
    ]
];
```

**In Kyte Shipyard**, you create this visually without writing PHP!

### Key Model Concepts

- **Fields**: Columns in your database table
- **Types**: Data type (string, integer, text, date, etc.)
- **Required**: Whether the field must have a value
- **Protected**: Whether to hide the field in API responses (for passwords, sensitive data)
- **Foreign Keys**: Links to other models (relationships)

See [Models Guide](03-models.md) for detailed information.

---

## Controllers - Your API Endpoints

### What is a Controller?

A **Controller** handles HTTP requests to your API. It:

- Receives requests (GET, POST, PUT, DELETE)
- Validates input
- Processes business logic
- Returns responses

### Controller Example

Imagine a "BlogPostController":

```
GET  /api/BlogPost         → List all blog posts
GET  /api/BlogPost/123     → Get blog post #123
POST /api/BlogPost         → Create a new blog post
PUT  /api/BlogPost/123     → Update blog post #123
DELETE /api/BlogPost/123   → Delete blog post #123
```

### Model vs. Controller

- **Model**: Defines the data structure
- **Controller**: Defines how to access and manipulate that data

**Every model automatically gets a basic controller**, but you can customize it:

- Add authentication
- Add custom validation
- Add business logic (e.g., send email when user registers)
- Add custom endpoints

See [Controllers Guide](04-controllers.md) for detailed information.

---

## Sites and Pages

### What is a Site?

A **Site** is a collection of web pages that make up a website. Examples:

- Public-facing website (www.example.com)
- Admin dashboard (admin.example.com)
- Landing page (promo.example.com)

### Site Components

Each site includes:

- **Pages**: Individual HTML pages
- **Navigation**: Menus and links
- **Domain**: Where the site is hosted (e.g., example.com)
- **Scripts**: Custom JavaScript/CSS
- **Media**: Images, files stored in S3

### What is a Page?

A **Page** is a single web page in your site. Examples:

- Home page (`index.html`)
- About page (`about.html`)
- Contact form (`contact.html`)
- Blog post display (`blog.html`)

### Creating Pages

Kyte Shipyard offers three ways to create pages:

1. **Page Wizard**: Visual drag-and-drop builder (easiest)
2. **Block Editor**: Component-based editing
3. **Code Editor**: Direct HTML/CSS/JS editing (most control)

### Page Features

Pages can:

- Display data from models
- Include forms that save to models
- Use custom components
- Include custom scripts
- Connect to navigation menus

See [Pages & Sites Guide](05-pages-and-sites.md) for detailed information.

---

## The Publish Workflow

Understanding how your changes go live is crucial.

### Development vs. Production

```
┌──────────────┐         ┌──────────────┐
│  Kyte        │         │  Production  │
│  Shipyard    │ Publish │  S3 Bucket   │
│  (Edit)      │────────▶│  (Live)      │
└──────────────┘         └──────────────┘
```

### The Workflow

1. **Edit**: Make changes in Kyte Shipyard
   - Create/edit models
   - Build pages
   - Configure settings

2. **Save**: Changes are saved to the Kyte API database
   - Data is stored but not yet public
   - You can preview changes

3. **Publish**: Changes are deployed to production
   - Pages are generated as HTML
   - Files are uploaded to S3
   - CloudFront cache is invalidated
   - Changes are now live

### What Gets Published?

When you publish a site:

- ✅ All pages in the site
- ✅ Navigation menus
- ✅ Custom scripts and CSS
- ✅ Media files (images, etc.)
- ✅ Configuration changes

What doesn't require publishing:

- ❌ Model changes (take effect immediately)
- ❌ Controller changes (take effect immediately)
- ❌ API data (always live)

### Versioning

Kyte Shipyard supports versioning:

- **Pages**: Each publish creates a version
- **Scripts**: Each save creates a version
- **Controllers**: Each save creates a version

You can:
- View past versions
- Compare versions
- Restore previous versions

---

## Data Flow

Let's trace how data flows through the system with a real example: a user registration form.

### Example: User Registration

#### Step 1: User Fills Form

User visits `https://yoursite.com/register.html` and fills out:
- Name: John Doe
- Email: john@example.com
- Password: ********

#### Step 2: JavaScript Sends to API

Your page's JavaScript (using Kyte.js):

```javascript
_ks.post('User', {
    name: $('#name').val(),
    email: $('#email').val(),
    password: $('#password').val()
}, function(response) {
    if (response.success) {
        alert('Registration successful!');
    }
});
```

#### Step 3: API Receives Request

The Kyte-PHP backend:
1. Receives POST request to `/api/User`
2. Validates the data
3. Runs the `UserController` (if customized)
4. Hashes the password
5. Saves to the database

#### Step 4: Response Returned

```json
{
    "success": true,
    "data": {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com",
        "created_at": "2024-01-15"
    }
}
```

#### Step 5: Page Updates

JavaScript receives the response and:
- Shows success message
- Redirects to dashboard
- Logs the user in

### Data Flow Diagram

```
┌────────┐                ┌─────────┐                ┌──────────┐
│  User  │                │ Your    │                │ Kyte API │
│        │                │ Page    │                │          │
└───┬────┘                └────┬────┘                └────┬─────┘
    │                          │                          │
    │ 1. Fills form            │                          │
    │─────────────────────────▶│                          │
    │                          │ 2. Kyte.js sends data    │
    │                          │─────────────────────────▶│
    │                          │                          │
    │                          │                 3. Validates
    │                          │                 4. Processes
    │                          │                 5. Saves to DB
    │                          │                          │
    │                          │ 6. Returns response      │
    │                          │◀─────────────────────────│
    │ 7. Shows result          │                          │
    │◀─────────────────────────│                          │
```

---

## Security Model

### Authentication

Kyte uses **session-based authentication**:

1. User logs in with email/password
2. API creates a session token
3. Token is stored in browser (cookie/localStorage)
4. All subsequent requests include the token

### Authorization

Controllers can require authentication:

```php
class UserController extends ModelController {
    protected function hook_init() {
        $this->requireAuth = true;  // Requires login
    }
}
```

### Protected Fields

Sensitive fields (like passwords) are marked as `protected`:

- Never returned in API responses
- Automatically hashed before storage
- Cannot be read, only written

### Data Validation

Validation happens at multiple levels:

1. **Browser**: JavaScript validates before sending
2. **API**: Controller validates on receipt
3. **Database**: Model enforces required fields and types

### CORS (Cross-Origin Resource Sharing)

If your frontend and API are on different domains, CORS must be configured:

- Set allowed origins in API configuration
- Set allowed methods (GET, POST, etc.)
- Set allowed headers

---

## Common Patterns

### Pattern 1: List and Detail Pages

**Scenario**: Display a list of blog posts, click to see details

**Solution**:
1. Create a `BlogPost` model
2. Create `blog-list.html` page:
   - Fetches all BlogPost records
   - Displays titles in a list
   - Links to detail page
3. Create `blog-detail.html` page:
   - Gets ID from URL parameter
   - Fetches single BlogPost
   - Displays full content

### Pattern 2: CRUD Operations

**Scenario**: Create, Read, Update, Delete records

**Solution**:
1. Define model in Kyte Shipyard
2. Controller is auto-generated with CRUD endpoints
3. Create forms in your pages:
   - Create: POST to `/api/Model`
   - Read: GET `/api/Model/id`
   - Update: PUT `/api/Model/id`
   - Delete: DELETE `/api/Model/id`

### Pattern 3: Form with Validation

**Scenario**: User registration form

**Solution**:
1. Create `User` model with required fields
2. Create registration page with form
3. JavaScript validates client-side
4. Kyte.js posts to API
5. Controller validates server-side
6. Success/error response shown to user

### Pattern 4: Related Data

**Scenario**: Blog posts with author information

**Solution**:
1. Create `User` model
2. Create `BlogPost` model with foreign key to `User`
3. When fetching BlogPost, API automatically includes User data
4. Display author name on page

### Pattern 5: Custom Business Logic

**Scenario**: Send email when user registers

**Solution**:
1. Create `User` model
2. Create custom `UserController`
3. Override `hook_create()` to send email:
   ```php
   protected function hook_create($data) {
       // Email sending logic here
   }
   ```
4. API automatically calls hook when user created

---

## Troubleshooting Connections

### Problem: "Cannot connect to API"

**Check:**
1. Is `kyte-connect.js` configured correctly?
2. Is the API server running?
3. Can you access the endpoint URL in a browser?
4. Are there firewall/network issues?

### Problem: "Unauthorized API request"

**Check:**
1. Are you logged in?
2. Does the controller require authentication?
3. Is your session still valid?
4. Try logging out and back in

### Problem: "CORS error in browser console"

**Check:**
1. Is CORS configured on the API server?
2. Is your domain whitelisted?
3. Are the correct headers allowed?

---

## Summary

You now understand:

- ✅ How Kyte Shipyard, Kyte-PHP, and Kyte.js work together
- ✅ What applications, models, controllers, sites, and pages are
- ✅ The publish workflow
- ✅ How data flows through the system
- ✅ Security concepts
- ✅ Common implementation patterns

**Next:** Dive into specific features in the following guides!

---

[← Back to Documentation Home](README.md) | [Next: Models Guide →](03-models.md)
