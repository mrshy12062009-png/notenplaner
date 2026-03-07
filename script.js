const S_KEY = 'gf_ultimate_v20';
const C_KEY = 'gf_conf_v20';

let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];
let config = JSON.parse(localStorage.getItem(C_KEY)) || { accentColor: '#5865f2', target: 11 };

window.onload = () => {
    applyStyles();
    showPage('list');
};

function applyStyles() {
    document.documentElement.style.setProperty('--accent', config.accentColor);
    document.getElementById('goal-input').value = config.target;
}

window.showPage = (id) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('btn-' + id)?.classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
};

// Berechnet den Status basierend auf eigenem oder globalem Ziel
function getStatus(avg, subjectGoal) {
    if (!avg) return { color: 'neutral', class: '', label: 'KEINE NOTEN' };
    const goal = subjectGoal || config.target;
    if (avg >= goal) return { color: 'success', class: 'bg-success', label: 'GUT' };
    if (avg >= goal - 2) return { color: 'warning', class: 'bg-warning', label: 'MITTEL' };
    return { color: 'danger', class: 'bg-danger', label: 'SCHLECHT' };
}

window.addFach = () => {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name: name, notes: [], customGoal: null });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.renderDash = () => {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    let totalSum = 0, count = 0;

    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg, f.customGoal);
        if(avg) { totalSum += avg; count++; }

        cont.innerHTML += `
            <div class="subject-card border-${status.color}" onclick="openDet(${f.id})">
                <small style="opacity:0.6">${f.name}</small>
                <h2 class="text-${status.color}">${avg ? avg.toFixed(1) : '-'}</h2>
                <small>${f.notes.length} Noten • Ziel: ${f.customGoal || config.target}</small>
            </div>`;
    });
    document.getElementById('dash-total').innerText = count > 0 ? (totalSum/count).toFixed(1) : '-';
};

window.renderGoals = () => {
    const cont = document.getElementById('goals-list');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg, f.customGoal);
        cont.innerHTML += `
            <div class="goal-row" onclick="openGoalModal(${f.id})">
                <span><b>${f.name}</b><br><small>Ziel: ${f.customGoal || config.target + ' (Global)'}</small></span>
                <span class="text-${status.color}" style="font-weight:bold">${avg ? avg.toFixed(1) : '-'}</span>
            </div>`;
    });
};

// Einzel-Ziel Modal Funktionen
window.openGoalModal = (id) => {
    window.modalTargetId = id;
    const f = appData.find(x => x.id === id);
    document.getElementById('modal-title').innerText = `Ziel für ${f.name}`;
    document.getElementById('modal-goal-input').value = f.customGoal || '';
    document.getElementById('goal-modal').style.display = 'flex';
};

window.closeModal = () => document.getElementById('goal-modal').style.display = 'none';

window.saveSubjectGoal = () => {
    const val = parseFloat(document.getElementById('modal-goal-input').value);
    const f = appData.find(x => x.id === window.modalTargetId);
    f.customGoal = isNaN(val) ? null : val;
    save(); closeModal(); renderGoals();
};

// Detailansicht mit farbigem Header
window.openDet = (id) => {
    window.curId = id;
    showPage('detail');
    renderDet();
};

function renderDet() {
    const f = appData.find(x => x.id === window.curId);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const status = getStatus(avg, f.customGoal);
    const goal = f.customGoal || config.target;

    const header = document.getElementById('det-header');
    header.className = `detail-header ${status.class}`;
    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg ? avg.toFixed(1) : '-';
    document.getElementById('det-status-label').innerText = status.label;

    const diff = avg ? (avg - goal).toFixed(1) : 0;
    document.getElementById('det-analysis-text').innerHTML = avg ? 
        `Schnitt: ${avg.toFixed(1)}<br>Ziel: ${goal}<br><b>${diff >= 0 ? '✅ Ziel erreicht (+' + diff + ')' : '❌ Ziel verfehlt (' + diff + ')'}</b>` : 
        "Noch keine Noten.";

    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="input-card" style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span>Note: <b>${n}</b></span>
            <button class="btn-danger" onclick="deleteNote(${i})">Löschen</button>
        </div>`).reverse().join('');
}

window.addNote = () => {
    const val = parseFloat(document.getElementById('n-val').value);
    if(isNaN(val)) return;
    appData.find(x => x.id === window.curId).notes.push(val);
    document.getElementById('n-val').value = '';
    save(); renderDet();
};

window.deleteNote = (i) => {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); renderDet();
};

window.updateGoal = (v) => { config.target = parseFloat(v) || 0; save(); };
window.deleteFach = () => { appData = appData.filter(x => x.id !== window.curId); save(); showPage('list'); };
function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); localStorage.setItem(C_KEY, JSON.stringify(config)); }
window.resetAll = () => { if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); } };