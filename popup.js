document.addEventListener("DOMContentLoaded", loadStats);

async function loadStats() {
    const today = new Date().toISOString().split("T")[0];

    const stored = await chrome.storage.local.get(["times"]);
    const times = stored.times || {};
    const todayData = times[today] || {};

    const statsDiv = document.getElementById("stats");
    statsDiv.innerHTML = "";

    const list = Object.entries(todayData)
        .map(([domain, ms]) => [domain, Math.round(ms / 60000)])
        .sort((a, b) => b[1] - a[1]);

    for (const [domain, mins] of list) {
        const row = document.createElement("div");
        row.textContent = `${domain}: ${mins} min`;
        statsDiv.appendChild(row);
    }
}