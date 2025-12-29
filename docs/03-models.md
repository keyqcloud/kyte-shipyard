# Models Guide

Learn how to define and manage your database structure using models in Kyte Shipyard.

## Table of Contents

1. [What are Models?](#what-are-models)
2. [Accessing the Models Interface](#accessing-the-models-interface)
3. [Creating Your First Model](#creating-your-first-model)
4. [Field Types Reference](#field-types-reference)
5. [Field Attributes](#field-attributes)
6. [Foreign Keys and Relationships](#foreign-keys-and-relationships)
7. [Viewing and Managing Data](#viewing-and-managing-data)
8. [Exporting Models](#exporting-models)
9. [Importing Models](#importing-models)
10. [Best Practices](#best-practices)
11. [Common Examples](#common-examples)

---

## What are Models?

A **model** defines the structure of a database table. Think of it as a blueprint that describes:

- **Table name**: What the database table is called
- **Fields (columns)**: What data the table stores
- **Data types**: What kind of data each field holds
- **Validation rules**: What values are allowed
- **Relationships**: How this table connects to other tables

### Why Use Models?

Models provide:
- **Automatic table creation**: Kyte creates database tables from your model
- **Type validation**: Ensures data is the correct type
- **API generation**: Automatic REST API endpoints
- **Security**: Built-in protection for sensitive fields
- **Documentation**: Self-documenting data structure

### Model vs. Database Table

```
Model (in Kyte Shipyard)          Database Table
┌──────────────────────┐          ┌──────────────────────┐
│ Model: User          │   ──▶    │ Table: User          │
│                      │          │                      │
│ Fields:              │          │ Columns:             │
│ - id                 │          │ - id (INT)           │
│ - email (string)     │          │ - email (VARCHAR)    │
│ - name (string)      │          │ - name (VARCHAR)     │
│ - created_at (date)  │          │ - created_at (DATE)  │
└──────────────────────┘          └──────────────────────┘
```

---

## Accessing the Models Interface

### Navigate to Models

1. Log in to Kyte Shipyard
2. From the top menu, click **API → Models**
3. Select your application (if prompted)

You'll see a list of existing models for your application.

### The Models List View

The models list shows:

- **Name**: Model name (e.g., "User", "BlogPost")
- **Description**: What the model is for
- **Fields**: Number of fields in the model
- **Actions**: View, edit, delete buttons

### Understanding the Interface

- **Search bar**: Find models by name
- **Add Model button** (+ icon): Create a new model
- **Table view**: Sortable list of all models
- **Click a row**: Open model details

---

## Creating Your First Model

Let's create a simple "BlogPost" model step by step.

### Step 1: Click "Add Model"

Click the **+ Add Model** button (usually top-right).

### Step 2: Fill in Model Information

You'll see a form with:

**Name:** `BlogPost`
- Must be alphanumeric, no spaces
- Use PascalCase (e.g., BlogPost, UserProfile)
- Will be your database table name

**Description:** `Stores blog post articles`
- Optional but recommended
- Helps you remember what the model is for

### Step 3: Add Fields

Now we'll add fields to define what data this model stores.

#### Field 1: Title

Click **Add Field** and fill in:

- **Name**: `title`
- **Type**: `s` (String/VARCHAR)
- **Size**: `255`
- **Required**: ☑ (checked)
- **Null**: ☐ (unchecked, because it's required)
- **Protected**: ☐ (unchecked)
- **Date**: ☐ (unchecked)

This creates a VARCHAR(255) column for the blog post title.

#### Field 2: Content

Click **Add Field** again:

- **Name**: `content`
- **Type**: `t` (Text)
- **Required**: ☑ (checked)
- **Date**: ☐ (unchecked)

This creates a TEXT column for the blog post content.

#### Field 3: Published

Click **Add Field** again:

- **Name**: `published`
- **Type**: `i` (Integer)
- **Size**: `11`
- **Required**: ☐ (unchecked)
- **Default**: `0`
- **Date**: ☐ (unchecked)

This creates an INT column to track if the post is published (0 = no, 1 = yes).

#### Field 4: Author ID

Click **Add Field** again:

- **Name**: `user_id`
- **Type**: `i` (Integer)
- **Size**: `11`
- **Required**: ☑ (checked)
- **Foreign Key**: Select "User" model (if it exists)
- **Date**: ☐ (unchecked)

This creates a foreign key to the User table.

### Step 4: Save the Model

Click **Save** or **Create Model**.

Kyte will:
1. Validate your model definition
2. Create the database table
3. Generate API endpoints
4. Show you the model details page

**Congratulations!** You've created your first model! 🎉

---

## Field Types Reference

Kyte supports various field types that map to MySQL column types:

### String Types

| Kyte Type | MySQL Type | Max Size | Use For |
|-----------|-----------|----------|---------|
| `s` | VARCHAR | 65,535 bytes | Short text: names, emails, titles |
| `tt` | TINYTEXT | 255 bytes | Very short text |
| `t` | TEXT | 65,535 bytes | Medium text: descriptions, articles |
| `mt` | MEDIUMTEXT | 16 MB | Long text: large articles |
| `lt` | LONGTEXT | 4 GB | Very long text: books, large content |

**When to use which:**
- **VARCHAR (s)**: When you need to search/index the field (emails, usernames, titles)
- **TEXT (t)**: When you don't need to search but want decent size (descriptions, content)
- **MEDIUMTEXT (mt)**: For very large content that won't fit in TEXT
- **LONGTEXT (lt)**: For massive content (rarely needed)

### Integer Types

| Kyte Type | MySQL Type | Range | Use For |
|-----------|-----------|-------|---------|
| `i` | INT | -2B to 2B | IDs, counts, flags, quantities |
| `bi` | BIGINT | -9 quintillion to 9 quintillion | Large numbers, timestamps |

**Unsigned option**: Check "Unsigned" to only allow positive numbers (0 to 4B for INT).

### Decimal Type

| Kyte Type | MySQL Type | Use For |
|-----------|-----------|---------|
| `d` | DECIMAL | Money, precise numbers, percentages |

Example: `DECIMAL(10,2)` for currency (e.g., 12345678.90)

### Binary Types (Rarely Used)

| Kyte Type | MySQL Type | Use For |
|-----------|-----------|---------|
| `b` | BLOB | Binary data |
| `tb` | TINYBLOB | Small binary files |
| `mb` | MEDIUMBLOB | Medium binary files |
| `lb` | LONGBLOB | Large binary files |

**Note**: For file storage, use S3 datastores instead of storing in database.

### Special Type: Date

Any field can be marked as a **date field**:

- Stores date/time values
- Automatically formats dates
- Can use for `created_at`, `updated_at`, `published_at`, etc.

---

## Field Attributes

### Required

**What it means**: This field must have a value.

**Database**: Column is `NOT NULL`

**API behavior**: Returns error if field is missing or null

**Example use cases**:
- Email (users must have an email)
- Title (blog posts must have a title)
- Password (users must set a password)

### Protected

**What it means**: This field is sensitive and should be hidden.

**Database**: Column exists normally

**API behavior**:
- Field is **never** returned in responses
- Field can be written but not read
- Perfect for passwords, API keys, secrets

**Example**:
```javascript
// User has password field marked as protected

// Create user (password can be set)
_ks.post('User', {
    email: 'john@example.com',
    password: 'secret123'  // ✅ Can write
}, callback);

// Fetch user
_ks.get('User', 'id', 123, [], function(r) {
    console.log(r.data[0].email);     // ✅ Returns email
    console.log(r.data[0].password);  // ❌ Undefined (protected)
});
```

### Password

**What it means**: This field stores a password.

**Behavior**:
- Automatically hashed before storage (bcrypt)
- Always marked as protected
- Cannot be read, only verified

**Example**:
```javascript
// User registers with password
_ks.post('User', {
    email: 'john@example.com',
    password: 'myPassword123'  // Stored as hash
}, callback);

// Later, user logs in
_ks.login('john@example.com', 'myPassword123', function(r) {
    // Kyte compares hash automatically
});
```

### Date

**What it means**: This field stores a date/time value.

**Behavior**:
- Stores as MySQL DATE, DATETIME, or TIMESTAMP
- Automatically formatted in responses
- Can use special keywords: `NOW()`, `CURRENT_TIMESTAMP`

**Common date fields**:
- `created_at`: When record was created
- `updated_at`: When record was last updated
- `published_at`: When content was published
- `expires_at`: When something expires

### Unsigned

**What it means**: This integer field can only be positive.

**Database**: Column is `UNSIGNED`

**Use for**:
- IDs (never negative)
- Counts (can't have -5 items)
- Quantities (can't have -10 in stock)

**Range difference**:
- Signed INT: -2,147,483,648 to 2,147,483,647
- Unsigned INT: 0 to 4,294,967,295

### Default Value

**What it means**: Value used if none is provided.

**Example use cases**:
- `published = 0` (new posts are unpublished by default)
- `role = 'user'` (new users get 'user' role by default)
- `quantity = 1` (default quantity is 1)

---

## Foreign Keys and Relationships

Foreign keys create relationships between models.

### What is a Foreign Key?

A foreign key is a field that references another table's ID.

**Example**: BlogPost has a `user_id` field that references User's `id`:

```
User Table              BlogPost Table
┌────┬───────┐         ┌────┬────────┬─────────┐
│ id │ name  │         │ id │ title  │ user_id │
├────┼───────┤         ├────┼────────┼─────────┤
│ 1  │ John  │    ◄────│ 1  │ Hello  │ 1       │
│ 2  │ Sarah │    ◄────│ 2  │ World  │ 2       │
└────┴───────┘         │ 3  │ Test   │ 1       │
                       └────┴────────┴─────────┘
```

### Creating a Foreign Key

When adding a field:

1. **Name the field**: Usually `[model]_id` (e.g., `user_id`, `category_id`)
2. **Type**: Integer (`i` or `bi`)
3. **Required**: Usually checked (every post must have an author)
4. **Foreign Key**: Select the related model from dropdown

### How Foreign Keys Work in the API

When you fetch data with foreign keys, Kyte automatically includes related data:

```javascript
// Fetch blog posts
_ks.get('BlogPost', 'id', 1, [], function(r) {
    let post = r.data[0];

    console.log(post.title);           // "Hello World"
    console.log(post.user_id);         // 1
    console.log(post.user.name);       // "John" (auto-included!)
});
```

The `user` object is automatically populated with the related User record!

### Common Relationships

#### One-to-Many

One user can have many blog posts:

- **User** model (the "one")
- **BlogPost** model with `user_id` foreign key (the "many")

#### Many-to-Many

Students can enroll in many courses, courses can have many students:

- **Student** model
- **Course** model
- **Enrollment** model with `student_id` and `course_id` foreign keys

---

## Viewing and Managing Data

After creating a model, you can view and manage the data.

### Accessing the Data Tab

1. Go to **API → Models**
2. Click on your model
3. Click the **Data** tab in the sidebar

### The Data Table

You'll see a DataTable with:

- **Columns**: All non-protected fields
- **Rows**: All records in the table
- **Search**: Search across all fields
- **Sorting**: Click column headers to sort
- **Pagination**: Navigate through records

### Adding Data

Click **Add Record** button:

1. Fill in the form with field values
2. Click **Create**
3. Record is added to the table

### Editing Data

Click a row or **Edit** button:

1. Modify field values
2. Click **Save**
3. Record is updated

### Deleting Data

Click **Delete** button:

1. Confirm deletion
2. Record is permanently removed

**Warning**: Deletion is permanent! Consider adding a `deleted` flag instead.

---

## Exporting Models

You can export model definitions to use in your code.

### Export Options

1. Go to your model details
2. Click the **Export** tab in sidebar
3. Choose export format:
   - **JSON**: For configuration files
   - **Swift**: For iOS apps
   - **Dart**: For Flutter apps

### JSON Export

```json
{
  "name": "BlogPost",
  "struct": {
    "title": {
      "type": "s",
      "size": 255,
      "required": true,
      "date": false
    },
    "content": {
      "type": "t",
      "required": true,
      "date": false
    }
  }
}
```

Use this to:
- Back up your model definition
- Share with other developers
- Version control your data structure

### Swift Export

Generates Swift structs for iOS development:

```swift
struct BlogPost: Codable {
    var id: Int?
    var title: String
    var content: String
    var user_id: Int
}
```

### Dart Export

Generates Dart classes for Flutter development:

```dart
class BlogPost {
  int? id;
  String title;
  String content;
  int userId;

  BlogPost({this.id, required this.title, required this.content, required this.userId});
}
```

---

## Importing Models

You can import model definitions from JSON files.

### Step 1: Prepare JSON File

Create a JSON file with your model definition:

```json
{
  "name": "Product",
  "struct": {
    "name": {
      "type": "s",
      "size": 255,
      "required": true
    },
    "price": {
      "type": "d",
      "size": "10,2",
      "required": true
    }
  }
}
```

### Step 2: Import

1. Go to **API → Models**
2. Click **Import** button
3. Choose your JSON file
4. Click **Import**

Kyte will:
- Validate the JSON structure
- Create the model
- Create the database table
- Generate API endpoints

---

## Best Practices

### Naming Conventions

✅ **DO:**
- Use PascalCase for model names: `BlogPost`, `UserProfile`
- Use snake_case for field names: `user_id`, `created_at`
- Name foreign keys as `[model]_id`: `user_id`, `category_id`

❌ **DON'T:**
- Use spaces: `Blog Post`
- Use special characters: `Blog-Post`, `Blog.Post`
- Use reserved keywords: `User`, `Order` can be problematic

### Field Design

✅ **DO:**
- Always include `id` field (auto-created)
- Add `created_at` date field for audit trails
- Mark passwords as protected
- Use appropriate field sizes
- Add descriptions to your models

❌ **DON'T:**
- Store files in BLOB fields (use S3 instead)
- Make everything required (allow nulls where appropriate)
- Use TEXT for searchable fields (use VARCHAR)
- Expose sensitive data (mark as protected)

### Performance

✅ **DO:**
- Use VARCHAR for fields you'll search
- Use appropriate integer sizes
- Index frequently searched fields
- Use foreign keys for relationships

❌ **DON'T:**
- Use TEXT for short strings
- Make all strings VARCHAR(65535)
- Store large files in the database

---

## Common Examples

### Example 1: User Model

```
Model: User

Fields:
- email (VARCHAR 255, required)
- password (VARCHAR 255, required, protected, password)
- name (VARCHAR 255, required)
- role (VARCHAR 50, default: 'user')
- created_at (DATE, date field)
```

### Example 2: Blog Post Model

```
Model: BlogPost

Fields:
- title (VARCHAR 255, required)
- slug (VARCHAR 255, required)
- content (TEXT, required)
- excerpt (VARCHAR 500)
- featured_image (VARCHAR 255)
- published (INT, default: 0)
- user_id (INT, required, foreign key: User)
- created_at (DATE, date field)
- published_at (DATE, date field)
```

### Example 3: E-commerce Product

```
Model: Product

Fields:
- name (VARCHAR 255, required)
- description (TEXT, required)
- price (DECIMAL 10,2, required)
- quantity (INT, unsigned, default: 0)
- sku (VARCHAR 100, required)
- image_url (VARCHAR 255)
- category_id (INT, foreign key: Category)
- created_at (DATE, date field)
```

### Example 4: Comment System

```
Model: Comment

Fields:
- content (TEXT, required)
- user_id (INT, required, foreign key: User)
- post_id (INT, required, foreign key: BlogPost)
- parent_id (INT, foreign key: Comment) // For nested comments
- approved (INT, default: 0)
- created_at (DATE, date field)
```

---

## Troubleshooting

### Problem: "Column cannot be null"

**Cause**: Trying to create a record without a required field.

**Solution**: Make sure all required fields are provided, or make the field not required.

### Problem: "Duplicate entry"

**Cause**: Trying to insert a value that already exists in a unique field.

**Solution**: Use a different value, or remove the unique constraint.

### Problem: "Foreign key constraint fails"

**Cause**: Trying to reference a record that doesn't exist.

**Solution**: Make sure the related record exists before creating the reference.

---

## Summary

You now know how to:

- ✅ Create models in Kyte Shipyard
- ✅ Choose appropriate field types
- ✅ Use field attributes (required, protected, etc.)
- ✅ Create foreign key relationships
- ✅ View and manage data
- ✅ Export and import models
- ✅ Follow best practices

**Next**: Learn how to create controllers to customize your API! →

---

[← Back: Core Concepts](02-core-concepts.md) | [Documentation Home](README.md) | [Next: Controllers Guide →](04-controllers.md)
