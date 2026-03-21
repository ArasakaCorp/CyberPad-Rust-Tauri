// shortcuts.js

/**
 * Tracks Alt state manually.
 * Required because Windows sends ArrowLeft/Right without altKey=true.
 */
let altPressed = false;

/**
 * Initialize global keyboard shortcuts for the app.
 * Keeps init clean: all logic lives in dedicated handlers.
 */
export function initShortcuts(dom, tabs) {
    if (!dom) {
        console.warn("Shortcuts: dom missing");
        return;
    }

    window.addEventListener("keydown", (e) => {
        if (e.code === "AltLeft" || e.code === "AltRight") {
            altPressed = true;
            return;
        }

        if (handleBlockRefresh(e)) return;

        if (tabs && handleNextTabShortcut(e, tabs)) return;
        if (tabs && handlePrevTabShortcut(e, tabs)) return;
        if (tabs && handleCloseTabShortcut(e, tabs)) return;
        if (tabs && handleNewTabShortcut(e, tabs)) return;

        if (handleOpenShortcut(e, dom)) return;
        if (handleSaveShortcut(e, dom)) return;
        if (handleSaveAsShortcut(e, dom)) return;
        if (handleTabInsertion(e, dom)) return;
    }, { capture: true });

    window.addEventListener("keyup", (e) => {
        if (e.code === "AltLeft" || e.code === "AltRight") {
            altPressed = false;
        }
    }, true);
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

function isCode(e, code) {
    return e.code === code;
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

    const isRefreshCombo = (mod && (isCode(e, "KeyR") || key === "r")) || key === "f5";
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
    const mod = isModPressed(e);

    const isSave = mod && !e.shiftKey && isCode(e, "KeyS");
    if (!isSave) return false;

    e.preventDefault();
    dom.menuSave?.click();
    return true;
}

/**
 * Save As shortcut (Mod+Shift+S).
 */
function handleSaveAsShortcut(e, dom) {
    const mod = isModPressed(e);

    const isSaveAs = mod && e.shiftKey && isCode(e, "KeyS");
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
    if (e.code !== "Tab") return false;

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
    document.execCommand("insertText", false, text);
}

/**
 * New tab shortcut (Mod+N).
 */
function handleNewTabShortcut(e, tabs) {
    const mod = isModPressed(e);

    const isNewTab = mod && !e.shiftKey && isCode(e, "KeyN");
    if (!isNewTab) return false;

    e.preventDefault();
    tabs?.newTab?.();

    return true;
}

/**
 * Open file shortcut (Mod+O).
 * Delegates to UI open button to keep logic centralized.
 */
function handleOpenShortcut(e, dom) {
    const mod = isModPressed(e);

    const isOpen = mod && isCode(e, "KeyO");
    if (!isOpen) return false;

    e.preventDefault();
    dom.menuOpen?.click();
    return true;
}

/**
 * Close active tab (Mod+W).
 */
function handleCloseTabShortcut(e, tabs) {
    const mod = isModPressed(e);

    const isCloseTab = mod && !e.shiftKey && e.code === "KeyW";
    if (!isCloseTab) return false;

    e.preventDefault();

    const active = tabs?.getActiveTab?.();
    if (!active) return true;

    tabs.closeTab?.(active.id);

    return true;
}

/**
 * Switch to next tab (Alt+Right).
 * Uses e.code for layout-independent detection.
 */
function handleNextTabShortcut(e, tabs) {
    if (!altPressed) return false;
    if (!isCode(e, "ArrowRight")) return false;

    e.preventDefault();
    e.stopPropagation();

    switchRelativeTab(tabs, +1);

    return true;
}

/**
 * Switch to previous tab (Alt+Left).
 */
function handlePrevTabShortcut(e, tabs) {
    if (!altPressed) return false;
    if (!isCode(e, "ArrowLeft")) return false;

    e.preventDefault();
    e.stopPropagation();

    switchRelativeTab(tabs, -1);

    return true;
}

/**
 * Switch tab relative to current index.
 */
function switchRelativeTab(tabs, delta) {
    const list = tabs?.getAllTabs?.();
    const active = tabs?.getActiveTab?.();

    if (!list?.length || !active) return;

    const idx = list.findIndex((t) => t.id === active.id);
    if (idx === -1) return;

    const nextIdx = (idx + delta + list.length) % list.length;

    tabs?.switchToTab?.(list[nextIdx].id);
}