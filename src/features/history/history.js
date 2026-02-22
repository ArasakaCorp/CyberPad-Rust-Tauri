// history.js (tabs-aware)
// Replaces legacy history based on state.currentFilePath/state.dirty.
// Uses TabState (createTabState) and keeps undo/redo per tabId.

import { updateCharCount } from "../counter.js";

export function initHistory(dom, tabState, opts = {}) {
    const limit = opts.limit ?? 200;
    const debounceMs = opts.debounceMs ?? 300;

    // tabId -> session
    const sessions = new Map();

    function getActiveId() {
        return tabState.getSnapshot().activeId ?? null;
    }

    function ensureSession(tabId, seedText = "") {
        if (!tabId) return null;

        let s = sessions.get(tabId);
        if (!s) {
            s = {
                undoStack: [seedText],
                redoStack: [],
                timer: null,
                applying: false,
            };
            sessions.set(tabId, s);
        }
        return s;
    }

    function snapshot() {
        return dom.editor.value ?? "";
    }

    function setEditorValue(value) {
        // programmatic set without generating new history step
        dom.editor.value = value ?? "";
        updateCharCount(dom);
    }

    function pushUndo(session, value) {
        const last = session.undoStack[session.undoStack.length - 1];
        if (last === value) return;

        session.undoStack.push(value);
        if (session.undoStack.length > limit) session.undoStack.shift();
    }

    function clearRedo(session) {
        session.redoStack = [];
    }

    function markDirtyAndSyncContent(tabId, content) {
        if (!tabId) return;
        // No legacy: mark tab dirty + keep its content in sync
        tabState.update(tabId, {
            content,
            dirty: true,
        });
    }

    function commit(tabId) {
        if (!tabId) return;

        const session = ensureSession(tabId, snapshot());
        if (!session || session.applying) return;

        pushUndo(session, snapshot());
        clearRedo(session);
    }

    function scheduleCommit(tabId) {
        if (!tabId) return;

        const session = ensureSession(tabId, snapshot());
        if (!session) return;

        if (session.timer) clearTimeout(session.timer);
        session.timer = setTimeout(() => {
            session.timer = null;
            commit(tabId);
        }, debounceMs);
    }

    function undo() {
        const tabId = getActiveId();
        if (!tabId) return;

        const session = ensureSession(tabId, snapshot());
        if (!session || session.undoStack.length <= 1) return;

        const current = snapshot();
        const prev = session.undoStack[session.undoStack.length - 2];

        // move current -> redo, remove current from undo
        session.redoStack.push(current);
        session.undoStack.pop();

        session.applying = true;
        setEditorValue(prev);
        session.applying = false;

        markDirtyAndSyncContent(tabId, prev);
    }

    function redo() {
        const tabId = getActiveId();
        if (!tabId) return;

        const session = ensureSession(tabId, snapshot());
        if (!session || !session.redoStack.length) return;

        const current = snapshot();
        const next = session.redoStack.pop();

        // keep undo consistent
        pushUndo(session, current);
        pushUndo(session, next);

        session.applying = true;
        setEditorValue(next);
        session.applying = false;

        markDirtyAndSyncContent(tabId, next);
    }

    function resetForTab(tabId, initialText = "") {
        if (!tabId) return;
        sessions.set(tabId, {
            undoStack: [initialText ?? ""],
            redoStack: [],
            timer: null,
            applying: false,
        });
    }

    function resetActive(initialText = "") {
        const tabId = getActiveId();
        if (!tabId) return;
        resetForTab(tabId, initialText);
    }

    function setProgrammaticValue(text, { commitSnapshot = true } = {}) {
        const tabId = getActiveId();
        if (!tabId) return;

        const session = ensureSession(tabId, snapshot());
        if (!session) return;

        session.applying = true;
        setEditorValue(text ?? "");
        session.applying = false;

        // keep tab content in sync, but do NOT force dirty here by default
        tabState.update(tabId, { content: text ?? "" });

        if (commitSnapshot) {
            // Make this the baseline so first undo returns to it
            resetForTab(tabId, text ?? "");
        }
    }

    // Editor input -> commit into history of ACTIVE tab
    dom.editor.addEventListener("input", () => {
        const tabId = getActiveId();
        if (!tabId) return;

        const session = ensureSession(tabId, snapshot());
        if (!session || session.applying) return;

        scheduleCommit(tabId);
    });

    // Hotkeys (Win/Linux + macOS)
    window.addEventListener("keydown", (e) => {
        const isMac = navigator.platform.toLowerCase().includes("mac");
        const mod = isMac ? e.metaKey : e.ctrlKey;
        if (!mod) return;

        // undo: Ctrl/Cmd + Z (no shift)
        if (e.key.toLowerCase() === "z" && !e.shiftKey) {
            e.preventDefault();
            undo();
            return;
        }

        // redo: Win Ctrl+Y, mac Cmd+Shift+Z
        if (!isMac && e.key.toLowerCase() === "y") {
            e.preventDefault();
            redo();
            return;
        }

        if (isMac && e.key.toLowerCase() === "z" && e.shiftKey) {
            e.preventDefault();
            redo();
            return;
        }
    });

    // React to tab switches and removals
    const unsubscribe = tabState.subscribe((type, payload) => {
        if (type === "active:changed") {
            const tabId = payload?.id ?? getActiveId();
            if (!tabId) return;

            // Seed history for this tab if it has no session yet.
            // We seed from current editor value because TabsController already swapped content into editor.
            ensureSession(tabId, snapshot());
            return;
        }

        if (type === "tabs:removed") {
            const removedId = payload?.tab?.id;
            if (removedId) sessions.delete(removedId);
        }
    });

    return {
        // called when you open a file into active tab and want a clean baseline
        resetActive,
        resetForTab,

        undo,
        redo,

        // force commit immediately (e.g. before Save)
        commitNow: () => commit(getActiveId()),

        // set editor value without creating a new undo step from input listener
        // commitSnapshot=true makes it the baseline
        setProgrammaticValue,

        destroy: () => unsubscribe(),
    };
}