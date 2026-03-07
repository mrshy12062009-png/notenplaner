const DB_NAME = 'gf_ultra_v7';
let appData = JSON.parse(localStorage.getItem(DB_NAME)) || [];

window.onload = () => renderDash();

function getTheme(avg, target) {
    if (avg === null) return { grad: 'var(--grad-neutral)', label: 'KEINE DATEN' };
    const goal = target || 15;
    if (avg >= goal) return { grad: 'var(--grad-success)', label: 'ZIEL ERREICHT' };
    if (avg >= goal * 0.7) return { grad: 'var(--grad-warning)', label: 'KNAPP DRAN' };
    return { grad: 'var(--grad-danger)', label: 'WEIT UNTER ZIEL' };
}

window.showPage = (id) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
};

window.renderDash = () => {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    let sum = 0, count = 0;
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const theme = getTheme(avg, f.target);
        if(avg !== null) { sum += avg; count++; }
        cont.innerHTML += `
            <div class="subject-card" style="background: ${theme.grad}" onclick="openDet(${f.id})">
                <span style="text-transform:uppercase; font-weight:800; font-size:14px; opacity:0.8">${f.name}</span>
                <h1>${avg !== null ? avg.toFixed(1) : '-'}</h1>
                <span style="font-weight:bold; font-size:12px">ZIEL: ${f.target || 15}</span>
            </div>`;
    });
    document.getElementById('dash-total').innerText = count > 0 ? (sum/count).toFixed(2) : '-';
};

window.renderGoals = () => {
    const cont = document.getElementById('goals-list');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : 0;
        const target = f.target || 15;
        const percent = Math.min((avg / target) * 100, 100);
        const theme = getTheme(avg, target);
        cont.innerHTML += `
            <div class="huge-goal-card">
                <div class="goal-info-top">
                    <div>
                        <div class="goal-name">${f.name}</div>
                        <div style="color: #94a3b8">Aktuell: ${avg.toFixed(1)} / Ziel: ${target}</div>
                    </div>
                    <div style="font-size: 32px; font-weight: 900; color: white">${Math.round(percent)}%</div>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${percent}%; background: ${theme.grad}"></div>
                </div>
            </div>`;
    });
};

window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    const f = appData.find(x => x.id === id);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const theme = getTheme(avg, f.target);
    
    document.getElementById('det-header').style.background = theme.grad;
    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg !== null ? avg.toFixed(1) : '-';
    document.getElementById('det-status-badge').innerText = theme.label;
    document.getElementById('f-target-input').value = f.target || 15;
    
    const list = document.getElementById('notes-list');
    list.innerHTML = f.notes.map((n, i) => `
        <div class="huge-goal-card" style="padding: 20px; margin-bottom: 10px; flex-direction: row; justify-content: space-between; align-items: center;">
            <span style="font-size: 20px">Note: <b>${n}</b></span>
            <button onclick="deleteNote(${i})" style="background:none; border:none; color:#ff4757; font-weight:bold; cursor:pointer">LÖSCHEN</button>
        </div>`).reverse().join('');
};

window.addFach = () => {
    const n = document.getElementById('f-name').value;
    if(!n) return;
    appData.push({ id: Date.now(), name: n, notes: [], target: 15 });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.saveFachTarget = () => {
    const f = appData.find(x => x.id === window.curId);
    f.target = parseFloat(document.getElementById('f-target-input').value) || 0;
    save(); openDet(f.id);
};

window.addNote = () => {
    const v = parseFloat(document.getElementById('n-val').value);
    if(isNaN(v)) return;
    appData.find(x => x.id === window.curId).notes.push(v);
    document.getElementById('n-val').value = '';
    save(); openDet(window.curId);
};

window.deleteNote = (i) => {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); openDet(window.curId);
};

window.deleteFach = () => { if(confirm("Löschen?")) { appData = appData.filter(x => x.id !== window.curId); save(); showPage('list'); } };
function save() { localStorage.setItem(DB_NAME, JSON.stringify(appData)); }