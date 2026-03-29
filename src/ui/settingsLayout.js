export function renderSettingsLayout(root) {
    root.innerHTML = `
      <div class="app-shell settings-shell">
        <div class="hud panel settings-panel">
          <header class="settings-header drag">
            <div class="header-title">
              <span class="header-value">SETTINGS</span>
            </div>

            <div class="header-actions no-drag">
              <button id="settingsCloseBtn" class="wbtn close" title="Close">X</button>
            </div>
          </header>

          <div class="settings-body">
            <aside class="settings-nav no-drag">
              <button class="settings-nav-item is-active" data-pane="shortcuts">SHORTCUTS</button>
              <button class="settings-nav-item" data-pane="storage">STORAGE</button>
              <button class="settings-nav-item" data-pane="themes">THEMES</button>
              <button class="settings-nav-item" data-pane="about">ABOUT</button>
            </aside>

            <main class="settings-content">
            <section class="settings-pane is-active" data-pane-view="shortcuts">
              <h2>Shortcuts</h2>
              <div class="settings-list">
                <div class="settings-row"><span>Ctrl + N</span><span>New tab</span></div>
                <div class="settings-row"><span>Ctrl + W</span><span>Close active tab</span></div>
                <div class="settings-row"><span>Ctrl + S</span><span>Save</span></div>
                <div class="settings-row"><span>Ctrl + Shift + S</span><span>Save as</span></div>
                <div class="settings-row"><span>Ctrl + O</span><span>Open file</span></div>
                <div class="settings-row"><span>Alt + Left</span><span>Previous tab</span></div>
                <div class="settings-row"><span>Alt + Right</span><span>Next tab</span></div>
                <div class="settings-row"><span>Double click tab</span><span>Close tab</span></div>
                <div class="settings-row"><span>Drag &amp; drop</span><span>Open files in new tab</span></div>
              </div>
            </section>

              <section class="settings-pane" data-pane-view="storage" hidden>
                <h2>Storage</h2>
                <div class="settings-actions">
                 <button id="resetAllBtn" class="menu-item danger" type="button">RESET ALL APP DATA</button>
                </div>
              </section>

            <section class="settings-pane" data-pane-view="themes" hidden>
              <h2>Themes</h2>
            
              <div class="theme-grid">
                <button class="theme-card is-active" data-theme="memory-shard">Memory Shard</button>
                <button class="theme-card" data-theme="militech-record">Militech Record</button>
                <button class="theme-card" data-theme="arasaka-log">Arasaka Log</button>
                <button class="theme-card" data-theme="petrochem-purist">Petrochem Purist</button>
                <button class="theme-card theme-card-custom" data-theme="custom-style">Custom Style</button>
              </div>
            
              <div class="theme-custom-wrap" hidden data-theme-custom-wrap>
                <div class="theme-custom-head">
                  <div class="theme-custom-title">Custom Theme JSON</div>
                  <a
                    href="#"
                    class="theme-lab-link"
                    data-theme-lab-link
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Theme Lab
                  </a>
                </div>
            
                <textarea
                  class="theme-json-editor"
                  data-theme-json-editor
                  spellcheck="false"
                >{
              "name": "Custom Theme",
              "vars": {
                "--app-bg-rgb": "7, 11, 16",
                "--panel-rgb": "8, 16, 22",
                "--rail-rgb": "12, 12, 12",
                "--text-rgb": "207, 233, 242",
                "--text-editor-rgb": "51, 214, 255",
                "--accent-rgb": "51, 214, 255",
                "--header-color-rgb": "51, 214, 255",
                "--success-rgb": "51, 255, 204",
                "--warning-rgb": "255, 176, 0",
                "--danger-rgb": "255, 90, 90",
                "--shadow-rgb": "0, 0, 0"
              }
            }</textarea>
            
                <div class="theme-custom-actions">
                  <button class="settings-btn settings-actions menu-item settings-nav-item" type="button" data-theme-apply-btn>Apply</button>
                  <button class="settings-btn settings-btn-ghost settings-actions menu-item settings-nav-item" type="button" data-theme-reset-btn>
                    Reset
                  </button>
                </div>
            
                <p class="theme-json-status" data-theme-json-status></p>
              </div>
            </section>

              <section class="settings-pane" data-pane-view="about" hidden>
                <h2>About</h2>
                <div class="settings-list">
                  <div class="settings-row"><span>App</span><span>CyberPad</span></div>
                  <div class="settings-row"><span>Version</span><span>v0.1.3</span></div>
                  <div class="settings-row"><span>Author</span><span>Nutcracker</span></div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    `;
}