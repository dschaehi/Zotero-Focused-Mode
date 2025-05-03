Toggles = {
  id: null,
  version: null,
  rootURI: null,
  initialized: false,

  // Track UI states
  states: {
    tabBar: true,
    annotationBar: true,
    fullscreen: false,  // Add tracking for fullscreen state
    focused: false  // Add tracking for focused mode state
  },

  // Constants
  SHORTCUTS: {
    FOCUSED_MODE: {  // Single shortcut for focused mode
      mac: "f",     // Ctrl+Cmd+F on Mac
      other: "F11"  // F11 on Windows/Linux
    }
  },

  // Track added elements for cleanup
  addedElementIDs: [],
  registeredShortcuts: [],

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
   * Get platform information (Mac vs other)
   * @returns {boolean} True if Mac, false otherwise
   */
  getPlatform() {
    try {
      return Components.classes["@mozilla.org/xre/app-info;1"]
             .getService(Components.interfaces.nsIXULRuntime)
             .OS === "Darwin";
    } catch (e) {
      try {
        return Services.appinfo.OS === "Darwin";
      } catch (e2) {
        this.log("Platform detection failed, assuming Mac");
        return true;
      }
    }
  },

  /**
   * Add keyboard shortcut listener with simplified logic
   * @param {Document} doc - Document to attach listener to
   * @param {string|Object} key - Key to listen for, or object with platform-specific keys
   * @param {Function} callback - Function to call when shortcut triggered
   * @param {Object} options - Additional options
   */
  toggleListener(doc, key, callback, options = {}) {
    // Create a named function for the event handler so we can track it
    const keydownHandler = (event) => {
      // Get platform information
      const isMac = this.getPlatform();

      // Handle platform-specific keys
      let targetKey = key;
      if (typeof key === 'object') {
        targetKey = isMac ? key.mac : key.other;
      }

      // Always log shortcut attempts for debugging
      this.log(`Key pressed: ${event.key}, ctrl=${event.ctrlKey}, cmd=${event.metaKey}, platform=${isMac ? 'Mac' : 'Other'}`);

      // For Cmd+Ctrl+F on Mac
      if (isMac && targetKey === 'f' && options.requireCtrlCmd &&
          event.ctrlKey && event.metaKey && event.key.toLowerCase() === 'f') {
        this.log("✓ Mac Ctrl+Cmd+F shortcut matched");
        callback();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // For F11 on Windows/Linux
      if (!isMac && targetKey === 'F11' && options.f11Special &&
          event.key === 'F11') {
        this.log("✓ F11 shortcut matched on Windows/Linux");
        callback();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // For standard Ctrl+key shortcuts
      const keyMatch = event.key.toLowerCase() === targetKey.toLowerCase();
      if (keyMatch && event.ctrlKey &&
          ((isMac && options.requireCtrlCmd && event.metaKey) || // Mac with Cmd
           (!isMac && options.requireCtrlCmd) ||                // Windows/Linux with Ctrl
           (!options.requireCtrlCmd))) {                        // Plain Ctrl shortcut
        this.log(`✓ ${isMac ? 'Mac' : 'Windows/Linux'} shortcut matched for key: ${targetKey}`);
        callback();
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Add the event listener at document level
    doc.addEventListener('keydown', keydownHandler, true);

    // Store reference to the handler for cleanup
    this.registeredShortcuts = this.registeredShortcuts || [];
    this.registeredShortcuts.push({
      doc,
      handler: keydownHandler,
      key: typeof key === 'object' ?
        (this.getPlatform() ? key.mac : key.other) : key
    });
  },

  /**
   * Create menu item with associated command and shortcut
   */
  createMenuItem(doc, { id, l10nId, shortcutKey, callback, requireCtrlCmd = false, f11Special = false }) {
    const menuItem = doc.createXULElement('menuitem');
    menuItem.id = id;
    menuItem.setAttribute('data-l10n-id', l10nId);

    // Create a wrapper that logs execution and only runs when document is viewed
    const wrappedCallback = () => {
      const isViewing = this.isViewingDocument();
      this.log(`Menu item clicked: ${id}, document is being viewed: ${isViewing}`);

      // Remove this condition to make menu items work regardless of document view
      // if (!isViewing) return;

      callback();
    };

    menuItem.addEventListener('command', wrappedCallback);
    this.storeAddedElement(menuItem);

    // Add keyboard shortcut - always register it
    if (shortcutKey) {
      this.toggleListener(doc, shortcutKey, wrappedCallback, {
        requireCtrlCmd,
        f11Special
      });
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

      // Add focused mode + bars toggle
      const focusedModeCombinedCallback = () => {
        // Always allow focused mode toggle
        this.toggleFocusedModeCombined(doc);

        // Log that it was triggered
        this.log("Focused mode toggle triggered via menu/shortcut");
      };

      const focusedModeCombinedItem = this.createMenuItem(doc, {
        id: 'toggle-focused-combined',
        l10nId: 'toggle-focused-combined',
        shortcutKey: this.SHORTCUTS.FOCUSED_MODE,
        callback: focusedModeCombinedCallback,
        requireCtrlCmd: true,
        f11Special: true
      });
      viewPopup.appendChild(focusedModeCombinedItem);

      // Set up dynamic menu item state updating
      this.setupMenuItemUpdating(doc, [focusedModeCombinedItem]);
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

  toggleFocusedMode(window) {
    try {
      if (!window) {
        this.log("Error: No window provided to toggleFocusedMode");
        return;
      }

      // Toggle focused mode state (uses fullscreen under the hood)
      window.fullScreen = !window.fullScreen;
      this.states.focused = window.fullScreen;
      this.log(`Toggled focused mode: ${window.fullScreen ? 'enabled' : 'disabled'}`);
    } catch (e) {
      this.log(`Error toggling focused mode: ${e.message}`);
    }
  },

  toggleFocusedModeCombined(doc) {
    try {
      if (!doc) {
        this.log("Error: No document provided to toggleFocusedModeCombined");
        return;
      }

      // Get the window from document
      const window = doc.defaultView;

      // Toggle UI elements first
      this.toggleCombined(doc);

      // Then toggle focused mode
      this.toggleFocusedMode(window);

      this.log("Toggled focused mode with UI bars hidden");
    } catch (e) {
      this.log(`Error in focused mode combined toggle: ${e.message}`);
    }
  },

  /**
   * Check if a PDF document is currently being viewed
   * @returns {boolean} True if viewing a document, false otherwise
   */
  isViewingDocument() {
    try {
      // Simple and reliable method: check if we're in a reader tab
      if (Zotero.Tabs && Zotero.Tabs.selectedID) {
        const currentTabID = Zotero.Tabs.selectedID;
        const isReaderTab = currentTabID.startsWith('reader-');

        // Add more logging to debug what's happening
        this.log(`Current tab: ${currentTabID}, is reader tab: ${isReaderTab}`);

        return isReaderTab;
      }

      return false;
    } catch (e) {
      this.log(`Error in isViewingDocument: ${e.message}`);
      return false;
    }
  },

  /**
   * Update menu item state based on document viewing status - simplified
   */
  setupMenuItemUpdating(doc, menuItems) {
    // Keep items enabled all the time for now
    this.log("Menu items will remain enabled");

    // We could re-enable this later if needed
    /*
    const updateMenuItems = () => {
      const isViewing = this.isViewingDocument();
      for (const item of menuItems) {
        if (item) {
          item.disabled = false; // Always enabled for testing
        }
      }
    };

    // Initial update
    updateMenuItems();
    */
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

      // Clear menu update intervals
      if (this.menuUpdateIntervals) {
        for (let intervalId of this.menuUpdateIntervals) {
          window.clearInterval(intervalId);
        }
        this.menuUpdateIntervals = [];
      }

      // Remove keyboard event listeners
      if (this.registeredShortcuts) {
        for (let shortcut of this.registeredShortcuts) {
          if (shortcut.doc === doc && shortcut.handler) {
            doc.removeEventListener('keydown', shortcut.handler, true);
          }
        }
      }

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
            this.tabObserver = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                // Look for relevant changes to detect tab switching
                if (mutation.type === 'attributes' &&
                    (mutation.attributeName === 'selected' ||
                     mutation.attributeName === 'class')) {
                  setTimeout(() => this.restoreUIElementsOnTabChange(), 50);
                  break;
                }
              }
            });

            // Configure observer with appropriate options
            this.tabObserver.observe(mainWindow, {
              attributes: true,
              subtree: true,
              attributeFilter: ['selected', 'class']
            });

            this.log("Tab mutation observer configured");
          }

          // Method 5: Use window's hashchange event
          win.addEventListener('hashchange', () => {
            setTimeout(() => this.restoreUIElementsOnTabChange(), 50);
          });
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
              this.log("Tab bar restored on tab change");
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
        this.log("Annotation bar restored on tab change");
      }

      // Exit focused mode if enabled
      if (this.states.focused) {
        for (let win of windows) {
          if (win.ZoteroPane && win.fullScreen) {
            win.fullScreen = false;
            this.states.focused = false;
            uiChanged = true;
            this.log("Focused mode exited on tab change");
          }
        }
      }

      if (uiChanged) {
        this.log("UI elements and focused mode state automatically restored on tab change");
      }
    } catch (e) {
      this.log(`Error restoring UI elements on tab change: ${e.message}`);
    }
  },

  debugTabChangeHandling() {
    this.log("DEBUG: Testing tab change handling");
    this.log(`Current state - tabBar: ${this.states.tabBar}, annotationBar: ${this.states.annotationBar}, focused: ${this.states.focused}`);
    this.restoreUIElementsOnTabChange();
    this.log("DEBUG: Tab change handling test complete");
  },

  async main() {
    // Plugin initialization complete
    this.log("Toggle-Bars plugin initialized");
  }
};
