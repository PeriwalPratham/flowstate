// credit for chatgpt for helping with this code as i am not that good with js but good with html and cs
let currentDomain = null;
let lastSwitchTime = Date.now();
let seenStartup = false;
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

async function getBlockedInfo() {
    const stored = await chrome.storage.local.get(["blocked"]);
    return { blocked: stored.blocked || {} };
}

async function isDomainBlocked(domain) {
    const { blocked } = await getBlockedInfo();
    return !!blocked[domain];
}

async function redirectToBlocker(tabId, originalUrl, domain) {
    // Simple blocking: redirect to an extension block page that shows the domain and unblock option
    const runtimeUrl = chrome.runtime.getURL('blocked.html');
    const encoded = encodeURIComponent(domain);
    try {
        await chrome.tabs.update(tabId, { url: `${runtimeUrl}?domain=${encoded}` });
    } catch (e) {
        console.error('Failed to redirect to blocked.html', e);
        try {
            await chrome.tabs.update(tabId, { url: 'about:blank' });
        } catch (err) { }
    }
}

async function maybeBlockTab(tab) {
    try {
        if (!tab || !tab.url) return false;
        // avoid infinite loop if navigating to our extension pages
        if (tab.url.startsWith(chrome.runtime.getURL('blocked.html'))) return false;
        const url = new URL(tab.url);
        const domain = normalizeDomain(url.hostname);
        if (await isDomainBlocked(domain)) {
            await redirectToBlocker(tab.id, tab.url, domain);
            return true;
        }
    } catch (e) {
        // ignore invalid urls
    }
    return false;
}

// create a daily alarm for summaries (runs every 24 hours)
chrome.alarms.create('dailySummary', { periodInMinutes: 1440 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== 'dailySummary') return;
    const today = getTodayKey();
    const stored = await chrome.storage.local.get(['times']);
    const times = stored.times || {};
    const todayData = times[today] || {};
    const entries = Object.entries(todayData).map(([d, ms]) => [d, Math.round(ms / 60000)]);
    entries.sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, 3).map(e => `${e[0]} ${e[1]}m`).join(', ') || 'no recorded sites yet';
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Daily FlowState Summary',
        message: `Top sites today: ${top}`
    });
});

// On startup ensure alarm exists
chrome.runtime.onStartup.addListener(() => {
    if (!seenStartup) {
        seenStartup = true;
        chrome.alarms.create('dailySummary', { periodInMinutes: 1440 });
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab || !tab.url) return;
    if (await maybeBlockTab(tab)) return;
    try {
        const url = new URL(tab.url);
        const domain = normalizeDomain(url.hostname);
        await handleNewDomain(domain);
    } catch (e) { }
});
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete") return;
    if (!tab || !tab.url) return;

    if (await maybeBlockTab(tab)) return;
    try {
        const url = new URL(tab.url);
        const domain = normalizeDomain(url.hostname);
        await handleNewDomain(domain);
    } catch (e) { }
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
