# Zotero Focused Mode

A plugin that enables you to toggle interface elements in Zotero to create a more distraction-free workspace for focused reading and research.

## Features

This plugin adds a focused reading mode to Zotero:
- **Focused Reading Mode** - Toggles the visibility of the tab bar and annotation toolbar while entering fullscreen mode
- Intelligent toggling of UI elements to minimize distractions
- Automatic restoration of interface when switching tabs

| Before  | After |
| ------------- | ------------- |
| <img width="1920" alt="Screenshot 2025-05-03 at 11 07 59" src="https://github.com/user-attachments/assets/edb9aad4-c89e-43b9-b3ee-f1863be91cc1" /> | <img width="1920" alt="Screenshot 2025-05-03 at 11 09 23" src="https://github.com/user-attachments/assets/cf66c320-5bfa-407e-a4a0-d4130202e809" /> |



## Keyboard Shortcuts

- **Mac**: Ctrl+Cmd+F - Toggle focused mode (hides interface elements and enters fullscreen)
- **Windows/Linux**: F11 - Toggle focused mode (hides interface elements and enters fullscreen)

## Behavior

The focused mode provides a distraction-free reading experience:
- Hides both the tab bar and annotation toolbar when activated
- Enters fullscreen mode for a truly immersive experience
- Intelligently handles UI element visibility based on current state
- Automatically restores all interface elements when:
  - Switching between tabs using keyboard shortcuts
  - Clicking on tabs
  - Using any tab navigation method
  - Exiting focused mode with the keyboard shortcut

## Installation

1. Use prebuilt XPI file from the releases page or run the `build.sh` file to create an XPI package.
   
1. Drag the resulting XPI file (from the `build` folder) to Zotero's Add-ons Manager dialog.

## Requirements

- Compatible with Zotero 7.0 and above

## Acknowledgements

This plugin is a fork of the original Zotero-Toggle-Bars plugin created by [Waleed Dahshan](https://github.com/wmstack).

## License

This project is licensed under the BSD 2-Clause License - see the `LICENSE` file for details.
