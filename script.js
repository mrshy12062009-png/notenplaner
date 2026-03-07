let appData = JSON.parse(localStorage.getItem('gf_data_v4')) || [];
let activeFachId = null;

// Die Funktion, die entscheidet, welche Farbe die Note hat
function getStatusColor(points) {
    if (points >= 11) return '#22c55e'; // Grün (1, 2)
    if (points >= 5) return '#eab308';  // Gelb (3, 4)
    if (points > 0) return '#ef4444';   // Rot (5, 6)
    return '#5865f2';                   // Blau (Standard)
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    if (id === 'list') renderGrid();
}

function addFach() {
    const nameInput = document.getElementById('f-name');
    if (!nameInput.value) return;
    appData.push({ id: Date.now(), name: nameInput.value, notes: [] });
    nameInput.value = '';
    save(); renderGrid();
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
    // Banner färben
    document.getElementById('hero-banner').style.background = `linear-gradient(135deg, ${color}, #080a12)`;

    const list = document.getElementById('notes-history');
    list.innerHTML = '<h2>Verlauf</h2>';
    f.notes.slice().reverse().forEach(n => {
        list.innerHTML += `
            <div class="subject-card" style="margin-bottom:10px; padding:15px; border-left-color:${getStatusColor(n)}">
                ${n} Punkte
            </div>`;
    });
}

function save() { localStorage.setItem('gf_data_v4', JSON.stringify(appData)); }

// Start
renderGrid();