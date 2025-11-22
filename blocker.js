(async () => {
    function getQuery() {
        const q = {};
        location.search.slice(1).split('&').forEach(p => {
            if (!p) return;
            const [k, v] = p.split('=');
            q[decodeURIComponent(k)] = decodeURIComponent(v || '');
        });
        return q;
    }
    const q = getQuery();
    const original = q.url || '';
    const domain = q.domain || '';
    const domainText = document.getElementById('domainText');
    domainText.textContent = domain ? domain : '';

    const continueBtn = document.getElementById('continueBtn');
    const blockTodayBtn = document.getElementById('blockTodayBtn');

    let countdown = 1;
    continueBtn.textContent = `Continue (after ${countdown}s)`;
    const interval = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
            continueBtn.textContent = 'Continue';
            clearInterval(interval);
            continueBtn.disabled = false;
        } else {
            continueBtn.textContent = `Continue (after ${countdown}s)`;
            continueBtn.disabled = true;
        }
    }, 1000);

    continueBtn.disabled = true;
    continueBtn.addEventListener('click', async () => {
        if (!original) return;
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                await chrome.tabs.update(tabs[0].id, { url: original });
            }
        } catch (e) {
            console.error(e);
            location.href = original;
        }
    });

    blockTodayBtn.addEventListener('click', async () => {
        if (!domain) return;
        const today = new Date().toISOString().split('T')[0];
        const stored = await chrome.storage.local.get(['blockedDays']);
        const blockedDays = stored.blockedDays || {};
        blockedDays[domain] = today;
        await chrome.storage.local.set({ blockedDays });
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
            // navigate away to a neutral page
            await chrome.tabs.update(tabs[0].id, { url: 'about:blank' });
        }
    });
})();
