export async function loadTheme() {
    const saved = localStorage.getItem("cyberpad:theme");

    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.warn("Failed to parse saved theme", e);
        }
    }

    // fallback
    const res = await fetch("/themes/theme_default.json");
    return await res.json();
}

export function applyTheme(theme, targetDocument = document) {
    const root = targetDocument.documentElement;

    if (!theme?.vars) return;

    for (const [k, v] of Object.entries(theme.vars)) {
        root.style.setProperty(k, v);
    }

    localStorage.setItem("cyberpad:theme", JSON.stringify(theme));
}