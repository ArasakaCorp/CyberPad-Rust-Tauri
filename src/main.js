import "./style.css";

import { renderLayout } from "./ui/layout.js";
import { getDom } from "./ui/dom.js";
import { createState } from "./ui/state.js";

import { initDrawer } from "./features/drawer.js";
import { initCounter, updateCharCount } from "./features/counter.js";
import { initShortcuts } from "./features/shortcuts.js";

import {initOpenSave, applyOpenedFile } from "./features/fileActions.js";
import { initAutosave } from "./features/autosave.js";
import { initRecent, pushRecent } from "./features/recentFiles.js";
import { initHistory } from "./features//history/history.js";
import { initDragDrop } from "./features/dragDrop.js";
import { initCredits } from "./features/credits.js";
import { initTabs } from "./features/tabs/TabsController.js";
import { loadTheme, applyTheme } from "./ui/themes.js";
import { initWindowButtons, initSettings, initSettingsEvents} from "./features/menu.js";
import { listen } from "@tauri-apps/api/event";


import { getCurrentWindow } from "@tauri-apps/api/window";

async function main() {
    const root = document.querySelector("#app");

    const theme = await loadTheme();
    applyTheme(theme);

    listen("theme:change", (event) => {
        applyTheme(event.payload);
    });

    renderLayout(root);


    const dom = getDom();
    const state = createState();


    initWindowButtons(dom);
    initDrawer(dom);
    initCounter(dom);
    dom.__updateCharCount = () => updateCharCount(dom);

    await initCredits(dom, state);
    await initRecent(dom, state);

    const tabs = await initTabs(dom, state, {
        onOpened: tab => pushRecent(dom, tab.filePath)
    });

    const history = initHistory(dom, tabs.__state, {
        limit: 200,
        debounceMs: 300,
    });

    initShortcuts(dom, tabs);

    const autosave = initAutosave(dom, state, {
        debounceMs: 1200,
        intervalMs: 20000,
        tabs,
    });

    const onOpened = (filePath) => {
        pushRecent(dom, filePath);
        autosave.setAutosaveState("idle");
        history.resetActive(dom.editor.value);
    };


    initOpenSave(dom, state, { onOpened, tabs });
    initDragDrop(dom, state, { onOpened, tabs });
    await initSettings(dom);
    await initSettingsEvents();
}

main();
