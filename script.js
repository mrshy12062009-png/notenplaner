const S_KEY = 'gf_final_v15';
const C_KEY = 'gf_conf_v15';

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
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
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
        
        let colorClass = '', borderClass = '', statusText = 'Keine Daten';

        if (avgRaw !== null) {
            const t = config.target;
            if (config.isPoints) {
                if (avgRaw >= t) { colorClass = 'text-success'; borderClass = 'success-border'; statusText = 'Gut'; }
                else if (avgRaw >= t - 3) { colorClass = 'text-warning'; borderClass = 'mid-border'; statusText = 'Mittel'; }
                else { colorClass = 'text-danger'; borderClass = 'warning-border'; statusText = 'Schlecht'; }
            } else {
                if (avgRaw <= t) { colorClass = 'text-success'; borderClass = 'success-border'; statusText = 'Gut'; }
                else if (avgRaw <= t + 0.7) { colorClass = 'text-warning'; borderClass = 'mid-border'; statusText = 'Mittel'; }
                else { colorClass = 'text-danger'; borderClass = 'warning-border'; statusText = 'Schlecht'; }
            }
        }

        cont.innerHTML += `
            <div class="subject-card ${borderClass}" onclick="openDet(${f.id})">
                <h3 style="margin:0; opacity:0.6; font-size:12px">${f.name}</h3>
                <p class="${colorClass}" style="font-size:32px; font-weight:bold; margin:10px 0">${avg}</p>
                <div style="display:flex; justify-content:space-between; font-size:11px">
                    <span>${f.notes.length} Noten</span>
                    <span class="${colorClass}" style="font-weight:bold">${statusText}</span>
                </div>
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
    appData.find(x => x.id === window.curId).notes.push(val);
    document.getElementById('n-val').value = '';
    save(); renderDet();
};

function renderDet() {
    const f = appData.find(x => x.id === window.curId);
    document.getElementById('det-avg').innerText = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="input-card" style="margin-top:10px; display:flex; justify-content:space-between">
            <span>${n}</span><button onclick="deleteNote(${i})" style="color:var(--danger); background:none; border:none; cursor:pointer">Löschen</button>
        </div>`).reverse().join('');
}

window.deleteNote = function(i) {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); renderDet();
};

window.deleteFach = function() {
    if(confirm("Löschen?")) { appData = appData.filter(x => x.id !== window.curId); save(); showPage('list'); }
};

window.saveSettings = function() {
    config.userName = document.getElementById('set-name').value || 'Schüler';
    config.target = parseFloat(document.getElementById('set-target').value) || 11;
    config.isPoints = document.getElementById('set-system').value === 'points';
    save(); applySettings(); alert("Gespeichert!"); showPage('list');
};

window.changeTheme = function(c) { config.accentColor = c; save(); applySettings(); };
function save() { 
    localStorage.setItem(S_KEY, JSON.stringify(appData)); 
    localStorage.setItem(C_KEY, JSON.stringify(config)); 
}
window.resetAll = function() { if(confirm("ALLES LÖSCHEN?")) { localStorage.clear(); location.reload(); } };

function renderStats() {
    const active = appData.filter(f => f.notes.length);
    document.getElementById('total-avg').innerText = active.length ? (active.reduce((acc, f) => acc + (f.notes.reduce((a,b)=>a+b,0)/f.notes.length), 0) / active.length).toFixed(2) : '-';
    document.getElementById('total-count').innerText = appData.reduce((a,b) => a + b.notes.length, 0);
    const ctx = document.getElementById('myChart').getContext('2d');
    if(window.chartObj) window.chartObj.destroy();
    window.chartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: active.map(f => f.name),
            datasets: [{ label: 'Schnitt', data: active.map(f => (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1)), backgroundColor: config.accentColor, borderRadius: 8 }]
        },
        options: { scales: { y: { beginAtZero: true, max: config.isPoints ? 15 : 6 } } }
    });
}