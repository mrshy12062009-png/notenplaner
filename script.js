let db = JSON.parse(localStorage.getItem('gf_data')) || [];
let currentFachId = null;

// Initialisierung
window.onload = () => {
    const savedBL = localStorage.getItem('gf_bl') || 'BE';
    document.getElementById('bundesland').value = savedBL;
    renderGrid();
};

// SEITEN WECHSELN
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('page-' + pageId).classList.add('active');
    const btn = document.getElementById('btn-' + pageId);
    if(btn) btn.classList.add('active');

    if(pageId === 'calendar') loadCalendar();
}

// FÄCHER VERWALTEN
function addFach() {
    const name = document.getElementById('f-in').value;
    if(!name) return;

    const newFach = {
        id: Date.now(),
        name: name,
        notes: [],
        goal: 10
    };

    db.push(newFach);
    document.getElementById('f-in').value = '';
    save();
    renderGrid();
}

function renderGrid() {
    const container = document.getElementById('grid');
    container.innerHTML = '';

    db.forEach(f => {
        const avg = f.notes.length ? (f.notes.reduce((a,b)=>a+b,0)/f.notes.length).toFixed(1) : '--';
        
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openDetail(f.id); // WICHTIG: Klick-Event
        card.innerHTML = `
            <h3>${f.name}</h3>
            <p style="font-size: 28px; font-weight: bold; margin: 10px 0;">${avg}</p>
            <small>Ziel: ${f.goal}</small>
        `;
        container.appendChild(card);
    });
}

// DETAIL ANSICHT
function openDetail(id) {
    currentFachId = id;
    const fach = db.find(f => f.id === id);
    if(!fach) return;

    document.getElementById('d-title').innerText = fach.name;
    document.getElementById('goal-in').value = fach.goal;
    
    renderNotes();
    showPage('detail');
}

function addNote() {
    const input = document.getElementById('n-in');
    const val = parseInt(input.value);
    if(isNaN(val) || val < 0 || val > 15) return;

    const fach = db.find(f => f.id === currentFachId);
    fach.notes.push(val);
    input.value = '';
    save();
    renderNotes();
}

function updateGoal() {
    const fach = db.find(f => f.id === currentFachId);
    fach.goal = parseInt(document.getElementById('goal-in').value);
    save();
    renderNotes();
}

function renderNotes() {
    const fach = db.find(f => f.id === currentFachId);
    const avg = fach.notes.length ? (fach.notes.reduce((a,b)=>a+b,0)/f.notes.length) : 0;
    
    document.getElementById('d-avg').innerText = `Schnitt: ${avg.toFixed(1)}`;
    document.getElementById('goal-status').innerText = avg >= fach.goal ? "Ziel erreicht! 🎉" : `Noch ${(fach.goal - avg).toFixed(1)} bis zum Ziel.`;

    const list = document.getElementById('n-list');
    list.innerHTML = fach.notes.map((n, i) => `
        <div class="note-item">
            <span>Prüfung ${i+1}</span>
            <strong>${n} Punkte</strong>
        </div>
    `).reverse().join('');
}

// KALENDER LOGIK
function saveBundesland() {
    localStorage.setItem('gf_bl', document.getElementById('bundesland').value);
    if(document.getElementById('page-calendar').classList.contains('active')) loadCalendar();
}

async function loadCalendar() {
    const bl = document.getElementById('bundesland').value;
    const container = document.getElementById('calendar-info');
    container.innerHTML = 'Lade Daten für 2026...';

    try {
        const res = await fetch(`https://feiertage-api.de/api/?jahr=2026&nur_land=${bl}`);
        const data = await res.json();
        
        container.innerHTML = '';
        Object.keys(data).forEach(key => {
            const item = data[key];
            container.innerHTML += `
                <div class="date-card">
                    <strong>${key}</strong><br>
                    <span>${item.datum}</span>
                </div>
            `;
        });
    } catch (e) {
        container.innerHTML = 'Fehler beim Laden. Bist du online?';
    }
}

function save() {
    localStorage.setItem('gf_data', JSON.stringify(db));
}