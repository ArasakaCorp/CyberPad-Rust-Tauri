import { fileNameFromPath } from "../ui/state.js";
import { updateCharCount } from "./counter.js";
import { closeDrawer } from "./drawer.js";
import { invoke } from "@tauri-apps/api/core"; // если v1, будет "@tauri-apps/api/tauri"
import { UIStrings } from "../ui/UIStrings.js";


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
    if (dom.__savedTimer) clearTimeout(dom.__savedTimer);

    dom.topFile.dataset.savedText = UIStrings.STATUS_SAVED;
    dom.topFile.classList.add("saved");

    dom.__savedTimer = setTimeout(() => {
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

        const tab = tabs.openPayloadInNewTab(res);
        onOpened?.(tab?.filePath ?? res.filePath);
    });

    dom.menuSave.addEventListener("click", async () => {
        closeDrawer(dom);

        // If tabs exist, save active tab path or fallback to Save As
        const activeTab = tabs?.getActiveTab?.();

        const path = activeTab?.filePath ?? state.currentFilePath;
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
                // mark clean in BOTH systems
                if (tabs) {
                    // best: controller should expose markClean() already
                    tabs.markClean?.();
                }
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

        const activeTab = tabs?.getActiveTab?.();

        const suggestedName = (activeTab?.filePath ?? state.currentFilePath)
            ? fileNameFromPath(activeTab?.filePath ?? state.currentFilePath)
            : UIStrings.FILE_DEFAULT_NAME;

        dom.menuSaveAs.disabled = true;

        try {
            const res = await invoke("save_as_dialog", {
                suggestedName,
                content: dom.editor.value,
            });

            if (!res?.filePath) return;

            if (tabs) {
                // ✅ НУЖЕН метод applySavedPath в TabsController (см. ниже)
                tabs.applySavedPath?.(res.filePath);

                // если applySavedPath ещё не сделал, временный костыль:
                // activeTab.filePath = res.filePath; activeTab.name = fileNameFromPath(res.filePath);
                // tabs._forceSync?.(); // но лучше не надо
                tabs.markClean?.();
            } else {
                applyOpenedFile(dom, state, { filePath: res.filePath, content: dom.editor.value });
            }

            state.currentFilePath = res.filePath;
            state.dirty = false;

            showSavedIndicator(dom);
            onOpened?.(res.filePath);
        } finally {
            dom.menuSaveAs.disabled = false;
            syncSaveState(dom, state);
        }
    });


    // dirty tracking (базовое)
    dom.editor.addEventListener("input", () => {
        state.dirty = true;
        syncSaveState(dom, state);
    });

    dom.menuNew.addEventListener("click", () => {
        closeDrawer(dom);
        if (tabs) {
            tabs.newTab();
            syncSaveState(dom, state);
            return;
        }

        newNote(dom, state);
    });

    function newNote(dom, state) {
        // сброс состояния документа
        state.currentFilePath = null;
        state.dirty = false;

        // UI
        dom.topFile.textContent = UIStrings.FILE_DEFAULT_NAME;
        dom.topFile.dataset.fileName = UIStrings.FILE_DEFAULT_NAME;
        dom.editor.value = "";
        updateCharCount(dom);

        // кнопки
        syncSaveState(dom, state);
    }

}
