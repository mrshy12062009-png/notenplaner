const S_KEY = 'gf_final_data';
const C_KEY = 'gf_final_conf';

let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];
let config = JSON.parse(localStorage.getItem(C_KEY)) || { userName: 'Schüler', accentColor: '#5865f2', isPoints: true, target: 11 };

window.onload = () => {
    applyTheme();
    showPage('list');
};

function applyTheme() {
    document.documentElement.style.setProperty('--accent', config.accentColor);
    document.getElementById('display-name').innerText = config.userName;
}

window.showPage = function(id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById('page-' + id).style.display = 'block';
    if(id === 'list') renderDash();
    if(id === 'stats') renderStats();
};

window.addFach = function() {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name: name, notes: [] });
    document.getElementById('f-name').value = '';
    save();
    renderDash();
};

function renderDash() {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
        cont.innerHTML += `<div class="subject-card" onclick="openDet(${f.id})"><h3>${f.name}</h3><p>${avg}</p></div>`;
    });
}

window.openDet = function(id) {
    window.curId = id;
    const f = appData.find(x => x.id === id);
    document.getElementById('det-title').innerText = f.name;
    showPage('detail');
    renderDet();
};

window.addNote = function() {
    const val = parseFloat(document.getElementById('n-val').value);
    if(isNaN(val)) return;
    const f = appData.find(x => x.id === window.curId);
    f.notes.push(val);
    document.getElementById('n-val').value = '';
    save();
    renderDet();
};

function renderDet() {
    const f = appData.find(x => x.id === window.curId);
    document.getElementById('det-avg').innerText = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
    document.getElementById('notes-list').innerHTML = f.notes.map(n => `<div class="subject-card" style="margin-top:10px">${n}</div>`).join('');
}

window.saveSettings = function() {
    config.userName = document.getElementById('set-name').value || config.userName;
    config.target = parseFloat(document.getElementById('set-target').value) || config.target;
    config.isPoints = document.getElementById('set-system').value === 'points';
    save();
    applyTheme();
    alert("Gespeichert!");
};

window.changeTheme = function(c) { config.accentColor = c; applyTheme(); save(); };
function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); localStorage.setItem(C_KEY, JSON.stringify(config)); }
window.resetAll = function() { localStorage.clear(); location.reload(); };