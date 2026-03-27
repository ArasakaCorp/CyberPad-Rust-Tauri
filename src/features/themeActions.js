import { applyTheme } from "../ui/themes.js";
import { emit } from "@tauri-apps/api/event";


const THEME_MAP = {
    "memory-shard": "/themes/theme_default.json",
    "militech-record": "/themes/theme_militech.json",
    "arasaka-log": "/themes/theme_arasaka.json",
    "petrochem-purist": "/themes/theme_petrochem.json",
};

export function initThemeActions(dom) {
    if (!dom.themeCards) return;

    dom.themeCards.forEach((btn) => {
        btn.addEventListener("click", async () => {
            const themeId = btn.dataset.theme;
            const path = THEME_MAP[themeId];

            if (!path) return;

            const res = await fetch(path);
            const theme = await res.json();

            applyTheme(theme);
            await emit("theme:change", theme);

            // визуально активная кнопка
            dom.themeCards.forEach((b) =>
                b.classList.toggle("is-active", b === btn)
            );
        });
    });
}