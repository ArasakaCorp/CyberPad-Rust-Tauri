// src/tabs/TabsController.js

import { createTabState } from "./TabState.js";
import { createTabsView } from "./TabsView.js";
import { createHeaderView } from "./HeaderView.js";

import { fileNameFromPath } from "../../ui/state.js";
import { UIStrings } from "../../ui/UIStrings.js";

import {
    persistTabsSnapshot,
    loadPersistedTabsSnapshot
} from "./persistTabs.js";

import { invoke } from "@tauri-apps/api/core";


/* ----------------------------- */
/* helpers                       */
/* ----------------------------- */

function uid() {
    return Math.random().toString(16).slice(2)
        + Date.now().toString(16);
}

function createEmptyTab() {
    return {
        id: uid(),
        filePath: null,
        name: UIStrings.FILE_DEFAULT_NAME,
        content: "",
        dirty: false,
        _scratch: true,
    };
}


/* ----------------------------- */
/* restore                      */
/* ----------------------------- */

async function restoreTabsIntoLegacyState() {

    const saved = loadPersistedTabsSnapshot();

    if (!saved?.tabs?.length) return;

    const hydratedTabs = [];

    for (const t of saved.tabs) {

        let content = t.scratch ?? "";

        if (t.filePath) {
            try {
                const res = await invoke("open_path", {
                    path: t.filePath
                });

                if (res?.content != null)
                    content = res.content;

            } catch {
                content = "";
            }
        }

        hydratedTabs.push({
            id: t.id,
            filePath: t.filePath,
            name:
                t.name ??
                (t.filePath
                    ? fileNameFromPath(t.filePath)
                    : UIStrings.FILE_DEFAULT_NAME),

            content,
            dirty: false,
            _scratch: false,
        });
    }
}


/* ----------------------------- */
/* controller                   */
/* ----------------------------- */

export async function initTabs(
    dom,
    { autosave, onOpened } = {}
) {

    dom.tabs ||= document.querySelector("#tabs");


    /* ------------------------- */
    /* restore                  */
    /* ------------------------- */

    await restoreTabsIntoLegacyState();


    /* ------------------------- */
    /* state                    */
    /* ------------------------- */

    const state = createTabState({
        tabs: [],
        activeId: null,
    });

    if (!state.getSnapshot().tabs.length) {

        const tab = createEmptyTab();

        state.addFront(tab);
        state.setActive(tab.id);
    }


    /* ------------------------- */
    /* persistence              */
    /* ------------------------- */

    let persistTimer = null;

    function schedulePersist() {

        clearTimeout(persistTimer);

        persistTimer = setTimeout(() => {
            persistTabsSnapshot(state);
        }, 400);
    }

    state.subscribe(type => {

        if (type === "hover:changed")
            return;

        if (type === "tabs:removed") {
            persistTabsSnapshot(state);
            return;
        }

        schedulePersist();
    });

    function flushPersistNow() {
        try {
            persistTabsSnapshot(state);
        } catch {}
    }

    window.addEventListener("pagehide", flushPersistNow);
    window.addEventListener("beforeunload", flushPersistNow);


    /* ------------------------- */
    /* editor sync              */
    /* ------------------------- */

    function persistActiveContent() {

        const active = state.getActive();

        if (active)
            active.content = dom.editor.value;
    }

    function applyActiveToEditor() {

        const active = state.getActive();

        if (!active) return;

        if (dom.editor.value !== active.content)
            dom.editor.value = active.content ?? "";

        autosave?.resetAutosaveForTab?.(active.id);

        dom.__updateCharCount?.();
    }


    /* ------------------------- */
    /* tab lifecycle            */
    /* ------------------------- */

    function switchToTab(tabId) {

        persistActiveContent();

        const next = state.getTab(tabId);

        if (!next) return;

        state.setActive(next.id);

        applyActiveToEditor();
    }

    function showUnsavedCloseBlocked(dom) {
        if (!dom?.topFile) return;

        clearTimeout(dom.__unsavedTimer);

        dom.topFile.classList.remove("unsaved");
        void dom.topFile.offsetWidth; // reflow
        dom.topFile.classList.add("unsaved");

        console.log("UNSAVED flash", dom.topFile?.id, dom.topFile?.className);

        dom.__unsavedTimer = setTimeout(() => {
            dom.topFile.classList.remove("unsaved");
        }, 240);
    }

    function closeTab(tabId, { force = false } = {}) {

        const tab = state.getTab(tabId);

        if (!tab) return;

        if (tab.dirty && !force) {
            showUnsavedCloseBlocked(dom);
            return false;
        }

        const snap = state.getSnapshot();

        const wasActive =
            tabId === snap.activeId;

        state.remove(tabId);

        const after = state.getSnapshot();

        if (!after.tabs.length) {

            const tab = createEmptyTab();

            state.addFront(tab);
            state.setActive(tab.id);

        } else if (wasActive) {

            state.setActive(after.tabs[0].id);
        }

        applyActiveToEditor();
    }

    function openPayloadInNewTab(res) {

        const filePath =
            res?.filePath ??
            res?.file_path ??
            null;

        const content =
            res?.content ?? "";

        const name =
            filePath
                ? fileNameFromPath(filePath)
                : UIStrings.FILE_DEFAULT_NAME;

        const snap = state.getSnapshot();
        const active = state.getActive();


        // reuse scratch tab

        if (
            snap.tabs.length === 1 &&
            active &&
            active.filePath === null &&
            active.content === "" &&
            active.dirty === false
        ) {

            state.update(active.id, {
                filePath,
                name,
                content,
                dirty: false,
            });

            state.setActive(active.id);

            applyActiveToEditor();

            onOpened?.(active);

            return active;
        }


        const tab = {
            id: uid(),
            filePath,
            name,
            content,
            dirty: false,
        };

        state.addFront(tab);
        state.setActive(tab.id);

        applyActiveToEditor();

        onOpened?.(tab);

        return tab;
    }

    function newTab() {

        const tab = createEmptyTab();

        state.addFront(tab);
        state.setActive(tab.id);

        applyActiveToEditor();

        return tab;
    }

    function applySavedPath(filePath) {

        const active = state.getActive();

        if (!active) return;

        state.update(active.id, {

            filePath,
            name: fileNameFromPath(filePath),
            dirty: false,
            content: dom.editor.value,
        });

        autosave?.resetAutosaveForTab?.(active.id);
    }


    /* ------------------------- */
    /* views                    */
    /* ------------------------- */

    const headerView =
        createHeaderView(dom, state);

    const tabsView =
        createTabsView(dom, state, {

            onClickTab: switchToTab,
            onDblClickTab: id => closeTab(id),
        });

    tabsView.mountInitial();

    applyActiveToEditor();



    dom.editor.addEventListener("input", () => {
        const active = state.getActive();
        if (!active) return;

        const content = dom.editor.value;

        const isScratch = !active.filePath;
        const shouldBeDirty = isScratch
            ? content.trim().length > 0
            : true;

        state.update(active.id, {
            content,
            dirty: shouldBeDirty,
        });
    });


    /* ------------------------- */
    /* public API               */
    /* ------------------------- */

    return {

        __state: state,

        getActiveTab: () => state.getActive(),

        getAllTabs: () =>
            state.getSnapshot().tabs,

        switchToTab,

        closeTab,

        openPayloadInNewTab,

        newTab,

        applySavedPath,

        markClean() {
            const active = state.getActive();

            if (active)
                active.dirty = false;
        },

        destroy() {

            headerView.destroy();

            tabsView.destroy();
        },
    };
}