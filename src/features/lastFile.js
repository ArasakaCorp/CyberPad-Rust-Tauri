import { invoke } from "@tauri-apps/api/core";

const LAST_KEY = "cyberpad:lastFile";

function getLastFilePath() {
    return localStorage.getItem(LAST_KEY) || null;
}

function setLastFilePath(path) {
    if (!path) return;
    localStorage.setItem(LAST_KEY, path);
}

function clearLastFilePath() {
    localStorage.removeItem(LAST_KEY);
}

/**
 * initLastFile(dom, state, deps)
 *
 * deps:
 * - applyOpenedFile(dom, state, res): required
 * - onOpened(filePath): optional (your existing callback)
 * - autoOpen: boolean (default true)
 *
 * returns: { onOpened } (wrapped)
 */
export async function initLastFile(dom, state, deps = {}) {
    const applyOpenedFile = deps.applyOpenedFile;
    if (typeof applyOpenedFile !== "function") {
        throw new Error("initLastFile: deps.applyOpenedFile(dom, state, res) is required");
    }

    const prevOnOpened = deps.onOpened;
    const onOpened = (filePath) => {
        if (filePath) setLastFilePath(filePath);
        prevOnOpened?.(filePath);
    };

    const autoOpen = deps.autoOpen ?? true;
    if (!autoOpen) return { onOpened };

    const lastPath = getLastFilePath();
    if (!lastPath) return { onOpened };

    try {
        // Self-heal: if the file is gone, forget it
        try {
            const ok = await invoke("path_exists", { path: lastPath });
            if (!ok) {
                clearLastFilePath();
                return { onOpened };
            }
        } catch {
            // ignore existence-check errors
        }

        const res = await invoke("open_path", { path: lastPath });
        if (!res?.filePath) return { onOpened };

        if (deps.tabs) {
            deps.tabs.openPayloadInNewTab(res);
            onOpened(res.filePath);
        } else {
            applyOpenedFile(dom, state, res);
            onOpened(res.filePath);
        }

        return { onOpened };
    } catch {
        return { onOpened };
    }
}
