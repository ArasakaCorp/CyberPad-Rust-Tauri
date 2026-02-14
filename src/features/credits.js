import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

export async function initCredits(dom, state, opts = {}) {
    const {
        author = "Nutcracker",
        sponsor = "ArasakaCorp",
        url = "https://github.com/ArasakaCorp/CyberPad",
        productName = "CyberPad",
    } = opts;

    const creditsText = document.getElementById("creditsText");
    const creditsLink = document.getElementById("creditsLink");
    if (!creditsText || !creditsLink) return;

    let version = "";
    try {
        version = await getVersion();
    } catch {
        version = "";
    }

    const versionPart = version ? ` v${version}` : "";

    creditsText.textContent = `${productName}${versionPart} • by ${author}  •  ${sponsor} • `;

    creditsLink.onclick = async (e) => {
        e.preventDefault();
        try {
            await openUrl(url);
        } catch {
            // молча игнорируем, чтобы не ломать UI
        }
    };
}
