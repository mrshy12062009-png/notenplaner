const S_KEY = 'gradeflow_v5_final';
let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];

window.onload = () => {
    renderDash();
};

// DASHBOARD LOGIK: Reine Bewertung der Note (Schulsystem)
function getDashboardStatus(avg) {
    if (!avg && avg !== 0) return { color: 'gray', label: 'Keine Noten' };
    if (avg >= 11) return { color: 'success', label: 'GUT' };
    if (avg >= 8) return { color: 'warning', label: 'OKEY' };
    return { color: 'danger', label: 'SCHLECHT' };
}

window.showPage = (id) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
};

window.renderDash = () => {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getDashboardStatus(avg);
        container.innerHTML += `
            <div class="subject-card" style="border-left: 6px solid var(--${status.color})" onclick="openDet(${f.id})">
                <small style="color: #94a3b8">${f.name}</small>
                <h2 style="color: var(--${status.color}); margin: 5px 0;">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <span class="status-pill" style="background: var(--${status.color})">${status.label}</span>
            </div>`;
    });
};

// ZIELE LOGIK: Vergleicht Schnitt mit dem EIGENEN Ziel des Fachs
window.renderGoals = () => {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const target = f.target || 15; // Standard 15, wenn nichts gesetzt
        const reached = avg >= target;
        list.innerHTML += `
            <div class="input-card" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <b>${f.name}</b><br>
                    <small>Ziel: ${target} Punkte</small>
                </div>
                <div style="color: var(--${reached ? 'success' : 'danger'}); font-weight:bold;">
                    ${avg !== null ? avg.toFixed(1) : '-'} ${reached ? '✅' : '❌'}
                </div>
            </div>`;
    });
};

window.openDet = (id) => {
    window.curId = id;
    const f = appData.find(x => x.id === id);
    showPage('detail');
    
    document.getElementById('det-title').innerText = f.name;
    document.getElementById('f-target-input').value = f.target || 15;
    
    updateDetailUI();
};

function updateDetailUI() {
    const f = appData.find(x => x.id === window.curId);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const status = getDashboardStatus(avg);
    
    document.getElementById('det-avg').innerText = avg !== null ? avg.toFixed(1) : '-';
    
    const list = document.getElementById('notes-list');
    list.innerHTML = f.notes.map((n, i) => `
        <div class="history-item">
            <span>Note: <b>${n}</b></span>
            <button class="btn-danger" onclick="deleteNote(${i})">Löschen</button>
        </div>`).reverse().join('');
}

// Ziel für das aktuelle Fach speichern
window.saveFachTarget = () => {
    const val = parseFloat(document.getElementById('f-target-input').value);
    const f = appData.find(x => x.id === window.curId);
    f.target = val;
    save();
    alert("Ziel für " + f.name + " gespeichert!");
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
    save(); updateDetailUI();
};

window.deleteNote = (i) => {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); updateDetailUI();
};

window.deleteFach = () => {
    if(confirm("Fach löschen?")) {
        appData = appData.filter(x => x.id !== window.curId);
        save(); showPage('list');
    }
};

function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); }
window.resetAll = () => { if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); } };