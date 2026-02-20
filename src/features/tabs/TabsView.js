import { UIStrings } from "../../ui/UIStrings.js";
export function createTabsView(dom, state, { onClickTab, onDblClickTab } = {}) {
    const byId = new Map(); // id -> button

    function makeBtn(tab) {
        const btn = document.createElement("button");
        btn.className = "tab";
        btn.dataset.tabId = tab.id;
        btn.setAttribute("role", "tab");
        btn.title = tab.name || UIStrings.FILE_DEFAULT_NAME;

        btn.addEventListener("mouseenter", () => state.setHover(tab.id));
        btn.addEventListener("mouseleave", () => {
            // если курсор уже на другом табе, не скидываем hover
            if (dom.tabs.querySelector(".tab:hover")) return;
            state.setHover(null);
        });

        btn.addEventListener("click", () => onClickTab?.(tab.id));
        btn.addEventListener("dblclick", (e) => {
            e.preventDefault();
            e.stopPropagation();
            onDblClickTab?.(tab.id);
        });

        return btn;
    }

    function setSelected(btn, isSelected) {
        btn.setAttribute("aria-selected", String(isSelected));
    }

    function animateEnter(btn) {
        btn.classList.add("tab-enter");
        btn.offsetWidth; // flush
        requestAnimationFrame(() => {
            btn.classList.add("tab-enter-active");
            setTimeout(() => btn.classList.remove("tab-enter", "tab-enter-active"), 260);
        });
    }

    function mountInitial() {
        dom.tabs.innerHTML = "";   // ← ОБЯЗАТЕЛЬНО

        const snap = state.getSnapshot();

        for (const tab of snap.tabs) {
            const btn = makeBtn(tab);
            byId.set(tab.id, btn);
            dom.tabs.appendChild(btn);
        }

        syncSelection();
    }

    function syncSelection() {
        const snap = state.getSnapshot();
        for (const tab of snap.tabs) {
            const btn = byId.get(tab.id);
            if (!btn) continue;
            setSelected(btn, tab.id === snap.activeId);
            btn.title = tab.name || UIStrings.FILE_DEFAULT_NAME;
        }
    }

    // state events
    const unsubscribe = state.subscribe((type, payload) => {
        if (type === "active:changed") syncSelection();
        if (type === "tabs:updated") {
            const btn = byId.get(payload.id);
            const tab = state.getTab(payload.id);
            if (btn && tab) btn.title = tab.name || UIStrings.FILE_DEFAULT_NAME;
        }

        if (type === "tabs:added") {
            const { tab } = payload;
            const btn = makeBtn(tab);
            byId.set(tab.id, btn);
            dom.tabs.insertBefore(btn, dom.tabs.firstChild);
            animateEnter(btn);
            syncSelection();
        }

        if (type === "tabs:removed") {
            const { tab } = payload;
            const btn = byId.get(tab.id);
            if (btn) btn.remove();
            byId.delete(tab.id);
            // если удалили hover-таб, сбросим hover
            const snap = state.getSnapshot();
            if (snap.hoverId === tab.id) state.setHover(null);
            syncSelection();
        }

        if (type === "tabs:reset") {
            // если ты когда-то захочешь reset, можно добавить очистку
            // но в стабильной версии reset почти не нужен
        }
    });

    return {
        mountInitial,
        destroy: () => unsubscribe(),
    };
}