# Components & Datastores Guide

Learn how to create reusable UI components and manage file storage with S3 datastores.

## Table of Contents

1. [What are Components?](#what-are-components)
2. [Creating a Component](#creating-a-component)
3. [Component Placeholders](#component-placeholders)
4. [Using Components in Pages](#using-components-in-pages)
5. [What are Datastores?](#what-are-datastores)
6. [Creating an S3 Datastore](#creating-an-s3-datastore)
7. [Uploading Files](#uploading-files)
8. [CORS Configuration](#cors-configuration)
9. [Best Practices](#best-practices)
10. [Common Examples](#common-examples)

---

## What are Components?

**Components** are reusable pieces of HTML/CSS/JS that you can use across multiple pages. Think of them as building blocks for your website.

### Why Use Components?

✅ **Reusability**: Write once, use everywhere
✅ **Consistency**: Same look and feel across pages
✅ **Easy updates**: Change component, all pages updated
✅ **Modularity**: Break complex pages into simple pieces

### Common Component Examples

- **Header**: Site navigation and logo
- **Footer**: Copyright, links, social media
- **Card**: Product card, blog post card
- **Modal**: Popup dialogs
- **Form**: Contact form, search box
- **Button**: Call-to-action buttons

---

## Creating a Component

Let's create a reusable blog post card component.

### Step 1: Navigate to Components

1. Log in to Kyte Shipyard
2. Click **Components → Reusable Components**
3. Select your application

### Step 2: Click "Add Component"

Click the **+ Add Component** button.

### Step 3: Fill in Component Details

**Name:** `BlogPostCard`
- Component identifier

**Description:** `Displays a blog post in card format`
- Optional description

**Application:** Select your application

### Step 4: Create Component

Click **Create Component**.

Now you can design the component!

---

## Component Placeholders

Placeholders make components dynamic by inserting different content each time you use them.

### What are Placeholders?

Placeholders are variables that get replaced with actual content when the component is used.

### Syntax

Use double curly braces: `{{placeholder_name}}`

### Example Component with Placeholders

```html
<div class="blog-card">
    <div class="card-image">
        <img src="{{image_url}}" alt="{{title}}">
    </div>
    <div class="card-content">
        <h3>{{title}}</h3>
        <p class="card-date">{{date}}</p>
        <p class="card-excerpt">{{excerpt}}</p>
        <a href="/post.html?id={{post_id}}" class="btn">Read More</a>
    </div>
</div>

<style>
.blog-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 20px;
}

.card-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.card-content {
    padding: 20px;
}

.card-content h3 {
    margin: 0 0 10px 0;
    color: #333;
}

.card-date {
    color: #666;
    font-size: 14px;
    margin-bottom: 10px;
}

.card-excerpt {
    color: #555;
    line-height: 1.6;
}

.btn {
    display: inline-block;
    background-color: #0066cc;
    color: white;
    padding: 8px 16px;
    text-decoration: none;
    border-radius: 4px;
    margin-top: 10px;
}
</style>
```

### Defining Placeholders

In the component editor sidebar, list your placeholders:

- `title`: Post title
- `excerpt`: Short description
- `date`: Publication date
- `image_url`: Featured image URL
- `post_id`: Post ID for link

This helps users know what data to provide.

---

## Using Components in Pages

### Method 1: In the Block Editor

1. Open a page in Block Editor
2. Drag your component from the left sidebar
3. Fill in placeholder values
4. Save

### Method 2: In Code

Include the component in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Blog</title>
</head>
<body>
    <h1>Latest Posts</h1>

    <!-- Use component with placeholders -->
    <kyte-component name="BlogPostCard"
        title="My First Post"
        excerpt="This is an amazing blog post..."
        date="2024-01-15"
        image_url="/media/post1.jpg"
        post_id="1">
    </kyte-component>

    <kyte-component name="BlogPostCard"
        title="Another Great Post"
        excerpt="More interesting content here..."
        date="2024-01-16"
        image_url="/media/post2.jpg"
        post_id="2">
    </kyte-component>
</body>
</html>
```

### Method 3: Dynamically with JavaScript

Load components dynamically from API data:

```javascript
// Fetch blog posts
_ks.get('BlogPost', null, null, [], function(response) {
    let posts = response.data;
    let container = document.getElementById('posts-container');

    posts.forEach(function(post) {
        // Create component instance
        let component = document.createElement('kyte-component');
        component.setAttribute('name', 'BlogPostCard');
        component.setAttribute('title', post.title);
        component.setAttribute('excerpt', post.excerpt);
        component.setAttribute('date', post.created_at);
        component.setAttribute('image_url', post.featured_image);
        component.setAttribute('post_id', post.id);

        container.appendChild(component);
    });
});
```

---

## What are Datastores?

**Datastores** are S3 buckets used to store files like images, documents, videos, and other media.

### Why Use Datastores?

✅ **Scalable**: Store unlimited files
✅ **Fast**: CloudFront CDN delivers files quickly
✅ **Reliable**: 99.99% uptime with AWS S3
✅ **Organized**: Separate storage from database
✅ **Cost-effective**: Pay only for what you store

### Common Uses

- **Images**: Product photos, user avatars, blog images
- **Documents**: PDFs, reports, downloadable files
- **Videos**: Training videos, promotional content
- **Backups**: Data exports, archives
- **Static assets**: CSS, JavaScript files

---

## Creating an S3 Datastore

### Step 1: Navigate to Datastores

1. Log in to Kyte Shipyard
2. Click **Storage → Datastores**
3. Select your application

### Step 2: Click "Add Datastore"

Click **+ Add Datastore** or start the Datastore Wizard.

### Step 3: Configure Bucket Settings

**Wizard Step 1: Basic Information**

**Bucket Name:** `my-app-media`
- Must be globally unique
- Use lowercase letters, numbers, hyphens
- Example: `mycompany-myapp-media-prod`

**Region:** `us-east-1`
- Choose closest to your users
- Common regions: us-east-1, us-west-2, eu-west-1

**Description:** `Media files for application`

### Step 4: Set Access Permissions

**Wizard Step 2: Access Control**

**Public Access:** Choose one:

**Public-Read** (Recommended for media files)
- Anyone can view files
- You control who can upload
- Use for: Images, videos, public documents

**Private**
- Only authenticated users can access
- Use for: User uploads, sensitive documents

**Public-Read-Write** (Not recommended)
- Anyone can view and upload
- Security risk

### Step 5: Configure CORS

**Wizard Step 3: CORS Settings**

CORS (Cross-Origin Resource Sharing) allows your website to access the S3 bucket.

**Add CORS Rule:**

**Allowed Origins:** `https://yoursite.com`
- Your website domain
- Can use `*` for all domains (less secure)

**Allowed Methods:**
- GET (view files)
- PUT (upload files)
- POST (upload files)
- DELETE (delete files - optional)

**Allowed Headers:** `*`

**Expose Headers:** `ETag`

**Max Age:** `3600` (1 hour)

**Example CORS Configuration:**

```json
[
    {
        "AllowedOrigins": ["https://example.com", "https://www.example.com"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
    }
]
```

### Step 6: Create Datastore

Click **Create Datastore**.

The S3 bucket is created and configured!

---

## Uploading Files

### Method 1: Through Kyte Shipyard

1. Go to **Storage → Datastores**
2. Click on your datastore
3. Click **Upload** button
4. Select files from your computer
5. Files are uploaded to S3

### Method 2: From Your Pages

Allow users to upload files:

```html
<input type="file" id="fileInput">
<button onclick="uploadFile()">Upload</button>

<script>
function uploadFile() {
    let fileInput = document.getElementById('fileInput');
    let file = fileInput.files[0];

    if (!file) {
        alert('Please select a file');
        return;
    }

    // Upload to S3 via Kyte API
    _ks.uploadFile('DatastoreName', file, function(response) {
        if (response.success) {
            console.log('File uploaded:', response.url);
            alert('Upload successful!');
        } else {
            alert('Upload failed: ' + response.error);
        }
    });
}
</script>
```

### Method 3: From Controllers

Upload files from backend:

```php
use \Kyte\Core\S3;

public function uploadImage($file) {
    $s3 = new S3();
    $bucket = 'my-app-media';
    $key = 'images/' . uniqid() . '.jpg';

    $result = $s3->putObject([
        'Bucket' => $bucket,
        'Key' => $key,
        'Body' => file_get_contents($file['tmp_name']),
        'ACL' => 'public-read',
        'ContentType' => $file['type']
    ]);

    if ($result) {
        $url = $s3->getObjectUrl($bucket, $key);
        $this->success(['url' => $url]);
    } else {
        $this->error('Upload failed');
    }
}
```

### File Organization

Organize files in folders:

```
my-app-media/
├── images/
│   ├── products/
│   ├── users/
│   └── blog/
├── documents/
│   ├── pdfs/
│   └── reports/
└── videos/
```

Use folder structure when uploading:

```javascript
let path = 'images/products/' + filename;
_ks.uploadFile('DatastoreName', file, path, callback);
```

---

## CORS Configuration

CORS is crucial for browser access to S3 files.

### What is CORS?

CORS controls which websites can access your S3 bucket from the browser.

### Why Configure CORS?

Without proper CORS:
- ❌ Browser blocks file access
- ❌ Images won't load
- ❌ Uploads fail with CORS error

With proper CORS:
- ✅ Your site can access files
- ✅ Images load correctly
- ✅ Uploads work

### CORS Rules

A CORS rule specifies:

**AllowedOrigins**: Which domains can access
- `https://example.com` - specific domain
- `*` - all domains (less secure)

**AllowedMethods**: What operations are allowed
- `GET` - download/view files
- `PUT`, `POST` - upload files
- `DELETE` - delete files

**AllowedHeaders**: Which HTTP headers can be sent
- Usually `*` (all headers)

**ExposeHeaders**: Which response headers browser can see
- Usually `ETag`, `x-amz-request-id`

**MaxAgeSeconds**: How long to cache CORS info
- Usually `3600` (1 hour)

### Common CORS Configurations

**Public read-only (view images):**
```json
[
    {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET"],
        "AllowedHeaders": ["*"],
        "MaxAgeSeconds": 3600
    }
]
```

**Specific domain with uploads:**
```json
[
    {
        "AllowedOrigins": ["https://example.com"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
    }
]
```

**Multiple domains:**
```json
[
    {
        "AllowedOrigins": [
            "https://example.com",
            "https://www.example.com",
            "https://admin.example.com"
        ],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedHeaders": ["*"],
        "MaxAgeSeconds": 3600
    }
]
```

### Updating CORS

1. Go to your datastore
2. Click **CORS Configuration**
3. Edit JSON
4. Click **Save**

Changes take effect immediately.

---

## Best Practices

### Components

✅ **DO:**
- Keep components small and focused
- Document placeholders
- Use semantic HTML
- Make components responsive
- Version components (save versions)

❌ **DON'T:**
- Create overly complex components
- Hard-code data (use placeholders)
- Use inline styles everywhere (use CSS)
- Forget to test components

### Datastores

✅ **DO:**
- Organize files in folders
- Use descriptive file names
- Compress images before upload
- Set appropriate ACL (public vs private)
- Monitor storage costs

❌ **DON'T:**
- Store sensitive data in public buckets
- Upload unoptimized large files
- Use generic bucket names
- Forget to configure CORS
- Allow public-read-write

### File Uploads

✅ **DO:**
- Validate file types
- Limit file sizes
- Generate unique file names
- Scan for malware (if user uploads)
- Show upload progress

❌ **DON'T:**
- Trust user file names
- Allow unlimited file sizes
- Skip validation
- Overwrite existing files

---

## Common Examples

### Example 1: Header Component

```html
<header class="site-header">
    <div class="container">
        <a href="/" class="logo">
            <img src="{{logo_url}}" alt="{{site_name}}">
        </a>
        <nav class="main-nav">
            <a href="/">Home</a>
            <a href="/about.html">About</a>
            <a href="/blog.html">Blog</a>
            <a href="/contact.html">Contact</a>
        </nav>
    </div>
</header>

<style>
.site-header {
    background-color: #333;
    color: white;
    padding: 15px 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo img {
    height: 40px;
}

.main-nav a {
    color: white;
    text-decoration: none;
    margin-left: 20px;
}
</style>
```

**Placeholders:**
- `logo_url`: Logo image URL
- `site_name`: Site name for alt text

### Example 2: Image Upload Component

```html
<div class="upload-widget">
    <input type="file" id="{{input_id}}" accept="image/*">
    <button onclick="uploadImage('{{input_id}}', '{{datastore}}')">Upload Image</button>
    <div id="{{preview_id}}" class="preview"></div>
</div>

<script>
function uploadImage(inputId, datastore) {
    let input = document.getElementById(inputId);
    let file = input.files[0];

    if (!file) return;

    _ks.uploadFile(datastore, file, function(response) {
        if (response.success) {
            let preview = document.getElementById('{{preview_id}}');
            preview.innerHTML = '<img src="' + response.url + '">';
        }
    });
}
</script>

<style>
.upload-widget {
    padding: 20px;
    border: 2px dashed #ccc;
    border-radius: 8px;
}

.preview img {
    max-width: 200px;
    margin-top: 10px;
}
</style>
```

**Placeholders:**
- `input_id`: Unique ID for file input
- `datastore`: Datastore name
- `preview_id`: ID for preview container

---

## Troubleshooting

### Problem: "CORS error" when accessing files

**Cause**: CORS not configured or incorrect

**Solution:**
1. Go to datastore CORS settings
2. Add your domain to AllowedOrigins
3. Ensure GET method is allowed
4. Save and test again

### Problem: Files upload but return 403 when accessing

**Cause**: Bucket ACL is private

**Solution:**
1. Change bucket ACL to public-read (if appropriate)
2. Or set ACL on individual files during upload
3. Verify bucket policy allows public access

### Problem: Upload fails with "Access Denied"

**Cause**: AWS credentials lack upload permissions

**Solution:**
1. Check AWS IAM user has S3 PutObject permission
2. Verify bucket policy allows uploads
3. Check credentials in Kyte configuration

---

## Summary

You now know how to:

- ✅ Create reusable components
- ✅ Use placeholders in components
- ✅ Create S3 datastores
- ✅ Upload files to S3
- ✅ Configure CORS
- ✅ Follow best practices

**Next**: Learn about scripts and custom functions! →

---

[← Back: Email Templates Guide](06-email-templates.md) | [Documentation Home](README.md) | [Next: Scripts & Functions Guide →](08-scripts-and-functions.md)
