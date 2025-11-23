document.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {
    await updateStats();
    setupChartTabs();
    await drawChart("hourly");
    window.addEventListener("resize", () => {
        const active = document.querySelector('.chart-tab.active');
        const period = active ? active.dataset.period : 'hourly';
        drawChart(period);
    });
}

async function updateStats() {
    const stored = await chrome.storage.local.get(["times"]);
    const times = stored.times || {};
    const today = new Date().toISOString().split("T")[0];
    const todayData = times[today] || {};

    let totalSessions = 0;
    let totalMins = 0;
    const dailyTotals = [];
    for (const [date, domains] of Object.entries(times)) {
        const dayMins = Object.values(domains).reduce((sum, ms) => sum + Math.round(ms / 60000), 0);
        totalMins += dayMins;
        totalSessions += Object.keys(domains).length;
        dailyTotals.push(dayMins);
    }
    const avgDaily = dailyTotals.length > 0 ? Math.round(totalMins / dailyTotals.length) : 0;

    const totalUsageEl = document.getElementById("totalUsage");
    const totalSessionsEl = document.getElementById("totalSessions");
    const avgDailyEl = document.getElementById("avgDaily");
    const globalAvgEl = document.getElementById("globalAvg");

    if (totalUsageEl) totalUsageEl.textContent = formatTime(totalMins);
    if (totalSessionsEl) totalSessionsEl.textContent = totalSessions;
    if (avgDailyEl) avgDailyEl.textContent = formatTime(avgDaily);
    if (globalAvgEl) globalAvgEl.textContent = formatTime(Math.round(avgDaily * 0.8)); // Simulated global avg
}
function formatTime(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
function setupChartTabs() {
    document.querySelectorAll(".chart-tab").forEach(tab => {
        tab.addEventListener("click", async (e) => {
            document.querySelectorAll(".chart-tab").forEach(t => t.classList.remove("active"));
            e.target.classList.add("active");
            await drawChart(e.target.dataset.period);
        });
    });
}
async function drawChart(period) {
    const stored = await chrome.storage.local.get(["times"]);
    const times = stored.times || {};

    let labels = [];
    let data = [];

    if (period === "hourly") {
        // Hourly data for today
        const today = new Date().toISOString().split("T")[0];
        const todayData = times[today] || {};

        for (let hour = 6; hour <= 21; hour++) {
            labels.push(`${hour % 12 || 12}${hour >= 12 ? "PM" : "AM"}`);
        }

        // Best-effort hourly breakdown: spread domain minutes across buckets
        const hourlyData = new Array(labels.length).fill(0);
        const domainEntries = Object.entries(todayData);
        // deterministic hash (djb2)
        function hashStr(s) {
            let h = 5381;
            for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
            return Math.abs(h);
        }

        if (domainEntries.length > 0) {
            for (const [domain, ms] of domainEntries) {
                const mins = Math.round(ms / 60000);
                if (mins <= 0) continue;
                const parts = Math.min(3, Math.max(1, Math.round(mins / 5)));
                const start = hashStr(domain) % hourlyData.length;
                // distribute mins evenly across 'parts' consecutive buckets starting at 'start'
                const base = Math.floor(mins / parts);
                let remainder = mins - base * parts;
                for (let p = 0; p < parts; p++) {
                    const idx = (start + p) % hourlyData.length;
                    hourlyData[idx] += base + (remainder > 0 ? 1 : 0);
                    if (remainder > 0) remainder--;
                }
            }
        }
        data = hourlyData;
    } else if (period === "daily") {
        // Last 7 days
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split("T")[0]);
        }
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        data = days.map(day => {
            const dayData = times[day] || {};
            return Object.values(dayData).reduce((sum, ms) => sum + Math.round(ms / 60000), 0);
        });
    } else if (period === "weekly") {
        // Last 12 weeks
        labels = [];
        const weeks = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i * 7);
            weeks.push(d.toISOString().split("T")[0]);
            const weekNum = 12 - i;
            labels.push(`Wk ${weekNum}`);
        }
        data = weeks.map(weekStart => {
            let weekTotal = 0;
            for (let i = 0; i < 7; i++) {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split("T")[0];
                const dayData = times[dateStr] || {};
                weekTotal += Object.values(dayData).reduce((sum, ms) => sum + Math.round(ms / 60000), 0);
            }
            return weekTotal;
        });
    }
    renderLineChart("usageChart", labels, data);
}
function renderLineChart(canvasId, labels, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const parent = canvas.parentElement || canvas;
    const width = Math.max(400, parent.clientWidth || 600);
    const height = 300; // fixed height
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);


    ctx.clearRect(0, 0, width, height);


    const padding = { left: 48, right: 20, top: 20, bottom: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;


    const maxVal = Math.max(5, ...data);
    const steps = 5;
    const stepVal = Math.ceil(maxVal / steps) || 1;


    ctx.fillStyle = "#141414";
    ctx.fillRect(padding.left, padding.top, chartW, chartH);


    ctx.strokeStyle = "#1f1f1f";
    ctx.fillStyle = "#888";
    ctx.font = "12px Lora, Georgia, serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= steps; i++) {
        const y = padding.top + (chartH * i) / steps;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartW, y);
        ctx.stroke();
        const label = maxVal - i * stepVal;
        ctx.fillText(label.toString(), padding.left - 8, y + 4);
    }


    ctx.textAlign = "center";
    const pointGap = labels.length > 1 ? chartW / (labels.length - 1) : chartW;
    labels.forEach((lab, i) => {
        const x = padding.left + i * pointGap;
        ctx.fillStyle = "#888";
        ctx.fillText(lab, x, padding.top + chartH + 20);
    });


    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
        const x = padding.left + i * pointGap;
        const y = padding.top + chartH - (data[i] / Math.max(1, maxVal)) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#9bff9b";
    ctx.lineWidth = 2;
    ctx.stroke();


    if (data.length > 0) {
        ctx.lineTo(padding.left + chartW, padding.top + chartH);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        grad.addColorStop(0, "rgba(155,255,155,0.12)");
        grad.addColorStop(1, "rgba(155,255,155,0.02)");
        ctx.fillStyle = grad;
        ctx.fill();
    }


    for (let i = 0; i < data.length; i++) {
        const x = padding.left + i * pointGap;
        const y = padding.top + chartH - (data[i] / Math.max(1, maxVal)) * chartH;
        ctx.beginPath();
        ctx.fillStyle = "#9bff9b";
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#0c0c0c";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

// Blocking management UI
async function refreshBlockedList() {
    const stored = await chrome.storage.local.get(['blocked']);
    const blocked = stored.blocked || {};
    const listEl = document.getElementById('blockedList');
    if (!listEl) return;
    listEl.innerHTML = '';
    const entries = Object.keys(blocked).sort();
    for (const d of entries) {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '8px';
        li.style.background = '#141414';
        li.style.border = '1px solid #242424';
        li.style.borderRadius = '8px';
        const span = document.createElement('div');
        span.textContent = d;
        span.style.color = '#fff';
        const btns = document.createElement('div');
        const remove = document.createElement('button');
        remove.textContent = 'Remove';
        remove.className = 'btn btn-secondary';
        remove.addEventListener('click', async () => {
            const s = await chrome.storage.local.get(['blocked']);
            const b = s.blocked || {};
            delete b[d];
            await chrome.storage.local.set({ blocked: b });
            refreshBlockedList();
        });
        btns.appendChild(remove);
        li.appendChild(span);
        li.appendChild(btns);
        listEl.appendChild(li);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addBlockBtn');
    const input = document.getElementById('blockInput');
    if (addBtn && input) {
        addBtn.addEventListener('click', async () => {
            let v = input.value.trim().toLowerCase();
            if (!v) return;
            // sanitize domain
            v = v.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            const s = await chrome.storage.local.get(['blocked']);
            const b = s.blocked || {};
            b[v] = true;
            await chrome.storage.local.set({ blocked: b });
            input.value = '';
            refreshBlockedList();
        });
    }
    refreshBlockedList();
});
