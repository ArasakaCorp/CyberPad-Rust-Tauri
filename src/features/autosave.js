import { syncSaveState } from "./fileActions.js";
import { invoke } from "@tauri-apps/api/core";

export function initAutosave(dom, state, opts = {}) {

    const debounceMs = opts.debounceMs ?? 1200;
    const intervalMs = opts.intervalMs ?? 20000;

    const tabs = opts.tabs; // ← единственный источник правды

    let timer = null;
    let inFlight = false;
    let currentTabId = null;

    function setAutosaveState(mode) {

        dom.autosaveStatus.classList.remove("saving", "saved");

        if (mode === "saving") {
            dom.autosaveStatus.textContent = "AUTO…";
            dom.autosaveStatus.classList.add("saving");
        }

        else if (mode === "saved") {

            dom.autosaveStatus.textContent = "AUTO•";
            dom.autosaveStatus.classList.add("saved");

            setTimeout(() => {
                dom.autosaveStatus.textContent = "AUTO";
                dom.autosaveStatus.classList.remove("saved");
            }, 1200);
        }

        else {
            dom.autosaveStatus.textContent = "AUTO";
        }
    }

    async function autosaveNow() {

        const active = tabs?.getActiveTab?.();

        if (!active?.filePath || !active.dirty) return;
        if (inFlight && currentTabId === active.id) return;

        currentTabId = active.id;
        inFlight = true;

        setAutosaveState("saving");

        try {

            const res = await invoke("save_file", {
                path: active.filePath,
                content: dom.editor.value,
            });

            if (res?.ok) {

                active.dirty = false;

                state.currentFilePath = active.filePath;
                state.dirty = false;

                syncSaveState(dom, state);

                setAutosaveState("saved");
            }

            else {
                setAutosaveState("idle");
            }

        } finally {
            inFlight = false;
        }
    }

    function schedule() {

        const active = tabs?.getActiveTab?.();
        if (!active?.filePath) return;

        if (timer) clearTimeout(timer);

        timer = setTimeout(() => {
            timer = null;
            autosaveNow();
        }, debounceMs);
    }

    function resetAutosaveForTab(tabId) {

        currentTabId = tabId;
        inFlight = false;

        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        setAutosaveState("idle");
    }

    dom.editor.addEventListener("input", schedule);

    setInterval(() => {

        const active = tabs?.getActiveTab?.();

        if (active?.filePath && active.dirty) {
            autosaveNow();
        }

    }, intervalMs);

    return {
        autosaveNow,
        setAutosaveState,
        resetAutosaveForTab,
    };
}
