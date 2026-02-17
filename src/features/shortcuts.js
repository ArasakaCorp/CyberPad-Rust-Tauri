// shortcuts.js

/**
 * Initialize global keyboard shortcuts for the app.
 * Keeps init clean: all logic lives in dedicated handlers.
 */
export function initShortcuts(dom) {
    window.addEventListener("keydown", (e) => {
        // Order matters: most "dangerous" first
        if (handleBlockRefresh(e)) return;
        if (handleSaveShortcut(e, dom)) return;
        if (handleSaveAsShortcut(e, dom)) return;
        if (handleTabInsertion(e, dom)) return;
    });
}

/* =========================
   Key / platform utilities
   ========================= */

/** True if current platform looks like macOS. */
function isMacPlatform() {
    return navigator.platform.toLowerCase().includes("mac");
}

/** "Mod" key: Cmd on macOS, Ctrl everywhere else. */
function isModPressed(e) {
    return isMacPlatform() ? e.metaKey : e.ctrlKey;
}

/** Lowercased key helper (safe). */
function keyOf(e) {
    return (e.key || "").toLowerCase();
}

/* =========================
   Shortcut handlers
   ========================= */

/**
 * Blocks browser/webview refresh shortcuts (Ctrl+R / Cmd+R, optional F5).
 * Prevents app UI from disappearing/resetting in Tauri.
 */
function handleBlockRefresh(e) {
    const key = keyOf(e);
    const mod = isModPressed(e);

    const isRefreshCombo = (mod && key === "r") || key === "f5";
    if (!isRefreshCombo) return false;

    e.preventDefault();
    e.stopPropagation();
    return true;
}
/**
 * Save shortcut (Mod+S).
 * Delegates to the UI "Save" action to keep behavior centralized.
 */
function handleSaveShortcut(e, dom) {
    const key = keyOf(e);
    const mod = isModPressed(e);

    // Mod+S, but NOT Mod+Shift+S (that's Save As)
    const isSave = mod && !e.shiftKey && key === "s";
    if (!isSave) return false;

    e.preventDefault();
    dom.menuSave?.click();
    return true;
}

/**
 * Save As shortcut (Mod+Shift+S).
 */
function handleSaveAsShortcut(e, dom) {
    const key = keyOf(e);
    const mod = isModPressed(e);

    const isSaveAs = mod && e.shiftKey && key === "s";
    if (!isSaveAs) return false;

    e.preventDefault();
    dom.menuSaveAs?.click();
    return true;
}

/**
 * Inserts TAB into the editor instead of focus-jumping.
 * Only triggers when the editor has focus.
 */
function handleTabInsertion(e, dom) {
    const key = keyOf(e);
    if (key !== "tab") return false;

    const editor = getEditorElement(dom);
    if (!editor) return false;

    if (!isEditorFocused(editor)) return false;

    e.preventDefault();

    if (editor instanceof HTMLTextAreaElement) {
        insertTextIntoTextarea(editor, "\t");
        return true;
    }

    if (editor instanceof HTMLElement && editor.isContentEditable) {
        insertTextIntoContentEditable("\t");
        return true;
    }

    return false;
}

/* =========================
   Editor helpers
   ========================= */

/**
 * Returns the main editor element from dom.
 * Change priority/order if your dom uses different naming.
 */
function getEditorElement(dom) {
    return dom.editor ?? dom.textarea ?? dom.editorEl ?? null;
}

/** Checks whether the given editor element is the currently focused element. */
function isEditorFocused(editorEl) {
    return document.activeElement === editorEl;
}

/**
 * Inserts text into a textarea at current selection, preserving caret,
 * and fires "input" event to notify dirty/autosave logic.
 */
function insertTextIntoTextarea(textarea, text) {
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const value = textarea.value ?? "";

    textarea.value = value.slice(0, start) + text + value.slice(end);

    const caret = start + text.length;
    textarea.selectionStart = textarea.selectionEnd = caret;

    textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Inserts text into contenteditable (fallback). */
function insertTextIntoContentEditable(text) {
    // execCommand is deprecated but still widely supported in webviews.
    // If you later move to a custom editor engine, replace this.
    document.execCommand("insertText", false, text);
}
