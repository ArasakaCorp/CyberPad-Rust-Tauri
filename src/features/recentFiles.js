import { invoke } from "@tauri-apps/api/core";
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

/**
 * Removes missing/deleted paths from recent list.
 * Runs on init to keep UI clean.
 */
async function pruneMissingRecent() {
    const list = loadRecent();
    if (!list.length) return list;

    // Check paths in parallel, but list is tiny anyway
    const checks = await Promise.all(list.map(async (p) => {
        try {
            const ok = await invoke("path_exists", { path: p });
            return ok ? p : null;
        } catch {
            // If existence check fails, keep it (conservative) OR drop it (strict).
            // I'd keep it to avoid accidental data loss on transient errors.
            return p;
        }
    }));

    const pruned = checks.filter(Boolean);

    if (pruned.length !== list.length) {
        saveRecent(pruned);
    }

    return pruned;
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
            if (!res) {
                // remove dead entry
                const list = loadRecent().filter(p => p !== filePath);
                saveRecent(list);
                renderRecent(dom);
                return;
            }

            dom.__applyOpenedFromRecent?.(res);
        });

        dom.recentList.appendChild(btn);
    }
}

export async function initRecent(dom, state) {
    dom.__applyOpenedFromRecent = (res) => applyOpenedFile(dom, state, res);

    // Prune missing entries first, then render
    await pruneMissingRecent();
    renderRecent(dom);
}