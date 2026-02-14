export function createState() {
    return {
        currentFilePath: null,
        dirty: false,
    };
}

export function fileNameFromPath(p) {
    return (p || "").split(/[/\\]/).pop();
}
