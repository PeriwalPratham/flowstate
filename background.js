// credit for chatgpt for helping with this code as i am not that good with js but good with html and css


let currentDomain = null;
let lastSwitchTime = Date.now();


function getTodayKey() {
    return new Date().toISOString().split("T")[0];
}


function normalizeDomain(raw) {
    const parts = raw.split(".");
    if (parts.length <= 2) return raw;

    return parts.slice(parts.length - 2).join(".");
}



async function handleNewDomain(domain) {
    const today = getTodayKey();


    const stored = await chrome.storage.local.get(["times", "lastDate"]);
    let times = stored.times || {};
    let lastDate = stored.lastDate || today;


    if (today !== lastDate) {
        times = {};
    }


    if (!currentDomain) {
        currentDomain = domain;
        lastSwitchTime = Date.now();
        await chrome.storage.local.set({ times, lastDate: today });
        return;
    }


    const now = Date.now();
    const timeSpent = now - lastSwitchTime;


    if (!times[today]) times[today] = {};
    if (!times[today][currentDomain]) times[today][currentDomain] = 0;


    times[today][currentDomain] += timeSpent;


    await chrome.storage.local.set({ times, lastDate: today });


    currentDomain = domain;
    lastSwitchTime = Date.now();
}


chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab || !tab.url) return;

    const url = new URL(tab.url);
    const domain = normalizeDomain(url.hostname);

    await handleNewDomain(domain);
});



chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete") return;
    if (!tab || !tab.url) return;

    const url = new URL(tab.url);
    const domain = normalizeDomain(url.hostname);

    await handleNewDomain(domain);
});


setInterval(async () => {
    if (!currentDomain) return;

    const today = getTodayKey();
    const stored = await chrome.storage.local.get(["times", "lastDate"]);
    let times = stored.times || {};

    if (!times[today]) times[today] = {};
    if (!times[today][currentDomain]) times[today][currentDomain] = 0;

    const now = Date.now();
    const timeSpent = now - lastSwitchTime;
    lastSwitchTime = now;

    times[today][currentDomain] += timeSpent;

    await chrome.storage.local.set({ times, lastDate: today });
}, 15000);


chrome.runtime.onSuspend.addListener(async () => {
    if (!currentDomain) return;

    const today = getTodayKey();
    const stored = await chrome.storage.local.get(["times", "lastDate"]);
    let times = stored.times || {};

    if (!times[today]) times[today] = {};
    if (!times[today][currentDomain]) times[today][currentDomain] = 0;

    const now = Date.now();
    const timeSpent = now - lastSwitchTime;

    times[today][currentDomain] += timeSpent;

    await chrome.storage.local.set({ times, lastDate: today });
});
