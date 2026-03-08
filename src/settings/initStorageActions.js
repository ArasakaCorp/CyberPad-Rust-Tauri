import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { confirm } from "@tauri-apps/plugin-dialog";

import {
    resetAllAppData,
} from "./storageActions.js";

function notify(message) {
    console.log(message);
}

async function notifyMain(type, payload = {}) {
    const main = await WebviewWindow.getByLabel("main");
    if (!main) return;

    await main.emit(type, payload);
}


export function initStorageActions(dom) {
    dom.resetAllBtn?.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const confirmed = await confirm(
            "Reset all CyberPad app data? This cannot be undone.",
            { title: "CyberPad", kind: "warning" }
        );

        if (!confirmed) return;

        const ok = resetAllAppData();
        notify(ok ? "All app data reset." : "Failed to reset app data.");

        if (ok) {
            await notifyMain("storage:reload");
        }
    });
}