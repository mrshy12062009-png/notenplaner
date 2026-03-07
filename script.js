let appData = JSON.parse(localStorage.getItem('gf_v5_data')) || [];
let userName = localStorage.getItem('gf_v5_name') || 'Schüler';
let activeFachId = null;

// Farblogik (0-15 Punkte)
function getStatusColor(points) {
    if (points >= 11) return '#22c55e';
    if (points >= 5) return '#eab308';
    if (points > 0) return '#ef4444';
    return '#5865f2';
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('page-' + id).classList.add('active');
    // Name im Dashboard aktualisieren
    document.getElementById('user-name-display').innerText = userName;
    
    if (id === 'list') renderGrid();
}

function saveSettings() {
    const newName = document.getElementById('set-name').value;
    if(newName) {
        userName = newName;
        localStorage.setItem('gf_v5_name', userName);
        alert('Name gespeichert!');
    }
}

function addFach() {
    const nameInput = document.getElementById('f-name');
    if (!nameInput.value) return;
    appData.push({ id: Date.now(), name: nameInput.value, notes: [] });
    nameInput.value = '';
    save(); renderGrid();
}

function deleteFach() {
    if(confirm('Dieses Fach wirklich löschen?')) {
        appData = appData.filter(x => x.id !== activeFachId);
        save(); showPage('list');
    }
}

function resetAll() {
    if(confirm('ALLE Daten löschen? Das kann nicht rückgängig gemacht werden!')) {
        localStorage.clear();
        location.reload();
    }
}

function renderGrid() {
    const grid = document.getElementById('grid-container');
    grid.innerHTML = '';
    appData.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
        const color = getStatusColor(avg);
        grid.innerHTML += `
            <div class="subject-card" onclick="openDetail(${f.id})" style="border-left-color: ${color}">
                <h3>${f.name}</h3>
                <div style="font-size:32px; font-weight:900; color:${color}">${f.notes.length ? avg.toFixed(1) : '-'}</div>
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
    const valInput = document.getElementById('n-val');
    const val = parseFloat(valInput.value);
    if (isNaN(val) || val < 0 || val > 15) return;
    appData.find(x => x.id === activeFachId).notes.push(val);
    valInput.value = '';
    save(); renderDetail();
}

function renderDetail() {
    const f = appData.find(x => x.id === activeFachId);
    const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
    const color = getStatusColor(avg);
    
    document.getElementById('det-avg').innerText = f.notes.length ? avg.toFixed(1) : '-';
    document.getElementById('hero-banner').style.background = `linear-gradient(135deg, ${color}, #080a12)`;

    const list = document.getElementById('notes-history');
    list.innerHTML = '<h2>Verlauf</h2>';
    f.notes.slice().reverse().forEach(n => {
        list.innerHTML += `<div class="subject-card" style="margin-bottom:10px; padding:15px; border-left-color:${getStatusColor(n)}">${n} Punkte</div>`;
    });
}

function save() { localStorage.setItem('gf_v5_data', JSON.stringify(appData)); }

// Start
document.getElementById('user-name-display').innerText = userName;
renderGrid();