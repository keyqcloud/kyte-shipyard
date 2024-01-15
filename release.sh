#!/bin/bash

print_error() {
    echo "\033[1;31m$1\033[0m"
}

if [ "$#" -eq 1 ]; then
    # Check the CHANGELOG.md
    changelog_version=$(awk '/## /{print $2;exit}' CHANGELOG.md)

    if [ "$changelog_version" != "$1" ]; then
        print_error "Version in CHANGELOG.md does not match the release version."
        exit 1
    fi

    # Check the kyte-shipyard.js file
    js_version=$(awk -F "'" '/var KS_VERSION =/ {print $2}' assets/js/source/kyte-shipyard.js)

    if [ "$js_version" 1= "$1" ]; then
        print_error "Version in kyte-shipyard.js does not match the release version."
        exit 1
    fi

    echo "Reobfuscating all JS"
    for filename in assets/js/source/*.js; do
        javascript-obfuscator "$filename" --output ${filename//source/} --compact true --string-array-encoding 'base64' --string-array-wrappers-type variable
    done

    echo "Creating tag for release version $1"

    git add .
    git commit -m "release $1"
    git push

    if [ $? -eq 0 ]; then
        echo "Committed and push $1 to git"
    else
        print_error "Git push failed."
        exit 1
    fi

    git tag "v$1"

    if [ $? -eq 0 ]; then
        echo "Git tag created successfully for v$1."
    else
        print_error "Git tag creation failed."
        exit 1
    fi

    # Push the tag to the origin
    git push origin --tags

    if [ $? -eq 0 ]; then
        echo "Git push successful. New release v$1 is available"
    else
        print_error "Git push failed."
        exit 1
    fi
fi