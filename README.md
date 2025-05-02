# Zotero-Toggle-Bars

A plugin that enables you to toggle interface elements in Zotero to create a more distraction-free workspace.

## Features

This plugin adds a single menu item to Zotero's View menu:
- **Toggle Interface Elements** - Toggles the visibility of both the tab bar and annotation toolbar

| Before  | After |
| ------------- | ------------- |
| <img width="1920" alt="Screenshot 2025-05-02 at 08 27 55" src="https://github.com/user-attachments/assets/41aa2670-bbbc-4881-b39f-2d950d0d3450" /> | <img width="1920" alt="Screenshot 2025-05-02 at 08 27 18" src="https://github.com/user-attachments/assets/fe3b9eb2-12e4-4cde-9a3f-894af4fdea13" /> |

## Keyboard Shortcuts

- **Ctrl+Cmd+h** - Toggle interface elements

## Behavior

The toggle works as follows:
- When both elements are visible, it hides both
- When both elements are hidden, it shows both
- If one element is visible and the other hidden, it synchronizes their states

The plugin also automatically restores interface elements when switching between tabs.

## Installation

1. Run the `build.sh` file to create an XPI package:
   ```bash
   ./build.sh
   ```
2. Drag the resulting XPI file (from the `build` folder) to Zotero's Add-ons Manager dialog.

## Requirements

- Compatible with Zotero 7.0 and above

## Acknowledgements

This plugin is a fork of the original Zotero-Toggle-Bars plugin created by [Waleed Dahshan](https://github.com/wmstack).

## License

This project is licensed under the BSD 2-Clause License - see the `LICENSE` file for details.
