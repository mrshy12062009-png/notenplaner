const S_KEY = 'gf_v16_data';
const C_KEY = 'gf_v16_conf';

let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];
let config = JSON.parse(localStorage.getItem(C_KEY)) || { 
    userName: 'Schüler', accentColor: '#5865f2', isPoints: true, target: 11 
};

window.onload = () => {
    applyConfig();
    showPage('list');
};

function applyConfig() {
    document.documentElement.style.setProperty('--accent', config.accentColor);
    document.getElementById('display-name').innerText = config.userName;
    document.getElementById('set-name').value = config.userName;
    document.getElementById('set-system').value = config.isPoints ? 'points' : 'grades';
    document.getElementById('goal-input').value = config.target;
}

window.showPage = function(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('btn-' + id)?.classList.add('active');
    if(id === 'list') renderDash();
    if(id === 'stats') renderStats();
};

// ZIELE LOGIK
window.updateGoal = (val) => {
    config.target = parseFloat(val);
    save();
    renderDash();
};

window.changeTheme = (color) => {
    config.accentColor = color;
    document.documentElement.style.setProperty('--accent', color);
    save();
};

function getStatus(avg) {
    if (avg === null) return { class: '', label: 'Keine Noten' };
    const t = config.target;
    if (config.isPoints) {
        if (avg >= t) return { class: 'success', label: 'Gut' };
        if (avg >= t - 3) return { class: 'warning', label: 'Mittel' };
        return { class: 'danger', label: 'Schlecht' };
    } else {
        if (avg <= t) return { class: 'success', label: 'Gut' };
        if (avg <= t + 0.7) return { class: 'warning', label: 'Mittel' };
        return { class: 'danger', label: 'Schlecht' };
    }
}

function renderDash() {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg);
        cont.innerHTML += `
            <div class="subject-card border-${status.class}" onclick="openDet(${f.id})">
                <h3 style="margin:0">${f.name}</h3>
                <p class="text-${status.class}" style="font-size:24px; font-weight:bold; margin:10px 0">
                    ${avg ? avg.toFixed(1) : '-'}
                </p>
                <small>${status.label}</small>
            </div>`;
    });
}

// ... Restliche Standard-Funktionen (addFach, addNote, save, etc.)
window.addFach = () => {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name: name, notes: [] });
    document.getElementById('f-name').value = '';
    save(); renderDash();
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
    document.getElementById('notes-list').innerHTML = f.notes.map(n => `<div class="input-card">${n}</div>`).join('');
}

function save() { 
    localStorage.setItem(S_KEY, JSON.stringify(appData)); 
    localStorage.setItem(C_KEY, JSON.stringify(config)); 
}
function resetAll() { localStorage.clear(); location.reload(); }