export function createState() {
    return {
        currentFilePath: null,
        dirty: false,

        // tabs
        tabs: [],
        activeTabId: null,
    };
}

export function fileNameFromPath(p) {
    return (p || "").split(/[/\\]/).pop();
}
