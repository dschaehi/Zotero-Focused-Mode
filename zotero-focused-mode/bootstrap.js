var Toggles;

function log(msg) {
  Zotero.debug("Toggle Bars: " + msg);
}

function install() {
  log("Installed 2.0");
}

async function startup({ id, version, rootURI }) {
  log("Starting 2.0");

  Zotero.PreferencePanes.register({
    pluginID: 'togglebars@example.com',
    src: rootURI + 'preferences.xhtml',
    scripts: [rootURI + 'preferences.js']
  });

  Services.scriptloader.loadSubScript(rootURI + 'toggle.js');
  Toggles.init({ id, version, rootURI });
  Toggles.addToAllWindows();
  await Toggles.main();
}

function onMainWindowLoad({ window }) {
  Toggles.addToWindow(window);
}

function onMainWindowUnload({ window }) {
  Toggles.removeFromWindow(window);
}

function shutdown() {
  log("Shutting down 2.0");
  Toggles.removeFromAllWindows();
  Toggles = undefined;
}

function uninstall() {
  log("Uninstalled 2.0");
}
