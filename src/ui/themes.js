export async function loadTheme() {
    //const saved = localStorage.getItem("cyberpad:theme");

    //if (saved) return JSON.parse(saved);

    // default
    //const res = await fetch("/themes/theme_default.json");

    //Militech
    //const res = await fetch("/themes/theme_militech.json");

    //Arasaka
    //const res = await fetch("/themes/theme_arasaka.json");

    //Arasaka
    const res = await fetch("/themes/theme_petrochem.json");

    const data = await res.json();
    console.log(data);

    return data;
}

export function applyTheme(theme, targetDocument = document) {
    const root = targetDocument.documentElement;

    if (!theme?.vars) return;

    for (const [k, v] of Object.entries(theme.vars)) {
        root.style.setProperty(k, v);
    }

    localStorage.setItem("cyberpad:theme", JSON.stringify(theme));
}