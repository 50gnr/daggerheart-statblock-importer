# Daggerheart Statblock Importer

A Foundry VTT module for importing Daggerheart adversary, environment, and encounter statblocks from freshcutgrass.app into the Foundryborne Daggerheart system.

## Features

- **Easy Import**: Copy and paste statblock text directly from freshcutgrass.app print view
- **Automatic Parsing**: Intelligent parsing of statblock format including:
  - Name, tier, and type
  - Difficulty and attack bonuses
  - HP and Stress values *** WIP
  - Features, actions, and reactions
  - Motives & tactics
- **Actor Creation**: Automatically creates properly configured Daggerheart actors
- **Item Generation**: Creates embedded items for features and attacks
- **Error Handling**: Clear error messages and graceful failure handling

## Installation

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/50gnr/daggerheart-statblock-importer/releases)
2. Extract the zip file to your Foundry VTT `Data/modules` directory
3. Restart Foundry VTT
4. Enable the module in your world's module settings

### Foundry VTT Module Browser

1. Open Foundry VTT
2. Go to the "Add-on Modules" tab
3. Click "Install Module"
4. Search for "Daggerheart Statblock Importer"
5. Click "Install"

## Usage

1. **Open the Import Dialog**: In the Actors directory, click the "Import Statblock" button
2. **Paste Statblock Text**: Copy the statblock text from freshcutgrass.app and paste it into the text area
3. **Import**: Click the "Import Statblock" button to parse and create the actor
4. **Review**: The created actor will automatically open for review and editing

## Supported Statblock Format

The module is designed to parse statblocks from freshcutgrass.app with the following structure:

```
CREATURE NAME T# Type
Description text
Difficulty: ##
Attack: +#
Experience: Description
Motives & Tactics: Description

FEATURES
Feature Name (value) - Type
Feature description text

HP & STRESS
MINOR HP [...] # MAJOR HP [...] # SEVERE HP [...] #
STRESS [...] #
```

## Examples

### Basic Adversary
```
ACID BURROWER T1 Solo
A home-sized insect with digging claws and acidic blood.
Difficulty: 14
Attack: +3
Experience: Tremor Sense +2
Motives & Tactics: Burrow, Drag away, Feed, Reposition

FEATURES
Relentless (2) - Passive
The Burrower can be spotlighted up to three times per GM turn.

HP & STRESS
MINOR HP [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 8 MAJOR HP [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 15
STRESS [ ] [ ] [ ]
```

## Troubleshooting

### Common Issues

1. **"Could not find creature name"**: Ensure the first line contains the creature name and tier information
2. **"Parsing failed"**: Check that the statblock follows the expected format from freshcutgrass.app
3. **Missing features**: Ensure features are properly formatted with "- Type" at the end of the header line

### Debug Mode

Enable debug mode in the module settings to see detailed parsing information in the browser console.

## Development

### Testing

The module includes a standalone test runner that can be used to test parsing without Foundry VTT:

1. Open `test/test-runner.html` in a web browser
2. Paste statblock text and click "Parse Statblock"
3. Run automated tests with "Run All Tests"

### Building

No build process is required. The module uses vanilla JavaScript ES6 modules.

## Compatibility

- **Foundry VTT**: v12+ (verified with v13)
- **System**: Daggerheart (Foundryborne) v1.0.0+

## License

This module is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Support

For support, please:
1. Check the [troubleshooting section](#troubleshooting)
2. Search existing [issues](https://github.com/50gnr/daggerheart-statblock-importer/issues)
3. Create a new issue with detailed information about your problem

## Acknowledgments

- Thanks to the Foundryborne team for the excellent Daggerheart system
- Inspired by the 5e Statblock Importer module
- Built for the Daggerheart community

