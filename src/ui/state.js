export function createState() {
    return {
        // tabs
        tabs: [],
        activeTabId: null,
    };
}

export function fileNameFromPath(p) {
    return (p || "").split(/[/\\]/).pop();
}
