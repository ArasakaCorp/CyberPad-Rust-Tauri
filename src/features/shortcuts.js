export function initShortcuts(dom) {
    window.addEventListener("keydown", (e) => {
        const isMac = navigator.platform.toLowerCase().includes("mac");
        const mod = isMac ? e.metaKey : e.ctrlKey;

        if (mod && e.shiftKey && e.key.toLowerCase() === "s") {
            e.preventDefault();
            dom.menuSaveAs.click();
        }
    });
}