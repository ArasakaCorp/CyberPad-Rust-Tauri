import { applyTheme } from "../ui/themes.js";
import { emit } from "@tauri-apps/api/event";


const THEME_MAP = {
    "memory-shard": "/themes/theme_memory-shard.json",
    "militech-record": "/themes/theme_militech-record.json",
    "arasaka-log": "/themes/theme_arasaka-log.json",
    "petrochem-purist": "/themes/theme_petrochem-purist.json",
};

const STORAGE_KEY = "cyberpad:theme";

function setActiveThemeCard(dom, activeId) {
    dom.themeCards.forEach(btn => {
        btn.classList.toggle("is-active", btn.dataset.theme === activeId);
    });
}

function getSavedTheme() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function initThemeActions(dom) {
    if (!dom.themeCards) return;

    const savedTheme = getSavedTheme();
    const activeId = savedTheme?.name || "memory-shard";

    setActiveThemeCard(dom, activeId);

    dom.themeCards.forEach(btn => {
        btn.addEventListener("click", async () => {
            const themeId = btn.dataset.theme;

            const res = await fetch(`/themes/theme_${themeId}.json`);
            const theme = await res.json();

            localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
            setActiveThemeCard(dom, themeId);
            applyTheme(theme);
            await emit("theme:change", theme);
        });
    });
}