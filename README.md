# Kyte Shipyard™

 [![CodeQL](https://github.com/keyqcloud/kyte-shipyard/actions/workflows/codeql.yml/badge.svg)](https://github.com/keyqcloud/kyte-shipyard/actions/workflows/codeql.yml) [![Deploy to CDN](https://github.com/keyqcloud/kyte-shipyard/actions/workflows/deploy.yml/badge.svg)](https://github.com/keyqcloud/kyte-shipyard/actions/workflows/deploy.yml)

## Introduction
Welcome to Kyte Shipyard™, the next-generation tool for building and managing your web applications. Our platform offers an intuitive interface for managing models, controllers, views, and more, simplifying key aspects of web development like database interaction, domain management, and email template configuration.

## Key Features
- **Model Management**: Effortlessly manage your application's data models and database interactions.
- **Controller Creation**: Quickly generate controllers with a user-friendly interface.
- **Page Builder**: Design and construct web pages seamlessly, suitable for both web apps and static sites.
- **Domain Management**: Administer your domains directly through the admin portal.
- **Email Template Editor**: Craft and edit email templates using the built-in editor.
- **And More!**: Explore additional features and tools designed to enhance your web development experience.

## Building and Deploying

### Prerequisites
- Ensure `npm` is installed on your machine.
- Install the `javascript-obfuscator` package globally:
  ```bash
  npm i -g javascript-obfuscator
  ```
For more information, visit []`javascript-obfuscator` on npm](https://www.npmjs.com/package/javascript-obfuscator).

### Releasing a New Version
Choose the appropriate release script based on your operating system:
- `release.sh`: for *nix/mac users
- `release.bat`: for Windows user

Before executing the release script, complete the following checklist:
- [ ] Updated CHANGELOG.md with the correct version number and release notes.
- [ ] Modified the version number in `/assets/js/source/kyte-shipyard.js`.
- [ ] Verified access to this repository.
- [ ] Set up the necessary environment variables and secrets for GitHub Actions.

## Kyte API Credentials

To connect Kyte Shipyard to your Kyte API, you must create a file called `kyte-connect.js` in the `/assets/js/` directory. The file should be obfuscated and must contain the following:

```javascript
let endpoint = 'https://api.example.com';
let publickey = 'PUBLIC_KEY';
let identifier = 'ACCOUNT_IDENTIFIER';
let account = 'ACCOUNT_NUMBER';
```

## Support
Encountering issues or have suggestions? Feel free to open a bug report or feature request on our [Issues](https://github.com/keyqcloud/kyte-shipyard/issues) page. We appreciate your feedback and contributions!

## License
Kyte Shipyard™  is available under the [MIT License](LICENSE).

---

© 2020-2024 KeyQ. All rights reserved.
