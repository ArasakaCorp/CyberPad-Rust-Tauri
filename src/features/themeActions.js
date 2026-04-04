import { applyTheme } from "../ui/themes.js";
import { emit } from "@tauri-apps/api/event";

const STORAGE_KEY = "cyberpad:theme";

function getSavedTheme() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

const REQUIRED_KEYS = [
    "--app-bg-rgb",
    "--panel-rgb",
    "--rail-rgb",
    "--text-rgb",
    "--text-editor-rgb",
    "--accent-rgb",
    "--header-color-rgb",
    "--success-rgb",
    "--warning-rgb",
    "--danger-rgb",
    "--shadow-rgb",
];

const DEFAULT_CUSTOM_THEME = {
    name: "Custom Theme",
    vars: {
        "--app-bg-rgb": "7, 11, 16",
        "--panel-rgb": "8, 16, 22",
        "--rail-rgb": "12, 12, 12",
        "--text-rgb": "207, 233, 242",
        "--text-editor-rgb": "51, 214, 255",
        "--accent-rgb": "51, 214, 255",
        "--header-color-rgb": "51, 214, 255",
        "--success-rgb": "51, 255, 204",
        "--warning-rgb": "255, 176, 0",
        "--danger-rgb": "255, 90, 90",
        "--shadow-rgb": "0, 0, 0",
    },
};

function isRgbTriple(value) {
    if (typeof value !== "string") return false;

    const parts = value.split(",").map((p) => p.trim());
    if (parts.length !== 3) return false;

    return parts.every((part) => {
        if (!/^\d+$/.test(part)) return false;
        const n = Number(part);
        return n >= 0 && n <= 255;
    });
}

function validateTheme(theme) {
    if (!theme || typeof theme !== "object") {
        return { ok: false, error: "Theme must be a JSON object." };
    }

    if (typeof theme.name !== "string" || !theme.name.trim()) {
        return { ok: false, error: 'Field "name" must be a non-empty string.' };
    }

    if (!theme.vars || typeof theme.vars !== "object" || Array.isArray(theme.vars)) {
        return { ok: false, error: 'Field "vars" must be an object.' };
    }

    for (const key of REQUIRED_KEYS) {
        if (!(key in theme.vars)) {
            return { ok: false, error: `Missing required key: ${key}` };
        }

        if (!isRgbTriple(theme.vars[key])) {
            return {
                ok: false,
                error: `Invalid value for ${key}. Expected string like "51, 214, 255".`,
            };
        }
    }

    return { ok: true };
}

function setStatus(dom, text, type = "") {
    if (!dom.themeJsonStatus) return;

    dom.themeJsonStatus.textContent = text;
    dom.themeJsonStatus.classList.remove("is-error", "is-success");

    if (type) {
        dom.themeJsonStatus.classList.add(type);
    }
}

function toggleCustomEditor(dom, show) {
    if (!dom.themeCustomWrap) return;
    dom.themeCustomWrap.hidden = !show;
}

function setActiveThemeCard(dom, activeThemeId) {
    if (!dom.themeCards) return;

    dom.themeCards.forEach((b) => {
        b.classList.toggle("is-active", b.dataset.theme === activeThemeId);
    });
}

async function applyPresetTheme(path) {
    const res = await fetch(path);
    const theme = await res.json();
    applyTheme(theme);
    await emit("theme:change", theme);
}

async function applyCustomTheme(dom) {
    try {
        const raw = dom.themeJsonEditor?.value?.trim();
        if (!raw) {
            setStatus(dom, "JSON is empty.", "is-error");
            return;
        }

        const theme = JSON.parse(raw);
        const validation = validateTheme(theme);

        if (!validation.ok) {
            setStatus(dom, validation.error, "is-error");
            return;
        }

        applyTheme(theme);
        await emit("theme:change", theme);
        setStatus(dom, `Applied: ${theme.name}`, "is-success");
    } catch (err) {
        setStatus(dom, `Invalid JSON: ${err.message}`, "is-error");
    }
}

export function initThemeActions(dom) {
    if (!dom.themeCards?.length) return;

    const savedTheme = getSavedTheme();
    const activeId = savedTheme?.name || "memory-shard";

    setActiveThemeCard(dom, activeId);
    toggleCustomEditor(dom, activeId === "custom-style");

    if (dom.themeJsonEditor && !dom.themeJsonEditor.value.trim()) {
        dom.themeJsonEditor.value = JSON.stringify(DEFAULT_CUSTOM_THEME, null, 2);
    }

    dom.themeCards.forEach((btn) => {
        btn.addEventListener("click", async () => {
            const themeId = btn.dataset.theme;

            if (themeId === "custom-style") {
                toggleCustomEditor(dom, true);
                setActiveThemeCard(dom, themeId);
                setStatus(dom, "Edit JSON and click Apply.");
                return;
            }

            toggleCustomEditor(dom, false);

            try {
                const res = await fetch(`./theme_${themeId}.json`);
                const theme = await res.json();

                localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
                setActiveThemeCard(dom, themeId);
                applyTheme(theme);
                await emit("theme:change", theme);
                setStatus(dom, "");
            } catch (err) {
                setStatus(dom, `Failed to load theme: ${err.message}`, "is-error");
            }
        });
    });

    dom.themeApplyBtn?.addEventListener("click", async () => {
        await applyCustomTheme(dom);
        setActiveThemeCard(dom, "custom-style");
        toggleCustomEditor(dom, true);
    });

    dom.themeResetBtn?.addEventListener("click", () => {
        if (!dom.themeJsonEditor) return;
        dom.themeJsonEditor.value = JSON.stringify(DEFAULT_CUSTOM_THEME, null, 2);
        setStatus(dom, "Default custom JSON restored.");
    });
}