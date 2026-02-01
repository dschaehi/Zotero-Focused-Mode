window.FocusedMode_Preferences = {
	init: function () {
		Zotero.debug("Focused Mode: Initialize preference pane");

		const checkbox = document.getElementById("zotero-focused-mode_hide-annotation-bar");
		checkbox.addEventListener("click", (e) => {
      Zotero.debug("Focused Mode: toggled annotation pref: " + checkbox.checked);
      Zotero.Reader._readers.forEach(reader => {
        const doc = reader?._iframeWindow?.document?.documentElement;
        if (!doc) return;
        doc.dataset.hideAnnotationBar = checkbox.checked;
      })
		});

		const menuBarCheckbox = document.getElementById("zotero-focused-mode_hide-menu-bar");
		menuBarCheckbox.addEventListener("click", (e) => {
      Zotero.debug("Focused Mode: toggled menu bar pref: " + menuBarCheckbox.checked);
      // Apply/remove the permanent menu bar hide CSS to all windows using the Toggles module
      if (Zotero.FocusedModeToggles) {
        const windows = Zotero.getMainWindows();
        for (let win of windows) {
          if (win.ZoteroPane) {
            Zotero.FocusedModeToggles.applyPermanentMenuBarHide(win.document, menuBarCheckbox.checked);
          }
        }
      }
		});

	}
};
