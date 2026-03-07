const DB_KEY = 'GF_FINAL_PRO_V1';
let data = JSON.parse(localStorage.getItem(DB_KEY)) || [];
let active = null;

const save = () => localStorage.setItem(DB_KEY, JSON.stringify(data));

// Logik: Was ist "Gut"? (Im Dashboard fest ab 10 Punkten)
function getStatus(avg) {
    if (avg === null) return { g: 'var(--grad-none)', t: 'NO DATA' };
    return avg >= 10 
        ? { g: 'var(--grad-good)', t: 'GUT' } 
        : { g: 'var(--grad-bad)', t: 'REVISE' };
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
}

// ENTER-OPTIONEN
document.getElementById('name-in').addEventListener('keypress', (e) => { if(e.key === 'Enter') addFach(); });
document.getElementById('note-in').addEventListener('keypress', (e) => { if(e.key === 'Enter') addNote(); });

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

function renderGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    data.forEach(f => {
        list.innerHTML += `
            <div class="goal-edit-card">
                <span style="font-weight:900; font-size:20px;">${f.name}</span>
                <div>
                    <span style="font-size:12px; opacity:0.5; margin-right:15px;">DEIN ZIEL</span>
                    <input type="number" value="${f.target || 15}" onchange="updateTarget(${f.id}, this.value)">
                </div>
            </div>`;
    });
}

function updateTarget(id, val) {
    data.find(x => x.id === id).target = parseFloat(val) || 0;
    save();
}

function openDet(id) {
    active = data.find(x => x.id === id);
    showPage('detail');
    const avg = active.notes.length ? active.notes.reduce((a,b)=>a+b,0)/active.notes.length : null;
    const s = getStatus(avg);

    document.getElementById('det-hero').style.background = s.g;
    document.getElementById('det-title').innerText = active.name;
    document.getElementById('det-score').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-status').innerText = s.t;

    const hist = document.getElementById('note-history');
    hist.innerHTML = active.notes.map((n, i) => `
        <div class="glass" style="display:flex; justify-content:space-between; margin-bottom:12px; padding:20px; border-radius:20px;">
            <b style="font-size:18px;">Punkte: ${n}</b>
            <button onclick="delNote(${i})" style="color:#f43f5e; background:none; border:none; cursor:pointer; font-weight:900;">LÖSCHEN</button>
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
    if(confirm("Dieses Fach wirklich löschen?")) { data = data.filter(x => x.id !== active.id); save(); showPage('list'); }
}

function factoryReset() {
    if(confirm("WIRKLICH ALLES LÖSCHEN?")) { localStorage.clear(); location.reload(); }
}

renderDash();