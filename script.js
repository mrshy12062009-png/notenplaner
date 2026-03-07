const S_KEY = 'gf_v15_data';
const C_KEY = 'gf_v15_conf';

let appData = JSON.parse(localStorage.getItem(S_KEY)) || [];
let config = JSON.parse(localStorage.getItem(C_KEY)) || { 
    userName: 'Schüler', accentColor: '#5865f2', isPoints: true, target: 11 
};

window.onload = () => {
    applySettings();
    showPage('list');
};

function applySettings() {
    document.documentElement.style.setProperty('--accent', config.accentColor);
    document.getElementById('display-name').innerText = config.userName;
    document.getElementById('set-name').value = config.userName;
    document.getElementById('set-target').value = config.target;
    document.getElementById('set-system').value = config.isPoints ? 'points' : 'grades';
}

window.showPage = function(id) {
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        setTimeout(() => { p.style.display = 'none'; }, 50);
    });
    
    const target = document.getElementById('page-' + id);
    setTimeout(() => {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active'), 50);
    }, 100);

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-' + id)?.classList.add('active');

    if(id === 'list') renderDash();
    if(id === 'stats') renderStats();
};

window.addFach = function() {
    const name = document.getElementById('f-name').value;
    if(!name) return;
    appData.push({ id: Date.now(), name: name, notes: [] });
    document.getElementById('f-name').value = '';
    save(); renderDash();
};

function renderDash() {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    appData.forEach(f => {
        const avgRaw = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const avg = avgRaw !== null ? avgRaw.toFixed(1) : '-';
        const isWarning = avgRaw !== null && (config.isPoints ? avgRaw < config.target : avgRaw > config.target);
        
        cont.innerHTML += `
            <div class="subject-card ${isWarning ? 'warning' : ''}" onclick="openDet(${f.id})">
                <h3>${f.name}</h3>
                <p style="font-size:24px; font-weight:bold">${avg}</p>
                <small>${f.notes.length} Noten</small>
            </div>`;
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
    save(); renderDet();
};

function renderDet() {
    const f = appData.find(x => x.id === window.curId);
    const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
    document.getElementById('det-avg').innerText = avg;
    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="input-card" style="margin-top:10px; display:flex; justify-content:space-between">
            <span>${n} ${config.isPoints ? 'Punkte' : 'Note'}</span>
            <button onclick="deleteNote(${i})" style="color:var(--danger); background:none; border:none; cursor:pointer">Löschen</button>
        </div>`).reverse().join('');
}

window.deleteNote = function(index) {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - index, 1);
    save(); renderDet();
};

window.deleteFach = function() {
    if(confirm("Fach wirklich löschen?")) {
        appData = appData.filter(x => x.id !== window.curId);
        save(); showPage('list');
    }
};

window.saveSettings = function() {
    config.userName = document.getElementById('set-name').value;
    config.target = parseFloat(document.getElementById('set-target').value);
    config.isPoints = document.getElementById('set-system').value === 'points';
    save(); applySettings();
    alert("Einstellungen gespeichert!");
};

window.changeTheme = function(c) {
    config.accentColor = c;
    save(); applySettings();
};

function save() { 
    localStorage.setItem(S_KEY, JSON.stringify(appData)); 
    localStorage.setItem(C_KEY, JSON.stringify(config)); 
}

function renderStats() {
    const activeF = appData.filter(f => f.notes.length);
    const totalAvg = activeF.length ? (activeF.reduce((acc, f) => acc + (f.notes.reduce((a,b)=>a+b,0)/f.notes.length), 0) / activeF.length).toFixed(2) : '-';
    document.getElementById('total-avg').innerText = totalAvg;
    document.getElementById('total-count').innerText = appData.reduce((a,b) => a + b.notes.length, 0);

    const ctx = document.getElementById('myChart').getContext('2d');
    if(window.chartObj) window.chartObj.destroy();
    window.chartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: activeF.map(f => f.name),
            datasets: [{
                label: 'Schnitt',
                data: activeF.map(f => (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1)),
                backgroundColor: config.accentColor,
                borderRadius: 8
            }]
        },
        options: { scales: { y: { beginAtZero: true, max: config.isPoints ? 15 : 6 } } }
    });
}

window.resetAll = function() { if(confirm("ALLES löschen?")) { localStorage.clear(); location.reload(); } };