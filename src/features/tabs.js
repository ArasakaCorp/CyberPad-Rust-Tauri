import { fileNameFromPath } from "../ui/state.js";

function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function getActiveTab(state) {
    return state.tabs.find(t => t.id === state.activeTabId) || null;
}

function setHeader(dom, tab, previewName = null) {
    const realName = tab?.name || "NOTE.txt";
    dom.topFile.textContent = previewName ?? realName;
    dom.topFile.dataset.realName = realName;
}

function createEmptyTab() {
    return {
        id: uid(),
        filePath: null,
        name: "NOTE.txt",
        content: "",
        dirty: false,
    };
}

export function initTabs(dom, state, { autosave, onOpened } = {}) {

    dom.tabs = dom.tabs || document.querySelector("#tabs");

    // ---------- core helpers ----------

    function persistActiveContent() {
        const active = getActiveTab(state);
        if (active) active.content = dom.editor.value;
    }

    function switchToTab(tabId) {
        const current = getActiveTab(state);
        if (current) persistActiveContent();

        const next = state.tabs.find(t => t.id === tabId);
        if (!next) return;

        state.activeTabId = next.id;

        dom.editor.value = next.content ?? "";
        setHeader(dom, next);

        state.currentFilePath = next.filePath ?? null;
        state.dirty = !!next.dirty;

        autosave?.resetAutosaveForTab?.(next.id);

        renderTabs();
        dom.__updateCharCount?.();
    }

    function closeTab(tabId, { force = false } = {}) {
        const idx = state.tabs.findIndex(t => t.id === tabId);
        if (idx === -1) return;

        const tab = state.tabs[idx];

        if (tab.dirty && !force) {
            dom.topFile.classList.add("saved");
            setTimeout(() => dom.topFile.classList.remove("saved"), 200);
            return;
        }

        const wasActive = tab.id === state.activeTabId;

        state.tabs.splice(idx, 1);

        if (!state.tabs.length) {
            const t = createEmptyTab();
            state.tabs = [t];
            state.activeTabId = t.id;
            dom.editor.value = "";
            setHeader(dom, t);
            autosave?.resetAutosaveForTab?.(t.id);
            renderTabs();
            return;
        }

        if (wasActive) {
            const next = state.tabs[Math.max(0, idx - 1)];
            state.activeTabId = next.id;
            dom.editor.value = next.content ?? "";
            setHeader(dom, next);

            state.currentFilePath = next.filePath ?? null;
            state.dirty = !!next.dirty;

            autosave?.resetAutosaveForTab?.(next.id);
        }

        renderTabs();
    }

    function renderTabs() {
        dom.tabs.innerHTML = "";

        for (const tab of state.tabs) {

            const btn = document.createElement("button");

            btn.className = "tab";
            btn.setAttribute("role", "tab");
            btn.setAttribute("aria-selected", tab.id === state.activeTabId);
            btn.title = tab.name || "NOTE.txt";

            // hover preview
            btn.addEventListener("mouseenter", () => {
                const name = tab.name || "NOTE.txt";
                if (dom.topFile.textContent === name) return;

                dom.topFile.classList.add("tab-preview-enter");
                dom.topFile.textContent = name;

                setTimeout(() =>
                    dom.topFile.classList.remove("tab-preview-enter"), 120);
            });

            btn.addEventListener("mouseleave", () => {
                const real = dom.topFile.dataset.realName || "NOTE.txt";
                dom.topFile.textContent = real;
            });

            // switch
            btn.addEventListener("click", () => switchToTab(tab.id));

            // close
            btn.addEventListener("dblclick", e => {
                e.preventDefault();
                e.stopPropagation();
                closeTab(tab.id);
            });

            dom.tabs.appendChild(btn);
        }
    }

    function openPayloadInNewTab(res) {

        const filePath = res?.filePath ?? res?.file_path ?? null;
        const content = res?.content ?? "";
        const name = filePath ? fileNameFromPath(filePath) : "NOTE.txt";

        const active = getActiveTab(state);

        // reuse empty tab
        if (
            state.tabs.length === 1 &&
            active &&
            !active.filePath &&
            !active.dirty &&
            !active.content
        ) {
            active.filePath = filePath;
            active.name = name;
            active.content = content;
            active.dirty = false;

            state.activeTabId = active.id;

            dom.editor.value = content;
            setHeader(dom, active);

            autosave?.resetAutosaveForTab?.(active.id);
            renderTabs();

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

        state.tabs.unshift(tab);
        state.activeTabId = tab.id;

        dom.editor.value = content;
        setHeader(dom, tab);

        autosave?.resetAutosaveForTab?.(tab.id);
        renderTabs();

        onOpened?.(tab);
        return tab;
    }

    // ---------- init ----------

    if (!state.tabs.length) {
        const t = createEmptyTab();
        state.tabs = [t];
        state.activeTabId = t.id;
        setHeader(dom, t);
    }

    dom.editor.addEventListener("input", () => {
        const active = getActiveTab(state);
        if (!active) return;

        active.dirty = true;
        state.dirty = true;
        state.currentFilePath = active.filePath ?? null;
    });

    renderTabs();

    // ---------- public API ----------

    return {

        getActiveTab: () => getActiveTab(state),

        openPayloadInNewTab,
        getAllTabs: () => state.tabs,
        switchToTab,
        newTab() {
            const t = createEmptyTab();
            state.tabs.unshift(t);
            state.activeTabId = t.id;
            dom.editor.value = "";
            setHeader(dom, t);
            autosave?.resetAutosaveForTab?.(t.id);
            renderTabs();
            return t;
        },

        closeTab,

        markClean() {
            const active = getActiveTab(state);
            if (active) active.dirty = false;
            state.dirty = false;
        }
    };
}
