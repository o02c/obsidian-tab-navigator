# Tab Navigator for Obsidian

Simple tab switcher for Obsidian. Search and switch between open tabs quickly.

## Features

- **Quick Tab Navigation**  
  Easily switch between open tabs by fuzzy searching through them.  
  Initiate using the command palette or assign a hotkey with `tab-navigator:search-tabs`.
  - Search targets:
    - file name
    - file path
    - frontmatter aliases (toggleable via the "Enable Alias Search" option, enabled by default)
    - frontmatter tags (toggleable via the "Enable Tag Search" option, enabled by default)

- **Delete Duplicate Tabs**  
  Close duplicate tabs efficiently.  
  Initiate using the command palette or assign a hotkey with `tab-navigator:close-duplicate-tabs`.

## Installation

### From Community Plugins
1. Open Settings → Community plugins
2. Search for "Tab Navigator"
3. Click Install and Enable

### Manual Installation
1. Create a `tab-navigator` folder inside your `.obsidian/plugins` directory
2. Download `main.js` and `manifest.json` from the [latest release](https://github.com/o02c/obsidian-tab-navigator/releases)
3. Place the files inside the folder
4. Restart Obsidian and enable the plugin in Settings → Community plugins

## Usage

Once Tab Navigator is enabled, it will automatically integrate with Obsidian's tab system.

### Limitations

- **Tab Loading Behavior**
  - By default, inactive tabs are not loaded until they are clicked to preserve performance
  - For searching through all tabs including unloaded ones, you can:
    1. Manually click each tab to load it
    2. Command palette: `tab-navigator:load-all-tabs` (not recommended for vaults with many tabs)
    3. Enable the "Load all tabs on startup" option in settings
  - Note: Options 2 and 3 interact directly with the DOM to load tabs, which may cause unexpected behavior in some cases.

## Privacy and Security

This plugin does not transmit any user data externally. All data is kept locally.

## Support

For questions or issues, please use the [GitHub Issues](https://github.com/o02c/obsidian-tab-navigator/issues) page. Feedback and feature requests are welcome.

[![PayPal](https://img.shields.io/badge/paypal-o02c-yellow?style=social&logo=paypal)](https://paypal.me/o02c)
[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/_o2c)

## License

This plugin is released under the [MIT License](LICENSE).
