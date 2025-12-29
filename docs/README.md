# Kyte Shipyard Documentation

Welcome to the comprehensive documentation for Kyte Shipyard™! This documentation will guide you through everything you need to know to effectively use and develop with Kyte Shipyard.

## What is Kyte Shipyard?

Kyte Shipyard is a powerful web-based administration interface for managing Kyte-PHP applications. It provides an intuitive graphical interface for building and managing your web application's backend without writing code directly. Think of it as a control panel for your entire web application.

## Who is This Documentation For?

- **Beginners**: New to Kyte Shipyard or web development
- **Intermediate Users**: Familiar with web development, learning Kyte Shipyard
- **Advanced Users**: Experienced developers looking for reference material
- **Contributors**: Developers wanting to contribute to Kyte Shipyard itself

## Documentation Structure

### Getting Started

📘 **[Getting Started Guide](01-getting-started.md)** - Start here!
- Installing Kyte Shipyard
- Initial setup and configuration
- Logging in for the first time
- Understanding the interface
- Creating your first application

### Core Concepts

📗 **[Core Concepts](02-core-concepts.md)** - Essential knowledge
- Understanding the Kyte architecture
- Applications, Sites, and Pages
- The Model-View-Controller pattern
- How Kyte Shipyard connects to your backend
- The publish workflow

### Feature Guides

📙 **[Models Guide](03-models.md)** - Database structure
- What are models?
- Creating your first model
- Field types and attributes
- Foreign keys and relationships
- Importing and exporting models
- Working with model data

📙 **[Controllers Guide](04-controllers.md)** - API endpoints
- What are controllers?
- Creating controllers
- Controller functions
- Hooks and lifecycle
- Testing controllers
- Version control for controllers

📙 **[Pages & Sites Guide](05-pages-and-sites.md)** - Building web pages
- Understanding sites
- Creating pages with the wizard
- Using the block editor
- Code editor for advanced customization
- Navigation menus
- Media assets
- Publishing and versioning

📙 **[Email Templates Guide](06-email-templates.md)** - Email management
- Creating email templates
- Template variables and placeholders
- Testing email templates
- Sending emails from controllers

📙 **[Components & Datastores Guide](07-components-and-datastores.md)** - Reusable elements
- What are components?
- Creating reusable components
- Component placeholders
- S3 datastores
- CORS configuration

📙 **[Scripts & Functions Guide](08-scripts-and-functions.md)** - Custom code
- Custom JavaScript files
- CSS stylesheets
- Global vs. page-specific scripts
- Version control for scripts
- Custom PHP functions

📙 **[Configuration & Settings Guide](09-configuration-and-settings.md)** - App settings
- Application configuration
- AWS integration (S3, SES, KMS)
- API keys management
- Account settings
- Domain management

### Advanced Topics

📕 **[Developer Guide](10-developer-guide.md)** - For contributors
- Codebase architecture
- Development workflow
- Code obfuscation
- Release process
- Contributing guidelines

## Quick Links

### Common Tasks

- [Creating a new model](03-models.md#creating-your-first-model)
- [Building a page](05-pages-and-sites.md#creating-your-first-page)
- [Setting up email](06-email-templates.md#creating-an-email-template)
- [Publishing a site](05-pages-and-sites.md#publishing-your-site)
- [Adding AWS credentials](09-configuration-and-settings.md#aws-integration)

### Troubleshooting

- [Login issues](01-getting-started.md#troubleshooting-login)
- [Publishing errors](05-pages-and-sites.md#troubleshooting-publishing)
- [API connection problems](02-core-concepts.md#troubleshooting-connections)

### Reference

- [Model field types reference](03-models.md#field-types-reference)
- [Controller hooks reference](04-controllers.md#hooks-reference)
- [Email template variables](06-email-templates.md#template-variables-reference)

## Backend Framework Documentation

Kyte Shipyard manages applications built on the Kyte-PHP framework. For detailed information about how the backend works:

📚 **[Kyte-PHP Documentation](../kyte-php-docs/README.md)**
- Model definitions
- ModelObject and Model classes
- Controller architecture
- AWS integration

Understanding the backend framework will help you make better use of Kyte Shipyard's features.

## Need Help?

- **Issues**: Report bugs at [GitHub Issues](https://github.com/keyqcloud/kyte-shipyard/issues)
- **Check the Guides**: Most questions are answered in the guides above
- **CHANGELOG**: See what's new in [CHANGELOG.md](../CHANGELOG.md)

## Learning Path

### For Complete Beginners

If you're new to web development or Kyte Shipyard:

1. Read [Getting Started Guide](01-getting-started.md)
2. Read [Core Concepts](02-core-concepts.md)
3. Follow the [Models Guide](03-models.md) to create your first model
4. Follow the [Pages Guide](05-pages-and-sites.md) to build your first page
5. Explore other features as needed

### For Experienced Developers

If you're familiar with web development:

1. Skim [Getting Started Guide](01-getting-started.md) for setup
2. Read [Core Concepts](02-core-concepts.md) to understand the architecture
3. Jump to specific guides for features you need
4. Reference [Developer Guide](10-developer-guide.md) if contributing

### For Backend Developers

If you're working on the API/backend:

1. Read [Core Concepts](02-core-concepts.md)
2. Focus on [Models Guide](03-models.md)
3. Study [Controllers Guide](04-controllers.md)
4. Read the [Kyte-PHP Documentation](../kyte-php-docs/README.md)

### For Frontend Developers

If you're building the user interface:

1. Read [Core Concepts](02-core-concepts.md)
2. Focus on [Pages & Sites Guide](05-pages-and-sites.md)
3. Read [Components Guide](07-components-and-datastores.md)
4. Study [Scripts & Functions Guide](08-scripts-and-functions.md)

## Version Information

This documentation is for Kyte Shipyard v1.6.3+

Last updated: 2024

---

© 2020-2025 KeyQ. All rights reserved.

**Ready to get started?** Begin with the [Getting Started Guide](01-getting-started.md)! 🚀
