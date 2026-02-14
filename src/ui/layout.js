import iconUrl from "../assets/icons/icon.png";

export function renderLayout(root) {
    root.innerHTML = `
    <div class="hud panel">
      <div class="dropOverlay" aria-hidden="true">DROP TO OPEN</div>
      <div class="noise"></div>
      <div class="hud-deco" aria-hidden="true"></div>

      <button id="openBtn" class="rail-btn" title="Open file"></button>

      <section class="content">
        <header class="header drag">
          <div class="header-title">
            <span class="chip-icon"><img src="${iconUrl}" alt=""></span>
            <span id="topFile" class="header-value">NONE</span>
          </div>

          <div class="header-actions no-drag">
            <button id="minBtn" class="wbtn min" title="Minimize">_</button>
            <button id="closeBtn" class="wbtn close" title="Close">X</button>
          </div>
        </header>

        <div id="drawer" class="drawer" aria-hidden="true">
          <div class="drawer-inner">
            <button id="menuNew" class="menu-item">NEW</button>
            <button id="menuOpen" class="menu-item">OPEN</button>
            <button id="menuSave" class="menu-item" disabled>SAVE</button>
            <button id="menuSaveAs" class="menu-item">SAVE AS…</button>

            <div class="drawer-sep"></div>

            <div class="recent">
              <div class="recent-title">RECENT</div>
              <div id="recentList" class="recent-list"></div>
            </div>

            <div class="creditsBar">
              <span id="creditsText"></span><a id="creditsLink" href="#">GitHub</a>
            </div>
          </div>
        </div>

        <div class="body">
          <textarea id="editor" spellcheck="false" placeholder="Open a file to begin..."></textarea>
          <div class="char-status" aria-hidden="true">
            <span id="autosaveStatus" class="autosave">AUTO</span>
            <span id="charCount" class="char-count">000000</span>
          </div>
        </div>
      </section>
    </div>
  `;
}
