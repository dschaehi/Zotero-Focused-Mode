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

    // Register tab selection listener
    this.registerTabChangeListener();
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
            this.restoreTabBarIfHidden();
          }
        };
        Zotero.Tabs.addListener(this.tabListener);
        this.log("Tab change listener registered via API");
      }

      // Method 2: Enhanced keyboard shortcut monitoring for tab navigation
      const windows = Zotero.getMainWindows();
      for (let win of windows) {
        if (win.ZoteroPane) {
          // Monitor keyboard events at the capturing phase to catch them before they're processed
          win.document.addEventListener('keydown', (event) => {
            // Check for tab navigation shortcuts (Cmd+Shift+[ or ], Cmd+number)
            if ((event.metaKey && event.shiftKey && (event.key === '[' || event.key === ']')) ||
                (event.metaKey && /^\d$/.test(event.key))) {
              // Longer delay to ensure tab change completes
              setTimeout(() => this.restoreTabBarIfHidden(), 50);
            }
          }, true); // Using capture phase to get events early

          // Also watch for keyup to catch if user holds down the key
          win.document.addEventListener('keyup', (event) => {
            if ((event.metaKey && event.shiftKey && (event.key === '[' || event.key === ']')) ||
                (event.metaKey && /^\d$/.test(event.key))) {
              setTimeout(() => this.restoreTabBarIfHidden(), 50);
            }
          }, true);

          // Method 3: Monitor tab element clicks directly
          const tabList = win.document.getElementById("zotero-tab-toolbar");
          if (tabList) {
            tabList.addEventListener('click', () => {
              setTimeout(() => this.restoreTabBarIfHidden(), 50);
            }, true);
          }

          // Method 4: Broader mutation observer for tab changes
          const mainWindow = win.document.getElementById("main-window");
          if (mainWindow) {
            const observer = new MutationObserver(() => {
              // Check if tab has changed by looking at the 'selected' attribute on tabs
              const selectedTab = win.document.querySelector('.tab[selected="true"]');
              if (selectedTab) {
                setTimeout(() => this.restoreTabBarIfHidden(), 50);
              }
            });

            observer.observe(mainWindow, {
              attributes: true,
              attributeFilter: ['selected'],
              subtree: true,
              childList: true // Also watch for DOM structure changes
            });

            // Store observer for cleanup
            this.tabObserver = observer;
            this.log("Enhanced tab change observer registered");
          }

          // Method 5: Use window's hashchange event as tabs may update URL
          win.addEventListener('hashchange', () => {
            setTimeout(() => this.restoreTabBarIfHidden(), 50);
          });
        }
      }
    } catch (e) {
      this.log(`Error registering tab change listener: ${e.message}`);
    }
  },

  restoreTabBarIfHidden() {
    try {
      if (!this.states.tabBar) {
        const windows = Zotero.getMainWindows();
        for (let win of windows) {
          if (win.ZoteroPane) {
            const titleBar = win.document.getElementById("zotero-title-bar");
            if (titleBar) {
              titleBar.removeAttribute("style");
              this.states.tabBar = true;
              this.log("Tab bar automatically restored on tab change");
            }
          }
        }
      }
    } catch (e) {
      this.log(`Error restoring tab bar: ${e.message}`);
    }
  },

  async main() {
    // Plugin initialization complete
    this.log("Toggle-Bars plugin initialized");
  }
};
