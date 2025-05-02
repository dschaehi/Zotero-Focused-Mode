Toggles = {
  id: null,
  version: null,
  rootURI: null,
  initialized: false,

  // Track UI states
  states: {
    tabBar: true,
    annotationBar: true
  },

  // Constants
  SHORTCUTS: {
    COMBINED: "h"  // Combined shortcut
  },

  // Track added elements for cleanup
  addedElementIDs: [],

  init({ id, version, rootURI }) {
    if (this.initialized) return;
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
    this.initialized = true;

    // Register tab selection listener
    this.registerTabChangeListener();
  },

  log(msg) {
    Zotero.debug("Toggle-Bars: " + msg);
  },

  /**
   * Add keyboard shortcut listener with simplified logic
   * @param {Document} doc - Document to attach listener to
   * @param {string} key - Key to listen for
   * @param {Function} callback - Function to call when shortcut triggered
   * @param {Object} options - Additional options
   */
  toggleListener(doc, key, callback, options = {}) {
    doc.addEventListener('keydown', (event) => {
      // Mozilla-compatible platform detection
      let isMac;
      try {
        // First try using Mozilla Components
        isMac = Components.classes["@mozilla.org/xre/app-info;1"]
                .getService(Components.interfaces.nsIXULRuntime)
                .OS === "Darwin";
      } catch (e) {
        // Fallback to Services if available
        try {
          isMac = Services.appinfo.OS === "Darwin";
        } catch (e2) {
          // Last resort hardcoded default (assuming macOS)
          this.log("Platform detection failed, assuming Mac");
          isMac = true;
        }
      }

      // Simple case-insensitive key matching
      const keyMatch = event.key.toLowerCase() === key.toLowerCase();

      // Log all Ctrl or Cmd key events for debugging
      if ((event.ctrlKey || event.metaKey) && keyMatch) {
        this.log(`Key event: ctrl=${event.ctrlKey}, cmd=${event.metaKey}, key=${event.key}`);
      }

      // Mac: Check for Ctrl+Cmd+key
      // Windows/Linux: Check for just Ctrl+key
      if (options.requireCtrlCmd) {
        if (isMac && event.ctrlKey && event.metaKey && keyMatch) {
          this.log(`Mac shortcut triggered: Ctrl+Cmd+${event.key}`);
          callback();
          event.preventDefault();
        }
        else if (!isMac && event.ctrlKey && keyMatch) {
          this.log(`Non-Mac shortcut triggered: Ctrl+${event.key}`);
          callback();
          event.preventDefault();
        }
      }
      // Standard Ctrl+key for all platforms
      else if (event.ctrlKey && keyMatch) {
        callback();
        event.preventDefault();
      }
    });
  },

  /**
   * Create menu item with associated command and shortcut
   * @param {Document} doc - Document to create element in
   * @param {Object} config - Configuration object
   */
  createMenuItem(doc, { id, l10nId, shortcutKey, callback, requireCtrlCmd = false }) {
    const menuItem = doc.createXULElement('menuitem');
    menuItem.id = id;
    menuItem.setAttribute('data-l10n-id', l10nId);
    menuItem.addEventListener('command', callback);

    // Register for cleanup
    this.storeAddedElement(menuItem);

    // Add keyboard shortcut if provided
    if (shortcutKey) {
      this.toggleListener(doc, shortcutKey, callback, { requireCtrlCmd });
    }

    return menuItem;
  },

  addMenuItems(doc, manualPopup) {
    try {
      // Find the view popup menu
      const viewPopup = manualPopup
        ? doc.querySelectorAll("menupopup")[2]
        : doc.getElementById('menu_viewPopup');

      if (!viewPopup) {
        this.log("View popup menu not found");
        return;
      }

      // Keep Combined tab bar and annotation bar toggle
      const combinedCallback = () => this.toggleCombined(doc);
      const combinedItem = this.createMenuItem(doc, {
        id: 'toggle-combined',
        l10nId: 'toggle-combined',
        shortcutKey: this.SHORTCUTS.COMBINED,
        callback: combinedCallback,
        requireCtrlCmd: true  // This is true for both Mac and Windows/Linux, just works differently
      });
      viewPopup.appendChild(combinedItem);
    } catch (e) {
      this.log(`Error adding menu items: ${e.message}`);
    }
  },

  toggleTabBar(doc) {
    try {
      const titleBar = doc.getElementById("zotero-title-bar");
      if (!titleBar) {
        this.log("Tab bar element not found");
        return;
      }

      if (this.states.tabBar) {
        titleBar.style.display = "none";
      } else {
        titleBar.removeAttribute("style");
      }

      this.states.tabBar = !this.states.tabBar;
    } catch (e) {
      this.log(`Error toggling tab bar: ${e.message}`);
    }
  },

  toggleAnnotation() {
    try {
      Zotero.Reader._readers.forEach(reader => {
        if (!reader || !reader._iframeWindow) return;

        const doc = reader._iframeWindow.document;

        if (this.states.annotationBar) {
          // Hide annotation bar
          reader._iframeWindow.eval(
            "document.getElementById('fix-popup')?.remove(); " +
            "let style = document.createElement('style'); " +
            "style.id = 'fix-popup'; " +
            "style.innerHTML = '.view-popup {margin-top: -40px;}'; " +
            "document.head.appendChild(style)"
          );

          // Adjust UI elements
          this.adjustElement(doc.querySelector(".toolbar"), "display", "none");
          this.adjustElement(doc.querySelector("#split-view"), "top", "0");
          this.adjustElement(doc.querySelector("#sidebarContainer"), "top", "0");
        } else {
          // Restore annotation bar
          reader._iframeWindow.eval(
            "document.getElementById('fix-popup')?.remove()"
          );

          // Reset UI elements
          this.resetElement(doc.querySelector(".toolbar"));
          this.resetElement(doc.querySelector("#split-view"));
          this.resetElement(doc.querySelector("#sidebarContainer"));
        }
      });

      this.states.annotationBar = !this.states.annotationBar;
    } catch (e) {
      this.log(`Error toggling annotation bar: ${e.message}`);
    }
  },

  // Helper to adjust element style
  adjustElement(element, property, value) {
    if (element) element.style[property] = value;
  },

  // Helper to reset element style
  resetElement(element) {
    if (element) element.removeAttribute("style");
  },

  toggleCombined(doc) {
    try {
      // If tab bar is visible and annotation bar is hidden,
      // only hide the tab bar without showing annotation bar
      if (this.states.tabBar && !this.states.annotationBar) {
        this.toggleTabBar(doc);
      }
      // If both are visible or both are hidden, toggle both
      else if ((this.states.tabBar && this.states.annotationBar) ||
              (!this.states.tabBar && !this.states.annotationBar)) {
        this.toggleTabBar(doc);
        this.toggleAnnotation();
      }
      // If tab bar is hidden and annotation bar is visible,
      // only show tab bar without hiding annotation bar
      else if (!this.states.tabBar && this.states.annotationBar) {
        this.toggleTabBar(doc);
      }

      this.log(`Combined toggle: tab bar ${this.states.tabBar ? 'visible' : 'hidden'}, ` +
               `annotation bar ${this.states.annotationBar ? 'visible' : 'hidden'}`);
    } catch (e) {
      this.log(`Error toggling combined tab bar and annotation bar: ${e.message}`);
    }
  },

  addToWindow(window, manualPopup = false) {
    try {
      // Use Fluent for localization
      window.MozXULElement.insertFTLIfNeeded("toggles.ftl");
      this.addMenuItems(window.document, manualPopup);
    } catch (e) {
      this.log(`Error adding to window: ${e.message}`);
    }
  },

  addToAllWindows() {
    try {
      // Add to existing windows
      const windows = Zotero.getMainWindows();
      for (let win of windows) {
        if (win.ZoteroPane) {
          this.addToWindow(win);
        }
      }

      // Add listener for new windows
      const windowListener = {
        onOpenWindow: (aWindow) => {
          const domWindow = aWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindow);

          domWindow.addEventListener("load", () => {
            this.addToWindow(domWindow, true);
          }, {once: true});
        }
      };

      Services.wm.addListener(windowListener);
    } catch (e) {
      this.log(`Error adding to all windows: ${e.message}`);
    }
  },

  storeAddedElement(elem) {
    if (!elem.id) {
      throw new Error("Element must have an id");
    }
    this.addedElementIDs.push(elem.id);
  },

  removeFromWindow(window) {
    try {
      const doc = window.document;

      // Remove all elements added to DOM
      for (let id of this.addedElementIDs) {
        const element = doc.getElementById(id);
        if (element) element.remove();
      }

      // Remove localization
      const ftlLink = doc.querySelector('[href="toggles.ftl"]');
      if (ftlLink) ftlLink.remove();
    } catch (e) {
      this.log(`Error removing from window: ${e.message}`);
    }
  },

  removeFromAllWindows() {
    // Clean up tab listener if it exists
    if (this.tabListener && Zotero.Tabs && typeof Zotero.Tabs.removeListener === 'function') {
      Zotero.Tabs.removeListener(this.tabListener);
    }

    // Clean up mutation observer if it exists
    if (this.tabObserver) {
      this.tabObserver.disconnect();
    }

    // Existing code
    const windows = Zotero.getMainWindows();
    for (let win of windows) {
      if (win.ZoteroPane) {
        this.removeFromWindow(win);
      }
    }
  },

  registerTabChangeListener() {
    try {
      // Method 1: Use Zotero's Tabs API
      if (Zotero.Tabs && typeof Zotero.Tabs.addListener === 'function') {
        this.tabListener = {
          onSelect: (tab) => {
            this.restoreUIElementsOnTabChange();
          }
        };
        Zotero.Tabs.addListener(this.tabListener);
        this.log("Tab change listener registered via API");
      }

      // Method 2: Enhanced keyboard shortcut monitoring for tab navigation
      const windows = Zotero.getMainWindows();
      for (let win of windows) {
        if (win.ZoteroPane) {
          // Monitor keyboard events at the capturing phase
          win.document.addEventListener('keydown', (event) => {
            // Check for tab navigation shortcuts (Cmd+Shift+[ or ], Cmd+number)
            if ((event.metaKey && event.shiftKey && (event.key === '[' || event.key === ']')) ||
                (event.metaKey && /^\d$/.test(event.key))) {
              // Longer delay to ensure tab change completes
              setTimeout(() => this.restoreUIElementsOnTabChange(), 50);
            }
          }, true);

          // Also watch for keyup events
          win.document.addEventListener('keyup', (event) => {
            if ((event.metaKey && event.shiftKey && (event.key === '[' || event.key === ']')) ||
                (event.metaKey && /^\d$/.test(event.key))) {
              setTimeout(() => this.restoreUIElementsOnTabChange(), 50);
            }
          }, true);

          // Method 3: Monitor tab element clicks directly
          const tabList = win.document.getElementById("zotero-tab-toolbar");
          if (tabList) {
            tabList.addEventListener('click', () => {
              setTimeout(() => this.restoreUIElementsOnTabChange(), 50);
            }, true);
          }

          // Method 4: Broader mutation observer for tab changes
          const mainWindow = win.document.getElementById("main-window");
          if (mainWindow) {
            const observer = new MutationObserver(() => {
              // Check if tab has changed by looking at the 'selected' attribute on tabs
              const selectedTab = win.document.querySelector('.tab[selected="true"]');
              if (selectedTab) {
                setTimeout(() => this.restoreUIElementsOnTabChange(), 50);
              }
            });

            // Observer configuration remains the same

            // Method 5: Use window's hashchange event
            win.addEventListener('hashchange', () => {
              setTimeout(() => this.restoreUIElementsOnTabChange(), 50);
            });
          }
        }
      }
    } catch (e) {
      this.log(`Error registering tab change listener: ${e.message}`);
    }
  },

  restoreUIElementsOnTabChange() {
    try {
      let uiChanged = false;
      const windows = Zotero.getMainWindows();

      // Restore tab bar if hidden
      if (!this.states.tabBar) {
        for (let win of windows) {
          if (win.ZoteroPane) {
            const titleBar = win.document.getElementById("zotero-title-bar");
            if (titleBar) {
              titleBar.removeAttribute("style");
              this.states.tabBar = true;
              uiChanged = true;
            }
          }
        }
      }

      // Restore annotation bar if hidden
      if (!this.states.annotationBar) {
        Zotero.Reader._readers.forEach(reader => {
          if (!reader || !reader._iframeWindow) return;

          const doc = reader._iframeWindow.document;

          // Restore annotation bar
          reader._iframeWindow.eval(
            "document.getElementById('fix-popup')?.remove()"
          );

          // Reset UI elements
          this.resetElement(doc.querySelector(".toolbar"));
          this.resetElement(doc.querySelector("#split-view"));
          this.resetElement(doc.querySelector("#sidebarContainer"));
        });

        this.states.annotationBar = true;
        uiChanged = true;
      }

      if (uiChanged) {
        this.log("UI elements automatically restored on tab change");
      }
    } catch (e) {
      this.log(`Error restoring UI elements on tab change: ${e.message}`);
    }
  },

  async main() {
    // Plugin initialization complete
    this.log("Toggle-Bars plugin initialized");
  }
};
