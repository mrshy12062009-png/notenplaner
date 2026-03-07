let subjects = JSON.parse(localStorage.getItem('GF_ULTIMATE_V4')) || [];
let activeId = null;

const save = () => localStorage.setItem('GF_ULTIMATE_V4', JSON.stringify(subjects));

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
}

function getStatus(avg, target) {
    if (avg === null) return { g: 'var(--card)', t: 'KEINE DATEN' };
    // Logik: Gut, wenn Schnitt >= persönliches Ziel
    return avg >= (target || 10) ? { g: 'var(--g-blue)', t: 'STARK' } : { g: 'var(--g-red)', t: 'ACHTUNG' };
}

function renderDash() {
    const grid = document.getElementById('dash-grid');
    grid.innerHTML = '';
    let total = 0, count = 0;

    subjects.forEach(s => {
        const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
        const status = getStatus(avg, s.target);
        if(avg !== null) { total += avg; count++; }

        // Balken berechnen (0-15 Punkte)
        const percent = avg !== null ? Math.min((avg / 15) * 100, 100) : 0;

        grid.innerHTML += `
            <div class="card" onclick="openDetail(${s.id})">
                <span class="title">${s.name}</span>
                <h2 style="color: ${avg !== null ? '#fff' : '#222'}">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <div class="progress-container">
                    <div class="progress-fill" style="width: ${percent}%; background: ${status.g}"></div>
                </div>
            </div>`;
    });
    document.getElementById('main-avg').innerText = count > 0 ? (total/count).toFixed(2) : '0.0';
}

function addFach() {
    const el = document.getElementById('name-in');
    if(!el.value.trim()) return;
    subjects.push({ id: Date.now(), name: el.value, notes: [], target: 10 });
    el.value = ''; save(); renderDash();
}

function openDetail(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    showPage('detail');
    const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
    const status = getStatus(avg, s.target);

    document.getElementById('det-hero').style.background = status.g;
    document.getElementById('det-title').innerText = s.name;
    document.getElementById('det-score').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-status').innerText = status.t;

    const hist = document.getElementById('note-history');
    hist.innerHTML = s.notes.map((n, i) => `
        <div class="glass" style="display:flex; justify-content:space-between; align-items:center; padding:15px; margin-bottom:10px">
            <b>Punkte: ${n}</b>
            <button onclick="delNote(${i})" style="color:#ff4444; background:none; border:none; cursor:pointer; font-weight:bold">LÖSCHEN</button>
        </div>`).reverse().join('');
}

function addNote() {
    const el = document.getElementById('note-in');
    const val = Math.min(Math.max(parseFloat(el.value), 0), 15);
    if(isNaN(val)) return;
    subjects.find(x => x.id === activeId).notes.push(val);
    el.value = ''; save(); openDetail(activeId);
}

function delNote(i) {
    const s = subjects.find(x => x.id === activeId);
    s.notes.splice(s.notes.length - 1 - i, 1);
    save(); openDetail(activeId);
}

function delFach() {
    if(confirm("Dieses Fach löschen?")) { subjects = subjects.filter(x => x.id !== activeId); save(); showPage('list'); }
}

function renderGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    subjects.forEach(s => {
        list.innerHTML += `
            <div class="goal-card">
                <span style="font-weight:900">${s.name}</span>
                <input type="number" min="0" max="15" value="${s.target}" onchange="updateGoal(${s.id}, this.value)">
            </div>`;
    });
}

function updateGoal(id, val) {
    subjects.find(x => x.id === id).target = Math.min(Math.max(parseFloat(val), 0), 15);
    save();
}

function factoryReset() { if(confirm("ALLES LÖSCHEN?")) { localStorage.clear(); location.reload(); } }

renderDash();