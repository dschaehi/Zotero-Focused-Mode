# Zotero Focused Mode

A plugin that enables a distraction-free workspace for focused reading and research.

## Features

This plugin adds a focused reading mode to Zotero:
- **Focused Reading Mode** - Toggles the visibility of the tab bar and annotation toolbar while entering fullscreen mode
- Intelligent toggling of UI elements to minimize distractions
- Automatic restoration of interface when switching tabs
- Context pane management for maximizing reading space

| Before  | After |
| ------------- | ------------- |
|<img width="1920" alt="Screenshot 2025-05-03 at 20 34 02" src="https://github.com/user-attachments/assets/37dd4792-64db-4463-b420-2a1c9a1fd8b4" /> | <img width="1920" alt="Screenshot 2025-05-03 at 11 09 23" src="https://github.com/user-attachments/assets/cf66c320-5bfa-407e-a4a0-d4130202e809" /> |

## Keyboard Shortcuts

- **Mac**: Ctrl+Cmd+F - Toggle focused mode (hides interface elements and enters fullscreen)
- **Windows/Linux**: F11 - Toggle focused mode (hides interface elements and enters fullscreen)

The keyboard shortcuts are implemented via the View menu and are available globally.

## Behavior

The focused mode provides a distraction-free reading experience:
- Hides both the tab bar and annotation toolbar when activated
- Enters fullscreen mode for a truly immersive experience
- Hides the context pane to maximize reading space

## How it works

The plugin:
- Adds a menu item to the View menu
- Registers keyboard shortcuts for toggling focused mode
- Adds custom CSS for fullscreen mode

## Installation

1. Download the XPI file from the releases page
2. In Zotero, go to Tools → Add-ons
3. Click the gear icon and select "Install Add-on From File..."
4. Select the downloaded XPI file

Alternatively, run the `build.sh` file to create an XPI package and drag it to Zotero's Add-ons Manager dialog.

## Requirements

- Zotero 7.0+
- Tested on Zotero 7.1 beta

## Acknowledgements

GPT o3 and the following scripts and the plugin:
- https://github.com/windingwind/zotero-actions-tags/discussions/385
- https://github.com/windingwind/zotero-actions-tags/discussions/169
- https://github.com/wmstack/Zotero-Toggle-Bars

## License

This project is licensed under the BSD 2-Clause License - see the `LICENSE` file for details.
