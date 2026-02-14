import { invoke } from "@tauri-apps/api/core"; // v2
import { fileNameFromPath } from "../ui/state.js";
import { closeDrawer } from "./drawer.js";
import { applyOpenedFile } from "./fileActions.js";

const RECENT_KEY = "cyberpad:recent";
const RECENT_MAX = 6;

function loadRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); }
    catch { return []; }
}

function saveRecent(list) {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export function pushRecent(dom, filePath) {
    if (!filePath) return;

    let list = loadRecent();
    list = list.filter(p => p !== filePath);
    list.unshift(filePath);
    list = list.slice(0, RECENT_MAX);

    saveRecent(list);
    renderRecent(dom);
}

export function renderRecent(dom) {
    const list = loadRecent();
    dom.recentList.innerHTML = "";

    if (!list.length) {
        dom.recentList.innerHTML = `<div class="recent-path">No recent files</div>`;
        return;
    }

    for (const filePath of list) {
        const name = fileNameFromPath(filePath);

        const btn = document.createElement("button");
        btn.className = "recent-item";
        btn.type = "button";
        btn.innerHTML = `
      <span>${name}</span>
      <span class="recent-path">${filePath}</span>
    `;

        btn.addEventListener("click", async () => {
            closeDrawer(dom);

            const res = await invoke("open_path", { path: filePath });
            if (!res) return;

            dom.__applyOpenedFromRecent?.(res); // hook, если нужно
        });

        dom.recentList.appendChild(btn);
    }
}

export function initRecent(dom, state) {
    // небольшой hook: чтобы recent мог открыть файл, не создавая циклов импорта
    dom.__applyOpenedFromRecent = (res) => applyOpenedFile(dom, state, res);

    renderRecent(dom);
}
