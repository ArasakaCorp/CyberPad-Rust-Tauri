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

        themeCustomWrap: document.querySelector("[data-theme-custom-wrap]"),
        themeJsonEditor: document.querySelector("[data-theme-json-editor]"),
        themeApplyBtn: document.querySelector("[data-theme-apply-btn]"),
        themeResetBtn: document.querySelector("[data-theme-reset-btn]"),
        themeJsonStatus: document.querySelector("[data-theme-json-status]"),
        themeLabLink: document.querySelector("[data-theme-lab-link]"),
    };
}