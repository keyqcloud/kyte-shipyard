#!/bin/bash

if [ "$#" -eq 2 ]; then
    sed -i '' -e "1s/.*/var KS_VERSION = '${2}';/" "assets/js/source/kyte-shipyard.js"
fi

if [ -z "$1" ]
    then
        echo "Obfuscating all JavaScript files..."
        for filename in assets/js/source/*.js; do
            javascript-obfuscator "$filename" --output ${filename//source/} --compact true --string-array-encoding 'base64' --string-array-wrappers-type variable
            echo "Obfuscating KyteShipyard JS file"
            javascript-obfuscator assets/js/source/kyte-shipyard.js --output assets/js/kyte-shipyard.js --compact true --string-array-encoding 'base64' --string-array-wrappers-type variable
        done
    else
        if [[ "$1" == *"source"* ]]; then
            echo "Obfuscating a single JavaScript file $1...";
            javascript-obfuscator "$1" --output ${1//source/} --compact true --string-array-encoding 'base64' --string-array-wrappers-type variable
            echo "Obfuscating KyteShipyard JS file"
            javascript-obfuscator assets/js/source/kyte-shipyard.js --output assets/js/kyte-shipyard.js --compact true --string-array-encoding 'base64' --string-array-wrappers-type variable
        else
            echo "Please use absolute file paths or execute from root project path."
        fi
fi
