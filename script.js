const S_KEY = 'gf_pro_v17';
const C_KEY = 'gf_conf_v17';

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

window.showPage = function(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('btn-' + id)?.classList.add('active');
    
    if(id === 'list') renderDash();
    if(id === 'goals') renderGoals();
};

// STATUS LOGIK
function getStatus(avg) {
    if (!avg) return { color: 'neutral', label: 'Keine Noten', class: '' };
    const t = config.target;
    if (avg >= t) return { color: 'success', label: 'GUT', class: 'text-success' };
    if (avg >= t - 2) return { color: 'warning', label: 'MITTEL', class: 'text-warning' };
    return { color: 'danger', label: 'SCHLECHT', class: 'text-danger' };
}

// DASHBOARD
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
        const status = getStatus(avg);
        cont.innerHTML += `
            <div class="subject-card border-${status.color}" onclick="openDet(${f.id})">
                <h3 style="margin:0; opacity:0.6; font-size:12px">${f.name}</h3>
                <p class="${status.class}" style="font-size:32px; font-weight:bold; margin:10px 0">${avg ? avg.toFixed(1) : '-'}</p>
                <small class="badge">${status.label}</small>
            </div>`;
    });
};

// ZIELE REITER (ALLE FÄCHER AUTO)
window.renderGoals = function() {
    const cont = document.getElementById('goals-list');
    cont.innerHTML = '';
    let sum = 0, count = 0;

    appData.forEach(f => {
        const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
        const status = getStatus(avg);
        if(avg) { sum += avg; count++; }

        cont.innerHTML += `
            <div class="note-row" style="border-left: 5px solid var(--${status.color})">
                <div><b>${f.name}</b><br><small>${f.notes.length} Noten</small></div>
                <div style="text-align:right">
                    <span class="${status.class}" style="font-weight:bold">${avg ? avg.toFixed(1) : '-'}</span><br>
                    <small class="badge">${status.label}</small>
                </div>
            </div>`;
    });

    const totalAvg = count > 0 ? sum / count : 0;
    const totalStatus = getStatus(totalAvg);
    document.getElementById('goal-total-val').innerText = totalAvg.toFixed(2);
    document.getElementById('goal-label-all').innerText = totalStatus.label;
    document.getElementById('goal-label-all').className = `badge bg-${totalStatus.color}`;
};

// DETAIL REITER (MEHR INHALT)
window.openDet = function(id) {
    window.curId = id;
    renderDet();
    showPage('detail');
};

function renderDet() {
    const f = appData.find(x => x.id === window.curId);
    const avg = f.notes.length ? f.notes.reduce((a,b)=>a+b,0)/f.notes.length : null;
    const status = getStatus(avg);

    document.getElementById('det-title').innerText = f.name;
    document.getElementById('det-avg').innerText = avg ? avg.toFixed(1) : '-';
    document.getElementById('det-status-text').innerText = `Status: ${status.label}`;
    document.getElementById('det-status-text').className = status.class;
    
    // Analyse Text
    const diff = avg ? (avg - config.target).toFixed(1) : 0;
    const analysisEl = document.getElementById('det-analysis-text');
    if(!avg) {
        analysisEl.innerHTML = "Noch keine Noten für eine Analyse vorhanden.";
    } else {
        analysisEl.innerHTML = `
            <p>Dein Schnitt ist <b>${avg.toFixed(1)}</b>.</p>
            <p>Ziel: <b>${config.target}</b></p>
            <p class="${diff >= 0 ? 'text-success' : 'text-danger'}">
                ${diff >= 0 ? '✅ Du bist ' + diff + ' über deinem Ziel!' : '❌ Dir fehlen ' + Math.abs(diff) + ' zum Ziel.'}
            </p>
        `;
    }

    // Notenliste
    document.getElementById('notes-list').innerHTML = f.notes.map((n, i) => `
        <div class="note-row">
            <span>Note: <b>${n}</b></span>
            <button class="btn-danger" onclick="deleteNote(${i})" style="padding:5px 10px">X</button>
        </div>`).reverse().join('');
}

window.addNote = function() {
    const val = parseFloat(document.getElementById('n-val').value);
    if(isNaN(val)) return;
    appData.find(x => x.id === window.curId).notes.push(val);
    document.getElementById('n-val').value = '';
    save(); renderDet();
};

window.deleteNote = function(i) {
    const f = appData.find(x => x.id === window.curId);
    f.notes.splice(f.notes.length - 1 - i, 1);
    save(); renderDet();
};

window.updateGoal = (v) => { config.target = parseFloat(v); save(); renderGoals(); };
window.changeTheme = (c) => { config.accentColor = c; applyStyles(); save(); };
function save() { localStorage.setItem(S_KEY, JSON.stringify(appData)); localStorage.setItem(C_KEY, JSON.stringify(config)); }
window.deleteFach = () => { if(confirm("Löschen?")) { appData = appData.filter(x => x.id !== window.curId); save(); showPage('list'); } };
window.resetAll = () => { if(confirm("Alles weg?")) { localStorage.clear(); location.reload(); } };