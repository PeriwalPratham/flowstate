document.addEventListener('DOMContentLoaded', async () => {
    function getQuery() {
        const q = {};
        location.search.slice(1).split('&').forEach(p => { if (!p) return; const [k, v] = p.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
        return q;
    }
    const q = getQuery();
    const domain = q.domain || '';
    const msg = document.getElementById('msg');
    if (domain) msg.textContent = `The site ${domain} is blocked.`;

    document.getElementById('unblock').addEventListener('click', async () => {
        if (!domain) return;
        const stored = await chrome.storage.local.get(['blocked']);
        const blocked = stored.blocked || {};
        if (blocked[domain]) {
            delete blocked[domain];
            await chrome.storage.local.set({ blocked });
        }
        try { window.close(); } catch (e) { location.href = 'about:blank'; }
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
        try { window.close(); } catch (e) { location.href = 'about:blank'; }
    });
});
