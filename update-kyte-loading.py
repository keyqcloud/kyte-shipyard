#!/usr/bin/env python3

"""
Script to update all HTML pages to use conditional kyte.js loading
This allows local development with kyte-api-js changes
"""

import os
import re
from pathlib import Path

# Define the old pattern
OLD_PATTERN = '<script src="https://cdn.keyqcloud.com/kyte/js/stable/kyte.js" crossorigin="anonymous"></script>'

# Define the new pattern
NEW_PATTERN = '''<script>
        // Auto-detect localhost and conditionally load local kyte.js for development
        (function() {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            // Load kyte.js: use local dev version on localhost, otherwise use CDN
            const kyteScript = isLocalhost ? '/assets/js/kyte-dev.js' : 'https://cdn.keyqcloud.com/kyte/js/stable/kyte.js';
            document.write('<script src="' + kyteScript + '"' + (isLocalhost ? '' : ' crossorigin="anonymous"') + '><\\/script>');

            if (isLocalhost) {
                console.log('%c[DEV MODE] Loading local kyte-api-js from /assets/js/kyte-dev.js', 'color: #FF6B6B; font-weight: bold;');
            }
        })();
    </script>'''

def update_file(filepath):
    """Update a single HTML file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        if OLD_PATTERN in content:
            updated_content = content.replace(OLD_PATTERN, NEW_PATTERN)

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_content)

            return True
    except Exception as e:
        print(f"  ❌ Error updating {filepath}: {e}")
        return False

    return False

def main():
    print("🔄 Updating HTML pages to use conditional kyte.js loading...")
    print()

    count = 0

    # Root-level HTML files (login, password reset, error pages) plus every
    # HTML file under app/. The pre-login flows live at the root and were
    # missed in the original sweep — `if html_file.exists()` guards against
    # the script being re-run in environments that don't ship all four.
    root_files = [Path(name) for name in ('index.html', 'password.html', 'reset.html', 'error.html')]
    app_files = list(Path('app').rglob('*.html'))

    for html_file in root_files + app_files:
        if not html_file.exists():
            continue
        if update_file(html_file):
            print(f"  📝 Updated: {html_file}")
            count += 1

    print()
    print("✅ Update complete!")
    print(f"📊 Files updated: {count}")
    print()
    print("💡 Next steps:")
    print("   1. Test on localhost - you should see: [DEV MODE] Loading local kyte-api-js")
    print("   2. Make changes to kyte-api-js/kyte-source.js")
    print("   3. Refresh browser to see changes immediately")
    print()
    print("⚠️  Remember: kyte-dev.js is gitignored (it's a symlink to kyte-api-js)")

if __name__ == '__main__':
    main()
