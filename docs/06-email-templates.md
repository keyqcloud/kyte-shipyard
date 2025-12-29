# Email Templates Guide

Learn how to create and manage email templates in Kyte Shipyard.

## Table of Contents

1. [What are Email Templates?](#what-are-email-templates)
2. [Accessing Email Templates](#accessing-email-templates)
3. [Creating an Email Template](#creating-an-email-template)
4. [Template Variables and Placeholders](#template-variables-and-placeholders)
5. [Using the Email Editor](#using-the-email-editor)
6. [Testing Email Templates](#testing-email-templates)
7. [Sending Emails from Controllers](#sending-emails-from-controllers)
8. [AWS SES Configuration](#aws-ses-configuration)
9. [Best Practices](#best-practices)
10. [Common Examples](#common-examples)

---

## What are Email Templates?

**Email templates** are pre-designed HTML emails that your application can send automatically. Common uses:

- **Welcome emails**: When users register
- **Password reset**: When users forget their password
- **Notifications**: Order confirmations, updates
- **Marketing**: Newsletters, announcements
- **Transactional**: Receipts, invoices

### Why Use Templates?

✅ **Consistency**: All emails look professional
✅ **Reusability**: Write once, use many times
✅ **Dynamic content**: Insert user data automatically
✅ **Easy updates**: Change template, all emails updated
✅ **Version control**: Track changes over time

---

## Accessing Email Templates

### Navigate to Email Templates

1. Log in to Kyte Shipyard
2. Click **Components → Email Templates**
3. Select your application

You'll see a list of existing email templates.

---

## Creating an Email Template

### Step 1: Click "Add Template"

Click the **+ Add Template** button.

### Step 2: Fill in Template Details

**Name:** `Welcome Email`
- Internal name for the template

**Subject:** `Welcome to {{app_name}}!`
- Email subject line
- Can use variables (e.g., `{{user_name}}`, `{{app_name}}`)

**Description:** `Sent to new users after registration`
- Optional description

**Application:** Select your application

### Step 3: Create Template

Click **Create Template**.

Now you can design the email!

---

## Template Variables and Placeholders

Template variables let you insert dynamic data into emails.

### Syntax

Use double curly braces: `{{variable_name}}`

### Common Variables

**User-related:**
- `{{user_name}}`: User's name
- `{{user_email}}`: User's email
- `{{user_id}}`: User's ID

**Application-related:**
- `{{app_name}}`: Application name
- `{{app_url}}`: Application URL
- `{{site_name}}`: Site name

**Custom variables:**
- Any data you pass when sending the email
- `{{order_number}}`, `{{total_amount}}`, `{{product_name}}`

### Example Usage

```html
<h1>Welcome, {{user_name}}!</h1>
<p>Thank you for joining {{app_name}}.</p>
<p>Your account email is: {{user_email}}</p>

<a href="{{app_url}}/dashboard">Go to Dashboard</a>
```

**When sent to user "John Doe":**

```html
<h1>Welcome, John Doe!</h1>
<p>Thank you for joining My App.</p>
<p>Your account email is: john@example.com</p>

<a href="https://example.com/dashboard">Go to Dashboard</a>
```

### Conditional Content

Show content only if variable exists:

```html
{{#if order_number}}
<p>Your order number is: {{order_number}}</p>
{{/if}}
```

### Loops

Loop through arrays:

```html
<ul>
{{#each items}}
    <li>{{this.name}} - ${{this.price}}</li>
{{/each}}
</ul>
```

---

## Using the Email Editor

The email template editor provides a code editor for HTML.

### Opening the Editor

1. Go to **Components → Email Templates**
2. Click on your template
3. The Monaco editor opens

### The Editor Interface

**Left Sidebar:**
- Template info
- Variables reference
- Send test email

**Center: Monaco Editor**
- Syntax highlighting
- Auto-completion
- Error detection
- Line numbers

**Toolbar:**
- Save button
- Preview toggle
- Test email button

### Editing HTML

Write your email HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{subject}}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
        }
        .header {
            background-color: #0066cc;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 20px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background-color: #0066cc;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{app_name}}!</h1>
        </div>

        <div class="content">
            <p>Hi {{user_name}},</p>

            <p>Thank you for creating an account with us. We're excited to have you on board!</p>

            <p>To get started, click the button below:</p>

            <a href="{{app_url}}/dashboard" class="button">Go to Dashboard</a>

            <p>If you have any questions, feel free to reach out to our support team.</p>

            <p>Best regards,<br>The {{app_name}} Team</p>
        </div>

        <div class="footer">
            <p>© 2024 {{app_name}}. All rights reserved.</p>
            <p>You received this email because you created an account.</p>
        </div>
    </div>
</body>
</html>
```

### Email HTML Best Practices

✅ **DO:**
- Use inline CSS (many email clients strip `<style>` tags)
- Use tables for layout (better email client support)
- Keep width under 600px
- Test in multiple email clients
- Include plain text version

❌ **DON'T:**
- Use JavaScript (email clients block it)
- Use external stylesheets
- Use background images (limited support)
- Use complex CSS (floats, flexbox, grid)

### Saving

Click **Save** or press **Ctrl+S** to save your template.

---

## Testing Email Templates

Always test emails before using them in production!

### Sending a Test Email

1. Open your email template
2. Click **Test Email** or **Send Test** button
3. Fill in test data:

**Send To:** `your-email@example.com`

**Test Variables:**
```json
{
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "app_name": "My Application",
    "app_url": "https://example.com"
}
```

4. Click **Send Test**

You'll receive the email at the specified address!

### What to Check

- ✅ Subject line correct?
- ✅ Variables replaced correctly?
- ✅ Links work?
- ✅ Images display?
- ✅ Layout looks good on mobile?
- ✅ No typos or errors?

### Testing in Multiple Clients

Test in various email clients:
- Gmail (web, mobile)
- Outlook (desktop, web)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Others your users might use

Tools like **Litmus** or **Email on Acid** can help test across many clients.

---

## Sending Emails from Controllers

Use email templates in your controllers to send automated emails.

### Basic Email Sending

In your controller:

```php
use \Kyte\Core\Email;

protected function hook_create($data) {
    // Create user first
    // ... user creation code ...

    // Send welcome email
    $email = new Email();
    $email->setTemplate('Welcome Email'); // Template name
    $email->setRecipient($data['email']);
    $email->setVariables([
        'user_name' => $data['name'],
        'user_email' => $data['email'],
        'app_name' => 'My App',
        'app_url' => 'https://example.com'
    ]);
    $email->send();

    return $data;
}
```

### Password Reset Email

```php
protected function function_sendPasswordReset($email) {
    // Generate reset token
    $token = $this->generateResetToken($email);

    // Send email
    $emailObj = new Email();
    $emailObj->setTemplate('Password Reset');
    $emailObj->setRecipient($email);
    $emailObj->setVariables([
        'reset_link' => 'https://example.com/reset?token=' . $token,
        'app_name' => 'My App'
    ]);
    $emailObj->send();

    $this->success(['message' => 'Reset email sent']);
}
```

### Order Confirmation

```php
protected function hook_create($orderData) {
    // Create order
    // ... order creation code ...

    // Get user
    $user = $this->getUser($orderData['user_id']);

    // Send confirmation email
    $email = new Email();
    $email->setTemplate('Order Confirmation');
    $email->setRecipient($user['email']);
    $email->setVariables([
        'user_name' => $user['name'],
        'order_number' => $orderData['order_number'],
        'total_amount' => $orderData['total'],
        'items' => $orderData['items'],
        'app_name' => 'My Shop'
    ]);
    $email->send();

    return $orderData;
}
```

### Error Handling

Always handle email errors:

```php
try {
    $email = new Email();
    $email->setTemplate('Welcome Email');
    $email->setRecipient($data['email']);
    $email->setVariables($variables);
    $result = $email->send();

    if (!$result) {
        error_log('Failed to send welcome email to ' . $data['email']);
    }
} catch (Exception $e) {
    error_log('Email error: ' . $e->getMessage());
}
```

---

## AWS SES Configuration

Kyte uses AWS Simple Email Service (SES) to send emails.

### Prerequisites

Before sending emails, you need:

1. **AWS Account** with SES enabled
2. **Verified email addresses or domains**
3. **SES credentials** in Kyte configuration
4. **Production access** (if out of SES sandbox)

### Verifying Email Addresses

In **AWS Console → SES → Verified Identities**:

1. Click **Create Identity**
2. Choose **Email Address**
3. Enter: `noreply@example.com`
4. Click **Create**
5. Check email for verification link
6. Click link to verify

### Configuring in Kyte Shipyard

1. Go to **Settings → Configuration**
2. Click **AWS Integration** or **Email Settings**
3. Fill in:

**SES Region:** `us-east-1` (or your region)
**From Email:** `noreply@example.com`
**From Name:** `My Application`

4. Save

### SES Sandbox vs. Production

**Sandbox Mode** (default for new accounts):
- Can only send to verified emails
- Limited to 200 emails/day
- 1 email/second

**Production Mode** (after requesting):
- Can send to any email
- Higher sending limits
- Faster sending rate

**To request production access:**
1. AWS Console → SES → Account Dashboard
2. Click "Request production access"
3. Fill out form describing use case
4. Wait for approval (usually 24 hours)

### Monitoring Emails

Track email sending in:

**AWS Console → SES → Sending Statistics**
- Emails sent
- Bounces
- Complaints
- Delivery rate

**Kyte Shipyard → Logs**
- See email send attempts
- Debugging errors

---

## Best Practices

### Email Design

✅ **DO:**
- Keep design simple and clean
- Use responsive design (mobile-friendly)
- Include clear call-to-action (CTA)
- Use web-safe fonts
- Optimize images (small file size)

❌ **DON'T:**
- Use complex layouts
- Rely on images for important info
- Use tiny fonts (<14px)
- Forget alt text on images

### Content

✅ **DO:**
- Write clear, concise copy
- Personalize with user's name
- Include unsubscribe link (for marketing)
- Provide contact information
- Proofread carefully

❌ **DON'T:**
- Use all caps or excessive punctuation
- Send without testing
- Use spammy language
- Forget legal requirements (CAN-SPAM, GDPR)

### Technical

✅ **DO:**
- Test in multiple email clients
- Use proper email headers
- Handle errors gracefully
- Log email sends
- Monitor bounce rates

❌ **DON'T:**
- Send without verifying domain
- Ignore bounce/complaint rates
- Hard-code sensitive data
- Send to unverified emails in production

---

## Common Examples

### Example 1: Welcome Email

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .button { background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome, {{user_name}}!</h1>
        <p>Thanks for joining {{app_name}}.</p>
        <a href="{{app_url}}/dashboard" class="button">Get Started</a>
    </div>
</body>
</html>
```

### Example 2: Password Reset

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .button { background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Password Reset Request</h1>
        <p>Hi {{user_name}},</p>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <a href="{{reset_link}}" class="button">Reset Password</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email.</p>
    </div>
</body>
</html>
```

### Example 3: Order Confirmation

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Order Confirmation</h1>
        <p>Hi {{user_name}},</p>
        <p>Thank you for your order! Order #{{order_number}}</p>

        <h2>Items:</h2>
        <table>
            {{#each items}}
            <tr>
                <td>{{this.name}}</td>
                <td>${{this.price}}</td>
            </tr>
            {{/each}}
            <tr>
                <td><strong>Total:</strong></td>
                <td><strong>${{total_amount}}</strong></td>
            </tr>
        </table>

        <p>We'll send you another email when your order ships.</p>
    </div>
</body>
</html>
```

---

## Troubleshooting

### Problem: Emails not sending

**Causes:**
- SES not configured
- Email addresses not verified
- AWS credentials incorrect
- SES in sandbox mode

**Solutions:**
- Check AWS SES configuration in Settings
- Verify sender and recipient emails in SES
- Verify AWS credentials are correct
- Request production access if needed

### Problem: Emails going to spam

**Causes:**
- No SPF/DKIM records
- High bounce rate
- Spammy content
- No unsubscribe link

**Solutions:**
- Configure SPF and DKIM in DNS
- Clean your email list
- Improve email content
- Include unsubscribe link for marketing emails

### Problem: Variables not replaced

**Causes:**
- Wrong variable syntax
- Variable not passed to template
- Typo in variable name

**Solutions:**
- Use `{{variable_name}}` syntax
- Verify variable passed in `setVariables()`
- Check spelling matches exactly

---

## Summary

You now know how to:

- ✅ Create email templates
- ✅ Use variables and placeholders
- ✅ Design professional emails
- ✅ Test templates
- ✅ Send emails from controllers
- ✅ Configure AWS SES
- ✅ Follow best practices

**Next**: Learn about components and datastores! →

---

[← Back: Pages & Sites Guide](05-pages-and-sites.md) | [Documentation Home](README.md) | [Next: Components & Datastores Guide →](07-components-and-datastores.md)
