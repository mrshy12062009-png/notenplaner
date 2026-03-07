let subjects = JSON.parse(localStorage.getItem('GF_ELITE_V3')) || [];
let currentId = null;

const save = () => localStorage.setItem('GF_ELITE_V3', JSON.stringify(subjects));

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
}

function getStatusInfo(avg, target) {
    if (avg === null) return { g: 'var(--card)', t: 'KEINE DATEN', c: '#444' };
    const goal = target || 10;
    const diff = avg - goal;
    
    if (diff >= 2) return { g: 'var(--g-green)', t: 'EXZELLENT', c: '#43e97b' };
    if (diff >= 0) return { g: 'var(--g-blue)', t: 'AUF KURS', c: '#4facfe' };
    return { g: 'var(--g-orange)', t: 'STEIGERUNG NÖTIG', c: '#ff4e50' };
}

function renderDash() {
    const grid = document.getElementById('dash-grid');
    grid.innerHTML = '';
    let totalSum = 0, count = 0;

    subjects.forEach(s => {
        const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
        const status = getStatusInfo(avg, s.target);
        if(avg !== null) { totalSum += avg; count++; }

        const progress = avg !== null ? Math.min((avg / 15) * 100, 100) : 0;

        grid.innerHTML += `
            <div class="card" onclick="openDetail(${s.id})">
                <span class="label">${s.name} • ${status.t}</span>
                <h2 style="color: ${avg !== null ? '#fff' : '#333'}">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <div class="mini-bar-bg">
                    <div class="mini-bar-fill" style="width: ${progress}%; background: ${status.g}"></div>
                </div>
            </div>`;
    });
    document.getElementById('main-avg').innerText = count > 0 ? (totalSum/count).toFixed(2) : '0.0';
}

function addFach() {
    const el = document.getElementById('name-in');
    if(!el.value.trim()) return;
    subjects.push({ id: Date.now(), name: el.value, notes: [], target: 10 });
    el.value = ''; save(); renderDash();
}

function openDetail(id) {
    currentId = id;
    const s = subjects.find(x => x.id === id);
    showPage('detail');
    const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
    const status = getStatusInfo(avg, s.target);

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
    subjects.find(x => x.id === currentId).notes.push(val);
    el.value = ''; save(); openDetail(currentId);
}

function delNote(i) {
    const s = subjects.find(x => x.id === currentId);
    s.notes.splice(s.notes.length - 1 - i, 1);
    save(); openDetail(currentId);
}

function delFach() {
    if(confirm("Löschen?")) { subjects = subjects.filter(x => x.id !== currentId); save(); showPage('list'); }
}

function renderGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    subjects.forEach(s => {
        list.innerHTML += `
            <div class="goal-card">
                <span style="font-weight:900">${s.name}</span>
                <div>
                    <span style="font-size:10px; opacity:0.5; margin-right:10px">DEIN ZIEL (0-15)</span>
                    <input type="number" min="0" max="15" value="${s.target}" onchange="updateGoal(${s.id}, this.value)">
                </div>
            </div>`;
    });
}

function updateGoal(id, val) {
    subjects.find(x => x.id === id).target = Math.min(Math.max(parseFloat(val), 0), 15);
    save();
}

function factoryReset() { if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); } }

renderDash();