let data = JSON.parse(localStorage.getItem('GF_FINAL_STABLE')) || [];
let activeId = null;

// Wartet bis das HTML komplett geladen ist
document.addEventListener('DOMContentLoaded', () => {
    renderDash();

    // Enter für Fach hinzufügen
    document.getElementById('name-in').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addFach();
    });

    // Enter für Note hinzufügen
    document.getElementById('note-in').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addNote();
    });
});

function save() {
    localStorage.setItem('GF_FINAL_STABLE', JSON.stringify(data));
}

function getStatus(avg) {
    if (avg === null) return { g: 'var(--grad-none)', t: 'KEINE DATEN' };
    return avg >= 10 ? { g: 'var(--grad-good)', t: 'GUT' } : { g: 'var(--grad-bad)', t: 'MANGELHAFT' };
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
        const s = getStatus(avg);
        if(avg !== null) { sum += avg; count++; }

        grid.innerHTML += `
            <div class="card" style="background: ${s.g}" onclick="openDet(${f.id})">
                <span>${f.name}</span>
                <h1>${avg !== null ? avg.toFixed(1) : '-'}</h1>
            </div>`;
    });
    document.getElementById('main-avg').innerText = count > 0 ? (sum/count).toFixed(2) : '0.0';
}

function openDet(id) {
    activeId = id;
    const f = data.find(x => x.id === id);
    showPage('detail');
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const s = getStatus(avg);

    document.getElementById('det-hero').style.background = s.g;
    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-score').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-status').innerText = s.t;

    const hist = document.getElementById('note-history');
    hist.innerHTML = f.notes.map((n, i) => `
        <div class="glass" style="display:flex; justify-content:space-between; align-items:center; padding:15px; margin-bottom:10px">
            <b>Punkte: ${n}</b>
            <button onclick="delNote(${i})" style="color:#ef4444; background:none; border:none; cursor:pointer; font-weight:bold">LÖSCHEN</button>
        </div>`).reverse().join('');
}

function addFach() {
    const input = document.getElementById('name-in');
    const name = input.value.trim();
    if(!name) return;
    data.push({ id: Date.now(), name: name, notes: [], target: 15 });
    input.value = '';
    save();
    renderDash();
}

function addNote() {
    const input = document.getElementById('note-in');
    const val = parseFloat(input.value);
    if(isNaN(val)) return;
    const f = data.find(x => x.id === activeId);
    f.notes.push(val);
    input.value = '';
    save();
    openDet(activeId);
}

function delNote(i) {
    const f = data.find(x => x.id === activeId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save();
    openDet(activeId);
}

function delFach() {
    if(confirm("Löschen?")) {
        data = data.filter(x => x.id !== activeId);
        save();
        showPage('list');
    }
}

function renderGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    data.forEach(f => {
        list.innerHTML += `
            <div class="goal-edit-card">
                <span style="font-weight:bold">${f.name}</span>
                <input type="number" value="${f.target}" onchange="updateGoal(${f.id}, this.value)">
            </div>`;
    });
}

function updateGoal(id, val) {
    data.find(x => x.id === id).target = val;
    save();
}

function factoryReset() {
    if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); }
}