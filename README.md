# Zotero Focused Mode

A plugin that enables a distraction-free workspace for focused reading and research.

## Features

This plugin adds a focused reading mode to Zotero:
- **Focused Reading Mode** - Toggles the visibility of the tab bar, annotation toolbar, and the sidebars while entering fullscreen mode

| Before  | After |
| ------------- | ------------- |
|<img width="1920" alt="Screenshot 2025-05-03 at 20 34 02" src="https://github.com/user-attachments/assets/37dd4792-64db-4463-b420-2a1c9a1fd8b4" /> | <img width="1920" alt="Screenshot 2025-05-03 at 11 09 23" src="https://github.com/user-attachments/assets/cf66c320-5bfa-407e-a4a0-d4130202e809" /> |
|<img width="1920" alt="Screenshot 2025-05-03 at 21 53 31" src="https://github.com/user-attachments/assets/e103754f-f5cc-4282-b09a-6219ccf3c882" /> | <img width="1920" alt="Screenshot 2025-05-03 at 21 53 41" src="https://github.com/user-attachments/assets/ff7f73d7-143b-4b52-a0b9-034fce3fcc73" /> |



## Keyboard Shortcuts

- **Mac**: Ctrl+Cmd+F - Toggle focused mode (hides interface elements and enters fullscreen)
- **Windows/Linux**: F11 - Toggle focused mode (hides interface elements and enters fullscreen)

## Behavior

The focused mode provides a distraction-free reading experience:
- Hides both the tab bar and annotation toolbar when activated
- Enters fullscreen mode for a truly immersive experience
- Hides the context pane to maximize reading space

## Installation

1. Download the XPI file from the releases page
2. In Zotero, go to Tools → Add-ons
3. Click the gear icon and select "Install Add-on From File..."
4. Select the downloaded XPI file

Alternatively, run the `build.sh` file to create an XPI package and drag it to Zotero's Add-ons Manager dialog.

## Requirements

- Tested on Zotero 7.1 beta

## Acknowledgements

GPT o3 and the following scripts and the plugin:
- https://github.com/windingwind/zotero-actions-tags/discussions/385
- https://github.com/windingwind/zotero-actions-tags/discussions/169
- https://github.com/wmstack/Zotero-Toggle-Bars
