const S_KEY = 'gf_pro_v5_final';
let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];

window.onload = () => {
    renderDash();
};

// Berechnet Statusfarbe basierend auf Fach-Ziel
function getStatus(avg, target) {
    if (avg === null) return { color: '#444', label: 'KEINE NOTEN', class: '' };
    const goal = target || 15; // Standard 15
    if (avg >= goal) return { color: 'var(--success)', label: 'ZIEL ERREICHT', class: 'bg-success' };
    if (avg >= goal - 2) return { color: 'var(--warning)', label: 'KNAPP UNTER ZIEL', class: 'bg-warning' };
    return { color: 'var(--danger)', label: 'UNTER ZIEL', class: 'bg-danger' };
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
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg, f.target);
        container.innerHTML += `
            <div class="subject-card" style="border-left-color: ${status.color}" onclick="openDet(${f.id})">
                <small style="color: var(--gray)">${f.name}</small>
                <h2 style="color: ${status.color}; margin: 10px 0;">${avg !== null ? avg.toFixed(1) : '-'}</h2>
                <div style="font-size: 11px; opacity: 0.8">Ziel: ${f.target || 15}</div>
            </div>`;
    });
};

window.renderGoals = () => {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const target = f.target || 15;
        const reached = avg >= target;
        list.innerHTML += `
            <div class="history-item">
                <div><b>${f.name}</b><br><small>Ziel: ${target}</small></div>
                <div class="${reached ? 'text-success' : 'text-danger'}" style="font-weight:bold">
                    ${avg !== null ? avg.toFixed(1) : '-'} ${reached ? '✅' : '❌'}
                </div>
            </div>`;
    });
};

window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    const f = appData.find(x => x.id === id);
    document.getElementById('f-target-input').value = f.target || 15;
    updateDetailUI();
};

function updateDetailUI() {
    const f = appData.find(x => x.id === window.curId);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const status = getStatus(avg, f.target);
    
    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg !== null ? avg.toFixed(1) : '-';
    document.getElementById('det-status-badge').innerText = status.label;
    
    const header = document.getElementById('det-header');
    header.style.backgroundColor = status.color;

    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="history-item">
            <span>Note: <b>${n}</b></span>
            <button class="btn-danger" onclick="deleteNote(${i})" style="padding: 5px 10px">X</button>
        </div>`).reverse().join('');
}

window.saveFachTarget = () => {
    const val = parseFloat(document.getElementById('f-target-input').value);
    const f = appData.find(x => x.id === window.curId);
    f.target = isNaN(val) ? 15 : val;
    save();
    updateDetailUI();
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
    if(isNaN(val)) return;
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
    if(confirm("Löschen?")) {
        appData = appData.filter(x => x.id !== window.curId);
        save(); showPage('list');
    }
};

window.exportData = () => { prompt("Dein Backup-Code (kopieren):", btoa(JSON.stringify(appData))); };
window.importData = () => { const c = prompt("Backup-Code einfügen:"); if(c) { appData = JSON.parse(atob(c)); save(); location.reload(); } };
window.resetAll = () => { if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); } };
function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); }