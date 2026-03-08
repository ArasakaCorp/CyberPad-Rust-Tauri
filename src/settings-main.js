import "./style.css";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { renderSettingsLayout } from "./ui/settingsLayout";
import { getSettingsDom } from "./ui/settingsDom";
import { initStorageActions } from "./settings/initStorageActions.js";

function switchPane(dom, paneName) {
    dom.navItems.forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.pane === paneName);
    });

    dom.panes.forEach((pane) => {
        const isActive = pane.dataset.paneView === paneName;
        pane.classList.toggle("is-active", isActive);
        pane.hidden = !isActive;
    });
}

function main() {
    const root = document.querySelector("#app");
    renderSettingsLayout(root);

    const dom = getSettingsDom();

    dom.navItems.forEach((btn) => {
        btn.addEventListener("click", () => switchPane(dom, btn.dataset.pane));
    });

    dom.closeBtn?.addEventListener("click", async () => {
        const win = getCurrentWindow();
        await win.close();
    });
    initStorageActions(dom);
}

main();