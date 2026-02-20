import { UIStrings } from "../../ui/UIStrings.js";

export function createHeaderView(dom, state) {
    const host = dom.topFile;

    // создаём слои, если их нет
    let activeEl = host.querySelector(".top-file-active");
    let previewEl = host.querySelector(".top-file-preview");

    if (!activeEl || !previewEl) {
        host.textContent = "";
        activeEl = document.createElement("span");
        activeEl.className = "top-file-active";
        previewEl = document.createElement("span");
        previewEl.className = "top-file-preview";
        host.appendChild(activeEl);
        host.appendChild(previewEl);
    }

    function nameOf(tab) { return tab?.name || UIStrings.FILE_DEFAULT_NAME; }

    function render() {
        const snap = state.getSnapshot();
        const active = state.getActive();
        const hover = snap.hoverId ? state.getTab(snap.hoverId) : null;

        activeEl.textContent = nameOf(active);

        if (hover) {
            previewEl.textContent = nameOf(hover);
            previewEl.classList.add("is-on");
        } else {
            previewEl.classList.remove("is-on");
        }

        // для твоего dataset.realName (если где-то нужно)
        host.dataset.realName = nameOf(active);
        host.classList.toggle("is-preview", !!hover);
    }

    const unsubscribe = state.subscribe((type) => {
        if (type === "active:changed" || type === "hover:changed" || type === "tabs:updated") render();
    });

    render();

    return { destroy: () => unsubscribe() };
}