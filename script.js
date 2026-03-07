let subjects = JSON.parse(localStorage.getItem('GF_STABLE_V2')) || [];
let currentId = null;

function save() {
    localStorage.setItem('GF_STABLE_V2', JSON.stringify(subjects));
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
}

function getStatus(avg) {
    if (avg === null) return { g: 'linear-gradient(135deg, #222, #333)', t: 'KEINE DATEN' };
    // Feste Logik fürs Dashboard: Ab 10 Pkt ist es gut (Blau)
    return avg >= 10 ? { g: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', t: 'GUT' } 
                     : { g: 'linear-gradient(135deg, #f83600, #f9d423)', t: 'SCHLECHT' };
}

function renderDash() {
    const grid = document.getElementById('dash-grid');
    grid.innerHTML = '';
    let total = 0, count = 0;

    subjects.forEach(s => {
        const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
        const style = getStatus(avg);
        if(avg !== null) { total += avg; count++; }

        grid.innerHTML += `
            <div class="card" style="background: ${style.g}" onclick="openDetail(${s.id})">
                <span style="font-weight:900; font-size:12px; opacity:0.8">${s.name}</span>
                <h1>${avg !== null ? avg.toFixed(1) : '-'}</h1>
            </div>`;
    });
    document.getElementById('main-avg').innerText = count > 0 ? (total/count).toFixed(2) : '0.0';
}

function addFach() {
    const input = document.getElementById('name-in');
    if(!input.value.trim()) return;
    subjects.push({ id: Date.now(), name: input.value, notes: [], target: 15 });
    input.value = '';
    save(); renderDash();
}

function openDetail(id) {
    currentId = id;
    const s = subjects.find(x => x.id === id);
    showPage('detail');
    const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
    const style = getStatus(avg);

    document.getElementById('det-hero').style.background = style.g;
    document.getElementById('det-title').innerText = s.name;
    document.getElementById('det-score').innerText = avg !== null ? avg.toFixed(1) : '0.0';
    document.getElementById('det-status').innerText = style.t;

    const hist = document.getElementById('note-history');
    hist.innerHTML = s.notes.map((n, i) => `
        <div class="glass" style="display:flex; justify-content:space-between; align-items:center; padding:15px; margin-bottom:10px">
            <b>Punkte: ${n}</b>
            <button onclick="delNote(${i})" style="color:#ff4444; background:none; border:none; cursor:pointer; font-weight:bold">LÖSCHEN</button>
        </div>`).reverse().join('');
}

function addNote() {
    const input = document.getElementById('note-in');
    const val = parseFloat(input.value);
    if(isNaN(val)) return;
    subjects.find(x => x.id === currentId).notes.push(val);
    input.value = '';
    save(); openDetail(currentId);
}

function delNote(i) {
    const s = subjects.find(x => x.id === currentId);
    s.notes.splice(s.notes.length - 1 - i, 1);
    save(); openDetail(currentId);
}

function delFach() {
    if(confirm("Löschen?")) {
        subjects = subjects.filter(x => x.id !== currentId);
        save(); showPage('list');
    }
}

function renderGoals() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    subjects.forEach(s => {
        list.innerHTML += `
            <div class="goal-card">
                <span style="font-weight:900">${s.name}</span>
                <input type="number" value="${s.target}" onchange="updateGoal(${s.id}, this.value)">
            </div>`;
    });
}

function updateGoal(id, val) {
    subjects.find(x => x.id === id).target = val;
    save();
}

function factoryReset() {
    if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); }
}

// Start
renderDash();