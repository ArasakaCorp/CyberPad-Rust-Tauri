export function getSettingsDom() {
    return {
        closeBtn: document.querySelector("#settingsCloseBtn"),
        navItems: Array.from(document.querySelectorAll(".settings-nav-item")),
        panes: Array.from(document.querySelectorAll(".settings-pane")),
        clearRecentsBtn: document.querySelector("#clearRecentsBtn"),
        clearSessionBtn: document.querySelector("#clearSessionBtn"),
        resetSettingsBtn: document.querySelector("#resetSettingsBtn"),
        resetAllBtn: document.querySelector("#resetAllBtn"),
        themeCards: Array.from(document.querySelectorAll(".theme-card")),
    };
}