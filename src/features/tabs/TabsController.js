// src/tabs/TabsController.js
import { createTabState } from "./TabState.js";
import { createTabsView } from "./TabsView.js";
import { createHeaderView } from "./HeaderView.js";
import { fileNameFromPath } from "../../ui/state.js";
import { UIStrings } from "../../ui/UIStrings.js";


function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function createEmptyTab() {
    return { id: uid(), filePath: null, name: UIStrings.FILE_DEFAULT_NAME, content: "", dirty: false };
}

export function initTabs(dom, legacyState, { autosave, onOpened } = {}) {
    dom.tabs = dom.tabs || document.querySelector("#tabs");

    // State (истина)
    const state = createTabState({
        tabs: legacyState.tabs ?? [],
        activeId: legacyState.activeTabId ?? null,
    });

    state.ensureAtLeastOne(createEmptyTab);

    function persistActiveContent() {
        const active = state.getActive();
        if (active) active.content = dom.editor.value;
    }

    function applyActiveToEditor() {
        const active = state.getActive();
        dom.editor.value = active?.content ?? "";
        legacyState.currentFilePath = active?.filePath ?? null;
        legacyState.dirty = !!active?.dirty;
        legacyState.activeTabId = state.getSnapshot().activeId;
        autosave?.resetAutosaveForTab?.(active?.id);
        dom.__updateCharCount?.();
    }

    function switchToTab(tabId) {
        persistActiveContent();
        const next = state.getTab(tabId);
        if (!next) return;
        state.setActive(next.id);
        applyActiveToEditor();
    }

    function closeTab(tabId, { force = false } = {}) {
        const tab = state.getTab(tabId);
        if (!tab) return;

        if (tab.dirty && !force) {
            // твой “flash saved” можно оставить
            dom.topFile.classList.add("saved");
            setTimeout(() => dom.topFile.classList.remove("saved"), 200);
            return;
        }

        const snap = state.getSnapshot();
        const wasActive = tabId === snap.activeId;

        state.remove(tabId);

        const after = state.getSnapshot();
        if (!after.tabs.length) {
            const t = createEmptyTab();
            state.addFront(t);
            state.setActive(t.id);
        } else if (wasActive) {
            // выберем следующий “слева”, но у нас порядок массива
            state.setActive(after.tabs[0].id);
        }

        applyActiveToEditor();
    }

    function openPayloadInNewTab(res) {
        const filePath = res?.filePath ?? res?.file_path ?? null;
        const content = res?.content ?? "";
        const name = filePath ? fileNameFromPath(filePath) : UIStrings.FILE_DEFAULT_NAME;

        const snap = state.getSnapshot();
        const active = state.getActive();

        // reuse empty
        if (
            snap.tabs.length === 1 &&
            active &&
            !active.filePath &&
            !active.dirty &&
            !active.content
        ) {
            state.update(active.id, { filePath, name, content, dirty: false });
            state.setActive(active.id);
            applyActiveToEditor();
            onOpened?.(active);
            return active;
        }

        const tab = { id: uid(), filePath, name, content, dirty: false };
        state.addFront(tab);
        state.setActive(tab.id);
        applyActiveToEditor();

        onOpened?.(tab);
        return tab;
    }

    function newTab() {
        const t = createEmptyTab();
        state.addFront(t);
        state.setActive(t.id);
        applyActiveToEditor();
        return t;
    }

    // Views
    const headerView = createHeaderView(dom, state);
    const tabsView = createTabsView(dom, state, {
        onClickTab: switchToTab,
        onDblClickTab: (id) => closeTab(id),
    });

    tabsView.mountInitial();
    applyActiveToEditor();

    // editor dirty tracking (обновляем таб и legacy)
    dom.editor.addEventListener("input", () => {
        const active = state.getActive();
        if (!active) return;
        active.dirty = true;
        legacyState.dirty = true;
        legacyState.currentFilePath = active.filePath ?? null;
    });

    return {
        getActiveTab: () => state.getActive(),
        getAllTabs: () => state.getSnapshot().tabs,

        switchToTab,
        closeTab,
        openPayloadInNewTab,
        newTab,
        applySavedPath,


        markClean() {
            const active = state.getActive();
            if (active) active.dirty = false;
            legacyState.dirty = false;
        },

        destroy() {
            headerView.destroy();
            tabsView.destroy();
        },
    };

    function applySavedPath(filePath) {
        const active = state.getActive();
        if (!active) return;

        state.update(active.id, {
            filePath,
            name: fileNameFromPath(filePath),
            dirty: false,
            content: dom.editor.value,
        });

        legacyState.currentFilePath = filePath;
        legacyState.dirty = false;

        autosave?.resetAutosaveForTab?.(active.id);
    }
}