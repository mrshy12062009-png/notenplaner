let subjects = JSON.parse(localStorage.getItem('GF_DATA')) || [];
let activeId = null;

const save = () => localStorage.setItem('GF_DATA', JSON.stringify(subjects));

function tab(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    if(id !== 'det') document.getElementById('btn-' + id).classList.add('active');
    
    if(id === 'dash') renderDash();
    if(id === 'stats') renderStats();
}

function renderDash() {
    const grid = document.getElementById('dash-grid');
    grid.innerHTML = subjects.map(s => {
        const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '0.0';
        return `
            <div class="card" onclick="openSub(${s.id})">
                <label>${s.name}</label>
                <div class="val">${avg}</div>
                <small>${s.notes.length} Einträge</small>
            </div>
        `;
    }).join('');
}

function openSub(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    document.getElementById('det-title').innerText = s.name;
    updateDetail();
    tab('det');
}

function updateDetail() {
    const s = subjects.find(x => x.id === activeId);
    const avg = s.notes.length ? (s.notes.reduce((a,b)=>a+b,0)/s.notes.length).toFixed(1) : '0.0';
    document.getElementById('det-avg').innerText = avg;
    
    document.getElementById('grade-history').innerHTML = s.notes.map((n, i) => `
        <div class="history-item">
            <span>${n} Punkte</span>
            <button onclick="delGrade(${i})">Löschen</button>
        </div>
    `).reverse().join('');
}

function renderStats() {
    const chart = document.getElementById('bar-chart');
    const dist = new Array(16).fill(0);
    let all = [];
    subjects.forEach(s => s.notes.forEach(n => { dist[n]++; all.push(n); }));

    const max = Math.max(...dist) || 1;
    chart.innerHTML = dist.map((count, p) => `
        <div class="bar-wrapper">
            <div class="bar" style="height: ${(count/max)*100}%"></div>
            <span class="bar-label">${p}</span>
        </div>
    `).join('');

    document.getElementById('total-avg').innerText = all.length ? (all.reduce((a,b)=>a+b,0)/all.length).toFixed(2) : '0.0';
    document.getElementById('best-grade').innerText = all.length ? Math.max(...all) + " Pkt" : "-";
}

/* Reset Logik */
function confirmReset() { document.getElementById('reset-modal').classList.add('open'); }
function closeReset() { document.getElementById('reset-modal').classList.remove('open'); }
function executeReset() { localStorage.clear(); location.reload(); }

// ... (Restliche Funktionen wie addSub, addGrade identisch zum Vorherigen)
tab('dash');