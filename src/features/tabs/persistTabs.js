// src/tabs/persistTabs.js
// ======================================================================
// Tabs persistence (minimal)
// - Persists open tabs and active tab between launches.
// - Stores content ONLY for scratch NOTE tabs (filePath === null).
// - Does NOT persist file content (autosave + disk are source of truth).
// ======================================================================

const KEY = "cyberpad:tabs:v1";
const MAX_SCRATCH_CHARS = 200_000; // protection

function clampText(s) {
    if (!s) return "";
    return s.length > MAX_SCRATCH_CHARS ? s.slice(0, MAX_SCRATCH_CHARS) : s;
}

export function persistTabsSnapshot(tabState) {
    const snap = tabState.getSnapshot();

    const tabs = (snap.tabs ?? [])
        .map(t => {
            const isScratch = !t.filePath;

            return {
                id: t.id,
                filePath: t.filePath ?? null,
                name: t.name ?? null,

                // keep scratch buffer; ignore file buffers
                scratch: isScratch ? clampText(t.content ?? "") : null,
            };
        })
        // keep: any file tab OR scratch that has some content
        .filter(t => t.filePath || (t.scratch && t.scratch.length));

    const payload = {
        v: 1,
        ts: Date.now(),
        activeId: snap.activeId ?? null,
        tabs,
    };

    localStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadPersistedTabsSnapshot() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.tabs)) return null;

        return parsed;
    } catch {
        return null;
    }
}

export function clearPersistedTabsSnapshot() {
    localStorage.removeItem(KEY);
}