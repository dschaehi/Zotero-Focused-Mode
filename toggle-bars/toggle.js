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
    TAB_BAR: "t",
    ANNOTATION_BAR: "a",
    SIDEBAR: "b",
    COMBINED: "h"  // New combined shortcut
  },

  // Track added elements for cleanup
  addedElementIDs: [],

  init({ id, version, rootURI }) {
    if (this.initialized) return;
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
    this.initialized = true;
  },

  log(msg) {
    Zotero.debug("Toggle-Bars: " + msg);
  },

  /**
   * Add keyboard shortcut listener
   * @param {Document} doc - Document to attach listener to
   * @param {string} key - Key to listen for
   * @param {Function} callback - Function to call when shortcut triggered
   * @param {Object} options - Additional options
   */
  toggleListener(doc, key, callback, options = {}) {
    doc.addEventListener('keydown', (event) => {
      // Check for Ctrl+Cmd+key combination
      if (options.requireCtrlCmd) {
        if (event.ctrlKey && event.metaKey && event.key === key) {
          callback();
          event.preventDefault();
        }
      }
      // Original behavior - just Ctrl+key
      else if (event.ctrlKey && event.key === key) {
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

      // Tab Bar Toggle
      const tabBarCallback = () => this.toggleTabBar(doc);
      const tabBarItem = this.createMenuItem(doc, {
        id: 'toggle-tab',
        l10nId: 'toggle-tab',
        shortcutKey: this.SHORTCUTS.TAB_BAR,
        callback: tabBarCallback
      });
      viewPopup.appendChild(tabBarItem);

      // Annotation Tool Bar Toggle
      const annotationCallback = () => this.toggleAnnotation();
      const annotationItem = this.createMenuItem(doc, {
        id: 'toggle-ann',
        l10nId: 'toggle-ann',
        shortcutKey: this.SHORTCUTS.ANNOTATION_BAR,
        callback: annotationCallback
      });
      viewPopup.appendChild(annotationItem);

      // Sidebar toggle
      const sidebarCallback = () => this.toggleSidebar();
      const sidebarItem = this.createMenuItem(doc, {
        id: 'toggle-sidebar',
        l10nId: 'toggle-sidebar',
        shortcutKey: this.SHORTCUTS.SIDEBAR,
        callback: sidebarCallback
      });
      viewPopup.appendChild(sidebarItem);

      // Combined tab bar and annotation bar toggle
      const combinedCallback = () => this.toggleCombined(doc);
      const combinedItem = this.createMenuItem(doc, {
        id: 'toggle-combined',
        l10nId: 'toggle-combined',
        shortcutKey: this.SHORTCUTS.COMBINED,
        callback: combinedCallback,
        requireCtrlCmd: true  // Require both Ctrl and Cmd keys
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

  toggleSidebar() {
    try {
      Zotero.Reader._readers.forEach(reader => {
        if (reader && typeof reader.toggleSidebar === 'function') {
          reader.toggleSidebar();
        }
      });
    } catch (e) {
      this.log(`Error toggling sidebar: ${e.message}`);
    }
  },

  toggleCombined(doc) {
    try {
      this.toggleTabBar(doc);
      this.toggleAnnotation();
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
    const windows = Zotero.getMainWindows();
    for (let win of windows) {
      if (win.ZoteroPane) {
        this.removeFromWindow(win);
      }
    }
  },

  async main() {
    // Plugin initialization complete
    this.log("Toggle-Bars plugin initialized");
  }
};
