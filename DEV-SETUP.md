# Development Setup Guide

## Local kyte-api-js Development

This setup allows you to test changes to `kyte-api-js` locally without deploying to CDN.

### Setup (One-time)

The symlink has already been created:
```bash
/assets/js/kyte-dev.js → ../../../kyte-api-js/kyte-source.js
```

This symlink is **excluded from git** via `.gitignore`.

#### Windows: enable symlinks (or use a hard link)

Windows blocks unprivileged symlink creation by default, so plain `ln -sf` from Git Bash and `New-Item -ItemType SymbolicLink` from PowerShell will fail with `Administrator privilege required`.

Pick one:

1. **Enable Developer Mode (recommended, one-time fix).** Settings → Privacy & security → For developers → Developer Mode = On. After this, the standard symlink commands work without admin.

2. **Run an elevated PowerShell once and create the symlink:**
   ```powershell
   New-Item -ItemType SymbolicLink `
     -Path "D:\path\to\kyte-shipyard\assets\js\kyte-dev.js" `
     -Target "D:\path\to\kyte-api-js\kyte-source.js"
   ```

3. **Hard link fallback (no admin needed, same volume only).** Functionally equivalent for editing — both names point at the same file data, so changes propagate. Caveat: if `kyte-source.js` is *deleted and recreated* (e.g., by `release.sh`'s build step or a `git reset --hard`), the hard link keeps pointing at the old data and must be re-created. From an unprivileged PowerShell:
   ```powershell
   New-Item -ItemType HardLink `
     -Path "D:\path\to\kyte-shipyard\assets\js\kyte-dev.js" `
     -Target "D:\path\to\kyte-api-js\kyte-source.js"
   ```

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

## KyteTable & KyteForm gotchas

Non-obvious things about the widgets in `kyte-api-js/kyte-source.js`. Save the next dev a debugging trip.

### KyteTable constructor flags are positional

`kyte-source.js:767`:

```js
new KyteTable(api, selector, model, columnDefs,
              searching = true, order = [],
              actionEdit = false, actionDelete = false, actionView = false,
              viewTarget = null, rowCallBack = null, initComplete = null)
```

Most call sites pass them as bare booleans, so it's easy to misread which flag is which. The two that bite people:

- **`actionEdit` / `actionDelete` / `actionView`** auto-inject a `⋮` kebab dropdown column with Edit / Delete / View entries. If you're rendering your own action buttons via a column renderer, set these to `false` or you'll get a duplicate column. (This is what `app/tokens.html` does — its custom Revoke column needs `actionDelete: false`.)
- **`searching`** toggles the search input above the table.

### Refreshing data after a custom POST/PUT/DELETE

KyteTable doesn't use DataTables' `ajax` config, so `$('#table').DataTable().ajax.reload()` is a no-op. Use `kyteTableInstance.draw()` (`kyte-source.js:1890`) — it calls `_loadData()` internally and refetches.

### `.modal-body` is unpadded by default

`assets/css/kyte-form.css:82` sets `.modal-body { padding: 0; padding-top: 1em; }` with `!important`. KyteForm relies on its content being wrapped in a `.mx-3` (which then gets `padding: 2.5rem !important`). Custom modals that aren't KyteForm-driven need either a `.mx-3` wrapper or their own `padding: ... !important` override (see `app/tokens.html` for the `.modal-mcp` pattern).

### `.modal-header` defaults to the orange "model-CRUD" theme

`kyte-form.css:25-30` paints every `.modal-header` with `var(--primary-gradient)` (orange) `!important`, and `kyte-form.css:55-61` injects a database (`\f1c0`) icon before every `.modal-title`. If you want a different look (e.g. for AI/MCP modals), override both with `!important` on a scoping class. Example in `app/tokens.html`:

```css
.modal-mcp .modal-header { background: linear-gradient(135deg, #667eea, #764ba2) !important; }
.modal-mcp .modal-title::before { content: '\f544' !important; /* fa-robot */ }
```
