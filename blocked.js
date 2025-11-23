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
    const quotes = [
        "The secret of getting ahead is getting started. — Mark Twain",
        "What you do every day matters more than what you do once in a while. — Gretchen Rubin",
        "Simplicity is the ultimate sophistication. — Leonardo da Vinci",
        "The best time to plant a tree was 20 years ago. The second best time is now. — Chinese Proverb",
        "Don’t watch the clock; do what it does. Keep going. — Sam Levenson",
        "Your future is created by what you do today, not tomorrow. — Robert Kiyosaki",
        "One productive minute can save you an hour of regret later.",
        "The way to get started is to quit talking and begin doing. — Walt Disney",
        "Focus on being productive instead of busy. — Tim Ferriss",
        "Act like a man of thought, and you will become one."
    ];

    const quoteEl = document.getElementById('quote');
    let idx = 0;
    function showQuote(i) {
        if (!quoteEl) return;
        quoteEl.textContent = quotes[i % quotes.length];
    }
    showQuote(idx);
    const interval = 8000; // rotate every 8s
    const timer = setInterval(() => { idx++; showQuote(idx); }, interval);

    document.getElementById('closeBtn').addEventListener('click', () => {
        try { window.close(); } catch (e) { location.href = 'about:blank'; }
    });
});
