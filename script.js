const DB_KEY = 'GF_ULTRA_V11';
let subjects = JSON.parse(localStorage.getItem(DB_KEY)) || [];
let activeId = null;

function save() { localStorage.setItem(DB_KEY, JSON.stringify(subjects)); }

function nav(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(document.getElementById('btn-' + id)) document.getElementById('btn-' + id).classList.add('active');
}

function showPage(id) {
    nav(id);
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
}

function getStatus(avg, target) {
    if (avg === null) return { grad: 'var(--grad-neutral)', label: 'KEINE DATEN' };
    const goal = target || 15;
    if (avg >= goal) return { grad: 'var(--grad-green)', label: 'ZIEL ERREICHT' };
    if (avg >= goal * 0.7) return { grad: 'var(--grad-yellow)', label: 'FAST DA' };
    return { grad: 'var(--grad-red)', label: 'UNTER ZIEL' };
}

function renderDash() {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';
    let sum = 0, count = 0;

    subjects.forEach(s => {
        const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
        const style = getStatus(avg, s.target);
        if(avg !== null) { sum += avg; count++; }

        container.innerHTML += `
            <div class="subject-card" style="background: ${style.grad}" onclick="openDetail(${s.id})">
                <span style="font-weight:900; text-transform:uppercase; letter-spacing:1px">${s.name}</span>
                <h1>${avg !== null ? avg.toFixed(1) : '-'}</h1>
                <span style="font-weight:bold; opacity:0.8">ZIEL: ${s.target || 15}</span>
            </div>`;
    });
    document.getElementById('dash-total').innerText = count > 0 ? (sum/count).toFixed(2) : '-';
}

function renderGoals() {
    const container = document.getElementById('goals-list');
    container.innerHTML = '';
    subjects.forEach(s => {
        const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : 0;
        const target = s.target || 15;
        const percent = Math.min((avg / target) * 100, 100);
        const style = getStatus(avg, target);

        container.innerHTML += `
            <div class="goal-card-huge">
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <h2 style="margin:0; font-size:32px">${s.name}</h2>
                    <span style="font-size:38px; font-weight:900">${Math.round(percent)}%</span>
                </div>
                <div class="progress-bg">
                    <div class="progress-fill" style="width:${percent}%; background:${style.grad}"></div>
                </div>
            </div>`;
    });
}

function openDetail(id) {
    activeId = id;
    const s = subjects.find(x => x.id === id);
    showPage('detail');
    const avg = s.notes.length ? s.notes.reduce((a,b)=>a+b,0)/s.notes.length : null;
    const style = getStatus(avg, s.target);

    document.getElementById('det-header').style.background = style.grad;
    document.getElementById('det-title').innerText = s.name;
    document.getElementById('det-avg').innerText = avg !== null ? avg.toFixed(1) : '-';
    document.getElementById('det-status-label').innerText = style.label;
    document.getElementById('f-target-input').value = s.target || 15;

    const list = document.getElementById('notes-list');
    list.innerHTML = s.notes.map((n, i) => `
        <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
            <span style="font-size:24px; font-weight:900">Note: ${n}</span>
            <button onclick="delNote(${i})" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold">X</button>
        </div>`).reverse().join('');
}

function addFach() {
    const n = document.getElementById('f-name-in').value;
    if(!n) return;
    subjects.push({ id: Date.now(), name: n, notes: [], target: 15 });
    document.getElementById('f-name-in').value = '';
    save(); renderDash();
}

function saveTarget() {
    const s = subjects.find(x => x.id === activeId);
    s.target = parseFloat(document.getElementById('f-target-input').value) || 0;
    save(); openDetail(activeId);
}

function addNote() {
    const v = parseFloat(document.getElementById('n-val-input').value);
    if(isNaN(v)) return;
    subjects.find(x => x.id === activeId).notes.push(v);
    document.getElementById('n-val-input').value = '';
    save(); openDetail(activeId);
}

function delNote(i) {
    const s = subjects.find(x => x.id === activeId);
    s.notes.splice(s.notes.length - 1 - i, 1);
    save(); openDetail(activeId);
}

function deleteFach() {
    if(confirm("Löschen?")) {
        subjects = subjects.filter(x => x.id !== activeId);
        save(); showPage('list');
    }
}

function factoryReset() {
    if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); }
}

renderDash();