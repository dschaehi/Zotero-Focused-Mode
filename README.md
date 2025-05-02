# Zotero-Toggle-Bars

A plugin that enables you to toggle interface elements in Zotero to create a more distraction-free workspace.

## Features

This plugin adds a single menu item to Zotero's View menu:
- **Toggle Interface Elements** - Toggles the visibility of both the tab bar and annotation toolbar

| Before  | After |
| ------------- | ------------- |
| <img width="1920" alt="Screenshot 2025-05-02 at 08 32 38" src="https://github.com/user-attachments/assets/91f3e042-bd48-4ded-a1f8-1289e67d6ff4" /> | <img width="1920" alt="Screenshot 2025-05-02 at 08 32 58" src="https://github.com/user-attachments/assets/7a8c7537-635a-4bb2-8b4d-4f7a80888590" /> |



## Keyboard Shortcuts

- **Mac**: Ctrl+Cmd+h - Toggle both tab bar and annotation bar
- **Windows/Linux**: Ctrl+h - Toggle both tab bar and annotation bar

## Behavior

The toggle follows an intelligent workflow:
- If both elements are visible, it hides both
- If both elements are hidden, it shows both
- If tab bar is visible but annotation bar is hidden, it only hides the tab bar
- If tab bar is hidden but annotation bar is visible, it only shows the tab bar

The plugin automatically restores all interface elements when switching between tabs using:
- Tab keyboard shortcuts
- Tab clicking
- Tab navigation methods

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
