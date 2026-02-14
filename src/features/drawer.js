export function closeDrawer(dom) {
    dom.drawer.classList.remove("open");
    dom.railBtn.classList.remove("active");
}

export function initDrawer(dom) {
    dom.railBtn.addEventListener("click", () => {
        dom.drawer.classList.toggle("open");
        dom.railBtn.classList.toggle("active");
    });
}
