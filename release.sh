#!/bin/bash
#
# Tag and push a Shipyard release.
#
# CI (.github/workflows/deploy.yml) handles the actual build + S3
# upload + CloudFront invalidation + GitHub Release on tag push.
# This script's job is to verify pre-flight gates and push the tag.
#
# Pre-flight gates:
#   - CHANGELOG.md has a `## <version>` section at the top
#   - KS_VERSION in assets/js/source/kyte-shipyard.js matches
#   - Working tree is clean
#   - On main branch
#   - Local main is in sync with origin
#   - Tag doesn't already exist (locally or on origin)
#
# Usage:  ./release.sh 2.0.0

set -e

print_error()   { printf "\033[1;31m%s\033[0m\n" "$1"; }
print_success() { printf "\033[1;32m%s\033[0m\n" "$1"; }

if [ "$#" -ne 1 ]; then
    print_error "Usage: ./release.sh <version>"
    print_error "Example: ./release.sh 2.0.0"
    exit 1
fi

VERSION="$1"

# Sanity-check CHANGELOG has the new version at the top.
CHANGELOG_VERSION=$(awk '/^## /{print $2; exit}' CHANGELOG.md)
if [ "$CHANGELOG_VERSION" != "$VERSION" ]; then
    print_error "Version in CHANGELOG.md ($CHANGELOG_VERSION) does not match $VERSION."
    print_error "Add a '## $VERSION' section at the top of CHANGELOG.md before releasing."
    exit 1
fi

# Sanity-check KS_VERSION in the source.
JS_VERSION=$(awk -F\' '/var KS_VERSION =/ {print $2}' assets/js/source/kyte-shipyard.js)
if [ "$JS_VERSION" != "$VERSION" ]; then
    print_error "KS_VERSION in assets/js/source/kyte-shipyard.js ($JS_VERSION) does not match $VERSION."
    print_error "Update line 1 of that file before releasing."
    exit 1
fi

# Refuse to tag against a dirty tree — would tag unintended state.
if ! git diff-index --quiet HEAD --; then
    print_error "Working tree is not clean. Commit or stash changes first."
    git status --short
    exit 1
fi

# Refuse to tag if we're not on main.
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_error "Releases must be tagged from main. Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Refuse to tag if local main is not in sync with origin.
git fetch origin main --quiet
LOCAL=$(git rev-parse main)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" != "$REMOTE" ]; then
    print_error "Local main is not in sync with origin/main. Push or pull first."
    exit 1
fi

# Refuse to tag if the tag already exists locally or upstream.
if git rev-parse "v$VERSION" >/dev/null 2>&1; then
    print_error "Tag v$VERSION already exists locally."
    exit 1
fi
if git ls-remote --tags origin "v$VERSION" 2>/dev/null | grep -q "v$VERSION"; then
    print_error "Tag v$VERSION already exists on origin."
    exit 1
fi

print_success "Tagging v$VERSION..."
git tag "v$VERSION"
git push origin "v$VERSION"

print_success ""
print_success "Tagged v$VERSION and pushed."
print_success "GitHub Actions will now build, upload to S3, invalidate CloudFront,"
print_success "and create the GitHub Release."
print_success "Watch: https://github.com/keyqcloud/kyte-shipyard/actions"
