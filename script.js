const S_KEY = 'gf_pro_v16';
const C_KEY = 'gf_conf_v16';

let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];
let config = JSON.parse(localStorage.getItem(C_KEY)) || { 
    accentColor: '#5865f2', target: 11 
};

window.onload = () => {
    applyStyles();
    showPage('list');
};

function applyStyles() {
    document.documentElement.style.setProperty('--accent', config.accentColor);
    document.getElementById('goal-input').value = config.target;
}

window.showPage = function(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('btn-' + id)?.classList.add('active');
    if(id === 'list') renderDash();
};

window.addFach = function() {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name: name, notes: [] });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

window.renderDash = function() {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        let sClass = '';
        if (avg !== null) {
            if (avg >= config.target) sClass = 'border-success';
            else if (avg >= config.target - 2) sClass = 'border-warning';
            else sClass = 'border-danger';
        }
        cont.innerHTML += `
            <div class="subject-card ${sClass}" onclick="openDet(${f.id})">
                <h3 style="margin:0; opacity:0.7; font-size:14px">${f.name}</h3>
                <p style="font-size:32px; font-weight:bold; margin:10px 0">${avg ? avg.toFixed(1) : '-'}</p>
            </div>`;
    });
};

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
    appData.find(x => x.id === window.curId).notes.push(val);
    document.getElementById('n-val').value = '';
    save(); renderDet();
};

function renderDet() {
    const f = appData.find(x => x.id === window.curId);
    const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
    document.getElementById('det-avg').innerText = avg;
    
    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="note-item">
            <span><b>${n}</b> Punkte</span>
            <button onclick="deleteNote(${i})" style="color:var(--danger); background:none; border:none; cursor:pointer">Löschen</button>
        </div>`).reverse().join('');
}

window.deleteNote = function(i) {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); renderDet();
};

window.updateGoal = function() {
    config.target = parseFloat(document.getElementById('goal-input').value);
    save(); alert("Ziel gespeichert!");
};

window.changeTheme = function(c) {
    config.accentColor = c;
    applyStyles();
    save();
};

window.deleteFach = function() {
    if(confirm("Dieses Fach wirklich löschen?")) {
        appData = appData.filter(x => x.id !== window.curId);
        save(); showPage('list');
    }
};

function save() { 
    localStorage.setItem(S_KEY, JSON.stringify(appData)); 
    localStorage.setItem(C_KEY, JSON.stringify(config)); 
}

window.resetAll = function() { if(confirm("ALLES löschen?")) { localStorage.clear(); location.reload(); } };