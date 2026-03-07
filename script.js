let appData = JSON.parse(localStorage.getItem('gf_v20')) || [];
let activeFachId = null;

function showPage(pageId) {
    // Alle Seiten ausblenden
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // Zielseite einblenden
    const target = document.getElementById('page-' + pageId);
    if(target) target.classList.add('active');
    
    const btn = document.getElementById('btn-' + pageId);
    if(btn) btn.classList.add('active');

    if(pageId === 'list') renderDashboard();
    if(pageId === 'stats') renderStats();
}

function addFach() {
    const input = document.getElementById('f-name');
    if(!input.value.trim()) return;
    appData.push({ id: Date.now(), name: input.value, notes: [] });
    input.value = '';
    saveData();
    renderDashboard();
}

function renderDashboard() {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
        container.innerHTML += `
            <div class="subject-card" onclick="openDetail(${f.id})">
                <h3 style="margin:0; font-size:22px;">${f.name}</h3>
                <div style="font-size:32px; font-weight:900; margin-top:10px;">${avg}</div>
            </div>`;
    });
}

function openDetail(id) {
    activeFachId = id;
    const f = appData.find(x => x.id === id);
    document.getElementById('det-title').innerText = f.name;
    showPage('detail');
    renderDetail();
}

function addNote() {
    const input = document.getElementById('n-val');
    const val = parseFloat(input.value);
    if(isNaN(val) || val < 0 || val > 15) return;
    const f = appData.find(x => x.id === activeFachId);
    f.notes.push(val);
    input.value = '';
    saveData();
    renderDetail();
}

function renderDetail() {
    const f = appData.find(x => x.id === activeFachId);
    const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '-';
    document.getElementById('det-avg').innerText = avg;
    
    const list = document.getElementById('notes-history');
    list.innerHTML = '<h2>Notenverlauf</h2>';
    f.notes.slice().reverse().forEach(n => {
        list.innerHTML += `<div class="subject-card" style="margin-bottom:10px; padding:15px; cursor:default;">${n} Punkte</div>`;
    });
}

function renderStats() {
    const container = document.getElementById('stats-list');
    container.innerHTML = '';
    appData.forEach(f => {
        if(!f.notes.length) return;
        const avg = (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1);
        container.innerHTML += `<div class="subject-card" style="margin-bottom:10px; cursor:default;"><b>${f.name}:</b> ${avg} Schnitt</div>`;
    });
}

function saveData() { localStorage.setItem('gf_v20', JSON.stringify(appData)); }
renderDashboard();