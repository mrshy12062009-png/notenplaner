const DB = 'GF_FINAL_ULTRA';
let data = JSON.parse(localStorage.getItem(DB)) || [];

// Initialisierung
window.onload = () => renderDash();

function getStyle(avg, target) {
    if (avg === null) return { grad: 'linear-gradient(135deg, #222, #333)', label: 'KEINE DATEN' };
    const goal = target || 15;
    if (avg >= goal) return { grad: 'var(--success)', label: 'ZIEL ERREICHT' };
    if (avg >= goal * 0.7) return { grad: 'var(--warning)', label: 'FAST DA' };
    return { grad: 'var(--danger)', label: 'UNTER ZIEL' };
}

window.showPage = (id) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('btn-' + id)?.classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
};

window.renderDash = () => {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';
    let totalAvg = 0, count = 0;

    data.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const s = getStyle(avg, f.target);
        if(avg !== null) { totalAvg += avg; count++; }

        container.innerHTML += `
            <div class="subject-card" style="background: ${s.grad}" onclick="openDet(${f.id})">
                <span style="font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">${f.name}</span>
                <h1>${avg !== null ? avg.toFixed(1) : '-'}</h1>
                <span style="font-weight: 700; opacity: 0.8">ZIEL: ${f.target || 15}</span>
            </div>`;
    });
    document.getElementById('dash-total').innerText = count > 0 ? (totalAvg/count).toFixed(2) : '-';
};

window.renderGoals = () => {
    const container = document.getElementById('goals-list');
    container.innerHTML = '';
    data.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : 0;
        const target = f.target || 15;
        const percent = Math.min((avg / target) * 100, 100);
        const s = getStyle(avg, target);

        container.innerHTML += `
            <div class="huge-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-end">
                    <h2 style="font-size:35px; margin:0">${f.name}</h2>
                    <span style="font-size:40px; font-weight:900">${Math.round(percent)}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width:${percent}%; background:${s.grad}"></div>
                </div>
                <p style="color:#777; margin-top:15px">Aktuell: ${avg.toFixed(1)} / Ziel: ${target}</p>
            </div>`;
    });
};

window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    const f = data.find(x => x.id === id);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const s = getStyle(avg, f.target);

    document.getElementById('det-header').style.background = s.grad;
    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg !== null ? avg.toFixed(1) : '-';
    document.getElementById('det-status-badge').innerText = s.label;
    document.getElementById('f-target-input').value = f.target || 15;

    const list = document.getElementById('notes-list');
    list.innerHTML = f.notes.map((n, i) => `
        <div class="card-ui" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
            <span style="font-size:24px; font-weight:900">Note: ${n}</span>
            <button onclick="deleteNote(${i})" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold">LÖSCHEN</button>
        </div>`).reverse().join('');
};

window.addFach = () => {
    const val = document.getElementById('f-name').value;
    if(!val) return;
    data.push({ id: Date.now(), name: val, notes: [], target: 15 });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.saveFachTarget = () => {
    const f = data.find(x => x.id === window.curId);
    f.target = parseFloat(document.getElementById('f-target-input').value) || 0;
    save(); openDet(f.id);
};

window.addNote = () => {
    const v = parseFloat(document.getElementById('n-val').value);
    if(isNaN(v)) return;
    data.find(x => x.id === window.curId).notes.push(v);
    document.getElementById('n-val').value = '';
    save(); openDet(window.curId);
};

window.deleteNote = (i) => {
    const f = data.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); openDet(window.curId);
};

window.deleteFach = () => {
    if(confirm("Fach wirklich löschen?")) {
        data = data.filter(x => x.id !== window.curId);
        save(); showPage('list');
    }
};

function save() { localStorage.setItem(DB, JSON.stringify(data)); }
window.resetAll = () => { if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); } };