const S_KEY = 'gf_final_v18';
const C_KEY = 'gf_conf_v18';

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

function getStatus(avg) {
    if (!avg) return { color: '', class: '', label: 'Keine Noten' };
    const t = config.target;
    if (avg >= t) return { color: 'success', class: 'card-success', label: 'Gut' };
    if (avg >= t - 2) return { color: 'warning', class: 'card-warning', label: 'Mittel' };
    return { color: 'danger', class: 'card-danger', label: 'Schlecht' };
}

window.addFach = () => {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name: name, notes: [] });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.renderDash = () => {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    let totalSum = 0, count = 0;

    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg);
        if(avg) { totalSum += avg; count++; }

        cont.innerHTML += `
            <div class="subject-card ${status.class}" onclick="openDet(${f.id})">
                <small style="opacity:0.6">${f.name}</small>
                <h2 class="text-${status.color}">${avg ? avg.toFixed(1) : '-'}</h2>
                <div style="font-size:12px; opacity:0.8">${f.notes.length} Noten • ${status.label}</div>
            </div>`;
    });
    document.getElementById('dash-total').innerText = count > 0 ? (totalSum/count).toFixed(1) : '-';
};

window.renderGoals = () => {
    const cont = document.getElementById('goals-list');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg);
        cont.innerHTML += `
            <div class="goal-row">
                <span><b>${f.name}</b></span>
                <span class="text-${status.color}" style="font-weight:bold">${avg ? avg.toFixed(1) : 'Keine Noten'} (${status.label})</span>
            </div>`;
    });
};

window.openDet = (id) => {
    window.curId = id;
    const f = appData.find(x => x.id === id);
    document.getElementById('det-title').innerText = f.name;
    showPage('detail');
    renderDet();
};

window.addNote = () => {
    const val = parseFloat(document.getElementById('n-val').value);
    if(isNaN(val)) return;
    appData.find(x => x.id === window.curId).notes.push(val);
    document.getElementById('n-val').value = '';
    save(); renderDet();
};

function renderDet() {
    const f = appData.find(x => x.id === window.curId);
    const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
    document.getElementById('det-avg').innerText = avg;
    document.getElementById('notes-list').innerHTML = f.notes.map(n => `<div class="input-card">${n}</div>`).reverse().join('');
}

window.updateGoal = (v) => { config.target = parseFloat(v); save(); renderDash(); };
window.changeTheme = (c) => { config.accentColor = c; applyStyles(); save(); };
function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); localStorage.setItem(C_KEY, JSON.stringify(config)); }
window.deleteFach = () => { appData = appData.filter(x => x.id !== window.curId); save(); showPage('list'); };
window.resetAll = () => { localStorage.clear(); location.reload(); };