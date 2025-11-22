(function () {
    try {
        const data = window.__flowstate_inject || {};
        const original = data.originalUrl || location.href;
        const domain = data.domain || (location.hostname || '');

        // avoid injecting twice
        if (document.getElementById('__flowstate_onesec_overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = '__flowstate_onesec_overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '2147483647';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(0,0,0,0.6)';
        overlay.style.backdropFilter = 'blur(3px)';

        const card = document.createElement('div');
        card.style.width = 'min(720px, 92%)';
        card.style.padding = '28px';
        card.style.borderRadius = '14px';
        card.style.background = '#0f1113';
        card.style.color = '#fff';
        card.style.boxShadow = '0 10px 40px rgba(0,0,0,0.6)';
        card.style.textAlign = 'center';
        card.style.fontFamily = 'Inter, Roboto, Arial, sans-serif';

        const title = document.createElement('h1');
        title.textContent = 'One Second — Pause';
        title.style.color = '#9bff9b';
        title.style.margin = '0 0 6px 0';
        title.style.fontSize = '22px';

        const msg = document.createElement('p');
        msg.textContent = `You are opening ${domain || 'this site'}. Take one second to decide.`;
        msg.style.color = '#cfcfcf';
        msg.style.margin = '0 0 18px 0';

        const progressWrap = document.createElement('div');
        progressWrap.style.width = '100%';
        progressWrap.style.height = '10px';
        progressWrap.style.background = '#0b0b0b';
        progressWrap.style.border = '1px solid #222';
        progressWrap.style.borderRadius = '999px';
        progressWrap.style.overflow = 'hidden';
        progressWrap.style.margin = '0 0 16px 0';

        const progress = document.createElement('div');
        progress.style.width = '0%';
        progress.style.height = '100%';
        progress.style.background = '#9bff9b';
        progress.style.transition = 'width 300ms linear';
        progressWrap.appendChild(progress);

        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '10px';
        controls.style.justifyContent = 'center';

        const continueBtn = document.createElement('button');
        continueBtn.textContent = 'Continue';
        continueBtn.disabled = true;
        continueBtn.style.padding = '10px 18px';
        continueBtn.style.borderRadius = '8px';
        continueBtn.style.border = 'none';
        continueBtn.style.cursor = 'pointer';
        continueBtn.style.fontWeight = '700';
        continueBtn.style.background = '#9bff9b';
        continueBtn.style.color = '#071';

        const blockBtn = document.createElement('button');
        blockBtn.textContent = 'Block for Today';
        blockBtn.style.padding = '10px 18px';
        blockBtn.style.borderRadius = '8px';
        blockBtn.style.border = 'none';
        blockBtn.style.cursor = 'pointer';
        blockBtn.style.fontWeight = '700';
        blockBtn.style.background = '#222';
        blockBtn.style.color = '#fff';

        const allow5Btn = document.createElement('button');
        allow5Btn.textContent = 'Allow 5 minutes';
        allow5Btn.style.padding = '10px 18px';
        allow5Btn.style.borderRadius = '8px';
        allow5Btn.style.border = 'none';
        allow5Btn.style.cursor = 'pointer';
        allow5Btn.style.fontWeight = '700';
        allow5Btn.style.background = '#1f1f1f';
        allow5Btn.style.color = '#fff';

        controls.appendChild(continueBtn);
        controls.appendChild(allow5Btn);
        controls.appendChild(blockBtn);

        const note = document.createElement('div');
        note.style.marginTop = '12px';
        note.style.fontSize = '12px';
        note.style.color = '#aaa';
        note.textContent = 'Small friction helps break autopilot. You can continue after the countdown.';

        card.appendChild(title);
        card.appendChild(msg);
        card.appendChild(progressWrap);
        card.appendChild(controls);
        card.appendChild(note);
        overlay.appendChild(card);
        document.documentElement.appendChild(overlay);

        // prevent pointer events under the overlay
        document.body.style.pointerEvents = 'none';
        overlay.style.pointerEvents = 'auto';

        // countdown logic: 1000ms but animate in a few frames for smoothness
        let duration = 1000; // 1s
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const pct = Math.min(1, elapsed / duration);
            progress.style.width = (pct * 100) + '%';
            if (pct < 1) {
                requestAnimationFrame(tick);
            } else {
                continueBtn.disabled = false;
            }
        };
        requestAnimationFrame(tick);

        function cleanup(redirect) {
            try {
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                // restore pointer events
                document.body.style.pointerEvents = '';
            } catch (e) { }
            if (redirect) {
                try {
                    location.href = redirect;
                } catch (e) { }
            }
        }

        continueBtn.addEventListener('click', () => cleanup());

        allow5Btn.addEventListener('click', async () => {
            // set a small temporary allow flag in sessionStorage so background won't re-inject for 5 minutes
            try {
                const key = '__flowstate_allow_until_' + domain;
                const until = Date.now() + (5 * 60 * 1000);
                sessionStorage.setItem(key, String(until));
            } catch (e) { }
            cleanup();
        });

        blockBtn.addEventListener('click', async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const stored = await chrome.storage.local.get(['blockedDays']);
                const blockedDays = stored.blockedDays || {};
                blockedDays[domain] = today;
                await chrome.storage.local.set({ blockedDays });
            } catch (e) {
                try { window.__flowstate_block = { domain }; } catch (e) { }
            }
            // navigate away to a neutral page
            cleanup('about:blank');
        });

        // small helper to avoid reinjecting when allow5 is active
        // background script should check sessionStorage via an injection check; as a simple heuristic, leave this here.

    } catch (err) {
        console.error('onesec_inject error', err);
    }
})();
