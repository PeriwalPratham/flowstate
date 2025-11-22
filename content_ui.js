(function () {
    // small content UI to let user toggle blocking for current domain
    try {
        const normalizeDomain = (raw) => {
            const parts = raw.split('.');
            if (parts.length <= 2) return raw;
            return parts.slice(parts.length - 2).join('.');
        };
        const domain = normalizeDomain(location.hostname || '');
        if (!domain) return;
        if (location.protocol.startsWith('chrome-extension:') || location.href.includes('flowstate')) return;

        // avoid injecting twice
        if (document.getElementById('__flowstate_content_ui')) return;

        const container = document.createElement('div');
        container.id = '__flowstate_content_ui';
        container.style.position = 'fixed';
        container.style.zIndex = '2147483646';
        container.style.fontFamily = 'Inter, Arial, sans-serif';

        // load position from storage (default: bottom-right)
        let position = 'bottom-right';
        chrome.storage.local.get(['uiPosition'], (res) => {
            position = res.uiPosition || 'bottom-right';
            applyPosition();
        });

        function applyPosition() {
            container.style.right = '';
            container.style.left = '';
            container.style.top = '';
            container.style.bottom = '';
            switch (position) {
                case 'top-left':
                    container.style.top = '16px';
                    container.style.left = '16px';
                    break;
                case 'top-right':
                    container.style.top = '16px';
                    container.style.right = '16px';
                    break;
                case 'bottom-left':
                    container.style.bottom = '16px';
                    container.style.left = '16px';
                    break;
                default: // bottom-right
                    container.style.bottom = '16px';
                    container.style.right = '16px';
            }
        }
        applyPosition();

        const btn = document.createElement('button');
        btn.textContent = 'Flow';
        btn.title = 'FlowState — site controls';
        btn.style.background = '#0f0f0f';
        btn.style.color = '#dcecdc';
        btn.style.border = '1px solid #2a2a2a';
        btn.style.padding = '8px 10px';
        btn.style.borderRadius = '10px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';

        const panel = document.createElement('div');
        panel.style.marginTop = '8px';
        panel.style.background = '#0b0b0b';
        panel.style.color = '#fff';
        panel.style.border = '1px solid #222';
        panel.style.padding = '12px';
        panel.style.borderRadius = '10px';
        panel.style.minWidth = '200px';
        panel.style.display = 'none';
        panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';

        const title = document.createElement('div');
        title.textContent = domain;
        title.style.fontWeight = '700';
        title.style.marginBottom = '8px';

        const status = document.createElement('div');
        status.style.fontSize = '13px';
        status.style.marginBottom = '8px';

        const toggleBtn = document.createElement('button');
        toggleBtn.style.padding = '8px 10px';
        toggleBtn.style.borderRadius = '8px';
        toggleBtn.style.border = 'none';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.marginRight = '8px';

        const blockTodayBtn = document.createElement('button');
        blockTodayBtn.textContent = 'Block for Today';
        blockTodayBtn.style.padding = '8px 10px';
        blockTodayBtn.style.borderRadius = '8px';
        blockTodayBtn.style.border = 'none';
        blockTodayBtn.style.cursor = 'pointer';
        blockTodayBtn.style.background = '#222';
        blockTodayBtn.style.color = '#fff';

        const allow5Btn = document.createElement('button');
        allow5Btn.textContent = 'Allow 5 min';
        allow5Btn.style.padding = '8px 10px';
        allow5Btn.style.borderRadius = '8px';
        allow5Btn.style.border = 'none';
        allow5Btn.style.cursor = 'pointer';
        allow5Btn.style.background = '#333';
        allow5Btn.style.color = '#fff';

        const openDash = document.createElement('div');
        openDash.textContent = 'Open FlowState';
        openDash.style.marginTop = '10px';
        openDash.style.fontSize = '13px';
        openDash.style.cursor = 'pointer';
        openDash.style.color = '#9bff9b';

        const settingsBtn = document.createElement('div');
        settingsBtn.textContent = '⚙️ Settings';
        settingsBtn.style.marginTop = '10px';
        settingsBtn.style.fontSize = '13px';
        settingsBtn.style.cursor = 'pointer';
        settingsBtn.style.color = '#9bff9b';

        const settingsPanel = document.createElement('div');
        settingsPanel.style.marginTop = '10px';
        settingsPanel.style.padding = '10px';
        settingsPanel.style.background = '#0f0f0f';
        settingsPanel.style.border = '1px solid #1a1a1a';
        settingsPanel.style.borderRadius = '8px';
        settingsPanel.style.fontSize = '12px';
        settingsPanel.style.display = 'none';

        const posLabel = document.createElement('div');
        posLabel.textContent = 'Button Position:';
        posLabel.style.marginBottom = '6px';
        posLabel.style.fontWeight = '600';
        const posSel = document.createElement('select');
        posSel.style.width = '100%';
        posSel.style.padding = '4px';
        posSel.style.marginBottom = '10px';
        posSel.style.background = '#1a1a1a';
        posSel.style.color = '#fff';
        posSel.style.border = '1px solid #333';
        posSel.style.borderRadius = '4px';
        ['bottom-right', 'top-right', 'top-left', 'bottom-left'].forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            posSel.appendChild(opt);
        });

        const countdownLabel = document.createElement('div');
        countdownLabel.textContent = 'Friction Delay (seconds):';
        countdownLabel.style.marginBottom = '6px';
        countdownLabel.style.fontWeight = '600';
        const countdownSel = document.createElement('select');
        countdownSel.style.width = '100%';
        countdownSel.style.padding = '4px';
        countdownSel.style.marginBottom = '10px';
        countdownSel.style.background = '#1a1a1a';
        countdownSel.style.color = '#fff';
        countdownSel.style.border = '1px solid #333';
        countdownSel.style.borderRadius = '4px';
        [1, 2, 3, 5, 10].forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s + 's';
            countdownSel.appendChild(opt);
        });

        const styleLabel = document.createElement('div');
        styleLabel.textContent = 'OneSec Style:';
        styleLabel.style.marginBottom = '6px';
        styleLabel.style.fontWeight = '600';
        const styleSel = document.createElement('select');
        styleSel.style.width = '100%';
        styleSel.style.padding = '4px';
        styleSel.style.marginBottom = '10px';
        styleSel.style.background = '#1a1a1a';
        styleSel.style.color = '#fff';
        styleSel.style.border = '1px solid #333';
        styleSel.style.borderRadius = '4px';
        ['modal', 'full-blur', 'progress-bar'].forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            styleSel.appendChild(opt);
        });

        settingsPanel.appendChild(posLabel);
        settingsPanel.appendChild(posSel);
        settingsPanel.appendChild(countdownLabel);
        settingsPanel.appendChild(countdownSel);
        settingsPanel.appendChild(styleLabel);
        settingsPanel.appendChild(styleSel);

        panel.appendChild(title);
        panel.appendChild(status);

        const actionRow = document.createElement('div');
        actionRow.style.display = 'flex';
        actionRow.style.gap = '8px';
        actionRow.appendChild(toggleBtn);
        actionRow.appendChild(allow5Btn);
        panel.appendChild(actionRow);
        panel.appendChild(blockTodayBtn);
        panel.appendChild(openDash);
        panel.appendChild(settingsBtn);
        panel.appendChild(settingsPanel);

        container.appendChild(btn);
        container.appendChild(panel);
        document.documentElement.appendChild(container);

        async function refresh() {
            const stored = await chrome.storage.local.get(['blocked', 'blockedDays']);
            const blocked = stored.blocked || {};
            const blockedDays = stored.blockedDays || {};
            const today = new Date().toISOString().split('T')[0];
            const isBlockedPersistent = !!blocked[domain];
            const isBlockedToday = blockedDays[domain] === today;
            const isBlocked = isBlockedPersistent || isBlockedToday;
            status.textContent = isBlocked ? 'Status: Blocked' : 'Status: Allowed';
            toggleBtn.textContent = isBlocked ? 'Unblock' : 'Block (persist)';
            toggleBtn.style.background = isBlocked ? '#3a3a3a' : '#9bff9b';
            toggleBtn.style.color = isBlocked ? '#fff' : '#071';
        }

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            if (panel.style.display === 'block') refresh();
        });

        // click outside to close
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) panel.style.display = 'none';
        });

        toggleBtn.addEventListener('click', async () => {
            const stored = await chrome.storage.local.get(['blocked']);
            const blocked = stored.blocked || {};
            const isBlockedNow = !!blocked[domain];
            if (isBlockedNow) {
                delete blocked[domain];
                await chrome.storage.local.set({ blocked });
                await refresh();
            } else {
                blocked[domain] = true;
                await chrome.storage.local.set({ blocked });
                // navigate away if user just blocked current site
                try { location.href = 'about:blank'; } catch (e) { }
            }
        });

        blockTodayBtn.addEventListener('click', async () => {
            const today = new Date().toISOString().split('T')[0];
            const stored = await chrome.storage.local.get(['blockedDays']);
            const blockedDays = stored.blockedDays || {};
            blockedDays[domain] = today;
            await chrome.storage.local.set({ blockedDays });
            try { location.href = 'about:blank'; } catch (e) { }
        });

        allow5Btn.addEventListener('click', () => {
            try {
                const key = '__flowstate_allow_until_' + domain;
                const until = Date.now() + (5 * 60 * 1000);
                sessionStorage.setItem(key, String(until));
            } catch (e) { }
            panel.style.display = 'none';
        });

        openDash.addEventListener('click', () => {
            try { window.open(chrome.runtime.getURL('dashboard.html')); } catch (e) { }
        });

        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        });

        posSel.addEventListener('change', async () => {
            position = posSel.value;
            await chrome.storage.local.set({ uiPosition: position });
            applyPosition();
        });

        countdownSel.addEventListener('change', async () => {
            await chrome.storage.local.set({ frictionDelay: parseInt(countdownSel.value) });
        });

        styleSel.addEventListener('change', async () => {
            await chrome.storage.local.set({ oneSec_style: styleSel.value });
        });

        // load current settings
        chrome.storage.local.get(['uiPosition', 'frictionDelay', 'oneSec_style'], (res) => {
            if (res.uiPosition) posSel.value = res.uiPosition;
            if (res.frictionDelay) countdownSel.value = res.frictionDelay;
            if (res.oneSec_style) styleSel.value = res.oneSec_style;
        });

        // initial refresh
        refresh();

        // update UI when storage changes
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area !== 'local') return;
            if (changes.blocked || changes.blockedDays) refresh();
        });

    } catch (err) {
        console.error('flowstate content ui error', err);
    }
})();