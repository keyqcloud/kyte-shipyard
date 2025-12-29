# Configuration & Settings Guide

Learn how to configure your application, manage AWS integration, API keys, and account settings.

## Table of Contents

1. [Application Configuration](#application-configuration)
2. [AWS Integration](#aws-integration)
3. [S3 Configuration](#s3-configuration)
4. [SES Email Configuration](#ses-email-configuration)
5. [KMS Encryption](#kms-encryption)
6. [API Keys Management](#api-keys-management)
7. [Account Settings](#account-settings)
8. [Session Management](#session-management)
9. [Viewing Logs](#viewing-logs)
10. [Best Practices](#best-practices)

---

## Application Configuration

Configure application-wide settings.

### Accessing Configuration

1. Log in to Kyte Shipyard
2. Click **Settings → Configuration**
3. Select your application

### Application Settings

**Application Name:** `My Blog Application`
- Display name for your application

**Identifier:** `my-blog-prod`
- Unique slug identifier
- Used in API URLs and references

**Description:** `Production blog application`
- Optional description

**Status:** Active / Inactive
- Disable application temporarily

**Domain:** `example.com`
- Primary domain for this application

**API Version:** `v1`
- API version for this application

### Environment Variables

Set environment-specific configuration:

**Development:**
- Debug mode: Enabled
- Error reporting: Verbose
- Cache: Disabled

**Production:**
- Debug mode: Disabled
- Error reporting: Errors only
- Cache: Enabled

---

## AWS Integration

Kyte uses AWS services for file storage, email, and encryption.

### Prerequisites

Before configuring AWS:

1. **AWS Account**: You need an active AWS account
2. **IAM User**: Create a user with programmatic access
3. **Permissions**: User needs permissions for:
   - S3 (file storage)
   - SES (email sending)
   - KMS (encryption, optional)
   - CloudFront (CDN, optional)

### Creating IAM User

In AWS Console:

1. Go to **IAM → Users**
2. Click **Add User**
3. **User name:** `kyte-application`
4. **Access type:** Programmatic access
5. **Permissions:** Attach policies:
   - `AmazonS3FullAccess`
   - `AmazonSESFullAccess`
   - `AWSKeyManagementServicePowerUser` (if using KMS)
6. **Create user**
7. **Save** Access Key ID and Secret Access Key

### Configuring AWS Credentials in Kyte

1. Go to **Settings → AWS Keys**
2. Click **Add AWS Credentials**

**Name:** `Production AWS`
**Access Key ID:** `AKIAIOSFODNN7EXAMPLE`
**Secret Access Key:** `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
**Region:** `us-east-1`
**Description:** `Production AWS credentials`

3. Click **Save**

**Security Note:** These credentials are encrypted and stored securely. Never commit them to version control!

---

## S3 Configuration

Configure Amazon S3 for file storage.

### S3 Buckets

Each datastore maps to an S3 bucket. See [Datastores Guide](07-components-and-datastores.md) for detailed setup.

### Bucket Configuration

**Bucket Name:** Must be globally unique
- Use lowercase letters, numbers, hyphens
- Example: `mycompany-myapp-media-prod`

**Region:** Choose based on your users
- `us-east-1` (Virginia) - Most common
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)
- `ap-southeast-1` (Singapore)

**Access Control:**
- **Public Read**: For public media files
- **Private**: For user uploads, sensitive files

### CloudFront CDN

Use CloudFront for faster file delivery:

1. In AWS Console, go to **CloudFront**
2. Create Distribution
3. **Origin**: Your S3 bucket
4. **Viewer Protocol Policy**: Redirect HTTP to HTTPS
5. **SSL Certificate**: Use AWS Certificate Manager
6. **Create Distribution**

In Kyte, update datastore:
- **CloudFront Domain:** `d123456abcdef.cloudfront.net`
- Files will be served via CDN

### S3 Lifecycle Policies

Save costs by automatically deleting old files:

1. In S3 bucket, go to **Management → Lifecycle**
2. Create rule
3. **Name:** Delete old logs
4. **Filter:** Prefix `logs/`
5. **Action:** Delete after 90 days
6. **Create**

---

## SES Email Configuration

Configure Amazon SES for sending emails.

### Verifying Email Addresses

Before sending emails, verify sender addresses:

1. In AWS Console, go to **SES → Verified Identities**
2. Click **Create Identity**
3. **Identity type:** Email address
4. **Email:** `noreply@example.com`
5. **Create**
6. Check email and click verification link

### Verifying Domains

For production, verify your domain:

1. Create Identity → **Domain**
2. **Domain:** `example.com`
3. **Create**
4. Add DNS records (provided by AWS):

**DKIM Records:** (3 CNAME records)
```
_domainkey.example.com → ...
```

**SPF Record:** (TXT record)
```
v=spf1 include:amazonses.com ~all
```

**DMARC Record:** (TXT record)
```
_dmarc.example.com → v=DMARC1; p=none; rua=mailto:admin@example.com
```

5. Wait for verification (can take 48 hours)

### Configuring SES in Kyte

1. Go to **Settings → Configuration → Email**
2. Fill in:

**SES Region:** `us-east-1`
**From Email:** `noreply@example.com`
**From Name:** `My Application`
**Reply-To Email:** `support@example.com`

3. **Save**

### Moving Out of Sandbox

New SES accounts start in sandbox mode:
- Can only send to verified emails
- Limited to 200 emails/day

**To request production access:**

1. In AWS Console, go to **SES → Account Dashboard**
2. Click **Request production access**
3. Fill out form:
   - **Use case:** Describe your application
   - **Compliance:** How you handle bounces/complaints
   - **Email type:** Transactional / Marketing / Both
4. Submit
5. Wait for approval (usually 24 hours)

After approval:
- Send to any email
- Higher sending limits
- Faster sending

---

## KMS Encryption

Use AWS Key Management Service to encrypt sensitive data.

### What is KMS?

KMS provides encryption for:
- Database fields (passwords, SSN, credit cards)
- Files in S3
- Application secrets

### Creating a KMS Key

1. In AWS Console, go to **KMS → Customer managed keys**
2. Click **Create key**
3. **Key type:** Symmetric
4. **Key usage:** Encrypt and decrypt
5. **Alias:** `kyte-application-key`
6. **Administrators:** Select IAM users
7. **Users:** Select kyte IAM user
8. **Create**

### Configuring KMS in Models

Mark fields for encryption in model definition:

```php
$User = [
    'name' => 'User',
    'struct' => [
        'ssn' => [
            'type' => 's',
            'size' => 255,
            'required' => true,
            'protected' => true,
            'kms' => true  // Encrypt this field
        ]
    ]
];
```

Data is automatically encrypted before storage and decrypted when retrieved.

### Configuring KMS in Kyte

1. Go to **Settings → Configuration → Security**
2. **KMS Key ID:** `arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012`
3. **Region:** `us-east-1`
4. **Save**

---

## API Keys Management

Manage API keys for your application.

### What are API Keys?

API keys authenticate:
- External applications accessing your API
- Third-party integrations
- Mobile apps
- Partner systems

### Creating an API Key

1. Go to **Settings → API Keys**
2. Click **Generate Key**

**Key Name:** `Mobile App API Key`
**Permissions:**
- Read: ✓
- Write: ✓
- Delete: ✗

**Rate Limit:** 1000 requests/hour
**Expires:** Never / Date

3. **Generate**

Copy the API key (won't be shown again):
```
kytekey_abc123def456ghi789jkl012mno345
```

### Using API Keys

Include in requests:

**Header:**
```
Authorization: Bearer kytekey_abc123def456ghi789jkl012mno345
```

**Or in Kyte.js:**
```javascript
var _ks = new Kyte(endpoint, apikey, identifier, account);
```

### Revoking API Keys

1. Go to API Keys list
2. Find key to revoke
3. Click **Revoke** or **Delete**
4. Confirm

Revoked keys immediately stop working.

### Best Practices

✅ **DO:**
- Use different keys for different apps
- Set appropriate permissions
- Set rate limits
- Rotate keys periodically
- Revoke unused keys

❌ **DON'T:**
- Share keys publicly
- Commit keys to Git
- Use same key everywhere
- Give more permissions than needed

---

## Account Settings

Manage your personal account settings.

### Accessing Account Settings

1. Click your **username** (top right)
2. Select **Account Settings**

### Profile Settings

**Name:** Your display name
**Email:** Your email address
**Phone:** Contact phone (optional)
**Company:** Company name (optional)

### Changing Password

1. Go to Account Settings
2. Click **Change Password**
3. **Current Password:** Enter current password
4. **New Password:** Enter new password
5. **Confirm Password:** Confirm new password
6. **Update**

**Password Requirements:**
- At least 8 characters
- Include uppercase and lowercase
- Include numbers
- Include special characters

### Two-Factor Authentication (if available)

Enable 2FA for extra security:

1. Go to Account Settings → **Security**
2. Click **Enable 2FA**
3. Scan QR code with authenticator app (Google Authenticator, Authy)
4. Enter code to verify
5. **Save backup codes**

### API Preferences

**Default Timezone:** `America/New_York`
**Date Format:** `MM/DD/YYYY` / `DD/MM/YYYY` / `YYYY-MM-DD`
**Time Format:** `12-hour` / `24-hour`

---

## Session Management

View and manage active sessions.

### Viewing Sessions

1. Go to **Settings → Sessions**
2. See list of active sessions:
   - IP address
   - Browser/device
   - Login time
   - Last activity

### Revoking Sessions

Revoke suspicious or old sessions:

1. Find session to revoke
2. Click **Revoke** or **X**
3. Confirm

User will be logged out from that session.

### Session Timeout

Configure how long sessions last:

**Idle Timeout:** `30 minutes`
- Logout after 30 minutes of inactivity

**Absolute Timeout:** `8 hours`
- Logout after 8 hours regardless of activity

---

## Viewing Logs

Monitor system activity and debug issues.

### Accessing Logs

1. Go to **Settings → Logs**
2. Select log type:
   - **Application Logs**: General application events
   - **API Logs**: API requests and responses
   - **Error Logs**: Errors and exceptions
   - **Email Logs**: Email send attempts

### Filtering Logs

**Date Range:** Last 24 hours / Last 7 days / Custom
**Log Level:** All / Info / Warning / Error
**Search:** Filter by keyword

### Log Entry Details

Each log entry shows:
- **Timestamp**: When it occurred
- **Level**: Info / Warning / Error
- **Message**: Log message
- **Details**: Additional context (user, IP, etc.)

### Common Log Messages

**"User logged in"**
- Info log when user successfully logs in
- Shows user ID and IP address

**"API request failed"**
- Error log when API call fails
- Shows endpoint, error message

**"Email sent"**
- Info log when email successfully sent
- Shows recipient, template

**"Model created"**
- Info log when new record created
- Shows model name, record ID

---

## Best Practices

### Security

✅ **DO:**
- Rotate AWS credentials periodically
- Use least-privilege IAM permissions
- Enable CloudWatch logging
- Use KMS for sensitive data
- Revoke unused API keys

❌ **DON'T:**
- Share AWS credentials
- Give full access permissions
- Commit credentials to Git
- Disable security features
- Ignore security warnings

### AWS Costs

✅ **DO:**
- Monitor AWS billing
- Set up billing alerts
- Use S3 lifecycle policies
- Enable CloudFront caching
- Delete unused resources

❌ **DON'T:**
- Leave unused S3 buckets
- Store everything forever
- Ignore cost reports
- Use expensive storage classes

### Monitoring

✅ **DO:**
- Check logs regularly
- Set up error alerts
- Monitor API usage
- Track email bounce rates
- Review session activity

❌ **DON'T:**
- Ignore error logs
- Skip monitoring
- Let logs grow forever
- Ignore unusual activity

---

## Troubleshooting

### Problem: "Access Denied" AWS errors

**Cause:** IAM user lacks permissions

**Solution:**
1. Check IAM user permissions in AWS Console
2. Attach necessary policies (S3, SES, etc.)
3. Verify credentials are correct in Kyte

### Problem: Emails not sending

**Cause:** SES not configured or in sandbox mode

**Solution:**
1. Verify email addresses in SES
2. Check SES region matches configuration
3. Request production access if in sandbox

### Problem: Files not uploading to S3

**Cause:** Bucket permissions or CORS

**Solution:**
1. Check bucket ACL allows uploads
2. Verify CORS configuration
3. Check IAM user has PutObject permission

---

## Summary

You now know how to:

- ✅ Configure applications
- ✅ Set up AWS integration
- ✅ Configure S3, SES, and KMS
- ✅ Manage API keys
- ✅ Update account settings
- ✅ Monitor sessions and logs

**Next**: Learn about contributing to Kyte Shipyard! →

---

[← Back: Scripts & Functions Guide](08-scripts-and-functions.md) | [Documentation Home](README.md) | [Next: Developer Guide →](10-developer-guide.md)
