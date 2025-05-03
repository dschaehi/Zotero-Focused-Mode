# Zotero Focused Mode

A plugin that enables you to toggle interface elements in Zotero to create a more distraction-free workspace for focused reading and research.

## Features

This plugin adds a focused reading mode to Zotero:
- **Focused Reading Mode** - Toggles the visibility of the tab bar and annotation toolbar while entering fullscreen mode
- Intelligent toggling of UI elements to minimize distractions
- Automatic restoration of interface when switching tabs

| Before  | After |
| ------------- | ------------- |
| <img width="1920" alt="Screenshot 2025-05-02 at 08 32 38" src="https://github.com/user-attachments/assets/91f3e042-bd48-4ded-a1f8-1289e67d6ff4" /> | <img width="1920" alt="Screenshot 2025-05-02 at 08 32 58" src="https://github.com/user-attachments/assets/7a8c7537-635a-4bb2-8b4d-4f7a80888590" /> |

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
