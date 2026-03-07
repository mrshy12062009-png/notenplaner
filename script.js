const S_KEY = 'gradeflow_final_stable';
let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];

window.onload = () => { renderDash(); };

function getStatus(avg, target) {
    if (avg === null || avg === undefined) return { color: 'neutral', class: '', label: 'Keine Noten' };
    const goal = target || 15;
    if (avg >= goal) return { color: 'success', class: 'bg-success', label: 'ZIEL ERREICHT' };
    if (avg >= goal - 2) return { color: 'warning', class: 'bg-warning', label: 'FAST DA' };
    return { color: 'danger', class: 'bg-danger', label: 'UNTER ZIEL' };
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
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    let totalSum = 0, count = 0;

    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg, f.target);
        if(avg !== null) { totalSum += avg; count++; }

        cont.innerHTML += `
            <div class="subject-card" style="border-left-color: var(--${status.color})" onclick="openDet(${f.id})">
                <small>${f.name}</small>
                <h2 class="text-${status.color}">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <small>Ziel: ${f.target || 15}</small>
            </div>`;
    });
    const totalAvg = count > 0 ? (totalSum / count).toFixed(2) : '-';
    document.getElementById('dash-total').innerText = totalAvg;
};

window.renderGoals = () => {
    const cont = document.getElementById('goals-list');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const target = f.target || 15;
        const status = getStatus(avg, target);
        cont.innerHTML += `
            <div class="input-card" style="display:flex; justify-content:space-between; align-items:center">
                <div><b>${f.name}</b><br><small>Ziel: ${target}</small></div>
                <div class="text-${status.color}" style="font-weight:bold">${avg !== null ? avg.toFixed(1) : '-'}</div>
            </div>`;
    });
};

window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    const f = appData.find(x => x.id === id);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const status = getStatus(avg, f.target);

    const header = document.getElementById('det-header');
    header.className = `detail-hero ${status.class}`;
    if(!status.class) header.style.background = 'var(--card)';

    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg !== null ? avg.toFixed(1) : '-';
    document.getElementById('det-status-badge').innerText = status.label;
    document.getElementById('f-target-input').value = f.target || 15;

    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="input-card" style="display:flex; justify-content:space-between; margin-bottom:10px">
            <span>Note: <b>${n}</b></span>
            <button class="btn-danger" onclick="deleteNote(${i})">X</button>
        </div>`).reverse().join('');
};

window.saveFachTarget = () => {
    const val = parseFloat(document.getElementById('f-target-input').value);
    const f = appData.find(x => x.id === window.curId);
    f.target = (val >= 0 && val <= 15) ? val : 15;
    save(); openDet(f.id);
};

window.addFach = () => {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name, notes: [], target: 15 });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.addNote = () => {
    const val = parseFloat(document.getElementById('n-val').value);
    if(isNaN(val) || val < 0 || val > 15) return;
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
function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); }
window.resetAll = () => { if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); } };