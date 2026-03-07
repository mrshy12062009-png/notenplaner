const KEY = 'gf_vibrant_final';
let appData = JSON.parse(localStorage.getItem(KEY)) || [];

window.onload = () => renderDash();

function getTheme(avg, target) {
    if (avg === null) return { grad: 'var(--neutral)', label: 'NO DATA' };
    const goal = target || 15;
    if (avg >= goal) return { grad: 'var(--success)', label: 'PASSED' };
    if (avg >= goal * 0.8) return { grad: 'var(--warning)', label: 'ALMOST' };
    return { grad: 'var(--danger)', label: 'FAILED' };
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
    let total = 0, count = 0;
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const theme = getTheme(avg, f.target);
        if(avg !== null) { total += avg; count++; }
        cont.innerHTML += `
            <div class="subject-card" style="background: ${theme.grad}" onclick="openDet(${f.id})">
                <small style="font-weight:bold; text-transform:uppercase">${f.name}</small>
                <h1>${avg !== null ? avg.toFixed(1) : '-'}</h1>
                <small>Ziel: ${f.target || 15}</small>
            </div>`;
    });
    document.getElementById('dash-total').innerText = count > 0 ? (total/count).toFixed(1) : '-';
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
            <div class="goal-card">
                <div style="width:120px"><b>${f.name}</b></div>
                <div class="progress-container">
                    <div class="progress-bar" style="width:${percent}%; background:${theme.grad}"></div>
                </div>
                <div style="width:60px; text-align:right"><b>${avg.toFixed(1)}</b></div>
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
    
    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="goal-card">
            <span>Note: <b>${n}</b></span>
            <button onclick="deleteNote(${i})" style="color:red; background:none; border:none; cursor:pointer">Löschen</button>
        </div>`).reverse().join('');
};

window.addFach = () => {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name, notes: [], target: 15 });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.saveFachTarget = () => {
    const f = appData.find(x => x.id === window.curId);
    f.target = parseFloat(document.getElementById('f-target-input').value) || 0;
    save(); openDet(f.id);
};

window.addNote = () => {
    const val = parseFloat(document.getElementById('n-val').value);
    if(isNaN(val)) return;
    appData.find(x => x.id === window.curId).notes.push(val);
    document.getElementById('n-val').value = '';
    save(); openDet(window.curId);
};

window.deleteNote = (i) => {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); openDet(window.curId);
};

window.deleteFach = () => { if(confirm("Löschen?")) { appData = appData.filter(x => x.id !== window.curId); save(); showPage('list'); } };
function save() { localStorage.setItem(KEY, JSON.stringify(appData)); }
window.resetAll = () => { localStorage.clear(); location.reload(); };