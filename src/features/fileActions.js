import { fileNameFromPath } from "../ui/state.js";
import { updateCharCount } from "./counter.js";
import { closeDrawer } from "./drawer.js";
import { invoke } from "@tauri-apps/api/core";
import { UIStrings } from "../ui/UIStrings.js";


export function applyOpenedFile(dom, state, res) {
    if (!res?.filePath) return;

    const name = fileNameFromPath(res.filePath);
    dom.topFile.textContent = name;
    dom.topFile.dataset.fileName = name;

    dom.editor.value = res.content ?? "";
    updateCharCount(dom);
}

export function showSavedIndicator(dom) {
    if (dom.__savedTimer) clearTimeout(dom.__savedTimer);

    dom.topFile.dataset.savedText = UIStrings.STATUS_SAVED;
    dom.topFile.classList.add("saved");

    dom.__savedTimer = setTimeout(() => {
        dom.topFile.classList.remove("saved");
        dom.__savedTimer = null;
    }, 700);
}

export function initOpenSave(dom, state, { onOpened , tabs}) {
    dom.menuOpen.addEventListener("click", async () => {
        closeDrawer(dom);

        const res = await invoke("open_file_dialog");
        if (!res) return;

        const tab = tabs.openPayloadInNewTab(res);
        onOpened?.(tab?.filePath ?? res.filePath);
    });

    dom.menuSave.addEventListener("click", async () => {
        closeDrawer(dom);

        // If tabs exist, save active tab path or fallback to Save As
        const activeTab = tabs?.getActiveTab?.();
        const path = activeTab?.filePath;

        if (!path) {
            dom.menuSaveAs.click();
            return;
        }

        dom.menuSave.disabled = true;

        try {
            const res = await invoke("save_file", {
                path,
                content: dom.editor.value,
            });

            if (res?.ok) {
                tabs.markClean?.();
                showSavedIndicator(dom);
            }
        } finally {
            dom.menuSave.disabled = false;
        }
    });

    dom.menuSaveAs.addEventListener("click", async () => {
        closeDrawer(dom);

        const activeTab = tabs?.getActiveTab?.();

        const suggestedName = activeTab?.filePath
            ? fileNameFromPath(activeTab?.filePath ?? state.currentFilePath)
            : UIStrings.FILE_DEFAULT_NAME;

        dom.menuSaveAs.disabled = true;

        try {
            const res = await invoke("save_as_dialog", {
                suggestedName,
                content: dom.editor.value,
            });

            if (!res?.filePath) return;

            tabs.applySavedPath?.(res.filePath);
            tabs.markClean?.();

            showSavedIndicator(dom);
            onOpened?.(res.filePath);
        } finally {
            dom.menuSaveAs.disabled = false;
        }
    });


    // dirty tracking (базовое)
    dom.editor.addEventListener("input", () => {
        const active = tabs?.getActiveTab?.();
        if (active) {
            active.dirty = true;
            active.content = dom.editor.value;
        }
    });

    dom.menuNew.addEventListener("click", () => {
        closeDrawer(dom);
        tabs.newTab();
    });
}
