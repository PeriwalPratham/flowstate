let currentdomain = null;
let lastswitchtime = Date.now();

// ---------------------------
// TAB ACTIVATED
// ---------------------------
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url) return;

    let domain;
    try {
        const url = new URL(tab.url);
        domain = url.hostname;
    } catch {
        return;
    }

    await handleNewDomain(domain);
});


// ---------------------------
// TAB UPDATED
// ---------------------------
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return;
    if (!tab.url) return;

    let domain;
    try {
        const url = new URL(tab.url);
        domain = url.hostname;
    } catch {
        return;
    }

    await handleNewDomain(domain);
});


// ---------------------------
// GET DATE KEY
// ---------------------------
function getTodayKey() {
    return new Date().toISOString().split("T")[0];
}


// ---------------------------
//       DOMAIN HANDLING
// ---------------------------
async function handleNewDomain(newDomain) {

    const today = getTodayKey();
    const stored = await chrome.storage.local.get(["times", "lastDate"]);
    let times = stored.times || {};
    let lastDate = stored.lastDate || today;

    if (today !== lastDate) {
        times = {};
    }

    if (!times[today]) times[today] = {};

    const now = Date.now();


    if (!currentdomain) {
        currentdomain = newDomain;
        lastswitchtime = now;
        await chrome.storage.local.set({ times, lastDate: today });
        return;
    }


    if (newDomain === currentdomain) {
        return;
    }


    const timespent = now - lastswitchtime;

    if (!times[today][currentdomain]) {
        times[today][currentdomain] = 0;
    }
    times[today][currentdomain] += timespent;


    currentdomain = newDomain;
    lastswitchtime = now;

    await chrome.storage.local.set({
        times,
        lastDate: today
    });
}



// ---------------------------
setInterval(async () => {
    if (!currentdomain) return;

    const today = getTodayKey();
    const stored = await chrome.storage.local.get(["times", "lastDate"]);
    let times = stored.times || {};

    if (!times[today]) times[today] = {};
    if (!times[today][currentdomain]) times[today][currentdomain] = 0;

    const now = Date.now();
    const timespent = now - lastswitchtime;
    lastswitchtime = now;

    times[today][currentdomain] += timespent;

    await chrome.storage.local.set({
        times,
        lastDate: today
    });
}, 15000);


// ---------------------------
chrome.runtime.onSuspend.addListener(async () => {
    if (!currentdomain) return;

    const today = getTodayKey();
    const stored = await chrome.storage.local.get(["times", "lastDate"]);
    let times = stored.times || {};

    if (!times[today]) times[today] = {};
    if (!times[today][currentdomain]) times[today][currentdomain] = 0;

    const now = Date.now();
    const timespent = now - lastswitchtime;

    times[today][currentdomain] += timespent;

    await chrome.storage.local.set({
        times,
        lastDate: today
    });
});
// ---------------------------                      