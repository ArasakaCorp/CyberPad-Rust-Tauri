import { updateCharCount } from "./counter.js";
import { syncSaveState } from "./fileActions.js";

export function initHistory(dom, state, opts = {}) {
    const limit = opts.limit ?? 200;
    const debounceMs = opts.debounceMs ?? 300;

    let undoStack = [];
    let redoStack = [];
    let timer = null;
    let applying = false; // чтобы programmatic setValue не записывался как новый шаг

    function snapshot() {
        return dom.editor.value;
    }

    function pushUndo(value) {
        // не пишем дубликаты подряд
        const last = undoStack[undoStack.length - 1];
        if (last === value) return;

        undoStack.push(value);
        if (undoStack.length > limit) undoStack.shift();
    }

    function reset(initialText = "") {
        undoStack = [initialText];
        redoStack = [];
    }

    function setValue(value) {
        applying = true;
        dom.editor.value = value;
        updateCharCount(dom);
        applying = false;
    }

    function markDirtyIfFileOpen() {
        if (!state.currentFilePath) return;
        state.dirty = true;
        syncSaveState(dom, state);
    }

    function commit() {
        if (applying) return;
        // при вводе фиксируем в undo и чистим redo
        pushUndo(snapshot());
        redoStack = [];
    }

    function scheduleCommit() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            commit();
        }, debounceMs);
    }

    function undo() {
        if (undoStack.length <= 1) return;

        const current = snapshot();
        const prev = undoStack[undoStack.length - 2];

        // переносим текущий в redo, удаляем текущий из undo
        redoStack.push(current);
        undoStack.pop();

        setValue(prev);
        markDirtyIfFileOpen();
    }

    function redo() {
        if (!redoStack.length) return;

        const current = snapshot();
        const next = redoStack.pop();

        pushUndo(current);   // текущий в undo
        pushUndo(next);      // и next тоже, чтобы undo возвращался обратно корректно

        setValue(next);
        markDirtyIfFileOpen();
    }

    // слушаем ввод
    dom.editor.addEventListener("input", () => {
        if (applying) return;
        scheduleCommit();
    });

    // хоткеи (Win/Linux + macOS)
    window.addEventListener("keydown", (e) => {
        const isMac = navigator.platform.toLowerCase().includes("mac");
        const mod = isMac ? e.metaKey : e.ctrlKey;

        if (!mod) return;

        // undo: Ctrl/Cmd + Z (без shift)
        if (e.key.toLowerCase() === "z" && !e.shiftKey) {
            e.preventDefault();
            undo();
            return;
        }

        // redo: Windows Ctrl+Y, mac Cmd+Shift+Z
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

    // публичные методы: вызывать при open file / open-with / recent open
    return {
        reset,      // reset(text)
        undo,
        redo,
        commitNow: commit,
        setProgrammaticValue: (text) => setValue(text),
    };
}
