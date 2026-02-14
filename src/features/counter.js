export function updateCharCount(dom) {
    const n = dom.editor.value.length;
    dom.charCountEl.textContent = String(n).padStart(6, "0");
}

export function initCounter(dom) {
    dom.editor.addEventListener("input", () => updateCharCount(dom));
    updateCharCount(dom);
}
