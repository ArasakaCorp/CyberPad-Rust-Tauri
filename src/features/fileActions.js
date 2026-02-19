import { fileNameFromPath } from "../ui/state.js";
import { updateCharCount } from "./counter.js";
import { closeDrawer } from "./drawer.js";
import { invoke } from "@tauri-apps/api/core"; // если v1, будет "@tauri-apps/api/tauri"

export function syncSaveState(dom, state) {
    // Save is always available; Save As is always available.
    dom.menuSave.disabled = false;
    dom.menuSaveAs.disabled = false;
}

export function applyOpenedFile(dom, state, res) {
    if (!res?.filePath) return;

    state.currentFilePath = res.filePath;
    state.dirty = false;

    const name = fileNameFromPath(res.filePath);
    dom.topFile.textContent = name;
    dom.topFile.dataset.fileName = name;

    dom.editor.value = res.content ?? "";
    updateCharCount(dom);

    syncSaveState(dom, state);
}

export function showSavedIndicator(dom) {
    // cancel previous timer if user saves quickly
    if (dom.__savedTimer) clearTimeout(dom.__savedTimer);

    const original = dom.topFile.dataset.fileName || dom.topFile.textContent || "NOTE.txt";

    dom.topFile.textContent = "SAVED";
    dom.topFile.classList.add("saved");

    dom.__savedTimer = setTimeout(() => {
        dom.topFile.textContent = original;
        dom.topFile.classList.remove("saved");
        dom.__savedTimer = null;
    }, 700);
}

export function initWindowButtons(dom) {
    dom.minBtn.addEventListener("click", () => void invoke("minimize_window"));
    dom.closeBtn.addEventListener("click", () => void invoke("close_app"));
}

export function initOpenSave(dom, state, { onOpened , tabs}) {
    dom.menuOpen.addEventListener("click", async () => {
        closeDrawer(dom);

        const res = await invoke("open_file_dialog");
        if (!res) return;

        const tab = tabs ? tabs.openPayloadInNewTab(res) : (applyOpenedFile(dom, state, res), null);
        onOpened?.(tab?.filePath ?? res.filePath);
    });

    dom.menuSave.addEventListener("click", async () => {
        closeDrawer(dom);

        // Save behaves like Save As if we don't have a target path yet
        if (!state.currentFilePath) {
            dom.menuSaveAs.click();
            return;
        }

        dom.menuSave.disabled = true;

        try {
            const res = await invoke("save_file", {
                path: state.currentFilePath,
                content: dom.editor.value,
            });

            if (res?.ok) {
                state.dirty = false;
                showSavedIndicator(dom);
            }
        } finally {
            syncSaveState(dom, state);
            dom.menuSave.disabled = false;
        }
    });

    dom.menuSaveAs.addEventListener("click", async () => {
        closeDrawer(dom);

        const suggestedName = state.currentFilePath
            ? fileNameFromPath(state.currentFilePath)
            : "NOTE.txt";

        dom.menuSaveAs.disabled = true;

        try {
            const res = await invoke("save_as_dialog", {
                suggestedName,
                content: dom.editor.value,
            });

            if (!res?.filePath) return;
            if (tabs) {
                const active = tabs.getActiveTab();
                if (active) {
                    active.filePath = res.filePath;
                    active.name = fileNameFromPath(res.filePath);
                    active.content = dom.editor.value;
                    active.dirty = false;

                    tabs.render(); // обновить полоски
                }
            }

            applyOpenedFile(dom, state, { filePath: res.filePath, content: dom.editor.value });
            showSavedIndicator(dom);
            onOpened?.(res.filePath);
        } finally {
            dom.menuSaveAs.disabled = false;
            syncSaveState(dom, state);
        }
    });


    // dirty tracking (базовое)
    dom.editor.addEventListener("input", () => {
        if (!state.currentFilePath) return;
        state.dirty = true;
        syncSaveState(dom, state);
    });

    dom.menuNew.addEventListener("click", () => {
        closeDrawer(dom);
        newNote(dom, state);
    });

    function newNote(dom, state) {
        // сброс состояния документа
        state.currentFilePath = null;
        state.dirty = false;

        // UI
        dom.topFile.textContent = "NOTE.txt";
        dom.topFile.dataset.fileName = "NOTE.txt";
        dom.editor.value = "";
        updateCharCount(dom);

        // кнопки
        syncSaveState(dom, state);
    }

}
