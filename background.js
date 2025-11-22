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
    const stored = await chrome.storage.local.get(["blocked", "blockedDays"]);
    return { blocked: stored.blocked || {}, blockedDays: stored.blockedDays || {} };
}

async function isDomainBlocked(domain) {
    const today = getTodayKey();
    const { blocked, blockedDays } = await getBlockedInfo();
    if (blocked[domain]) return true;
    if (blockedDays[domain] === today) return true;
    return false;
}

async function redirectToBlocker(tabId, originalUrl, domain) {
    // Try injecting an in-page OneSec overlay. Fallback to extension blocker page if injection fails.
    try {
        // first store data on window for the injected script to read
        await chrome.scripting.executeScript({
            target: { tabId },
            func: (originalUrl, domain) => {
                window.__flowstate_inject = { originalUrl, domain };
            },
            args: [originalUrl, domain]
        });
        // then inject the onesec script
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['onesec_inject.js']
        });
    } catch (e) {
        console.error('Injection failed, falling back to blocker page', e);
        const runtimeUrl = chrome.runtime.getURL('blocker.html');
        const encoded = encodeURIComponent(originalUrl);
        try {
            await chrome.tabs.update(tabId, { url: `${runtimeUrl}?url=${encoded}&domain=${encodeURIComponent(domain)}` });
        } catch (err) {
            console.error('Failed to redirect to blocker', err);
        }
    }
}

async function maybeBlockTab(tab) {
    try {
        if (!tab || !tab.url) return false;
        const myUrl = chrome.runtime.getURL('blocker.html');
        if (tab.url.startsWith(myUrl)) return false; // avoid infinite loop
        const url = new URL(tab.url);
        const domain = normalizeDomain(url.hostname);
        if (await isDomainBlocked(domain)) {
            // check for a short-lived "allow 5 minutes" flag stored in sessionStorage of the page
            try {
                const res = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (d) => {
                        try {
                            const key = '__flowstate_allow_until_' + d;
                            const v = sessionStorage.getItem(key);
                            if (!v) return null;
                            return Number(v);
                        } catch (e) { return null; }
                    },
                    args: [domain]
                });
                const allowUntil = (res && res[0] && res[0].result) || null;
                if (allowUntil && Number(allowUntil) > Date.now()) {
                    return false; // temporary allow active
                }
            } catch (e) {
                // ignore; proceed to inject
            }
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
