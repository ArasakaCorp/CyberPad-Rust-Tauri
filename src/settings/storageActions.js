import { STORAGE_KEYS } from "./storageKeys.js";

function safeRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (err) {
        console.error(`Failed to remove storage key: ${key}`, err);
        return false;
    }
}

export function clearRecentFiles() {
    return safeRemove(STORAGE_KEYS.RECENT);
}

export function clearLastSession() {
    return safeRemove(STORAGE_KEYS.TABS_SESSION);
}

export function resetSettings() {
    let ok = true;
    ok = safeRemove(STORAGE_KEYS.SETTINGS) && ok;
    ok = safeRemove(STORAGE_KEYS.THEME) && ok;
    return ok;
}

export function resetAllAppData() {
    let ok = true;

    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (key.startsWith("cyberpad:")) {
            ok = safeRemove(key) && ok;
        }
    }

    return ok;
}