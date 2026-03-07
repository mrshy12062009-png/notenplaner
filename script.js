let appData = JSON.parse(localStorage.getItem('gf_v9')) || [];
let userName = localStorage.getItem('gf_user') || 'Schüler';
let activeFachId = null;

function getStatusColor(p) {
    if (p >= 11) return '#22c55e';
    if (p >= 5) return '#eab308';
    if (p > 0) return '#ef4444';
    return '#5865f2';
}

function showPage(id) {
    // Seiten umschalten
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');

    // Sidebar-Buttons umschalten (Der Fix!)
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('nav-' + id);
    if(btn) btn.classList.add('active');

    if(id === 'list') renderGrid();
    if(id === 'stats') renderStats();
    document.getElementById('user-name-display').innerText = userName;
}

function renderStats() {
    let totalPoints = 0, subCount = 0, noteCount = 0;
    const container = document.getElementById('stats-details');
    container.innerHTML = '';

    appData.forEach(f => {
        if(f.notes.length > 0) {
            const avg = f.notes.reduce((a,b)=>a+b,0)/f.notes.length;
            totalPoints += avg; subCount++; noteCount += f.notes.length;
            container.innerHTML += `<div class="subject-card" style="border-left-color:${getStatusColor(avg)}"><h3>${f.name}</h3><p>Schnitt: ${avg.toFixed(2)}</p></div>`;
        }
    });

    const final = subCount > 0 ? (totalPoints/subCount) : 0;
    document.getElementById('total-avg').innerText = subCount > 0 ? final.toFixed(1) : '-';
    document.getElementById('total-count').innerText = noteCount;
    document.getElementById('stats-banner').style.background = getStatusColor(final);
}

function saveSettings() {
    const n = document.getElementById('set-name').value;
    if(n) { userName = n; localStorage.setItem('gf_user', n); showPage('list'); }
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "noten_backup.json");
    downloadAnchorNode.click();
}

function addFach() {
    const i = document.getElementById('f-name');
    if(!i.value) return;
    appData.push({id: Date.now(), name: i.value, notes: []});
    i.value = ''; save(); renderGrid();
}

function deleteFach() {
    if(confirm('Fach löschen?')) { appData = appData.filter(x => x.id !== activeFachId); save(); showPage('list'); }
}

function renderGrid() {
    const g = document.getElementById('grid-container'); g.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
        const c = getStatusColor(avg);
        g.innerHTML += `<div class="subject-card" onclick="openDetail(${f.id})" style="border-left-color:${c}"><h3>${f.name}</h3><p style="color:${c}; font-weight:bold; font-size:24px">${f.notes.length ? avg.toFixed(1) : '-'}</p></div>`;
    });
}

function openDetail(id) {
    activeFachId = id; const f = appData.find(x => x.id === id);
    document.getElementById('det-title').innerText = f.name;
    showPage('detail'); renderDetail();
}

function addNote() {
    const v = parseFloat(document.getElementById('n-val').value);
    if(isNaN(v) || v < 0 || v > 15) return;
    appData.find(x => x.id === activeFachId).notes.push(v);
    document.getElementById('n-val').value = ''; save(); renderDetail();
}

function renderDetail() {
    const f = appData.find(x => x.id === activeFachId);
    const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
    const c = getStatusColor(avg);
    document.getElementById('det-avg').innerText = f.notes.length ? avg.toFixed(1) : '-';
    document.getElementById('hero-banner').style.background = c;
    const h = document.getElementById('notes-history'); h.innerHTML = '<h3>Verlauf</h3>';
    f.notes.slice().reverse().forEach(n => h.innerHTML += `<div class="subject-card" style="margin-bottom:10px; border-left-color:${getStatusColor(n)}">${n} Punkte</div>`);
}

function resetAll() { if(confirm('Alles löschen?')) { localStorage.clear(); location.reload(); } }
function save() { localStorage.setItem('gf_v9', JSON.stringify(appData)); }

showPage('list');