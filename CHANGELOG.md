# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ESLint configuration for code quality enforcement
- Prettier configuration for consistent code formatting
- Comprehensive test suite with unit and integration tests
- GitHub Actions CI/CD pipeline
- CodeQL security scanning
- Custom error classes for better error handling
- JSDoc documentation for main API functions
- Issue and PR templates
- Code coverage tracking with nyc
- `.editorconfig` for consistent editor configuration
- `.nvmrc` for Node.js version management
- `.npmignore` for package security

### Fixed
- Fixed error handling bug in `sendMessage.js` where wrong variable was used in error throw
- Fixed logic error in emoji validation where error message was inverted

### Changed
- Updated package.json with comprehensive npm scripts
- Improved package.json metadata (bugs URL, homepage, files list)
- Updated devDependencies to latest versions

## [3.5.2] - 2025-XX-XX

### Current Release
- Full Facebook Messenger automation
- Real-time messaging with MQTT support
- Message editing capabilities
- Typing indicators
- Thread management
- User info retrieval
- Sticker API support
- Post interaction features
- Follow/unfollow functionality
- Proxy support
- Modular architecture

## Version History Guidelines

### Types of Changes

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security vulnerability fixes

### Version Number Guidelines

Given a version number MAJOR.MINOR.PATCH:

1. **MAJOR** version - Incompatible API changes
2. **MINOR** version - Add functionality (backwards-compatible)
3. **PATCH** version - Bug fixes (backwards-compatible)

---

[Unreleased]: https://github.com/NethWs3Dev/ws3-fca/compare/v3.5.2...HEAD
[3.5.2]: https://github.com/NethWs3Dev/ws3-fca/releases/tag/v3.5.2

