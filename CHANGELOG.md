# Changelog

All notable changes to the Daggerheart Statblock Importer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-18

### Added
- Initial release of the Daggerheart Statblock Importer
- Support for parsing adversary statblocks from freshcutgrass.app
- Automatic actor creation in the Foundryborne Daggerheart system
- Parsing of core statblock elements:
  - Name, tier, and type information
  - Difficulty and attack bonuses
  - HP (Minor, Major, Severe) and Stress values
  - Features with type classification (Passive, Action, Reaction)
  - Motives & Tactics
  - Experience descriptions
- User-friendly import dialog accessible from the Actors directory
- Comprehensive error handling and user feedback
- Debug mode for troubleshooting
- Standalone test runner for development and validation
- Support for Foundry VTT v12+ and Daggerheart system v1.0.0+

### Features
- **Smart Parsing**: Intelligent text parsing that handles variations in formatting
- **Item Generation**: Automatically creates embedded items for features and attacks
- **Damage Detection**: Parses damage information from feature descriptions
- **Validation**: Validates parsed data and provides clear error messages
- **Responsive UI**: Clean, accessible interface that matches Foundry VTT's design

### Technical Details
- Built with vanilla JavaScript ES6 modules
- No external dependencies
- Modular architecture with separate parser and actor creator components
- Comprehensive test suite with multiple test cases
- Full compatibility with Foundry VTT v13

### Known Limitations
- Currently focused on adversary statblocks (environment and encounter support planned)
- Requires manual copy-paste from freshcutgrass.app (OCR integration planned)
- Some complex feature descriptions may require manual review

### Documentation
- Complete README with usage instructions and examples
- Inline code documentation
- Test cases demonstrating expected behavior
- Troubleshooting guide for common issues

