window.FocusedMode_Preferences = {
	init: function () {
		Zotero.debug("Toggle Bars: Initialize preference pane");

		const checkbox = document.getElementById("zotero-focused-mode_hide-annotation-bar");
		checkbox.addEventListener("click", (e) => {
      Zotero.debug("Toggle Bars: toggled annotation pref: " + checkbox.checked);
      Zotero.Reader._readers.forEach(reader => {
        const doc = reader?._iframeWindow?.document?.documentElement;
        if (!doc) return;
        doc.dataset.hideAnnotationBar = checkbox.checked;
      })
		});

	}
};
