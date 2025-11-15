let currentdomain = null;
let lastswitchtime = Date.now();
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url) return;
    const url = new URL(tab.url);
    const domain = url.hostname;
    await handleNewDomain(domain);
});


chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return;
    if (!tab.url) return;
    const url = new URL(tab.url);
    const domain = url.hostname;
    await handleNewDomain(domain);


});

function getTodayKey() {
    return new Date().toISOString().split("T")[0];
}

async function handleNewDomain(domain) {
    const today = getTodayKey();


    const stored = await chrome.storage.local.get(["times", "lastDate"]);
    let times = stored.times || {};
    let lastDate = stored.lastDate || today;


    if (today !== lastDate) {
        times = {};
    }


    if (!currentdomain) {
        currentdomain = domain;
        lastswitchtime = Date.now();

        await chrome.storage.local.set({ times, lastDate: today });
        return;
    }


    const now = Date.now();
    const timespent = now - lastswitchtime;


    if (!times[today]) times[today] = {};


    if (!times[today][currentdomain]) {
        times[today][currentdomain] = 0;
    }

    times[today][currentdomain] += timespent;


    await chrome.storage.local.set({
        times,
        lastDate: today
    });


    currentdomain = domain;
    lastswitchtime = Date.now();
}




