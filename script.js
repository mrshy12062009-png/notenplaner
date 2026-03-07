let db = JSON.parse(localStorage.getItem('gradeflow_data')) || [];
let selectedBL = localStorage.getItem('gradeflow_bl') || 'BE';
let currentFachId = null;

// Beim Start ausführen
window.onload = () => {
    document.getElementById('bundesland').value = selectedBL;
    renderGrid();
    fetchFerien();
};

// --- NAVIGATION ---
function showPage(pageId) {
    // Alle Seiten verstecken
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    // Aktive Seite zeigen
    document.getElementById('page-' + pageId).classList.add('active');
    
    // Buttons stylen
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + pageId);
    if(activeBtn) activeBtn.classList.add('active');

    if(pageId === 'calendar') fetchFerien();
}

// --- FÄCHER LOGIK ---
function addFach() {
    const input = document.getElementById('f-in');
    if (!input.value.trim()) return;

    db.push({
        id: Date.now(),
        name: input.value,
        notes: [],
        goal: 10
    });

    input.value = '';
    saveAndRender();
}

function openDetail(id) {
    currentFachId = id;
    const fach = db.find(f => f.id === id);
    document.getElementById('d-title').innerText = fach.name;
    document.getElementById('goal-in').value = fach.goal;
    renderNotes();
    showPage('detail');
}

function addNote() {
    const input = document.getElementById('n-in');
    const val = parseInt(input.value);
    if (isNaN(val) || val < 0 || val > 15) return;

    const fach = db.find(f => f.id === currentFachId);
    fach.notes.push(val);
    input.value = '';
    renderNotes();
    saveAndRender();
}

function updateGoal() {
    const fach = db.find(f => f.id === currentFachId);
    fach.goal = parseInt(document.getElementById('goal-in').value);
    renderNotes();
    saveAndRender();
}

// --- KALENDER & BUNDESLAND ---
function saveBundesland() {
    selectedBL = document.getElementById('bundesland').value;
    localStorage.setItem('gradeflow_bl', selectedBL);
    fetchFerien();
}

async function fetchFerien() {
    const container = document.getElementById('calendar-info');
    container.innerHTML = "Lade Termine...";
    
    try {
        // Nutzt die öffentliche Feiertage-API für Deutschland
        const response = await fetch(`https://feiertage-api.de/api/?jahr=2026&nur_land=${selectedBL}`);
        const data = await response.json();
        
        container.innerHTML = "";
        for (const [name, info] of Object.entries(data)) {
            container.innerHTML += `
                <div class="date-card">
                    <strong>${name}</strong><br>
                    <small>${info.datum}</small>
                </div>`;
        }
    } catch (e) {
        container.innerHTML = "Fehler beim Laden der Termine.";
    }
}

// --- HELPER ---
function saveAndRender() {
    localStorage.setItem('gradeflow_data', JSON.stringify(db));
    renderGrid();
}

function renderGrid() {
    const g = document.getElementById('grid');
    g.innerHTML = '';
    db.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length) : null;
        g.innerHTML += `
            <div class="card" onclick="openDetail(${f.id})">
                <h3>${f.name}</h3>
                <p style="font-size: 24px; font-weight: bold;">${avg ? avg.toFixed(1) : '--'}</p>
                <small>Ziel: ${f.goal}</small>
            </div>`;
    });
}

function renderNotes() {
    const fach = db.find(f => f.id === currentFachId);
    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/fach.notes.length) : 0;
    document.getElementById('d-avg').innerText = `Schnitt: ${avg.toFixed(1)}`;
    
    const diff = (fach.goal - avg).toFixed(1);
    document.getElementById('goal-status').innerHTML = avg >= fach.goal ? "Ziel erreicht!" : `Noch ${diff} Punkte nötig.`;

    document.getElementById('n-list').innerHTML = fach.notes.map(n => `
        <div class="note-item">${n} Punkte</div>
    `).reverse().join('');
}