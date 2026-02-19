import { syncSaveState } from "./fileActions.js";
import { invoke } from "@tauri-apps/api/core";

export function initAutosave(dom, state, opts = {}) {
    const debounceMs = opts.debounceMs ?? 1200;
    const intervalMs = opts.intervalMs ?? 20000;

    let timer = null;
    let inFlight = false;

    function setAutosaveState(mode) {
        dom.autosaveStatus.classList.remove("saving", "saved");

        if (mode === "saving") {
            dom.autosaveStatus.textContent = "AUTO…";
            dom.autosaveStatus.classList.add("saving");
        } else if (mode === "saved") {
            dom.autosaveStatus.textContent = "AUTO•";
            dom.autosaveStatus.classList.add("saved");
            setTimeout(() => {
                dom.autosaveStatus.textContent = "AUTO";
                dom.autosaveStatus.classList.remove("saved");
            }, 1200);
        } else {
            dom.autosaveStatus.textContent = "AUTO";
        }
    }

    async function autosaveNow() {
        if (!(state.currentFilePath && state.dirty)) return;
        if (inFlight) return;

        inFlight = true;
        setAutosaveState("saving");

        try {
            const active = tabs?.getActiveTab?.();
            if (!active?.filePath || !active.dirty) return;

            const res = await invoke("save_file", {
                path: state.currentFilePath,
                content: dom.editor.value,
            });

            if (res?.ok) {
                state.dirty = false;
                syncSaveState(dom, state);
                setAutosaveState("saved");
            } else {
                setAutosaveState("idle");
            }
        } finally {
            inFlight = false;
        }
    }

    function schedule() {
        if (!state.currentFilePath) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            void autosaveNow();
        }, debounceMs);
    }

    dom.editor.addEventListener("input", () => {
        if (!state.currentFilePath) return;
        schedule();
    });

    setInterval(() => {
        if (state.currentFilePath && state.dirty) void autosaveNow();
    }, intervalMs);

    return { autosaveNow, setAutosaveState };
}
