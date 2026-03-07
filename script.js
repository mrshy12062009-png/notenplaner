const S_KEY = 'gradeflow_v4_data';
let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];
let myGoal = localStorage.getItem('gradeflow_mygoal') || 15;

window.onload = () => {
    document.getElementById('goal-input').value = myGoal;
    renderDash();
};

// 1. DASHBOARD LOGIK (Feste Regeln für Überblick)
function getStatus(avg) {
    if (!avg) return { color: 'gray', class: '', label: 'Keine Noten' };
    if (avg >= 11) return { color: 'success', class: 'bg-success', label: 'GUT' };
    if (avg >= 8) return { color: 'warning', class: 'bg-warning', label: 'OKEY' };
    return { color: 'danger', class: 'bg-danger', label: 'SCHLECHT' };
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
        const status = getStatus(avg);
        container.innerHTML += `
            <div class="subject-card" style="border-left-color: var(--${status.color})" onclick="openDet(${f.id})">
                <span style="color: var(--gray); font-size: 12px; font-weight: bold; text-transform: uppercase;">${f.name}</span>
                <h2 class="text-${status.color}" style="margin: 10px 0; font-size: 32px;">${avg ? avg.toFixed(1) : '-'}</h2>
                <div class="status-pill ${status.class}" style="font-size: 10px; margin: 0;">${status.label}</div>
            </div>`;
    });
};

// 2. ZIELE LOGIK (Check gegen die 15)
window.renderGoals = () => {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const reached = avg >= myGoal;
        list.innerHTML += `
            <div class="history-item">
                <div>
                    <strong>${f.name}</strong><br>
                    <small style="color: var(--gray)">Aktuell: ${avg ? avg.toFixed(1) : 'Keine Noten'}</small>
                </div>
                <div style="text-align: right">
                    <span class="${reached ? 'text-success' : 'text-danger'}" style="font-weight: bold; font-size: 18px;">
                        ${reached ? 'ZIEL ERREICHT' : 'UNTER ZIEL'}
                    </span><br>
                    <small style="color: var(--gray)">Ziel: ${myGoal}</small>
                </div>
            </div>`;
    });
};

// 3. EINSTELLUNGEN FUNKTIONEN
window.exportData = () => {
    const data = btoa(JSON.stringify(appData));
    navigator.clipboard.writeText(data);
    alert("Backup-Code wurde in die Zwischenablage kopiert!");
};

window.importData = () => {
    const code = prompt("Backup-Code hier einfügen:");
    if(code) {
        try {
            appData = JSON.parse(atob(code));
            save();
            location.reload();
        } catch(e) { alert("Ungültiger Code!"); }
    }
};

window.resetAll = () => {
    if(confirm("Bist du sicher? Alle Daten werden gelöscht!")) {
        localStorage.clear();
        location.reload();
    }
};

// DETAIL & HELPER
window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    const f = appData.find(x => x.id === id);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const status = getStatus(avg);

    const header = document.getElementById('det-header');
    header.className = `detail-hero ${status.class || ''}`;
    if(!status.class) header.style.background = 'var(--card)';

    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg ? avg.toFixed(1) : '-';
    document.getElementById('det-status-badge').innerText = status.label;
    
    document.getElementById('det-analysis-text').innerText = avg 
        ? `Dein Schnitt in ${f.name} ist ${avg.toFixed(2)}. Das entspricht dem Status "${status.label}".`
        : "Noch keine Noten eingetragen.";

    const list = document.getElementById('notes-list');
    list.innerHTML = f.notes.map((n, i) => `
        <div class="history-item">
            <span>Note: <strong>${n}</strong></span>
            <button class="btn-danger" onclick="deleteNote(${i})" style="padding: 5px 10px;">Löschen</button>
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

window.updateGlobalGoal = (v) => { 
    myGoal = v; 
    localStorage.setItem('gradeflow_mygoal', v); 
    renderGoals(); 
};

function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); }