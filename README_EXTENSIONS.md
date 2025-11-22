FlowState — Recent additions and how to try

New features added (quick)

- Site blocking with One-Second friction: blocked sites open an interstitial (`blocker.html`) that forces a 1s pause and offers "Continue" or "Block for Today".
- Toggle block from popup: click a domain in the popup to toggle blocking for that domain.
- Daily summary notification: extension creates a daily summary notification with top sites of the day.

How to try locally

1. Open `chrome://extensions` in Chrome (or Edge), enable Developer mode.
2. Click "Load unpacked" and choose the `flowstate` folder.
3. Click the extension icon — the popup shows today's totals. Click a site to toggle blocking.
4. Try navigating to a blocked site — you should be redirected to the One-Second interstitial and given the option to continue or block the site for today.

Notes: This prototype stores data locally via `chrome.storage.local`. The daily summary runs via `chrome.alarms` and shows a notification once per 24h.
