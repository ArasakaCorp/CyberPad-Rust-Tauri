// src/tabs/TabState.js
export function createTabState(initial) {
    const s = {
        tabs: initial.tabs ?? [],
        activeId: initial.activeId ?? null,
        hoverId: null,              // UI-only: какой таб сейчас в hover
    };

    const listeners = new Set();
    function emit(type, payload) {
        for (const fn of listeners) fn(type, payload, api);
    }

    function getTab(id) { return s.tabs.find(t => t.id === id) || null; }
    function getActive() { return getTab(s.activeId); }

    const api = {
        // read
        getSnapshot: () => ({ ...s, tabs: s.tabs }),
        subscribe: (fn) => (listeners.add(fn), () => listeners.delete(fn)),
        getTab,
        getActive,

        // state mutations
        setActive(id) {
            if (s.activeId === id) return;
            s.activeId = id;
            emit("active:changed", { id });
        },
        setHover(idOrNull) {
            if (s.hoverId === idOrNull) return;
            s.hoverId = idOrNull;
            emit("hover:changed", { id: idOrNull });
        },

        addFront(tab) {
            s.tabs.unshift(tab);
            emit("tabs:added", { tab, index: 0 });
        },
        remove(id) {
            const idx = s.tabs.findIndex(t => t.id === id);
            if (idx === -1) return;
            const [tab] = s.tabs.splice(idx, 1);
            emit("tabs:removed", { tab, index: idx });
        },

        update(id, patch) {
            const t = getTab(id);
            if (!t) return;
            Object.assign(t, patch);
            emit("tabs:updated", { id, patch });
        },

        // convenience
        ensureAtLeastOne(makeEmptyTab) {
            if (s.tabs.length) return;
            const t = makeEmptyTab();
            s.tabs = [t];
            s.activeId = t.id;
            emit("tabs:reset", {});
            emit("active:changed", { id: t.id });
        },
    };

    return api;
}