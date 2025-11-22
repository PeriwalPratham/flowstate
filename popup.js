document.addEventListener("DOMContentLoaded", loadStats);
async function loadStats() {
    const today = new Date().toISOString().split("T")[0];
    const stored = await chrome.storage.local.get(["times"]);
    const times = stored.times || {};
    const todayData = times[today] || {};
    const siteList = document.getElementById("siteList");
    siteList.innerHTML = "";

    const timeSpentDiv = document.getElementById("time-spent");
    const totalMins = Object.values(todayData).reduce((sum, ms) => sum + Math.round(ms / 60000), 0);
    timeSpentDiv.textContent = `Today: ${totalMins} min`;

    const list = Object.entries(todayData)
        .map(([domain, ms]) => [domain, Math.round(ms / 60000)])
        .filter(([domain, mins]) => mins > 0)
        .sort((a, b) => b[1] - a[1]);
    for (const [domain, mins] of list) {
        const li = document.createElement("li");
        li.className = "site-item";
        li.style.cursor = "pointer";
        const siteInfo = document.createElement("div");
        siteInfo.className = "site-info";

        const icon = document.createElement("img");
        icon.className = "site-icon";
        icon.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        icon.onerror = function () {
            this.style.display = "none";
        };
        const name = document.createElement("div");
        name.className = "site-name";
        name.textContent = domain;
        const time = document.createElement("div");
        time.className = "site-time";
        time.textContent = `${mins} min`;
        siteInfo.appendChild(icon);
        siteInfo.appendChild(name);
        li.appendChild(siteInfo);
        li.appendChild(time);
        siteList.appendChild(li);
        // clicking a site toggles block for that domain
        li.addEventListener('click', async () => {
            const stored = await chrome.storage.local.get(['blocked']);
            const blocked = stored.blocked || {};
            if (blocked[domain]) {
                delete blocked[domain];
                li.style.opacity = 1;
            } else {
                blocked[domain] = true;
                li.style.opacity = 0.6;
            }
            await chrome.storage.local.set({ blocked });
        });
    }
    document.getElementById("stats").addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    });
}