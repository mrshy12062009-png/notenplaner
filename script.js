const DB_KEY = 'GF_MODERN_STRICT';
let data = JSON.parse(localStorage.getItem(DB_KEY)) || [];
let active = null;

function save() { localStorage.setItem(DB_KEY, JSON.stringify(data)); }

function getStatus(avg, target) {
    if (avg === null) return { g: 'var(--grad-none)', t: 'KEINE DATEN' };
    return avg >= (target || 15) 
        ? { g: 'var(--grad-good)', t: 'GUT' } 
        : { g: 'var(--grad-bad)', t: 'SCHLECHT' };
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
}

function renderDash() {
    const grid = document.getElementById('dash-grid');
    grid.innerHTML = '';
    let sum = 0, count = 0;

    data.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const s = getStatus(avg, f.target);
        if(avg !== null) { sum += avg; count++; }

        grid.innerHTML += `
            <div class="card" style="background: ${s.g}" onclick="openDet(${f.id})">
                <span style="font-weight:900; opacity:0.7; text-transform:uppercase; font-size:12px;">${f.name}</span>
                <h1>${avg !== null ? avg.toFixed(1) : '-'}</h1>
                <span style="font-weight:900; font-size:10px;">ZIEL: ${f.target || 15}</span>
            </div>`;
    });
    document.getElementById('main-avg').innerText = count > 0 ? (sum/count).toFixed(2) : '-';
}

function renderGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    data.forEach(f => {
        list.innerHTML += `
            <div class="goal-edit-card">
                <span style="font-weight:900; font-size:18px;">${f.name}</span>
                <div>
                    <span style="font-size:12px; opacity:0.6; margin-right:10px;">Ziel-Punkte:</span>
                    <input type="number" value="${f.target || 15}" onchange="updateTarget(${f.id}, this.value)">
                </div>
            </div>`;
    });
}

function updateTarget(id, val) {
    const f = data.find(x => x.id === id);
    f.target = parseFloat(val) || 0;
    save();
}

function openDet(id) {
    active = data.find(x => x.id === id);
    showPage('detail');
    const avg = active.notes.length ? active.notes.reduce((a,b)=>a+b,0)/active.notes.length : null;
    const s = getStatus(avg, active.target);

    document.getElementById('det-hero').style.background = s.g;
    document.getElementById('det-title').innerText = active.name;
    document.getElementById('det-score').innerText = avg !== null ? avg.toFixed(1) : '-';
    document.getElementById('det-status').innerText = s.t;

    const hist = document.getElementById('note-history');
    hist.innerHTML = active.notes.map((n, i) => `
        <div class="glass" style="display:flex; justify-content:space-between; margin-bottom:8px; padding:12px">
            <b>Note: ${n}</b>
            <button onclick="delNote(${i})" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold">X</button>
        </div>`).reverse().join('');
}

function addFach() {
    const n = document.getElementById('name-in').value;
    if(!n) return;
    data.push({ id: Date.now(), name: n, notes: [], target: 15 });
    document.getElementById('name-in').value = '';
    save(); renderDash();
}

function addNote() {
    const v = parseFloat(document.getElementById('note-in').value);
    if(isNaN(v)) return;
    active.notes.push(v);
    document.getElementById('note-in').value = '';
    save(); openDet(active.id);
}

function delNote(i) {
    active.notes.splice(active.notes.length - 1 - i, 1);
    save(); openDet(active.id);
}

function delFach() {
    if(confirm("Fach löschen?")) { data = data.filter(x => x.id !== active.id); save(); showPage('list'); }
}

function factoryReset() {
    if(confirm("ALLES LÖSCHEN?")) { localStorage.clear(); location.reload(); }
}

renderDash();