import "./style.css";

import { renderLayout } from "./ui/layout.js";
import { getDom } from "./ui/dom.js";
import { createState } from "./ui/state.js";

import { initDrawer } from "./features/drawer.js";
import { initCounter } from "./features/counter.js";
import { initShortcuts } from "./features/shortcuts.js";

import { initWindowButtons, initOpenSave } from "./features/fileActions.js";
import { initAutosave } from "./features/autosave.js";
import { initRecent, pushRecent } from "./features/recentFiles.js";
import { initHistory } from "./features/history.js";
import { initDragDrop } from "./features/dragDrop.js";
import { initCredits } from "./features/credits.js";



const root = document.querySelector("#app");
renderLayout(root);


const dom = getDom();
const state = createState();
const history = initHistory(dom, state, { limit: 200, debounceMs: 300 });
history.reset("");

initWindowButtons(dom);
initDrawer(dom);
initCounter(dom);
initShortcuts(dom);
initCredits(dom, state);

initRecent(dom, state);

const autosave = initAutosave(dom, state, {
    debounceMs: 1200,
    intervalMs: 20000
});

const onOpened = (filePath) => {
    pushRecent(dom, filePath);
    autosave.setAutosaveState("idle");
    history.reset(dom.editor.value);
};

initOpenSave(dom, state, { onOpened });
initDragDrop(dom, state, { onOpened });