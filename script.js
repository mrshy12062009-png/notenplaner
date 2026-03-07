const S_KEY = 'gradeflow_final_v3';
let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];
let globalGoal = localStorage.getItem('gradeflow_goal') || 15;

window.onload = () => {
    document.getElementById('goal-input').value = globalGoal;
    renderDash();
};

// Logik für Dashboard (Festgelegte Stufen)
function getDashboardStatus(avg) {
    if (!avg) return { color: 'neutral', class: '', label: 'Keine Noten' };
    if (avg >= 11) return { color: 'success', class: 'bg-success', label: 'GUT' };
    if (avg >= 8) return { color: 'warning', class: 'bg-warning', label: 'OKEY' };
    return { color: 'danger', class: 'bg-danger', label: 'SCHLECHT' };
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
        const status = getDashboardStatus(avg);
        if(avg) { sum += avg; count++; }
        cont.innerHTML += `
            <div class="subject-card" style="border-left-color: var(--${status.color})" onclick="openDet(${f.id})">
                <small>${f.name}</small>
                <h2 class="text-${status.color}">${avg ? avg.toFixed(1) : '-'}</h2>
                <small>${status.label}</small>
            </div>`;
    });
    document.getElementById('dash-total').innerText = count > 0 ? (sum/count).toFixed(2) : '-';
};

window.renderGoals = () => {
    const cont = document.getElementById('goals-list');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const reached = avg >= globalGoal;
        cont.innerHTML += `
            <div class="input-card" style="display:flex; justify-content:space-between; align-items:center;">
                <div><b>${f.name}</b><br><small>Ziel: ${globalGoal}</small></div>
                <div class="${reached ? 'text-success' : 'text-danger'}" style="font-weight:bold">
                    ${avg ? avg.toFixed(1) : '-'} ${reached ? '✅' : '❌'}
                </div>
            </div>`;
    });
};

window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    const f = appData.find(x => x.id === id);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const status = getDashboardStatus(avg);
    
    const header = document.getElementById('det-header');
    header.className = `detail-hero ${status.class}`;
    if(!status.class) header.style.background = 'var(--card)';

    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg ? avg.toFixed(1) : '-';
    document.getElementById('det-status-badge').innerText = status.label;

    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="input-card" style="display:flex; justify-content:space-between; margin-bottom:10px">
            <span>Note: <b>${n}</b></span>
            <button class="btn-danger" onclick="deleteNote(${i})">X</button>
        </div>`).reverse().join('');
};

window.addFach = () => {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name, notes: [] });
    document.getElementById('f-name').value = '';
    save(); renderDash();
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

window.updateGlobalGoal = (v) => { globalGoal = v; localStorage.setItem('gradeflow_goal', v); renderGoals(); };
window.deleteFach = () => { if(confirm("Löschen?")) { appData = appData.filter(x => x.id !== window.curId); save(); showPage('list'); } };
function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); }
window.resetAll = () => { if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); } };