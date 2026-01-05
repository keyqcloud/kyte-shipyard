# Development Setup Guide

## Local kyte-api-js Development

This setup allows you to test changes to `kyte-api-js` locally without deploying to CDN.

### Setup (One-time)

The symlink has already been created:
```bash
/assets/js/kyte-dev.js → ../../../kyte-api-js/kyte-source.js
```

This symlink is **excluded from git** via `.gitignore`.

### How It Works

When running on `localhost` or `127.0.0.1`, pages automatically load:
- **Local kyte.js**: `/assets/js/kyte-dev.js` (symlinked to `kyte-api-js/kyte-source.js`)
- **Source files**: `/assets/js/source/*.js` (non-obfuscated shipyard files)

When running in production, pages load:
- **CDN kyte.js**: `https://cdn.keyqcloud.com/kyte/js/stable/kyte.js`
- **Obfuscated files**: `/assets/js/*.js` (production shipyard files)

### Development Workflow

1. **Make changes to kyte-api-js**:
   ```bash
   cd "/path/to/kyte-api-js"
   # Edit kyte-source.js
   ```

2. **Test immediately in browser**:
   - Navigate to `http://localhost:8080/app/emails.html`
   - Changes are reflected automatically (just refresh)
   - Console shows: `[DEV MODE] Loading local kyte-api-js from /assets/js/kyte-dev.js`

3. **When ready to release**:
   ```bash
   cd "/path/to/kyte-api-js"
   ./release.sh  # Builds minified versions
   ```

4. **Deploy to CDN** (when production-ready):
   - Upload built files to CDN
   - Production sites automatically use CDN version

### Console Indicators

In development mode, you'll see colored console messages:
- 🔴 **Red**: Loading local kyte-api-js (your changes)
- 🟢 **Green**: Loading local shipyard source files

### HTML Template Pattern

Pages that support local dev mode include this script block:

```html
<script>
    // Auto-detect localhost and conditionally load local kyte.js for development
    (function() {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        // Load kyte.js: use local dev version on localhost, otherwise use CDN
        const kyteScript = isLocalhost ? '/assets/js/kyte-dev.js' : 'https://cdn.keyqcloud.com/kyte/js/stable/kyte.js';
        document.write('<script src="' + kyteScript + '"' + (isLocalhost ? '' : ' crossorigin="anonymous"') + '><\/script>');

        if (isLocalhost) {
            console.log('%c[DEV MODE] Loading local kyte-api-js from /assets/js/kyte-dev.js', 'color: #FF6B6B; font-weight: bold;');
        }
    })();
</script>
```

### Updating Other Pages

To apply this pattern to other HTML pages, replace:

```html
<!-- OLD -->
<script src="https://cdn.keyqcloud.com/kyte/js/stable/kyte.js" crossorigin="anonymous"></script>
```

With the conditional loading script above (before the shipyard scripts).

### Troubleshooting

**Symlink broken?**
```bash
cd "/path/to/kyte-managed-front-end/assets/js"
rm kyte-dev.js
ln -sf "../../../kyte-api-js/kyte-source.js" kyte-dev.js
```

**Changes not reflecting?**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Check console for `[DEV MODE]` messages
- Verify you're accessing via `localhost` (not `127.0.0.1` if expecting different behavior)

**404 on kyte-dev.js?**
- Ensure the symlink exists: `ls -la /assets/js/kyte-dev.js`
- Check that `kyte-api-js` is at the correct relative path

### Best Practices

✅ **Do:**
- Test all changes locally before releasing
- Update `CHANGELOG.md` in kyte-api-js
- Bump version number before release
- Test on localhost first, then staging, then production

❌ **Don't:**
- Commit `kyte-dev.js` (it's gitignored)
- Skip the `release.sh` build step
- Deploy unminified source to production
- Change the symlink target (always point to `kyte-source.js`)
