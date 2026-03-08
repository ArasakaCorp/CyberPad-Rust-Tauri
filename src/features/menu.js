import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

export async function openSettingsWindow() {
    const existing = await WebviewWindow.getByLabel("settings");

    if (existing) {
        await existing.setFocus();
        return;
    }

    const win = new WebviewWindow("settings", {
        url: "/settings.html",
        title: "CyberPad Settings",
        width: 920,
        height: 640,
        resizable: true,
        center: true,
        decorations: false,
        transparent: true,
    });

    win.once("tauri://created", () => {
        console.log("settings window created");
    });

    win.once("tauri://error", (e) => {
        console.error("settings window error", e);
    });
}

export async function closeSettingsWindowIfOpen() {
    const settings = await WebviewWindow.getByLabel("settings");
    if (settings) {
        try {
            await settings.close();
        } catch (err) {
            console.error("Failed to close settings window", err);
        }
    }
}

export function initWindowButtons(dom) {
    dom.minBtn.addEventListener("click", () => void invoke("minimize_window"));
    dom.closeBtn?.addEventListener("click", async () => {
        await closeSettingsWindowIfOpen();

        const main = getCurrentWindow();
        await main.close();
    });
}

export async function initSettings(dom){
    dom.menuSettings?.addEventListener("click", () => {
        openSettingsWindow().catch(console.error);
    });
}

export async function initSettingsEvents() {
    const win = getCurrentWindow();

    await win.listen("storage:reload", async () => {
        window.location.reload();
    });

}