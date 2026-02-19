import { fileNameFromPath } from "../ui/state.js";

function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function getActiveTab(state) {
    return state.tabs.find(t => t.id === state.activeTabId) || null;
}

function setHeader(dom, tab, previewName = null) {
    if (!tab) {
        dom.topFile.textContent = "NOTE.txt";
        dom.topFile.dataset.realName = "NOTE.txt";
        return;
    }

    const realName = tab.name || "NOTE.txt";

    if (previewName) {
        dom.topFile.textContent = previewName;
    } else {
        dom.topFile.textContent = realName;
    }

    dom.topFile.dataset.realName = realName;
}

function renderTabs(dom, state) {
    dom.tabs.innerHTML = "";

    if (!state.tabs.length) return;

    for (const tab of state.tabs) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tab";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", String(tab.id === state.activeTabId));
        btn.title = tab.name || "NOTE.txt";

        // hover preview: показываем имя в header, но не переключаем
        btn.addEventListener("mouseenter", () => {
            const active = getActiveTab(state);
            // показываем превью только если не активная
            if (active && tab.id !== active.id) setHeader(dom, active, tab.name);
        });
        btn.addEventListener("mouseleave", () => {
            dom.topFile.textContent = dom.topFile.dataset.realName || "NOTE.txt";
        });

        // click: switch
        btn.addEventListener("click", () => {
            switchToTab(dom, state, tab.id);
        });

        dom.tabs.appendChild(btn);
    }
}

function persistEditorToActive(dom, state) {
    const active = getActiveTab(state);
    if (!active) return;
    active.content = dom.editor.value;
}

function switchToTab(dom, state, tabId) {
    const current = getActiveTab(state);
    if (current) persistEditorToActive(dom, state);

    const next = state.tabs.find(t => t.id === tabId);
    if (!next) return;

    state.activeTabId = next.id;
    dom.editor.value = next.content ?? "";
    setHeader(dom, next, null);

    renderTabs(dom, state);

    // dirty tracking for legacy flags (если где-то ещё используется)
    state.currentFilePath = next.filePath ?? null;
    state.dirty = !!next.dirty;

    // опционально: обновить счётчик символов
    dom.__updateCharCount?.();
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

function createTabFromOpenPayload(res) {
    const filePath = res?.filePath ?? res?.file_path ?? null;
    const content = res?.content ?? "";
    const name = filePath ? fileNameFromPath(filePath) : "NOTE.txt";

    return {
        id: uid(),
        filePath,
        name,
        content,
        dirty: false,
    };
}

function upsertTabFromPath(state, tab) {
    // MVP: всегда новая вкладка
    state.tabs.unshift(tab);
    state.activeTabId = tab.id;
}

export function initTabs(dom, state, opts = {}) {
    // allow external hooks
    dom.tabs = dom.tabs || document.querySelector("#tabs");

    // initial tab
    if (!state.tabs.length) {
        const t = createEmptyTab();
        state.tabs = [t];
        state.activeTabId = t.id;
        setHeader(dom, t);
        dom.editor.value = "";
    }

    renderTabs(dom, state);

    // mark dirty on input for active tab
    dom.editor.addEventListener("input", () => {
        const active = getActiveTab(state);
        if (!active) return;

        active.dirty = true;

        // legacy flags for existing modules that still read state.dirty/currentFilePath
        state.currentFilePath = active.filePath ?? null;
        state.dirty = true;

        // (если нужно) сообщить autosave, что есть изменения
        opts.onDirty?.(active);
    });

    return {
        getActiveTab: () => getActiveTab(state),

        newTab: () => {
            const t = createEmptyTab();
            upsertTabFromPath(state, t);
            dom.editor.value = t.content;
            setHeader(dom, t);
            renderTabs(dom, state);
            opts.onSwitched?.(t);
            return t;
        },

        openPayloadInNewTab: (res) => {
            const filePath = res?.filePath ?? res?.file_path ?? null;
            const content = res?.content ?? "";
            const name = filePath ? fileNameFromPath(filePath) : "NOTE.txt";

            const active = getActiveTab(state);

            // ✅ Reuse the initial empty tab if it’s really empty and clean
            const canReuseEmpty =
                state.tabs.length === 1 &&
                active &&
                !active.filePath &&
                !active.dirty &&
                (active.content ?? "") === "" &&
                dom.editor.value === "";

            if (canReuseEmpty) {
                active.filePath = filePath;
                active.name = name;
                active.content = content;
                active.dirty = false;

                state.activeTabId = active.id;
                dom.editor.value = content;
                setHeader(dom, active, null);
                renderTabs(dom, state);

                opts.onOpened?.(active);
                return active;
            }

            // default behavior: open in a new tab
            const t = {
                id: uid(),
                filePath,
                name,
                content,
                dirty: false,
            };

            state.tabs.unshift(t);
            state.activeTabId = t.id;

            dom.editor.value = t.content;
            setHeader(dom, t, null);
            renderTabs(dom, state);

            opts.onOpened?.(t);
            return t;
        },

        setActiveTabClean: () => {
            const active = getActiveTab(state);
            if (!active) return;
            active.dirty = false;
            state.dirty = false;
        },

        persistActiveContent: () => persistEditorToActive(dom, state),
        switchToTab: (id) => switchToTab(dom, state, id),
        render: () => renderTabs(dom, state),
    };
}
