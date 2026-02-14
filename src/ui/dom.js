export function getDom() {
    return {
        minBtn: document.querySelector("#minBtn"),
        closeBtn: document.querySelector("#closeBtn"),
        editor: document.querySelector("#editor"),
        topFile: document.querySelector("#topFile"),
        railBtn: document.querySelector("#openBtn"),
        drawer: document.querySelector("#drawer"),
        menuNew: document.querySelector("#menuNew"),
        menuOpen: document.querySelector("#menuOpen"),
        menuSave: document.querySelector("#menuSave"),
        menuSaveAs: document.querySelector("#menuSaveAs"),
        autosaveStatus: document.querySelector("#autosaveStatus"),
        charCountEl: document.querySelector("#charCount"),
        recentList: document.querySelector("#recentList")
    };
}