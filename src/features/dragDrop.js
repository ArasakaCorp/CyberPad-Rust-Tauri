import { applyOpenedFile } from "./fileActions.js";
import { closeDrawer } from "./drawer.js";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";

export function initDragDrop(dom, state, { onOpened } = {}) {
    const hud = document.querySelector(".hud.panel");

    function setDragUI(on) {
        if (!hud) return;
        hud.classList.toggle("dragging", on);
    }

    async function openByPath(filePath) {
        closeDrawer(dom);

        const res = await invoke("open_path", { path: filePath });
        if (!res) return;

        applyOpenedFile(dom, state, res);
        onOpened?.(res.filePath);
    }

    (async () => {
        const webview = getCurrentWebview();

        await webview.onDragDropEvent((event) => {
            const p = event.payload;

            if (p.type === "over") {
                setDragUI(true);
                return;
            }

            if (p.type === "cancel") {
                setDragUI(false);
                return;
            }

            if (p.type === "drop") {
                setDragUI(false);
                const filePath = p.paths?.[0];
                if (filePath) {
                    void openByPath(filePath);
                }
            }
        });
    })();
}
