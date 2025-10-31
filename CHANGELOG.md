# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.6.4] - 2025-10-31

### Fixed
- **Critical Bug:** Fixed `EnhancedAPI` wrapper incorrectly wrapping `sendMessage` method
  - Resolved "MessageID should be of type string and not Function" error
  - Root cause: Protection wrapper was passing callback function where `replyToMessage` string parameter was expected
  - Changed wrapper to properly pass through original async signature: `(message, threadID, replyToMessage, isSingleUser)`
  - File changed: `src/core/client.js` lines 481-485

### Impact
- ✅ All message sending operations now work correctly
- ✅ Replies and message threading function properly
- ✅ Protection features remain fully functional
- ✅ Backward compatible with existing bots

## [3.6.3] - Previous Release

### Added
- Advanced anti-detection protection system
- Session fingerprint management
- Request obfuscation
- Pattern diffusion
- Traffic analysis resistance
- MQTT protection layer

### Features
- Automatic session rotation (6-hour intervals)
- Random realistic user agent rotation
- Timing jitter (0-100ms) for natural behavior
- Cookie refresh manager (20-minute intervals)
- Adaptive delays based on activity patterns
- Enhanced privacy and security measures

### Improved
- Login stability with advanced protection
- MQTT connection reliability
- Message delivery consistency
- Session persistence
- Error handling and recovery

## [3.6.2] - Previous Release

### Added
- Initial implementation of advanced protection features
- Enhanced API wrapper system
- Protection statistics tracking
- Device ID and Session ID management

## [3.6.1] - Previous Release

### Fixed
- Various bug fixes and stability improvements
- Enhanced error reporting
- Improved TypeScript definitions

## [3.6.0] - Previous Release

### Added
- Major refactor of core messaging system
- Improved MQTT handling
- Enhanced thread management
- Better attachment handling

### Changed
- Modernized codebase structure
- Updated dependencies
- Improved documentation

## [3.5.x] - Earlier Releases

### Features
- Basic Facebook Chat API functionality
- Message sending and receiving
- Thread and user information retrieval
- Attachment support
- Typing indicators
- Message reactions
- Friend management
- Group chat operations

---

## Legend

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Vulnerability fixes

---

**Note:** For detailed migration guides and breaking changes, please refer to the [README.md](README.md) and [ADVANCED_PROTECTION.md](ADVANCED_PROTECTION.md).

