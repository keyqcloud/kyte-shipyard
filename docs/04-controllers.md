# Controllers Guide

Learn how to create and customize API endpoints using controllers in Kyte Shipyard.

## Table of Contents

1. [What are Controllers?](#what-are-controllers)
2. [Accessing the Controllers Interface](#accessing-the-controllers-interface)
3. [Auto-Generated Controllers](#auto-generated-controllers)
4. [Creating a Custom Controller](#creating-a-custom-controller)
5. [Controller Functions](#controller-functions)
6. [Controller Hooks](#controller-hooks)
7. [Version Control](#version-control)
8. [Testing Controllers](#testing-controllers)
9. [Best Practices](#best-practices)
10. [Common Examples](#common-examples)

---

## What are Controllers?

A **controller** handles HTTP requests to your API endpoints. Controllers:

- **Receive requests**: GET, POST, PUT, DELETE
- **Validate input**: Check if data is correct
- **Process logic**: Run business rules
- **Return responses**: Send data back to client

### Model vs. Controller

- **Model**: Defines WHAT data you store (structure)
- **Controller**: Defines HOW to access that data (behavior)

### Example

```
User Model                  UserController
┌──────────────┐           ┌────────────────────────┐
│ id           │           │ GET /api/User          │
│ email        │  ──────▶  │ POST /api/User         │
│ password     │           │ PUT /api/User/:id      │
│ name         │           │ DELETE /api/User/:id   │
└──────────────┘           └────────────────────────┘
                           + Custom validation
                           + Custom business logic
```

---

## Accessing the Controllers Interface

### Navigate to Controllers

1. Log in to Kyte Shipyard
2. From the top menu, click **API → Controllers**
3. Select your application (if prompted)

You'll see a list of existing controllers.

### The Controllers List View

The list shows:

- **Name**: Controller name (e.g., "UserController")
- **Model**: Which model it's associated with
- **Description**: What the controller does
- **Actions**: View, edit, delete buttons

---

## Auto-Generated Controllers

### Every Model Gets a Controller

When you create a model, Kyte automatically generates a basic controller with these endpoints:

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/Model` | List all records |
| GET | `/api/Model/:id` | Get a single record |
| GET | `/api/Model/:field/:value` | Get records by field |
| POST | `/api/Model` | Create a new record |
| PUT | `/api/Model/:id` | Update a record |
| DELETE | `/api/Model/:id` | Delete a record |

### Example: User Model

If you have a `User` model, you automatically get:

```javascript
// List all users
_ks.get('User', null, null, [], callback);

// Get user by ID
_ks.get('User', 'id', 123, [], callback);

// Get user by email
_ks.get('User', 'email', 'john@example.com', [], callback);

// Create user
_ks.post('User', {email: 'john@example.com', name: 'John'}, callback);

// Update user
_ks.update('User', 123, {name: 'John Doe'}, callback);

// Delete user
_ks.delete('User', 123, callback);
```

### When to Customize

You should create a custom controller when you need to:

- Add authentication requirements
- Validate data before saving
- Add business logic (send emails, calculate totals, etc.)
- Filter data based on user permissions
- Create custom endpoints
- Override default behavior

---

## Creating a Custom Controller

Let's create a custom controller for our `BlogPost` model.

### Step 1: Navigate to Controllers

Go to **API → Controllers** and click **Add Controller**.

### Step 2: Fill in Controller Details

**Name:** `BlogPostController`
- Must end with "Controller"
- Usually named after the model: `[ModelName]Controller`

**Description:** `Handles blog post operations with custom logic`
- Optional but recommended

**Model:** Select `BlogPost` from dropdown
- Associates controller with model
- Can also create standalone controllers

### Step 3: Save

Click **Create Controller**.

You now have a custom controller! Let's add some functionality.

---

## Controller Functions

Controllers can have custom functions that create new API endpoints.

### What are Controller Functions?

A **controller function** is a custom method that:
- Creates a new API endpoint
- Runs custom PHP code
- Can accept parameters
- Returns data

### Creating a Function

1. Go to your controller details page
2. Click **Functions** tab or **Add Function** button
3. Fill in function details:

**Function Name:** `getPublished`

**Description:** `Get only published blog posts`

**Function Code:**
```php
public function getPublished() {
    $model = new \Kyte\Core\Model(constant('BlogPost'));
    $model->addConditional('published', 1);
    $result = $model->retrieve();

    $this->success($result);
}
```

**HTTP Method:** GET

### Calling Your Function

Your function is now available at:
```
GET /api/BlogPost/getPublished
```

From JavaScript:
```javascript
_ks.call('BlogPost', 'getPublished', {}, function(response) {
    console.log('Published posts:', response.data);
});
```

### Function Parameters

Functions can accept parameters:

```php
public function getByCategory($categoryId) {
    $model = new \Kyte\Core\Model(constant('BlogPost'));
    $model->addConditional('category_id', $categoryId);
    $result = $model->retrieve();

    $this->success($result);
}
```

Call with parameter:
```javascript
_ks.call('BlogPost', 'getByCategory', {categoryId: 5}, function(response) {
    console.log('Posts in category 5:', response.data);
});
```

---

## Controller Hooks

**Hooks** are special methods that let you customize controller behavior at specific points in the request lifecycle.

### Available Hooks

| Hook | When It Runs | Use For |
|------|--------------|---------|
| `hook_init()` | Controller initialization | Set configuration |
| `hook_preprocess()` | Before any processing | Validate all requests |
| `hook_prequery()` | Before database query | Filter data, add conditions |
| `hook_create()` | Before creating record | Validate/modify data, send notifications |
| `hook_response_data()` | Before sending response | Clean/format response data |
| `hook_update()` | Before updating record | Validate changes |
| `hook_delete()` | Before deleting record | Prevent deletion, cleanup |

### Hook: hook_init()

Configure your controller:

```php
protected function hook_init() {
    // Require authentication for all endpoints
    $this->requireAuth = true;

    // Set public methods (no auth required)
    $this->publicMethods = ['getPublished'];

    // Set read-only mode
    $this->readOnly = false;
}
```

**Common settings:**

- `$this->requireAuth = true`: All endpoints need login
- `$this->readOnly = true`: No create/update/delete
- `$this->publicMethods = ['method1', 'method2']`: Methods that don't need auth

### Hook: hook_preprocess()

Validate all incoming requests:

```php
protected function hook_preprocess() {
    $method = $this->request['method'];

    // Only allow admins to delete
    if ($method === 'DELETE') {
        $user = $this->getCurrentUser();
        if ($user['role'] !== 'admin') {
            $this->error('Only admins can delete posts');
        }
    }
}
```

### Hook: hook_prequery()

Filter data before queries:

```php
protected function hook_prequery() {
    // Users can only see their own posts
    $user = $this->getCurrentUser();
    $this->model->addConditional('user_id', $user['id']);
}
```

### Hook: hook_create()

Run logic when creating records:

```php
protected function hook_create($data) {
    // Set author to current user
    $user = $this->getCurrentUser();
    $data['user_id'] = $user['id'];

    // Set created_at timestamp
    $data['created_at'] = date('Y-m-d H:i:s');

    // Send notification email
    $this->sendNotificationEmail($data);

    return $data;
}
```

### Hook: hook_response_data()

Format data before returning:

```php
protected function hook_response_data($data) {
    // Add full author information
    foreach ($data as &$post) {
        $user = $this->getUser($post['user_id']);
        $post['author_name'] = $user['name'];
        $post['author_email'] = $user['email'];
    }

    return $data;
}
```

### Hook: hook_update()

Validate updates:

```php
protected function hook_update($id, $data) {
    // Get existing post
    $existing = $this->modelObject->get();

    // Only author can edit
    $user = $this->getCurrentUser();
    if ($existing['user_id'] !== $user['id']) {
        $this->error('You can only edit your own posts');
    }

    // Set updated_at timestamp
    $data['updated_at'] = date('Y-m-d H:i:s');

    return $data;
}
```

### Hook: hook_delete()

Control deletion:

```php
protected function hook_delete($id) {
    // Get post
    $post = $this->modelObject->get();

    // Only author can delete
    $user = $this->getCurrentUser();
    if ($post['user_id'] !== $user['id']) {
        $this->error('You can only delete your own posts');
    }

    // Instead of deleting, mark as deleted
    $this->modelObject->set(['deleted' => 1]);
    $this->modelObject->save();

    // Prevent actual deletion
    return false;
}
```

---

## Version Control

Kyte Shipyard supports version control for controller functions.

### Why Version Control?

- Track changes over time
- Restore previous versions if something breaks
- Compare versions to see what changed
- Collaborate with team members

### Viewing Versions

1. Go to your controller details
2. Click on a function
3. Click **Versions** or **History** button

You'll see:
- Version number
- Date/time saved
- Who made the change (if available)
- Change description (if provided)

### Comparing Versions

Click **Compare** to see differences between versions:

```diff
  public function getPublished() {
      $model = new \Kyte\Core\Model(constant('BlogPost'));
-     $model->addConditional('published', 1);
+     $model->addConditional('published', 1);
+     $model->addConditional('deleted', 0);
      $result = $model->retrieve();
      $this->success($result);
  }
```

### Restoring a Version

1. Select the version you want to restore
2. Click **Restore**
3. Confirm restoration

The function code will be reverted to that version.

---

## Testing Controllers

### Using the API Directly

Test your controller endpoints using curl or Postman:

```bash
# List all blog posts
curl -X GET https://api.example.com/api/BlogPost \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create a blog post
curl -X POST https://api.example.com/api/BlogPost \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","content":"Hello world"}'

# Call custom function
curl -X GET https://api.example.com/api/BlogPost/getPublished \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Kyte.js

Test from browser console:

```javascript
// Make sure you're logged in
_ks.isSession(); // Should return true

// Test get
_ks.get('BlogPost', null, null, [], function(r) {
    console.log('All posts:', r);
});

// Test create
_ks.post('BlogPost', {
    title: 'Test Post',
    content: 'This is a test'
}, function(r) {
    console.log('Created:', r);
});

// Test custom function
_ks.call('BlogPost', 'getPublished', {}, function(r) {
    console.log('Published:', r);
});
```

### Debugging

Check browser console for errors:
- Network errors (404, 500, etc.)
- CORS errors
- Authentication errors
- Validation errors

Check server logs for:
- PHP errors
- Database errors
- Custom error messages

---

## Best Practices

### Naming Conventions

✅ **DO:**
- Name controllers: `[ModelName]Controller`
- Use camelCase for function names: `getPublished`, `createDraft`
- Use descriptive function names: `getPublishedPosts` not `get2`

❌ **DON'T:**
- Use generic names: `Controller1`, `MyController`
- Use spaces or special characters
- Name functions after HTTP methods: `post()`, `get()` (reserved)

### Security

✅ **DO:**
- Set `$this->requireAuth = true` for protected endpoints
- Validate all input in `hook_preprocess()`
- Check user permissions before sensitive operations
- Use `$this->error()` to return error messages
- Filter data in `hook_prequery()` based on user

❌ **DON'T:**
- Trust client-side validation alone
- Return sensitive data without filtering
- Allow users to access other users' data
- Skip authentication checks

### Code Organization

✅ **DO:**
- Use hooks for their intended purpose
- Keep functions small and focused
- Add comments to complex logic
- Use meaningful variable names
- Handle errors gracefully

❌ **DON'T:**
- Put all logic in one giant function
- Duplicate code (create helper methods)
- Ignore errors
- Use cryptic variable names: `$x`, `$temp`

### Performance

✅ **DO:**
- Use conditions to limit queries: `addConditional()`
- Paginate large result sets
- Cache frequently accessed data
- Use appropriate indexes on database

❌ **DON'T:**
- Fetch all records without limit
- Run queries in loops
- Return unnecessary data

---

## Common Examples

### Example 1: Read-Only API

Public API that only allows reading:

```php
protected function hook_init() {
    $this->readOnly = true;  // No create/update/delete
    $this->requireAuth = false;  // Public access
}
```

### Example 2: User Registration

Controller that sends welcome email on registration:

```php
protected function hook_create($data) {
    // Validate email
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $this->error('Invalid email address');
    }

    // Check if email already exists
    $model = new \Kyte\Core\Model(constant('User'));
    $model->addConditional('email', $data['email']);
    $existing = $model->retrieve();

    if (count($existing) > 0) {
        $this->error('Email already registered');
    }

    // Send welcome email
    $this->sendWelcomeEmail($data['email'], $data['name']);

    return $data;
}

private function sendWelcomeEmail($email, $name) {
    // Email sending logic here
}
```

### Example 3: User-Scoped Data

Users can only see their own data:

```php
protected function hook_init() {
    $this->requireAuth = true;
}

protected function hook_prequery() {
    // Get current logged-in user
    $user = $this->getCurrentUser();

    // Add filter to only show user's records
    $this->model->addConditional('user_id', $user['id']);
}
```

### Example 4: Soft Delete

Mark records as deleted instead of actually deleting:

```php
protected function hook_delete($id) {
    // Instead of deleting, mark as deleted
    $this->modelObject->set(['deleted' => 1, 'deleted_at' => date('Y-m-d H:i:s')]);
    $this->modelObject->save();

    // Return false to prevent actual deletion
    return false;
}

protected function hook_prequery() {
    // Don't show deleted records
    $this->model->addConditional('deleted', 0);
}
```

### Example 5: Admin-Only Actions

Only admins can create/update/delete:

```php
protected function hook_init() {
    $this->requireAuth = true;
}

protected function hook_preprocess() {
    $method = $this->request['method'];
    $user = $this->getCurrentUser();

    // Only allow admins to modify
    if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
        if ($user['role'] !== 'admin') {
            $this->error('Admin access required');
        }
    }
}
```

---

## Troubleshooting

### Problem: "Unauthorized API request"

**Cause**: Controller requires authentication but user is not logged in.

**Solution**:
- Make sure user is logged in: `_ks.isSession()`
- Check `$this->requireAuth` setting
- Add method to `$this->publicMethods` if it should be public

### Problem: "Method not found"

**Cause**: Trying to call a function that doesn't exist.

**Solution**:
- Check function name spelling
- Make sure function is public, not protected/private
- Verify function is saved in controller

### Problem: "No retrieved data"

**Cause**: Trying to update/delete without retrieving first.

**Solution**: In your ModelObject code, call `retrieve()` before `save()` or `delete()`.

### Problem: Changes not taking effect

**Cause**: Code is cached or not saved properly.

**Solution**:
- Make sure you clicked "Save"
- Clear API cache if available
- Check for PHP syntax errors in logs

---

## Summary

You now know how to:

- ✅ Understand what controllers do
- ✅ Create custom controllers
- ✅ Add custom functions
- ✅ Use controller hooks
- ✅ Implement version control
- ✅ Test your controllers
- ✅ Follow best practices

**Next**: Learn how to build web pages with the Pages & Sites guide! →

---

[← Back: Models Guide](03-models.md) | [Documentation Home](README.md) | [Next: Pages & Sites Guide →](05-pages-and-sites.md)
