const DB_KEY = 'gf_ultimate_v6';
let appData = JSON.parse(localStorage.getItem(DB_KEY)) || [];

window.onload = () => { renderDash(); };

function getStatusInfo(avg, target) {
    if (avg === null) return { gradient: 'var(--neutral)', label: 'Keine Noten', colorName: 'gray' };
    const goal = target || 15;
    if (avg >= goal) return { gradient: 'var(--success)', label: 'ZIEL ERREICHT', colorName: 'success' };
    if (avg >= goal - 2) return { gradient: 'var(--warning)', label: 'KNAPP DRAN', colorName: 'warning' };
    return { gradient: 'var(--danger)', label: 'WEIT UNTER ZIEL', colorName: 'danger' };
}

window.showPage = (id) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if(id === 'list') renderDash();
};

window.renderDash = () => {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';
    let totalSum = 0, count = 0;

    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatusInfo(avg, f.target);
        if(avg !== null) { totalSum += avg; count++; }

        container.innerHTML += `
            <div class="subject-card" onclick="openDet(${f.id})">
                <div style="background: ${status.gradient}; height: 5px; width: 100%; position: absolute; top: 0; left: 0;"></div>
                <h3 style="margin-bottom: 5px;">${f.name}</h3>
                <h1 style="margin: 10px 0; font-size: 42px;">${avg !== null ? avg.toFixed(1) : '-'}</h1>
                <div class="status-pill" style="background: ${status.gradient}">Ziel: ${f.target || 15}</div>
            </div>`;
    });
    document.getElementById('dash-total').innerText = count > 0 ? (totalSum / count).toFixed(1) : '-';
};

window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    const f = appData.find(x => x.id === id);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const status = getStatusInfo(avg, f.target);

    const header = document.getElementById('det-header');
    header.style.background = status.gradient;
    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg !== null ? avg.toFixed(1) : '-';
    document.getElementById('det-status-badge').innerText = status.label;
    document.getElementById('f-target-input').value = f.target || 15;

    renderNotes(f);
};

function renderNotes(f) {
    const list = document.getElementById('notes-list');
    list.innerHTML = f.notes.map((n, i) => `
        <div class="card-glass" style="display:flex; justify-content:space-between; margin-bottom:10px; padding: 15px;">
            <span>Note: <strong>${n}</strong></span>
            <button onclick="deleteNote(${i})" style="background:none; border:none; color:#ef4444; cursor:pointer;">Löschen</button>
        </div>`).reverse().join('');
}

window.addFach = () => {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name, notes: [], target: 15 });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.saveFachTarget = () => {
    const val = parseFloat(document.getElementById('f-target-input').value);
    const f = appData.find(x => x.id === window.curId);
    f.target = (val >= 0 && val <= 15) ? val : 15;
    save(); openDet(f.id);
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

window.deleteFach = () => {
    if(confirm("Fach wirklich löschen?")) {
        appData = appData.filter(x => x.id !== window.curId);
        save(); showPage('list');
    }
};

function save() { localStorage.setItem(DB_KEY, JSON.stringify(appData)); }
window.resetAll = () => { localStorage.clear(); location.reload(); };